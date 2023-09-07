// correo.routes.js
import express from 'express';
import nodemailer from 'nodemailer';
import { htmlToText, convert } from 'html-to-text';
import fs from "fs";
import { pool } from '../db.js'


import multer from "multer";
import createDOMPurify from 'dompurify';

import { fileURLToPath, pathToFileURL } from 'url';
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

const contenidoHTML = `
<html>
<head>
<style>
    body {
        font-family: Arial, sans-serif;
    }
    .bold {
        font-weight: bold;
    }
    .page-break {
        page-break-before: always;
    }
</style>
</head>
<body>
<Br><Br>
<div class="page-break">
<img src="https://www.esifitnesmataro.com/images/Logo_copia.png" alt="Logo de Esimataro" width="150">
    <p>El Responsable del Tratamiento <span class="bold">OELAP TRAINING SL</span>, en cumplimiento del Reglamento General de Protección de Datos UE-2016/679, de la LOPD 3/2018, de garantía de los derechos digitales, y por la Directiva UE-2016/943 y la Ley 1/2019, de Secretos Empresariales, le informa que sus datos serán tratados para la gestión administrativa, contable, la prestación del servicio ofertado y el envío de información por <span class="bold">OELAP TRAINING SL</span>. No se cederán a terceros, salvo por obligación legal, pudiendo ejercer sus derechos de acceso, rectificación, supresión, oposición, portabilidad y limitación en <span class="bold">OELAP TRAINING SL</span>:</p>
    <p><span class="bold">RONDA SANT OLEGUER, 73, LOCAL. 08304, MATARO (BARCELONA).</span> <a href="mailto:dpd@grupqualia.com">dpd@grupqualia.com</a>.</p>
</div>

<div class="page-break">
    <p class="bold">AVISO DE CONFIDENCIALIDAD:</p>
    <p>De conformidad con lo establecido en el Reglamento General -UE- 2016/679, la LOPD 3/2018, de garantía de los derechos digitales, la Ley 34/2002, de Servicios de la Sociedad de la Información y el Comercio Electrónico, la Ley 9/2014, General de Telecomunicaciones y la Ley 1/2019, de Secretos Empresariales, le informamos que sus datos son tratados con la finalidad de gestionar los servicios contratados y mandarle información de nuestra entidad, <span class="bold">OELAP TRAINING SL</span></p>
</div>

<div class="page-break">
    <p>Este mensaje y sus archivos van dirigidos exclusivamente a su destinatario, pudiendo contener información confidencial sometida a secreto profesional. No está permitida su reproducción o distribución sin la autorización expresa de <span class="bold">OELAP TRAINING SL</span>. Si usted no es el destinatario final, por favor, elimínelo e infórmenos por esta vía.</p>
    <p>Le informamos la posibilidad de ejercer los derechos de acceso, rectificación, oposición, supresión, limitación y portabilidad de sus datos ante <span class="bold">OELAP TRAINING SL</span>:</p>
    <p><span class="bold">RONDA SANT OLEGUER, 73, LOCAL. 08304, MATARO (BARCELONA).</span> <a href="mailto:dpd@grupqualia.com">dpd@grupqualia.com</a></p>
</div>

<div class="page-break">
    <p>Si usted no desea recibir nuestra información, póngase en contacto con nosotros enviando un correo electrónico a la siguiente dirección: <a href="mailto:esifitnesmataro@gmail.com">esifitnesmataro@gmail.com</a></p>
</div>
</body>
</html>

    `;




// router.post('/enviar-correo', (req, res) => {
//   upload(req, res, (err) => {
//     if (err instanceof multer.MulterError) {
//       return res.status(500).json({ message: 'Error al adjuntar el archivo' });
//     } else if (err) {
//       return res.status(500).json({ message: 'Error en el servidor' });
//     }

//     const { destinatario, asunto, contenido, cc, bcc } = req.body; // Agregar cc y bcc

//     const adjuntos = [
//       {
//         filename: 'NORMAS ADMINISTRATIVAS.PDF',
//         path: 'NORMAS_ADMINISTRATIVAS.PDF', // Nombre de archivo relativo a la carpeta 'public'
//       },
//       {
//         filename: 'PROTECCION DATOS PARA USUARIOS.docx',
//         path: 'PROTECCION_DATOS.docx', // Nombre de archivo relativo a la carpeta 'public'
//       },
//     ];

    
 
    
    
    

