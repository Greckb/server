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
import calendario from './routes/calendario.routes.js';
import profile from './routes/profile.routes.js';
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

// Configurar middleware para archivos estáticos
app.use(express.static(path.join(__dirname, 'src/public')));

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

app.use(calendario);

app.use(profile)

app.get('/',(req,res)=> res.send('hello'))

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Listening on port ${port}..`));

