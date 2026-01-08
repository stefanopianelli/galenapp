import ftp from 'basic-ftp';
import { exec } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurazione per leggere .env in moduli ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const config = {
    host: process.env.FTP_HOST,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
    secure: process.env.FTP_SECURE === 'true', // Imposta true per FTPS
    remoteDir: process.env.FTP_REMOTE_DIR || '/' // Cartella di destinazione sul server (es. /public_html)
};

// Verifica configurazione
if (!config.host || !config.user || !config.password) {
    console.error('❌ Errore: Credenziali FTP mancanti nel file .env');
    console.log('Assicurati di avere: FTP_HOST, FTP_USER, FTP_PASSWORD');
    process.exit(1);
}

const runBuild = () => {
    return new Promise((resolve, reject) => {
        console.log('🔨 Avvio build di produzione...');
        const build = exec('npm run build');

        build.stdout.on('data', (data) => console.log(data.toString().trim()));
        build.stderr.on('data', (data) => console.error(data.toString().trim()));

        build.on('exit', (code) => {
            if (code === 0) {
                console.log('✅ Build completata con successo.');
                resolve();
            } else {
                reject(new Error(`Build fallita con codice ${code}`));
            }
        });
    });
};

const uploadFiles = async () => {
    const client = new ftp.Client();
    client.ftp.verbose = true; // Log dettagliati dell'FTP

    try {
        console.log(`🔌 Connessione a ${config.host}...`);
        await client.access({
            host: config.host,
            user: config.user,
            password: config.password,
            secure: config.secure,
            secureOptions: { rejectUnauthorized: false } // Utile per certificati self-signed, rimuovere se necessario
        });

        console.log(`📂 Caricamento cartella 'dist' in '${config.remoteDir}'...`);
        
        // Assicurati che la cartella remota esista o vai alla root
        await client.ensureDir(config.remoteDir);
        
        // Pulisce la cartella remota prima di caricare (OPZIONALE - Rimuovi se vuoi solo sovrascrivere)
        // Attenzione: cancella tutto nella remoteDir!
        // await client.clearWorkingDir(); 

        await client.uploadFromDir("dist");
        
        console.log('🚀 Deploy completato con successo!');
    } catch (err) {
        console.error('❌ Errore durante il deploy FTP:', err);
        process.exit(1);
    } finally {
        client.close();
    }
};

// Flusso principale
const main = async () => {
    try {
        await runBuild();
        await uploadFiles();
    } catch (error) {
        console.error('❌', error.message);
        process.exit(1);
    }
};

main();
