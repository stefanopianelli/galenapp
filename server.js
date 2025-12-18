require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Aumenta il limite per i dati inviati

// Configurazione della connessione al database
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  socketPath: process.env.DB_SOCKET_PATH || undefined,
};

let connection;

async function testConnection() {
  try {
    console.log("Tentativo di connessione al database MySQL...");
    connection = await mysql.createConnection(dbConfig);
    await connection.connect();
    console.log("Connessione al database MySQL riuscita!");
    // Mantieni la connessione aperta
  } catch (error) {
    console.error("Errore di connessione al database:", error.message);
    if (error.code === 'ECONNREFUSED') {
        console.error("Assicurati che il server MySQL sia in esecuzione.");
    }
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        console.error("Credenziali (utente/password) errate. Controlla il file .env");
    }
    if (error.code === 'ER_BAD_DB_ERROR') {
        console.error(`Il database '${process.env.DB_DATABASE}' non esiste. Crealo prima di avviare il server.`);
    }
    process.exit(1); // Esce se non può connettersi
  }
}

// Endpoint per ottenere tutti i dati
app.get('/api/data', async (req, res) => {
    if (!connection) {
        return res.status(503).json({ message: 'Nessuna connessione al database.' });
    }
    try {
        const [inventory, preparations, logs, settings] = await Promise.all([
            connection.query('SELECT * FROM inventory'),
            connection.query('SELECT * FROM preparations'),
            connection.query('SELECT * FROM logs'),
            connection.query('SELECT * FROM pharmacy_settings LIMIT 1'),
        ]);

        // La query restituisce un array [rows, fields]
        const parsedInventory = inventory[0].map(item => ({
            ...item,
            disposed: Boolean(item.disposed),
            securityData: item.securityData ? JSON.parse(item.securityData) : null,
        }));

        const parsedPreparations = preparations[0].map(prep => ({
            ...prep,
            ingredients: prep.ingredients ? JSON.parse(prep.ingredients) : [],
        }));
        
        const pharmacySettings = settings[0][0] || {};

        res.json({
            inventory: parsedInventory,
            preparations: parsedPreparations,
            logs: logs[0],
            pharmacySettings: pharmacySettings
        });

    } catch (error) {
        console.error("Errore nel recuperare i dati:", error);
        res.status(500).json({ message: "Errore del server durante il recupero dei dati." });
    }
});

// Endpoint per salvare tutti i dati (approccio distruttivo e ricreativo)
app.post('/api/data', async (req, res) => {
    if (!connection) {
        return res.status(503).json({ message: 'Nessuna connessione al database.' });
    }
    
    const { inventory, preparations, logs, pharmacySettings } = req.body;

    try {
        await connection.beginTransaction();

        // 1. Svuota le tabelle
        await connection.execute('TRUNCATE TABLE inventory');
        await connection.execute('TRUNCATE TABLE preparations');
        await connection.execute('TRUNCATE TABLE logs');
        await connection.execute('TRUNCATE TABLE pharmacy_settings');
        
        // 2. Inserisci i nuovi dati
        if (inventory && inventory.length > 0) {
            const inventoryQuery = 'INSERT INTO inventory (id, name, ni, lot, expiry, quantity, unit, totalCost, costPerGram, supplier, purity, receptionDate, ddtNumber, ddtDate, firstUseDate, endUseDate, disposed, sdsFile, securityData) VALUES ?';
            const inventoryValues = inventory.map(item => [
                item.id, item.name, item.ni, item.lot, item.expiry, item.quantity, item.unit, item.totalCost, item.costPerGram, item.supplier, item.purity, item.receptionDate, item.ddtNumber, item.ddtDate, item.firstUseDate, item.endUseDate, item.disposed, item.sdsFile, item.securityData ? JSON.stringify(item.securityData) : null
            ]);
            await connection.query(inventoryQuery, [inventoryValues]);
        }

        if (preparations && preparations.length > 0) {
            const preparationsQuery = 'INSERT INTO preparations (id, prepNumber, name, pharmaceuticalForm, quantity, prepUnit, expiryDate, posology, date, patient, doctor, status, totalPrice, ingredients) VALUES ?';
            const preparationsValues = preparations.map(p => [
                p.id, p.prepNumber, p.name, p.pharmaceuticalForm, p.quantity, p.prepUnit, p.expiryDate, p.posology, p.date, p.patient, p.doctor, p.status, p.totalPrice, p.ingredients ? JSON.stringify(p.ingredients) : '[]'
            ]);
            await connection.query(preparationsQuery, [preparationsValues]);
        }

        if (logs && logs.length > 0) {
            const logsQuery = 'INSERT INTO logs (id, date, type, substance, ni, quantity, unit, notes) VALUES ?';
            const logsValues = logs.map(log => [log.id, log.date, log.type, log.substance, log.ni, log.quantity, log.unit, log.notes]);
            await connection.query(logsQuery, [logsValues]);
        }
        
        if (pharmacySettings) {
            const settingsQuery = 'INSERT INTO pharmacy_settings (id, name, address, zip, city, province, phone) VALUES (?, ?, ?, ?, ?, ?, ?)';
            await connection.query(settingsQuery, [1, pharmacySettings.name, pharmacySettings.address, pharmacySettings.zip, pharmacySettings.city, pharmacySettings.province, pharmacySettings.phone]);
        }

        await connection.commit();
        res.status(200).json({ message: 'Dati salvati con successo.' });

    } catch (error) {
        await connection.rollback();
        console.error("Errore nel salvare i dati:", error);
        res.status(500).json({ message: 'Errore del server durante il salvataggio dei dati.' });
    }
});

app.listen(PORT, async () => {
  await testConnection();
  console.log(`Server API in ascolto sulla porta ${PORT}`);
});
