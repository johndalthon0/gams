const mysql = require('mysql2');
require('dotenv').config();

const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_NAME'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  throw new Error(`Faltan variables de entorno requeridas: ${missingEnv.join(', ')}`);
}

// SSL: en la nube (Aiven, TiDB, PlanetScale) se activa con DB_SSL=true.
// Railway MySQL por proxy público no usa SSL, así que se deja apagado por defecto.
let ssl;
if (process.env.DB_SSL === 'true') {
  ssl = process.env.DB_SSL_CA
    ? { ca: process.env.DB_SSL_CA, rejectUnauthorized: true }
    : { rejectUnauthorized: false };
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  ssl,
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 60000,
  charset: 'utf8mb4',
});

// MySQL 8 (Railway) trae ONLY_FULL_GROUP_BY; MariaDB local no. Se relaja
// por sesión en cada conexión nueva del pool para no romper los GROUP BY.
pool.on('connection', (conn) => {
  conn.query(
    "SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'"
  );
});

module.exports = pool.promise();