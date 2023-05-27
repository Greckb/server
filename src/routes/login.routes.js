import { Router } from "express";
import { pool } from '../db.js'
import fs from "fs";
import { fileURLToPath } from 'url';
import path from "path";
import { fileupload, processImage } from '../middleware/fileupload.js'

const router = Router()
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//Traer los cliente de DB
// router.post('/api/login', async (req, res) => {
//     const { email, password } = req.body;

//     try {
//         // Verificar credenciales del usuario en la base de datos
//         const user = await pool.query('SELECT * FROM ADMINISTRADORES WHERE email = ? AND password = ?', [email, password]);

//         if (user.length < 1) {
//             // Credenciales inválidas
//             return res.status(401).json({ error: 'Credenciales inválidas' });
//         } else {
//             // Credenciales válidas
//             const { email, password, role,fullName, id } = user[0][0];
//             res.status(200).json({ email, password, role, fullName, id});
//         }
//     } catch (error) {

//         res.status(500).json({ error: 'Error al conectar con la base de datos' });
//     }
// });

router.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Verificar credenciales del usuario en la tabla ADMINISTRADORES
        let user = await pool.query('SELECT * FROM ADMINISTRADORES WHERE email = ? AND password = ?', [email, password]);



        if (user[0].length < 1) {
            // Credenciales no encontradas en la tabla ADMINISTRADORES, buscar en la tabla CLIENTES
            user = await pool.query('SELECT * FROM CLIENTES WHERE Email = ? AND password = ?', [email, password]);

            if (user[0].length < 1) {
                // Credenciales inválidas
                return res.status(401).json({ error: 'Credenciales inválidas' });
            } else {
                // Credenciales válidas encontradas en la tabla CLIENTES
                // const { Email, password, role, Nombre, Idcliente, } = user[0][0];
                // res.status(200).json({ email: Email, password, role, fullName: Nombre, id: Idcliente });

                res.status(200).json(user[0][0]);
            }
        } else {
            // Credenciales válidas encontradas en la tabla ADMINISTRADORES
            const { email, password, role, fullName, id } = user[0][0];

            res.status(200).json({ email, password, role, fullName, id });

        }



    } catch (error) {
        res.status(500).json({ error: 'Error al conectar con la base de datos' });
    }
});

router.put('/update-client/:id', fileupload, async (req, res, next) => {
    if (!req.file) {
        // Si no hay archivo de imagen, pasa al siguiente middleware
        return next();
    }

    // Si hay archivo de imagen, procesa la imagen
    processImage(req, res, next);
}, async (req, res) => {
    try {
        const clientId = req.params.id;
        const data = JSON.parse(req.body.data);
        const { Nombre, Telefono, Dni, Calle, Ciudad, CodigoPostal, Fechanacimiento, Numero, Email, Piso } = data;
    
        // Obtener los datos del cliente de la base de datos
        const query = 'SELECT * FROM CLIENTES WHERE Idcliente = ?';
        const resp = await pool.query(query, [clientId]);
        const client = resp[0];

        // Obtener la imagen del cliente
        let imgArchivada = null;
        if (req.file) {
            imgArchivada = fs.readFileSync(`${__dirname}/../uploads/${req.file.filename}`);
        } else {
            imgArchivada = client.Foto;
        }


        //   // Actualiza los datos del cliente en la base de datos
        const updateQuery = 'UPDATE CLIENTES SET Nombre = ?, Telefono = ?, Dni = ?, Calle = ?, Ciudad = ?, CodigoPostal = ?, Fechanacimiento = ?, Numero = ?, Email = ?, Foto = ?, Piso = ? WHERE Idcliente = ?';
        const updateValues = [Nombre, Telefono, Dni, Calle, Ciudad, CodigoPostal, Fechanacimiento, Numero, Email, imgArchivada, Piso, clientId];
        const update = await pool.query(updateQuery, updateValues);

        if (update[0].affectedRows === 0) {
            // Si no se han actualizado filas, entonces el cliente no existe      
            res.status(404).send(`El cliente con el ID ${id} no existe`);
        } else {
            // El cliente se ha actualizado correctamente
            res.status(202).json({ message: 'Cliente actualizado correctamente' });
        }
    } catch (error) {
        console.error('Error al actualizar el cliente:', error);
        res.status(500).send('Error al actualizar el cliente');
    }

});

router.put('/update-admin/:id', async (req, res) => {
    const clientId = req.params.id;
    const { newPassword } = req.body;
  
    try {
      // Verificar si el cliente existe en la base de datos
      const query = 'SELECT * FROM CLIENTES WHERE Idcliente = ?';
      const results = await pool.query(query, [clientId]);
  
      if (results.length === 0) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }
  
      // Actualizar la contraseña del cliente en la base de datos
      const updateQuery = 'UPDATE CLIENTES SET password = ? WHERE Idcliente = ?';
      await pool.query(updateQuery, [newPassword, clientId]);
  
      return res.status(200).json({ message: 'Contraseña actualizada correctamente' });
    } catch (error) {
      console.error('Error al actualizar la contraseña del cliente:', error);
      return res.status(500).json({ error: 'Error en el servidor' });
    }
  });
  
  





export default router
