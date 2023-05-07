import { Router } from "express";
import { pool } from '../db.js'
import fs from "fs";
import { fileURLToPath } from 'url';
import { fileupload, processImage } from '../middleware/fileupload.js'
import path from "path";

const router = Router()

import builder from 'xmlbuilder';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


//Generar el archivo XML SEPA
router.get('/remesas/:id', async (req, res) => {
    const clientId = req.params.id;
    const query = 'SELECT Factura_cliente.*, CLIENTES.Nombre AS cliente_nombre, CLIENTES.BIC, CLIENTES.IBAN FROM Factura_cliente INNER JOIN CLIENTES ON Factura_cliente.cliente_id = CLIENTES.idcliente WHERE Factura_cliente.id = ?';

    const result = await pool.query(query, [clientId]);
    let totalCuotas = result[0].reduce((acumulador, pago) => {
        return acumulador + parseFloat(pago.cuota);
    }, 0);
    let fechaActual = new Date();
    let anioActual = fechaActual.getFullYear();
    let fechaISO = fechaActual.toISOString();
    let fechaActualStr = fechaISO.slice(0, 10);
    let mesActual = fechaActual.getMonth() + 1; // Nota: getMonth() devuelve un número de 0 a 11, por eso se suma 1

    // const datos = { total: result[0].length, totalCuotas: totalCuotas }


    const datos = {
        msgId: `ESI FITNESS ${anioActual}-${mesActual}`,
        fechaActualStr: fechaActualStr,
        total: result[0].length,
        totalCuotas: totalCuotas,
        orgId: 'ES30000B67170605',
        iban: 'ES2321000287350200851310',
        bic: 'CAIXESBBXXX',

    };
    const miarray = result[0].map((result, index) => {
        const paddedId = result.id.toString().padStart(5, '0');
        const mandateNumber = index + 1;
        return {
            endToEndId: mandateNumber,
            currency: "EUR",
            amount: result.cuota,
            mandateId: paddedId,
            mandateDate: fechaActualStr,
            creditorId: "ES30000B67170605",
            bic: "CAIXESBBXXX",
            debtorName: result.cliente_nombre,
            debtorIBAN: result.IBAN,
            reference: "PALEOTRAINING - PALEOMATARO",


            // instrId: paddedId,

            // creditorId:esult.IBAN, 

            // bic: result.BIC,
            // debtorName: ,
            // debtorIBAN: result.IBAN,
            // orgId:paddedId,
            // dtOfSgntr: result.fecha_pago.toISOString().substring(0, 10),
            // dbtr: {
            //     name: result.cliente_nombre,
            //     iban: result.IBAN,
            //     bic: result.BIC
            // 
        };
    });


    const archivo = generarXML(miarray, datos)
    res.send(archivo)

});


//Traer las Remesas al listado
router.get('/remesas', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Remesas')
        res.json(result[0])
    } catch (error) {

        res.status(500).send('Error connecting to database');
    }
});


//Ver las factuas por ID
router.get('/factura/:id', async (req, res) => {
    try {
        const clientId = req.params.id;
        const query = 'SELECT Factura_cliente.*, CLIENTES.Nombre AS cliente_nombre, CLIENTES.Plan, CLIENTES.Cuota FROM Factura_cliente INNER JOIN CLIENTES ON Factura_cliente.cliente_id = CLIENTES.idcliente WHERE Factura_cliente.id = ?';
        const result = await pool.query(query, [clientId]);
        res.json(result[0])
    } catch (error) {

        res.status(500).send('Error connecting to database');
    }
});

router.post('/remesas', async (req, res) => {
    const idClientes = req.body;

    try {
        const ids = idClientes.map(id => `'${id}'`).join(',');
        const query = `SELECT IdCliente, Nombre, Plan, Cuota, CuotaMensual,UltimoPago, ProximoPago FROM CLIENTES WHERE IdCliente IN (${ids})`;
        const [rows, fields] = await pool.query(query);

        // Obtener el valor máximo actual de id en la tabla Factura_cliente
        const [[{ maxId }]] = await pool.query('SELECT MAX(id) AS maxId FROM Factura_cliente');


        // Crear un array con los nuevos valores a insertar
        const newValues = rows.map(({ IdCliente, CuotaMensual }) => {
            return [
                maxId + 1, // Nuevo valor de id
                new Date().toISOString().slice(0, 10), // Fecha de hoy
                IdCliente,
                CuotaMensual,
            ];
        });

        // Insertar los nuevos valores en la tabla Factura_cliente
        const insertQuery = 'INSERT INTO Factura_cliente (id, fecha_pago, cliente_id, cuota) VALUES ?';
        await pool.query(insertQuery, [newValues]);


        // Crear un array con los nuevos valores a insertar en la tabla Remesas
        const newValues2 = [
            [
                maxId + 1, // Nuevo valor de factura_id
                new Date().toISOString().slice(0, 10), // Fecha de hoy
                maxId + 1, // Nuevo valor de factura_id
                rows.reduce((total, { CuotaMensual }) => total + CuotaMensual, 0), // Suma de las cuotas mensuales
                rows.length, // Número de clientes
            ],
        ];

        // Insertar los nuevos valores en la tabla Remesas
        const insertQuery2 = 'INSERT INTO Remesas (id, fecha_creacion, factura_id, cuota, num_clientes) VALUES ?';
        await pool.query(insertQuery2, [newValues2]);
        const value = newValues2[0][0];
        res.status(200).send({ value });



    } catch (error) {

        res.status(500).send('Error en el servidor');
    }
});



