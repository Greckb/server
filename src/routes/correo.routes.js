// correo.routes.js
import express from 'express';
import nodemailer from 'nodemailer';
import { htmlToText,convert } from 'html-to-text';


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
    user: '',
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
      // Ocurrió un error al subir el archivo
      return res.status(500).json({ message: 'Error al adjuntar el archivo' });
    } else if (err) {
      // Ocurrió otro tipo de error
      return res.status(500).json({ message: 'Error en el servidor' });
    }

    // Los datos del formulario (destinatario, asunto, contenido) estarán en req.body
    const { destinatario, asunto, contenido } = req.body;

 
    // Verificar si se adjuntó un archivo
    let adjunto;
    if (req.file) {
      // El archivo adjunto está en req.file
      adjunto = {
        filename: req.file.originalname,
        path: req.file.path,
      };
    }

    // Configurar los datos del correo electrónico
    const mailOptions = {
      from: 'info@esifitnesmataro.com',
      to: destinatario,
      subject: asunto,
      text: htmlToText(contenido), // Convertir el contenido HTML a texto plano
      html: contenido,
      attachments: adjunto ? [adjunto] : [], // Adjuntar el archivo si existe
    };

    console.log(mailOptions)

    // Enviar el correo electrónico
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error al enviar el correo:', error);
        return res.status(500).json({ message: 'Error al enviar el correo' });
      }

      console.log('Correo enviado:', info.response);
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



export default router;
