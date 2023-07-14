// correo.routes.js
import express from 'express';
import nodemailer from 'nodemailer';
import { htmlToText } from 'html-to-text';


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

router.post('/enviar-correo', (req, res) => {
  const { destinatario, asunto, contenido } = req.body;

  // Convierte el contenido HTML en texto plano
 const textContenido = htmlToText(contenido);

  // Configuración del correo
  const mailOptions = {
    from: 'info@esifitnesmataro.com',
    to: destinatario,
    subject: asunto,
    text: textContenido, // Usa el contenido convertido a texto plano
    html: contenido, // Usa el contenido HTML enriquecido
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
