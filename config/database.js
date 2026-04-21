const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'agua_consiente',
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    queueLimit: 0
});

const isTestEnvironment = Boolean(process.env.JEST_WORKER_ID || process.env.NODE_ENV === 'test');
const isConfigured = Boolean(
    process.env.DB_HOST &&
    process.env.DB_USER &&
    process.env.DB_NAME
);

let cachedConnectionCheck = null;

const canUseDatabase = async () => {
    if (cachedConnectionCheck !== null) {
        return cachedConnectionCheck;
    }

    if (!isConfigured || isTestEnvironment) {
        cachedConnectionCheck = false;
        return cachedConnectionCheck;
    }

    try {
        const connection = await pool.getConnection();
        connection.release();
        cachedConnectionCheck = true;
    } catch (error) {
        cachedConnectionCheck = false;
    }

    return cachedConnectionCheck;
};

module.exports = {
    pool,
    isConfigured,
    canUseDatabase
};
