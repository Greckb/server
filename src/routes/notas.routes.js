import { Router } from "express";
import { pool } from '../db.js'
import fs from "fs";
import { fileURLToPath } from 'url';
import path from "path";
import { fileupload, processImage } from '../middleware/fileupload.js'
import { generatePdfMiddleware } from '../middleware/documento.js'

const router = Router()
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//Traer todas las notas
router.post('/notas', async (req, res) => {
    try {
      const { subject, note } = req.body.values;
      const { id: cliente_id } = req.body;




      const fechaActual = new Date().toISOString().split('T')[0];
  
      const query = `
        INSERT INTO Observaciones (cliente_id, asunto, nota, date)
        VALUES (?, ?, ?, ?)
      `;
      const values = [cliente_id, subject, note, fechaActual];
      await pool.query(query, values);
  
      res.sendStatus(201);
    } catch (error) {
      console.error(error);
      res.sendStatus(500);
    }
  });
  
//Crear notas individuales
router.get(`/notas/:id`, async (req, res) => {
    try {
        const cliente_id = req.params.id;

    
        // Realizar una consulta a la base de datos para obtener todas las observaciones
         // Obtener los datos del cliente de la base de datos
         const query = 'SELECT * FROM Observaciones WHERE cliente_id = ?';
         const resp = await pool.query(query, [cliente_id]);
         const client = resp[0];

        res.json(client); // Enviar las observaciones como respuesta en formato JSON
    } catch (error) {
        console.error(error);
        res.sendStatus(500); // Respondemos con estado 500 Internal Server Error en caso de error
    }
});

//Borrar las notas individuales
router.delete(`/notas/:id`, async (req, res) => {
   
    try {
        const cliente_id = req.params.id;
               

      // Eliminar la nota de la base de datos
      const deleteQuery = 'DELETE FROM Observaciones WHERE id = ?';
      const result = await pool.query(deleteQuery, [cliente_id]);
      
      // Verificar si la nota se eliminó correctamente
      if (result.affectedRows === 0) {
        // No se encontró una nota con el ID proporcionado
        return res.status(404).json({ message: 'La nota no existe' });
      }
  
      res.sendStatus(200); // Respondemos con estado 200 OK si la nota se elimina correctamente
    } catch (error) {
      console.error(error);
      res.sendStatus(500); // Respondemos con estado 500 Internal Server Error en caso de error
    }
  });
  


export default router

