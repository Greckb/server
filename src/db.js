import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config(); // Cargar variables de entorno desde el archivo .env

export const pool = createPool({
    host: '178.211.133.14',
    user: 'zftuyhpu_juanjo',
    port: 3306,
    database: 'zftuyhpu_gimnasio',
});
