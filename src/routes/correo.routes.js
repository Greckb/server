// correo.routes.js
import express from 'express';
import nodemailer from 'nodemailer';
import { htmlToText,convert } from 'html-to-text';
import fs from "fs";
import { pool } from '../db.js'


import multer from "multer";
import createDOMPurify from 'dompurify';

import { fileURLToPath } from 'url';
import path from "path";



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOMPurify = createDOMPurify();

const router = express.Router();


// Configuración del transporte SMTP
const transporter = nodemailer.createTransport({
  host: 'com1004.raiolanetworks.es',
  port: 465,
  secure: true,
  auth: {
    user: 'info@esifitnesmataro.com',
    pass: '0zOsXG5]eYbr',
  },
  logger: true,
  transactionLog: true, // include SMTP traffic in the logs
  allowInternalNetworkInterfaces: false
},
{
  // default message fields

  // sender info
  from: 'Info <info@esifitnesmataro.com>',
  headers: {
      'X-Laziness-level': 1000 // just an example header, no need to use this
  }
}
);


// Configurar Multer para guardar los archivos adjuntos en la carpeta /uploads
const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage }).single('adjunto');


router.post('/enviar-correo', (req, res) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ message: 'Error al adjuntar el archivo' });
    } else if (err) {
      return res.status(500).json({ message: 'Error en el servidor' });
    }

    const { destinatario, asunto, contenido, cc, bcc } = req.body; // Agregar cc y bcc

    let adjunto;
    if (req.file) {
      adjunto = {
        filename: req.file.originalname,
        path: req.file.path,
      };
    }

    const mailOptions = {
      from: 'info@esifitnesmataro.com',
      to: destinatario,
      subject: asunto,
      text: htmlToText(contenido),
      html: contenido,
      attachments: adjunto ? [adjunto] : [],
      cc: cc ? cc.split(',') : [], // Agregar CC
      bcc: bcc ? bcc.split(',') : [], // Agregar BCC
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error al enviar el correo:', error);
        return res.status(500).json({ message: 'Error al enviar el correo' });
      }

      if (adjunto) {
        try {
          fs.unlinkSync(adjunto.path);
          console.log('Archivo adjunto eliminado');
        } catch (error) {
          console.error('Error al eliminar el archivo adjunto:', error);
        }
      }

      res.status(200).json({ message: 'Correo enviado exitosamente' });
    });
  });
});





router.post('/enviar-correo-remesa', (req, res) => {
  const { destinatario, asunto, contenido } = req.body;


  // Configuración del correo
  const mailOptions = {
    from: 'info@esifitnesmataro.com',
    to: destinatario,
    subject: asunto,
    text: contenido, // Usa el contenido convertido a texto plano
  
  };

  // Envío del correo
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      res.status(500).json({ message: 'Error al enviar el correo' });
    } else {
      console.log('Correo enviado:', info.response);
      res.status(200).json({ message: 'Correo enviado exitosamente' });
    }
  });
});

router.get('/nombre-de-emails', async (req, res) => {
  try {
    // Realizar la consulta a la base de datos
    const result = await pool.query('SELECT Nombre, Email, Estado FROM CLIENTES');

    // Extraer los datos de la consulta
    const data = result[0].map(row => ({ name: row.Nombre, value: row.Email, src: '', estado: row.Estado }));

    // Obtener todos los correos electrónicos en un array
    const allEmails = data.map(item => item.value);

    // Crear el objeto adicional con el valor 'todos'
    const todosEmails = { name: 'todos', value: allEmails, estado: 'Activo' };

    // Filtrar correos electrónicos por estado 'Activo'
    const activosEmails = data.filter(item => item.estado === 'Activo').map(item => item.value);

    // Crear el objeto adicional con el valor 'Activos'
    const activosEmailsObject = { name: 'Activos', value: activosEmails, estado: 'Activo' };

    // Filtrar correos electrónicos por estado 'Baja'
    const bajaEmails = data.filter(item => item.estado === 'Baja').map(item => item.value);

    // Crear el objeto adicional con el valor 'Baja'
    const bajaEmailsObject = { name: 'Baja', value: bajaEmails, estado: 'Baja' };

    // Agregar los objetos 'todosEmails', 'activosEmailsObject' y 'bajaEmailsObject' al array 'data'
    data.push(todosEmails, activosEmailsObject, bajaEmailsObject);

    // Eliminar la propiedad "estado" de los objetos en el array "data"
    data.forEach(item => delete item.estado);

    // Enviar los datos en la respuesta
    res.status(200).json({ data });
  } catch (error) {
    console.error('Error al consultar la base de datos:', error);
    res.status(500).json({ message: 'Error al consultar la base de datos' });
  }
});






export default router;
