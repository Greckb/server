import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { pool } from './db.js';
import clientes from './routes/clientes.routes.js';
import datos from './routes/datos.routes.js';
import login from './routes/login.routes.js';
import remesas from './routes/remesas.routes.js';
import correo from './routes/correo.routes.js';
import notas from './routes/notas.routes.js';
import https from 'https';
import fs from 'fs';
import { writeFileSync } from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Analizar solicitudes JSON
app.use(bodyParser.json());

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

(async function () {
  try {
    await pool.getConnection();
    console.log('Connected to database');
  } catch (error) {
    console.error('Error connecting to database:', error);
  }
})();

// Traer todas las funciones de Clientes
app.use(clientes);

// Traer el arbol del programa
app.use(datos);

app.use(remesas);

app.use(login);

app.use(correo);

app.use(notas);

app.get('/',(req,res)=> res.send('hello'))

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Listening on port ${port}..`));

// Opciones para el servidor HTTPS
// const options = {
//   key: fs.readFileSync('/home/ubuntu/ssl/clave-privada.key'),
//   cert: fs.readFileSync('/home/ubuntu/proyecto/server/src/ssl/certificado.crt')
// };

// const httpsServer = https.createServer(options, app);

// httpsServer.listen(8443, () => {
//   console.log('Servidor Node iniciado en el puerto 8443 (HTTPS)');
// });
