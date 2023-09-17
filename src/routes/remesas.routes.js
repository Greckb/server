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

// Función para sumar un mes a una fecha dada y formatearla como "mes año"
function addTimeToDate(dateString, timeType, increment) {
  const date = new Date(dateString);

  if (timeType === 'month') {
    date.setMonth(date.getMonth() + increment);
  } else if (timeType === 'quarter') {
    date.setMonth(date.getMonth() + increment * 3);
  } else if (timeType === 'year') {
    date.setFullYear(date.getFullYear() + increment);
  }

  const year = date.getFullYear();
  const month = date.toLocaleString('es', { month: 'long' });
  return `${month} ${year}`;
}


//Generar el archivo XML SEPA
router.get('/remesas/:id', async (req, res) => {
  const clientId = req.params.id;
  const query = 'SELECT Factura_cliente.*, CLIENTES.Nombre AS cliente_nombre, CLIENTES.BIC, CLIENTES.IBAN FROM Factura_cliente INNER JOIN CLIENTES ON Factura_cliente.cliente_id = CLIENTES.idcliente WHERE Factura_cliente.id = ?';

  const result = await pool.query(query, [clientId]);
  console.log(result[0])
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
    iban: 'ES1901824567140200363604',
    bic: 'BBVAESMMXXX',


  };
  const miarray = result[0].map((result, index) => {

    const mandateNumber = index + 1;
    const clienteIdNumerico = parseInt(result.cliente_id.slice(4), 10); // Extraer los 4 dígitos después de "ESI-" y convertirlos en número
    const paddedId = clienteIdNumerico.toString().padStart(4, '0'); // Asegurar que tenga 4 dígitos agregando ceros a la izquierda si es necesario
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


    // Obtener el mes de la fecha de Factura_cliente sin importar la zona horaria
    const fechaFactura = new Date(result[0][0].fecha_pago);
    const mesFactura = fechaFactura.getUTCMonth() + 2; // Sumamos 1 ya que los meses comienzan en 0


    // Consulta para obtener los datos de efectivo en el mismo mes
    const efectivoQuery = `
    SELECT efectivo.*, CLIENTES.Nombre AS cliente_nombre, CLIENTES.Plan, CLIENTES.Cuota
    FROM efectivo
    INNER JOIN CLIENTES ON efectivo.cliente_id = CLIENTES.idcliente
    WHERE MONTH(efectivo.fecha_pago) = ?    
 `;

    const [efectivoRows] = await pool.query(efectivoQuery, [mesFactura]);

    let combinedData = [];

    //   // // Crear un objeto combinado sin etiquetas si efectivoRows no está vacío
    if (efectivoRows.length > 0) {
      efectivoRows.forEach((e) => {
        e.pagado = 'P.Efectivo'; // Agrega la columna "pago" con valor "P.Efectivo" a efectivos
      });

      result[0].forEach((e) => {
        e.pagado = 'D.Bancaria'; // Agrega la columna "pago" con valor "P.Efectivo" a efectivos
      });
      combinedData = [...result[0], ...efectivoRows];
    }


    res.json(combinedData)
  } catch (error) {

    res.status(500).send('Error connecting to database');
  }
});

router.post('/remesas', async (req, res) => {
  const idClientes = req.body;
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  try {
    const ids = idClientes.map(id => `'${id}'`).join(',');

    const query = `SELECT IdCliente, Nombre, Plan, Cuota, CuotaMensual, UltimoPago, ProximoPago FROM CLIENTES WHERE IdCliente IN (${ids})`;
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

    // Actualizar los valores de UltimoPago y ProximoPago en la tabla CLIENTES
    const updatedRows = rows.map(({ IdCliente, UltimoPago, ProximoPago, Plan }) => {
      let newUltimoPago = ProximoPago; // Valor anterior de ProximoPago
      let newProximoPago = ProximoPago; // Valor anterior de ProximoPago

      if (Plan === 'Mensual') {
        newProximoPago = addTimeToDate(ProximoPago, 'month', 1);
      } else if (Plan === 'Trimestral') {
        newProximoPago = addTimeToDate(ProximoPago, 'quarter', 1);
      } else if (Plan === 'Anual') {
        newProximoPago = addTimeToDate(ProximoPago, 'year', 1);
      }

      return `UPDATE CLIENTES SET UltimoPago='${newUltimoPago}', ProximoPago='${newProximoPago}' WHERE IdCliente='${IdCliente}'`;
    });



    for (const updateQuery of updatedRows) {
      await pool.query(updateQuery);
    }

    const value = newValues2[0][0];
    res.status(200).send({ value });
  } catch (error) {
    res.status(500).send('Error en el servidor');
  }
});

