import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser';
import {pool} from './db.js'
import clientes from './routes/clientes.routes.js'
import datos from './routes/datos.routes.js'
import login from './routes/login.routes.js'
import remesas from './routes/remesas.routes.js'
import correo from './routes/correo.routes.js'
import dotenv from 'dotenv';
dotenv.config();
import dns from 'dns';



const app = express();

// Analizar solicitudes JSON
app.use(bodyParser.json());

app.use(
  cors({
    allowedHeaders: ["authorization", "Content-Type"], // you can change the headers
    exposedHeaders: ["authorization"], // you can change the headers
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false
  })
);

(async function() {
  try {
    await pool.getConnection();
    // console.log('Connected to database');
  } catch (error) {
    // console.error('Error connecting to database:', error);
  }
})();

//Traer todas las funciones de Clientes
app.use(clientes)

app.get('/', (req,res)=>{
  dns.lookup(require('os').hostname(), function (err, address, family) {
    console.log(`La dirección IP del host es ${address}`);
  });
  res.send('Welcome to my Apy!')
})

//Traer el arbol del programa
app.use(datos)

app.use(remesas)

app.use(login)

app.use(correo)

// function worker() {
//   setInterval(() => {
//     console.log('werk');
//   }, 1000);
// }

// throng({
//   workers: 1,
//   start: worker
// });

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => console.log(`Listening on port ${port}`));