// router.get('/pagos', async (req, res) => {
//     const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  
//     try {
//       const result = await pool.query('SELECT Idcliente, Plan, UltimoPago, ProximoPago FROM CLIENTES');
//       const clientes = result[0];
  
//       for (const cliente of clientes) {
//         // Aquí puedes incluir el código que procesa cada cliente
  
//         //si hay registro de ultimo pago
//         if (cliente.UltimoPago === 'abril 2023') {
//           const proximoPago = new Date(); // Crear objeto Date para el próximo pago
//           const plan = cliente.Plan.toLowerCase(); // Obtener el plan y convertirlo a minúsculas para evitar errores de capitalización
  
//           if (plan === 'mensual') { // Si el plan es mensual, el próximo pago será este mes
//             cliente.ProximoPago = `${meses[proximoPago.getMonth()+1]} ${proximoPago.getFullYear()}`; // Guardar el mes actual y el año en la casilla ProximoPago
//             cliente.UltimoPago = `${meses[proximoPago.getMonth()]} ${proximoPago.getFullYear()}`;
//           } else if (plan === 'trimestral') { // Si el plan es trimestral, el próximo pago será dentro de tres meses
//             proximoPago.setMonth(proximoPago.getMonth() + 3); // Sumar tres meses al objeto Date
//             cliente.ProximoPago = `${meses[proximoPago.getMonth()]} ${proximoPago.getFullYear()}`; // Guardar el mes actual más tres y el año en la casilla ProximoPago
//             cliente.UltimoPago = `${meses[proximoPago.getMonth()-1]} ${proximoPago.getFullYear()}`;
//           } else if (plan === 'anual') { // Si el plan es anual, el próximo pago será dentro de un año
//             proximoPago.setFullYear(proximoPago.getFullYear() + 1); // Sumar un año al objeto Date
//             cliente.ProximoPago = `${meses[proximoPago.getMonth()]} ${proximoPago.getFullYear()}`; // Guardar el mes actual del próximo año y el año en la casilla ProximoPago
//             cliente.UltimoPago = `${meses[proximoPago.getMonth()-1]} ${proximoPago.getFullYear()}`;
//           }
  
//           await pool.query('UPDATE CLIENTES SET UltimoPago = ?, ProximoPago = ? WHERE Idcliente = ?', [cliente.UltimoPago, cliente.ProximoPago, cliente.Idcliente]) // Actualizar la base de datos con los nuevos datos
//         }
//       }
  
//       res.json(clientes); // Retorna los resultados de la consulta después de procesar todos los clientes
  

//     } catch (error) {
//         res.status(500).send('Error connecting to database');
//     }
// });

// router.get('/pagos', async (req, res) => {
//     try {
//     const result = await pool.query('SELECT Idcliente, TipoPago FROM CLIENTES');
//     const clientes = result[0];
    
//     for (const cliente of clientes) {
                           
//         //guardar el db de cada cliente en la variable db TipoPago sea 0

//         if (cliente.TipoPago !== 0) { // Si hay un último pago registrado

//             const update = await pool.query('UPDATE CLIENTES SET TipoPago = ? WHERE Idcliente = ?', [0, cliente.Idcliente]) // Actualizar la base de datos con los nuevos datos


        
//             // cliente.TipoPago = 0;
//             // const update = await pool.query('UPDATE CLIENTES SET TipoPago = ? WHERE Idcliente = ?', [cliente.TipoPago, cliente.Idcliente]) // Actualizar la base de datos con los nuevos datos
                   
                
//           res.json(update); // Retorna los resultados de la consulta
//         }}
//     } catch (error) {
//                res.status(500).send('Error connecting to database');
//      }
// });

// router.get('/pagos', async (req, res) => {

//     //traer los datos de la base de datos de la ultima modificacion que ha habido el la tabla clientes y guardarlos en la variable clientes
//     const select = 'SELECT Idcliente, ProximoPago, UltimoPago, TipoPago, fecha_modificacion, columna_modificada FROM CLIENTES';
//     const result = await pool.query(select);

//     const clientes = result[0];
//     console.log(clientes)
 
// });