//     let adjunto;
//     if (req.file) {
//       adjunto = {
//         filename: req.file.originalname,
//         path: req.file.path,
//       };
//     }

//     const newContenido = contenido + contenidoHTML;

//     const mailOptions = {
//       from: 'Esifitnes Mataro <info@esifitnesmataro.com>',
//       to: destinatario,
//       subject: asunto,
//       text: htmlToText(newContenido),
//       html: newContenido,
//       // attachments: adjunto ? [adjunto] : [],
//       attachments: adjuntos ? [adjuntos] : [],
//       cc: cc ? cc.split(',') : [], // Agregar CC
//       bcc: bcc ? bcc.split(',') : [], // Agregar BCC
//     };

//     transporter.sendMail(mailOptions, (error, info) => {
//       if (error) {
//         console.error('Error al enviar el correo:', error);
//         return res.status(500).json({ message: 'Error al enviar el correo' });
//       }

      

//       if (adjunto) {
//         try {
//           fs.unlinkSync(adjunto.path);
//           console.log('Archivo adjunto eliminado');
//         } catch (error) {
//           console.error('Error al eliminar el archivo adjunto:', error);
//         }
//       }

//       res.status(200).json({ message: 'Correo enviado exitosamente' });
//     });
//   });
// });

router.post('/enviar-correo', (req, res) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ message: 'Error al adjuntar el archivo' });
    } else if (err) {
      return res.status(500).json({ message: 'Error en el servidor' });
    }

    const { destinatario, asunto, contenido, cc, bcc } = req.body; // Agregar cc y bcc

    // Ruta del archivo en /server/src/public
    const archivoAdjunto1 = path.join(__dirname, 'src/public/NORMAS_ADMINISTRATIVAS.PDF');
    const archivoAdjunto2 = path.join(__dirname, 'src/public/PROTECCION_DATOS.docx');

    // Leer los archivos adjuntos
    fs.readFile(archivoAdjunto1, (error1, data1) => {
      fs.readFile(archivoAdjunto2, (error2, data2) => {
        if (error1 || error2) {
          console.error('Error al leer uno o más archivos adjuntos:', error1 || error2);
          return res.status(500).json({ message: 'Error al leer archivos adjuntos' });
        }

        const adjuntos = [
          {
            filename: 'NORMAS ADMINISTRATIVAS.PDF',
            content: data1, // Contenido del primer archivo adjunto
          },
          {
            filename: 'PROTECCION DATOS PARA USUARIOS.docx',
            content: data2, // Contenido del segundo archivo adjunto
          },
        ];

        let adjunto;
        if (req.file) {
          adjunto = {
            filename: req.file.originalname,
            path: req.file.path,
          };
        }

        const newContenido = contenido + contenidoHTML;

        const mailOptions = {
          from: 'Esifitnes Mataro <info@esifitnesmataro.com>',
          to: destinatario,
          subject: asunto,
          text: htmlToText(newContenido),
          html: newContenido,
          attachments: adjuntos, // Agregar archivos adjuntos
          cc: cc ? cc.split(',') : [], // Agregar CC
          bcc: bcc ? bcc.split(',') : [], // Agregar BCC
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error('Error al enviar el correo:', error);
            return res.status(500).json({ message: 'Error al enviar el correo' });
          }

          // Eliminar el archivo adjunto después de enviarlo con éxito
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
  });
});


