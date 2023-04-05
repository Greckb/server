import {createPool} from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

export const pool  = createPool({
    host: process.env.MYQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    port: process.env.MYSQLPORT,
    database: process.env.MYSQLDATABASE,
    })
    
    