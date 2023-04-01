import {createPool} from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

export const pool  = createPool({
    host: process.env.host_db,
    user: process.env.user_db,
    password: process.env.password_db,
    port: process.env.port_db,
    database: process.env.database,
    })
    
    