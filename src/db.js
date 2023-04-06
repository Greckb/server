import {createPool} from 'mysql2/promise';

export const pool  = createPool({
    host: '178.211.133.14',
    user: 'zftuyhpu_juanjo',
    password: 'Surf&Roll1',
    port: 3306,
    database: 'zftuyhpu_gimnasio',
    })
    