function generarXML(transactions, datos) {
    // Crear el elemento Document y sus atributos
    const doc = builder.create('Document', { version: '1.0', encoding: 'UTF-8', 'standalone': true });
    doc.att('xmlns', 'urn:iso:std:iso:20022:tech:xsd:pain.008.001.02');

    // Crear el elemento CstmrDrctDbtInitn
    const cstmrDrctDbtInitn = doc.ele('CstmrDrctDbtInitn');


    // Obtener el año y el número de mes actual
    let fechaActual = new Date();
    let anioActual = fechaActual.getFullYear();
    let fechaISO = fechaActual.toISOString();
    let fechaActualStr = fechaISO.slice(0, 10);
    let mesActual = fechaActual.getMonth() + 1; // Nota: getMonth() devuelve un número de 0 a 11, por eso se suma 1

    // Concatenar el año y el número de mes a la cadena 'ESI FITNESS'
    let msgId = `ESI FITNESS ${anioActual}-${mesActual}`;

    // Crear el elemento GrpHdr y sus elementos hijos
    const grpHdr = cstmrDrctDbtInitn.ele('GrpHdr');
    grpHdr.ele('MsgId', datos.msgId);
    grpHdr.ele('CreDtTm', datos.fechaActualStr);
    grpHdr.ele('NbOfTxs', datos.total);
    grpHdr.ele('CtrlSum', datos.totalCuotas);

    const initgPty = grpHdr.ele('InitgPty');
    initgPty.ele('Nm', 'Oelap Training SL');

    const id = initgPty.ele('Id');
    const orgId = id.ele('OrgId');
    const othr = orgId.ele('Othr');
    othr.ele('Id', datos.orgId);

    const pmtInf = cstmrDrctDbtInitn.ele('PmtInf');
    pmtInf.ele('PmtInfId', '1');
    pmtInf.ele('PmtMtd', 'DD');
    pmtInf.ele('CtrlSum', datos.totalCuotas);

    const pmtTpInf = pmtInf.ele('PmtTpInf');
    const svcLvl = pmtTpInf.ele('SvcLvl');
    svcLvl.ele('Cd', 'SEPA');
    const lclInstrm = pmtTpInf.ele('LclInstrm');
    lclInstrm.ele('Cd', 'CORE');
    pmtTpInf.ele('SeqTp', 'RCUR');

    pmtInf.ele('ReqdColltnDt', fechaActualStr);

    const cdtr = pmtInf.ele('Cdtr');
    cdtr.ele('Nm', 'Oelap Training SL');

    const cdtrAcct = pmtInf.ele('CdtrAcct');
    cdtrAcct.ele('Id').ele('IBAN', datos.iban);

    const cdtrAgt = pmtInf.ele('CdtrAgt');
    cdtrAgt.ele('FinInstnId').ele('BIC', datos.bic);

    pmtInf.ele('ChrgBr', 'SLEV');




    for (let i = 0; i < transactions.length; i++) {
        const tx = transactions[i];
        const drctDbtTxInf = pmtInf.ele('DrctDbtTxInf');

        const pmtId = drctDbtTxInf.ele('PmtId');
        pmtId.ele('EndToEndId', tx.endToEndId);

        const instdAmt = drctDbtTxInf.ele('InstdAmt');
        instdAmt.att('Ccy', tx.currency);
        instdAmt.txt(tx.amount);

        const drctDbtTx = drctDbtTxInf.ele('DrctDbtTx');

        const mndtRltdInf = drctDbtTx.ele('MndtRltdInf');
        mndtRltdInf.ele('MndtId', tx.mandateId);
        mndtRltdInf.ele('DtOfSgntr', tx.mandateDate);

        const cdtrSchmeId = drctDbtTx.ele('CdtrSchmeId');
        const id2 = cdtrSchmeId.ele('Id');
        const prvtId = id2.ele('PrvtId');
        const othr2 = prvtId.ele('Othr');
        othr2.ele('Id', tx.creditorId);
        const schmeNm = othr2.ele('SchmeNm');
        schmeNm.ele('Prtry', 'SEPA');

        const dbtrAgt = drctDbtTxInf.ele('DbtrAgt');
        const finInstnId = dbtrAgt.ele('FinInstnId');
        finInstnId.ele('BIC', tx.bic);

        const dbtr = drctDbtTxInf.ele('Dbtr');
        dbtr.ele('Nm', tx.debtorName);

        const dbtrAcct = drctDbtTxInf.ele('DbtrAcct');
        const id3 = dbtrAcct.ele('Id');
        id3.ele('IBAN', tx.debtorIBAN);

        const purp = drctDbtTxInf.ele('Purp');
        purp.ele('Cd', 'COMC');

        const rmtInf = drctDbtTxInf.ele('RmtInf');
        rmtInf.ele('Ustrd', tx.reference);
    }





    // Guardar el XML en disco
    const xml = cstmrDrctDbtInitn.end({ pretty: true });
    // console.log(transactions[0].endToEndId)
    // fs.writeFileSync(`Esi-${transactions[0].endToEndId}.xml`, xml);


    return xml
}



export default router