router.post('/enviar-correo', (req, res) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ message: 'Error al adjuntar el archivo' });
    } else if (err) {
      return res.status(500).json({ message: 'Error en el servidor' });
    }

    const { destinatario, asunto, contenido, cc, bcc } = req.body; // Agregar cc y bcc

    const adjuntos = [
      {
        filename: 'NORMAS ADMINISTRATIVAS.PDF',
        path: 'NORMAS_ADMINISTRATIVAS.PDF', // Nombre de archivo relativo a la carpeta 'public'
      },
      {
        filename: 'PROTECCION DATOS PARA USUARIOS.docx',
        path: 'PROTECCION_DATOS.docx', // Nombre de archivo relativo a la carpeta 'public'
      },
    ];

    
 
    
    
    

    let adjunto;
    if (req.file) {
      adjunto = {
        filename: req.file.originalname,
        path: req.file.path,
      };
    }

    const newContenido = contenido + contenidoHTML;

    const mailOptions = {
      from: 'Esifitnes Mataro <info@esifitnesmataro.com>',
      to: destinatario,
      subject: asunto,
      text: htmlToText(newContenido),
      html: newContenido,
      // attachments: adjunto ? [adjunto] : [],
      attachments: adjuntos ? [adjuntos] : [],
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



router.post('/contrasena', async (req, res) => {
  const { email } = req.body;

  try {
    // Buscar al cliente por su correo electrónico en la base de datos
    const result = await pool.query('SELECT * FROM CLIENTES WHERE Email = ?', [email]);

    if (result.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    const contraseña = result[0][0].password;
    const nombre = result[0][0].Nombre

    // Configurar el correo electrónico
    const mailOptions = {
      from: 'Esifitnes Mataro <info@esifitnesmataro.com>',
      to: email,
      subject: 'Recuperación de contraseña',
      html: `
<html>
<head>
<style>
    body {
        font-family: Arial, sans-serif;
    }
    .bold {
        font-weight: bold;
    }
    .page-break {
        page-break-before: always;
    }
</style>
</head>
<body>
<div class="page-break">
<p>Estimado ${nombre},</p>
          <br>
          <p>Has olvidado tu contraseña?</p>
          <p>Este es tu email: <strong>${email}</strong></p>
          <p>y tu contraseña es...<strong>${contraseña}</strong></p>
          <br><br>
          <p><strong>Si no solicitaste la recuperación de la contraseña o tienes más problemas para iniciar sesión, por favor contacta con el soporte en <a href="mailto:info@esifitnesmataro.com">info@esifitnesmataro.com</a>.</strong></p>
          <br><br>
          </div>
<div class="page-break">
<img src="https://www.esifitnesmataro.com/_next/static/media/logo_esi.24fdf57a.png" alt="Logo de Esimataro" width="200">
    <p>El Responsable del Tratamiento <span class="bold">OELAP TRAINING SL</span>, en cumplimiento del Reglamento General de Protección de Datos UE-2016/679, de la LOPD 3/2018, de garantía de los derechos digitales, y por la Directiva UE-2016/943 y la Ley 1/2019, de Secretos Empresariales, le informa que sus datos serán tratados para la gestión administrativa, contable, la prestación del servicio ofertado y el envío de información por <span class="bold">OELAP TRAINING SL</span>. No se cederán a terceros, salvo por obligación legal, pudiendo ejercer sus derechos de acceso, rectificación, supresión, oposición, portabilidad y limitación en <span class="bold">OELAP TRAINING SL</span>:</p>
    <p><span class="bold">RONDA SANT OLEGUER, 73, LOCAL. 08304, MATARO (BARCELONA).</span> <a href="mailto:dpd@grupqualia.com">dpd@grupqualia.com</a>.</p>
</div>

<div class="page-break">
    <p class="bold">AVISO DE CONFIDENCIALIDAD:</p>
    <p>De conformidad con lo establecido en el Reglamento General -UE- 2016/679, la LOPD 3/2018, de garantía de los derechos digitales, la Ley 34/2002, de Servicios de la Sociedad de la Información y el Comercio Electrónico, la Ley 9/2014, General de Telecomunicaciones y la Ley 1/2019, de Secretos Empresariales, le informamos que sus datos son tratados con la finalidad de gestionar los servicios contratados y mandarle información de nuestra entidad, <span class="bold">OELAP TRAINING SL</span></p>
</div>

<div class="page-break">
    <p>Este mensaje y sus archivos van dirigidos exclusivamente a su destinatario, pudiendo contener información confidencial sometida a secreto profesional. No está permitida su reproducción o distribución sin la autorización expresa de <span class="bold">OELAP TRAINING SL</span>. Si usted no es el destinatario final, por favor, elimínelo e infórmenos por esta vía.</p>
    <p>Le informamos la posibilidad de ejercer los derechos de acceso, rectificación, oposición, supresión, limitación y portabilidad de sus datos ante <span class="bold">OELAP TRAINING SL</span>:</p>
    <p><span class="bold">RONDA SANT OLEGUER, 73, LOCAL. 08304, MATARO (BARCELONA).</span> <a href="mailto:dpd@grupqualia.com">dpd@grupqualia.com</a></p>
</div>

<div class="page-break">
    <p>Si usted no desea recibir nuestra información, póngase en contacto con nosotros enviando un correo electrónico a la siguiente dirección: <a href="mailto:esifitnesmataro@gmail.com">esifitnesmataro@gmail.com</a></p>
</div>
</body>
</html>

      `,
    };




    // Enviar el correo electrónico
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error al enviar el correo:', error);
        return res.status(500).json({ message: 'Error al enviar el correo' });
      }

      console.log('Correo enviado:', info.response);

      res.status(200).json({ message: 'Contraseña enviada exitosamente por correo electrónico' });
    });
  } catch (error) {
    console.error('Error en la petición:', error);
    res.status(500).json({ message: 'Error en la petición' });
  }
});






