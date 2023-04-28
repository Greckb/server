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

//Traer los cliente de DB
router.get('/usuarios', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM CLIENTES')

        res.json(result)
    } catch (error) {
        res.status(500).json({ message: 'Error al buscar el cliente' });
    }
});

//Traer los cliente por ID
router.get('/usuarios/:id', async (req, res) => {
    try {
        // Obtener el valor del parámetro "id"
        const clientId = req.params.id;
       

        // Ejecutar la consulta y devolver los resultados
        const query = 'SELECT * FROM CLIENTES WHERE Idcliente = ?';
        const resp = await pool.query(query, [clientId]);

        // Devolver los resultados de la consulta como JSON
        res.json(resp);
    } catch (error) {
       
        res.status(500).json({ message: 'Error al buscar el cliente' });
    }
});

// Modificar el cliente por ID
router.put('/usuarios/:id', fileupload, async (req, res, next) => {
    if (!req.file) {
        // Si no hay archivo de imagen, pasa al siguiente middleware
        return next();
    }

    // Si hay archivo de imagen, procesa la imagen
    processImage(req, res, next);
}, async (req, res) => {
    const clientId = req.params.id;
    const data = JSON.parse(req.body.data);
    const { Calle, Ciudad, Fechafreeze, CodigoPostal, Cuota, Dni, Fechanacimiento, IBAN, Nombre, Numero, Plan, Prefijo, Telefono, Email, Fechaalta, Cuotamensual, Piso, Observaciones, checkbox, Estado, BIC, role, password, comercial, proteccion } = data;

    try {
        // Obtener los datos del cliente de la base de datos
        const query = 'SELECT * FROM CLIENTES WHERE Idcliente = ?';
        const resp = await pool.query(query, [clientId]);
        const client = resp[0];



        let imgArchivada = null;
        if (req.file) {
            imgArchivada = fs.readFileSync(`${__dirname}/../uploads/${req.file.filename}`);
        } else {
            imgArchivada = client.Foto;
        }

        // Actualizar los datos del cliente en la base de datos
        const updateQuery = 'UPDATE CLIENTES SET Nombre = ?, Telefono = ?, Dni = ?, Calle = ?, Ciudad = ?, CodigoPostal = ?, Cuota = ?, Fechanacimiento = ?, IBAN = ?, Numero = ?, Plan = ?, Prefijo = ?, Email = ?, Fechaalta = ?, Cuotamensual = ?, Estado = ?, Foto = ?, Piso = ?, checkbox = ?, Observaciones = ?, Fechafreeze = ?, BIC = ?, role = ?, password = ?, comercial = ?, proteccion = ? WHERE Idcliente = ?';
        const updateValues = [Nombre, Telefono, Dni, Calle, Ciudad, CodigoPostal, Cuota, Fechanacimiento, IBAN, Numero, Plan, Prefijo, Email, Fechaalta, Cuotamensual, Estado, imgArchivada, Piso, checkbox, Observaciones, Fechafreeze, BIC, role, password, comercial, proteccion, clientId];

        const update = await pool.query(updateQuery, updateValues);

        if (update[0].affectedRows === 0) {
            // Si no se han actualizado filas, entonces el cliente no existe
            
            res.status(404).send(`El cliente con el ID ${clientId} no existe`);
        } else {
            // El cliente se ha actualizado correctamente
            res.status(202).json({ message: 'Cliente actualizado correctamente' });

        }
    } catch (error) {
       
        res.status(500).send('Error al actualizar el cliente');
    }
}
);


// Modificar el Estado del cliente por ID
router.put('/estado/:id', fileupload, async (req, res, next) => {
    if (!req.file) {
        // Si no hay archivo de imagen, pasa al siguiente middleware
        return next();
    }
    // Si hay archivo de imagen, procesa la imagen
    processImage(req, res, next);

}, async (req, res) => {

    const clientId = req.params.id;
    const data = JSON.parse(req.body.data)
    const { Fechafreeze, Estado } = data;

    try {

        // Actualizar los datos del cliente en la base de datos
        const updateQuery = 'UPDATE CLIENTES SET  Estado = ?, Fechafreeze = ? WHERE Idcliente = ?';
        const updateValues = [Estado, Fechafreeze, clientId];

        const update = await pool.query(updateQuery, updateValues);

        if (update.affectedRows === 0) {
            // Si no se han actualizado filas, entonces el cliente no existe
       
            res.status(404).send(`El Estado con el ID ${clientId} no existe`);
        } else {
            // El cliente se ha actualizado correctamente
            res.status(202).json({ message: 'El Estado ha sido actualizado correctamente' });
        }
    } catch (error) {
        
        res.status(500).send('Error al actualizar el Estado del cliente');
    }
}
);

