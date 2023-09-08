import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config(); // Cargar variables de entorno desde el archivo .env

export const pool = createPool({
    host: process.env.hostdb,
    user: process.env.userdb,
    password: process.env.passworddb,
    port: process.env.port_db,
    database: process.env.database,
});