//REcoger los datos del cliente en una remesa
router.get('/cliente/:id', async (req, res) => {
  try {
    const clienteId = req.params.id; // Obtener el ID del cliente desde los parámetros de la URL
    const query = `
        SELECT fc.*, c.plan, c.cuota AS cliente_cuota
        FROM Factura_cliente fc
        JOIN CLIENTES c ON fc.cliente_id = c.Idcliente
        WHERE fc.cliente_id = ?
      `; // Consulta con JOIN y un parámetro


    // Ejecutar la consulta con el ID del cliente como parámetro
    const [rows] = await pool.query(query, [clienteId]);

    const efectivo = `SELECT e.*, c.plan, c.cuota AS cliente_cuota
    FROM efectivo e
    JOIN CLIENTES c ON e.cliente_id = c.Idcliente
    WHERE e.cliente_id = ?;
    
  `
    const [efetivos] = await pool.query(efectivo, [clienteId]);

    // Combinar los resultados de rows y efetivos en un solo array si ambos tienen datos
    let combinedData = [];

    // Ahora combinedData contendrá los datos combinados o estará vacío si ambos están vacíos.
    if (rows.length > 0 && efetivos.length > 0) {
      // Agregar la columna "pago" a los datos de rows y efectivos
      rows.forEach((row) => {
        row.pagado = 'D.Bancaria'; // Agrega la columna "pago" con valor "D.Bancaria" a rows
      });
      efetivos.forEach((e) => {
        e.pagado = 'P.Efectivo'; // Agrega la columna "pago" con valor "P.Efectivo" a efectivos
      });
      combinedData = [...rows, ...efetivos];
    } else if (rows.length > 0 && efetivos == 0) {
      rows.forEach((row) => {
        row.pagado = 'D.Bancaria'; // Agrega la columna "pago" con valor "D.Bancaria" a rows
      });
      combinedData = rows;
    } else if (efetivos.length > 0 && rows == 0) {
      efetivos.forEach((e) => {
        e.pagado = 'P.Efectivo'; // Agrega la columna "pago" con valor "P.Efectivo" a efectivos
      });
      combinedData = efetivos;
    }


    // Enviar los resultados al cliente como respuesta
    res.json(combinedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener los datos de la factura." });
  }
});



// Ruta POST para manejar el pago efectivo
router.post('/pagoefectivo', async (req, res) => {
  try {
    // Acceder a los datos enviados en el cuerpo de la solicitud
    const { id: cliente_id, diaPagado: fecha_pagado, precioRedondeado: cuota, mesProximo: ProximoPago, mesPagado: UltimoPago } = req.body;


    // Verificar si ya existe una entrada para el mismo cliente en el mismo mes
    const checkQuery = 'SELECT * FROM efectivo WHERE cliente_id = ? AND MONTH(fecha_pago) = ? AND YEAR(fecha_pago) = ?';
    const fecha = new Date(fecha_pagado);
    const valuesCheck = [cliente_id, fecha.getMonth() + 1, fecha.getFullYear()]; // Sumamos 1 al mes ya que los meses van de 0 a 11

    const [existingEntry] = await pool.query(checkQuery, valuesCheck);

    // Si ya existe una entrada, maneja el error
    if (existingEntry.length > 0) {
      return res.status(400).json({ message: 'Ya existe una entrada para este cliente en el mismo mes.' });
    }

    // Verificar si ya existe una entrada para el mismo cliente en el mismo mes en Factura_cliente
    const facturaCheckQuery = 'SELECT * FROM Factura_cliente WHERE cliente_id = ? AND MONTH(fecha_pago) = ? AND YEAR(fecha_pago) = ?';
    const facturaValuesCheck = [cliente_id, fecha.getMonth(), fecha.getFullYear()];

    const [existingFacturaEntry] = await pool.query(facturaCheckQuery, facturaValuesCheck);

    // Si ya existe una entrada en Factura_cliente, maneja el error
    if (existingFacturaEntry.length > 0) {
      return res.status(405).json({ message: 'Ya existe una entrada para este cliente en el mismo mes en Factura_cliente.' });
    }

    // Insertar los nuevos valores en la tabla efectivo
    const insertQuery = 'INSERT INTO efectivo (fecha_pago, cliente_id , cuota) VALUES (?, ?, ?)';
    const valuesInsert = [fecha_pagado, cliente_id, cuota];

    await pool.query(insertQuery, valuesInsert);

    // Actualizar los pagos del cliente
    const updateQuery = 'UPDATE CLIENTES SET UltimoPago = ?, ProximoPago = ? WHERE Idcliente = ?';
    const valoresUpdate = [UltimoPago, ProximoPago, cliente_id];
    const update = await pool.query(updateQuery, valoresUpdate);

    
    // Enviar una respuesta al cliente
    res.status(200).json({ message: 'Datos recibidos correctamente' });
  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});


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


  let diaActual = fechaActual.getDate();
  let horas = fechaActual.getHours();
  let minutos = fechaActual.getMinutes();
  let segundos = fechaActual.getSeconds();

  // Formatear los valores para que tengan siempre dos dígitos
  mesActual = mesActual.toString().padStart(2, '0');
  diaActual = diaActual.toString().padStart(2, '0');
  horas = horas.toString().padStart(2, '0');
  minutos = minutos.toString().padStart(2, '0');
  segundos = segundos.toString().padStart(2, '0');

  let fechaActualStra = `${anioActual}-${mesActual}-${diaActual}T${horas}:${minutos}:${segundos}`;



  // Concatenar el año y el número de mes a la cadena 'ESI FITNESS'
  let msgId = `ESI FITNESS ${anioActual}-${mesActual}`;

  // Crear el elemento GrpHdr y sus elementos hijos
  const grpHdr = cstmrDrctDbtInitn.ele('GrpHdr');
  grpHdr.ele('MsgId', datos.msgId);
  grpHdr.ele('CreDtTm', fechaActualStra);
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