router.post('/enviar-correo-remesa', (req, res) => {
  const { destinatario, asunto, contenido } = req.body;


  // Configuración del correo
  const mailOptions = {
    from: 'Esimataro <info@esifitnesmataro.com>',
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


router.post('/correobienvenida', (req, res) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ message: 'Error al adjuntar el archivo' });
    } else if (err) {
      return res.status(500).json({ message: 'Error en el servidor' });
    }

    // const { destinatario, nombre } = req.body; // Agregar cc y bcc

    const destinatario = 'luar.28@gmail.com'
    const nombre = 'Raul'
    
    // Contenido del mensaje de bienvenida en HTML
    const contenidobienvenida = `
    <!DOCTYPE html>
    <html>
    
    <head>
        <title>Bienvenido a Esi Fitness</title>
    </head>
    
    <body>
        <p>Estimado/a ${nombre},</p>
    
        <p>Es un placer darle la bienvenida a Esi Fitness, su centro de bienestar y salud de confianza. Nos complace mucho que haya elegido unirse a nuestra comunidad. Estamos aquí para brindarle el mejor servicio y apoyo en su camino hacia una vida más saludable y activa.</p>
    
        <p>En Esi Fitness, nos enorgullece ofrecer un ambiente de calidad y excelencia en cada aspecto de su experiencia con nosotros. Si tiene alguna pregunta, sugerencia o necesidad, no dude en ponerse en contacto con nosotros. Estamos aquí para ayudarle en su viaje hacia el bienestar.</p>
    
        <p>Para comunicarse con nosotros, puede hacerlo a través del correo electrónico a la dirección: <a href="mailto:info@esifitnesmataro.com">info@esifitnesmataro.com</a>, o si lo prefiere, estamos disponibles por teléfono en el número: <a href="tel:+34989909551">649 909 551</a>. Estaremos encantados de atender sus consultas en cualquier momento.</p>
    
        <p>A continuación, le adjuntamos nuestras normas internas y nuestra política de protección de datos para su referencia. Le animamos a revisar estos documentos para comprender mejor nuestras políticas y compromisos con su seguridad y privacidad.</p>
       
        <p>Agradecemos la confianza que ha depositado en nosotros y esperamos que su experiencia en Esi Fitness sea enriquecedora y satisfactoria.</p>
    
        <p>Siempre estamos trabajando para mejorar y ofrecer un servicio de alta calidad a nuestros miembros. Si tiene alguna sugerencia o comentario, no dude en compartirla con nosotros. Valoramos su opinión.</p>
    
        <p>Una vez más, le damos la bienvenida a Esi Fitness y esperamos tener el placer de servirle pronto.</p>
    
        <p>Atentamente,</p>
       
        
    </body>
    
    </html>
    
    `;

    const adjuntos = [
      {
        filename: 'NORMAS ADMINISTRATIVAS.PDF',
        path: 'src/public/NORMAS_ADMINISTRATIVAS.PDF', // Ruta absoluta al archivo PDF
      },
      {
        filename: 'PROTECCION DATOS PARA USUARIOS.docx',
        path: 'src/public/PROTECCION_DATOS.docx', // Ruta absoluta al archivo DOCX
      },
    ];

    const newContenido = contenidobienvenida + contenidoHTML;

    const mailOptions = {
      from: 'Esifitnes Mataro <info@esifitnesmataro.com>',
      to: destinatario,
      subject: 'Bienvenido/a a Esi Fitness',
      text: htmlToText(newContenido),
      html: newContenido,
      attachments: adjuntos, // Agregar los archivos adjuntos aquí
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error al enviar el correo:', error);
        return res.status(500).json({ message: 'Error al enviar el correo' });
      }

     

      res.status(200).json({ message: 'Correo enviado exitosamente' });
    });
  });
});






export default router;
