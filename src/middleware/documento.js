import fs from "fs";
import { Router } from "express";
import { jsPDF } from "jspdf";
import { fileURLToPath } from 'url';
import path from "path";
import { promisify } from 'util';

const router = Router()
const readFile = promisify(fs.readFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function crearMarcaAgua(doc) {
  doc.setFontSize(60);

  doc.setGState(new doc.GState({ opacity: 0.1 }));
  doc.setFont("helvetica", "bold");
  doc.text("EsiMataro SL", doc.internal.pageSize.width / 2, doc.internal.pageSize.height / 2, { align: "center", angle: 45 });
  doc.setGState(new doc.GState({ opacity: 1 }));
}


const generatePdfMiddleware = async (req, res, next) => {
  try {
    // Obtener datos del request
    const { Idcliente, Fechaalta, Nombre, Email, Telefono } = JSON.parse(req.body.data);

    // Crear nuevo documento PDF
    const doc = new jsPDF();

    crearMarcaAgua(doc);
    

    // Agregar encabezado
    doc.setFontSize(20);
    doc.text("EsiMataro", 15, 15);

    // Agregar fecha de alta
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Fecha de Alta: ${Fechaalta}`, 15, 40);


    doc.setFontSize(12);
    doc.text(`DATOS PERSONALES`, 15, 60);

    // Agregar nombre
    doc.setFontSize(10);
    doc.text(`Nombre:`, 40, 75);

    // Agregar email
    doc.setFontSize(10);
    doc.text(`Email:`, 40, 90);

    // Agregar teléfono
    doc.setFontSize(10);
    doc.text(`Telefono:`, 40, 105);

    doc.setFont('helvetica', 'bold').text(`${Nombre}`, 60, 75);
    doc.text(`${Email}`, 60, 90);
    doc.text(`${Telefono}`, 60, 105);

    // Guardar el documento generado en el servidor
    const outputFilePath = path.join(__dirname, `../uploads/${Idcliente}.pdf`);
    fs.writeFileSync(outputFilePath, doc.output());

    // Enviar el PDF generado como respuesta al cliente
    // res.setHeader('Content-Type', 'application/pdf');
    // res.setHeader('Content-Disposition', 'attachment; filename=archivo.pdf');
    // res.send(doc.output());

     // Adjuntar el archivo PDF generado al objeto req
     req.PDF = {
      path: outputFilePath,
      filename: `${Idcliente}.pdf`,
      contentType: 'application/pdf'
    };

    next();


  } catch (error) {
    
    res.status(500).send('Error al generar el documento PDF');
  }
};




export { generatePdfMiddleware };