//Añadir un Cliente a la DB
router.post('/addCliente', fileupload, generatePdfMiddleware, async (req, res) => {
    try {
        // Si hay archivo de imagen, procesa la imagen
        let imgArchivada = null;
        if (req.file) {
            imgArchivada = fs.readFileSync(`${__dirname}/../uploads/${req.file.filename}`);
            // Eliminar la imagen subida del servidor
            fs.unlinkSync(`${__dirname}/../uploads/${req.file.filename}`);
        }

        // Si hay archivo PDF generado, procesa el PDF
        let pdfArchivado = null;
        if (req.PDF) {
            pdfArchivado = fs.readFileSync(`${__dirname}/../uploads/${req.PDF.filename}`);
            // Eliminar el PDF generado del servidor
            fs.unlinkSync(`${__dirname}/../uploads/${req.PDF.filename}`);
        }


        const Fechafreeze = req.body.data.Fechafreeze || '0000-00-00';

        const { Idcliente, Calle, Ciudad, CodigoPostal, Cuota, Dni, Fechanacimiento, IBAN, Nombre, Numero, Plan, Prefijo, Telefono, Email, Fechaalta, Cuotamensual, Estado, Piso, Observaciones, BIC, checkbox, role, password, comercial, proteccion } = JSON.parse(req.body.data);
              
        // Validar y sanitizar los datos de entrada
        const values = [Idcliente, Nombre, Calle, Numero, CodigoPostal, Ciudad, Prefijo, Telefono, Dni, Fechanacimiento, Fechaalta, imgArchivada, IBAN, Observaciones, Fechafreeze, Cuotamensual, Estado, Email, Plan, Cuota, Piso, checkbox, BIC, role, password, comercial, proteccion, pdfArchivado];

        // Establecer la consulta SQL y los valores a insertar
        const query = 'INSERT INTO CLIENTES (Idcliente, Nombre, Calle, Numero, CodigoPostal, Ciudad, Prefijo, Telefono, Dni, Fechanacimiento, Fechaalta, Foto, IBAN, Observaciones, Fechafreeze,  Cuotamensual, Estado, Email, Plan, Cuota, Piso, checkbox, BIC, role, password, comercial, proteccion, PDF ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';

        // Ejecutar la consulta y guardar el resultado
        const addClient = await pool.query(query, values);
        const newClient = { Idcliente, Nombre, Calle, Numero, CodigoPostal, Ciudad, Prefijo, Telefono, Dni, Fechanacimiento, Fechaalta, Foto: imgArchivada, IBAN, Observaciones, Fechafreeze, Cuotamensual, Estado, Email, Plan, Cuota, Piso, checkbox, BIC, role, password, comercial, proteccion, PDF: pdfArchivado };
        res.status(201).json(newClient);
    } catch (error) {
        
        res.status(500).send('Error al introducir el Cliente');
    }
});

// Modificar la cuota del cliente por ID
router.put('/cuota/:id', async (req, res) => {
    const clientId = req.params.id;
    const data = req.body;
    const {Plan, Cuota, Cuotamensual, Descuento} = data
    
    try {

        // Actualizar los datos del cliente en la base de datos
        const updateQuery = 'UPDATE CLIENTES SET  Plan = ?, Cuota = ?, Cuotamensual = ?, Descuento = ? WHERE Idcliente = ?';
        const updateValues = [Plan, Cuota,Cuotamensual,Descuento, clientId];

        const update = await pool.query(updateQuery, updateValues);

        if (update.affectedRows === 0) {
            // Si no se han actualizado filas, entonces el cliente no existe
       
            res.status(404).send(`El Cliente con el ID ${clientId} no existe`);
        } else {
            // El cliente se ha actualizado correctamente
            res.status(202).json({ message: 'su Tarifa ha sido actualizado correctamente' });
        }
    } catch (error) {
        
        res.status(500).send('Error al actualizar la Tarifa del cliente');
    }
  });
  
  
  


export default router


