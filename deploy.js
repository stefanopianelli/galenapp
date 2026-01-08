import Client from 'ssh2-sftp-client';
import { exec } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

// Definizione Servers
const servers = [
    {
        name: 'Server Primario',
        host: process.env.FTP_HOST,
        username: process.env.FTP_USER,
        password: process.env.FTP_PASSWORD,
        port: 22,
        remoteDir: process.env.FTP_REMOTE_DIR || '/'
    }
];

// Aggiungi Server 2 se configurato
if (process.env.FTP2_HOST && process.env.FTP2_USER) {
    servers.push({
        name: 'Server Secondario',
        host: process.env.FTP2_HOST,
        username: process.env.FTP2_USER,
        password: process.env.FTP2_PASSWORD,
        port: 22,
        remoteDir: process.env.FTP2_REMOTE_DIR || '/'
    });
}

const runBuild = () => {
    return new Promise((resolve, reject) => {
        console.log('🔨 [BUILD] Avvio build di produzione...');
        const build = exec('npm run build');

        build.stdout.on('data', (data) => console.log(data.toString().trim()));
        build.stderr.on('data', (data) => console.error(data.toString().trim()));

        build.on('exit', (code) => {
            if (code === 0) {
                console.log('✅ [BUILD] Completata con successo.');
                resolve();
            } else {
                reject(new Error(`Build fallita con codice ${code}`));
            }
        });
    });
};

const deployToServer = async (serverConfig) => {
    const sftp = new Client();
    console.log(`\n🚀 [DEPLOY] Avvio deploy su: ${serverConfig.name} (${serverConfig.host})...`);

    try {
        console.log(`🔌 Connessione SFTP...`);
        await sftp.connect(serverConfig);

        console.log(`📂 Caricamento Frontend in '${serverConfig.remoteDir}'...`);
        
        const remoteExists = await sftp.exists(serverConfig.remoteDir);
        if (!remoteExists) {
            console.log(`   Creazione cartella remota: ${serverConfig.remoteDir}`);
            await sftp.mkdir(serverConfig.remoteDir, true);
        }

        const localDir = path.join(__dirname, 'dist');
        
        sftp.on('upload', info => {
            console.log(`   ⬆️  Frontend: ${path.basename(info.source)}`);
        });

        await sftp.uploadDir(localDir, serverConfig.remoteDir);
        
        // --- DEPLOY BACKEND ---
        console.log('🐘 Aggiornamento Backend (API)...');
        const localApiDir = path.join(__dirname, 'api');
        const remoteApiDir = path.posix.join(serverConfig.remoteDir, 'api');
        
        await sftp.mkdir(remoteApiDir, true);

        const backendFiles = ['api.php', '.htaccess', 'setup_database.php', 'database_setup.sql', 'database_populate.sql'];
        
        for (const file of backendFiles) {
            const localFilePath = path.join(localApiDir, file);
            const remoteFilePath = path.posix.join(remoteApiDir, file);

            if (fs.existsSync(localFilePath)) {
                await sftp.put(localFilePath, remoteFilePath);
                console.log(`   ⬆️  Backend: ${file}`);
            }
        }
        console.log('   🚫 Config.php preservato.');
        console.log(`✅ [DEPLOY] Completato su ${serverConfig.name}!`);

    } catch (err) {
        console.error(`❌ [ERROR] Fallito deploy su ${serverConfig.name}:`, err.message);
        throw err; // Rilancia per fermare o gestire
    } finally {
        await sftp.end();
    }
};

const main = async () => {
    try {
        // 1. Build una volta sola
        await runBuild();

        // 2. Deploy su tutti i server configurati
        let successCount = 0;
        for (const server of servers) {
            try {
                await deployToServer(server);
                successCount++;
            } catch (err) {
                console.error(`⚠️  Salto ${server.name} a causa dell'errore.`);
            }
        }
        
        if (successCount === servers.length) {
            console.log('\n✨ TUTTI I DEPLOY COMPLETATI CON SUCCESSO! ✨');
        } else if (successCount > 0) {
            console.log(`\n🟠 DEPLOY PARZIALE: Completato su ${successCount}/${servers.length} server.`);
        } else {
            console.error('\n❌ TUTTI I DEPLOY SONO FALLITI.');
            process.exit(1);
        }
    } catch (error) {
        console.error('\n❌ PROCESSO DI BUILD FALLITO. Deploy annullato.');
        process.exit(1);
    }
};

main();
