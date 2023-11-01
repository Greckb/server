import { Router } from "express";
import { pool } from '../db.js'

const router = Router()

//Trae todo el calendario
router.get('/calendar/events', async (req, res) => {
  try {
    const { calendars } = req.query;

    const query = `
      SELECT *
      FROM calendar
      WHERE calendar IN (?)
    `;
    const values = [calendars];
    const result = await pool.query(query, values);

    // Transformar el resultado
    const transformedEvents = result[0].map(event => ({
      id: event.id,
      url: event.url || '',
      title: event.title,
      start: new Date(event.start),
      end: new Date(event.end),
      allDay: event.allDay === 1,
      idCliente: event.idCliente,
      extendedProps: {
        calendar: event.calendar
      }
    }));


    res.status(200).json(transformedEvents);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los eventos del calendario' });
  }
});

// añadir Eventos
// router.post('/calendar/add-event', async (req, res) => {
//   try {
//     const { event } = req.body.data;

//     const lastIndexResult = await pool.query('SELECT COALESCE(MAX(id), 0) AS lastIndex FROM calendar');
//     const lastIndex = lastIndexResult[0][0].lastIndex || 0;
//     const eventId = lastIndex + 1;

//     const query = `
//       INSERT INTO calendar (id, url, display, title, start, end, allDay, calendar, idCliente,weekNumber, listaSemana, dias)
//       VALUES (?,?, ?,?,?,?,?,?,?,?,?,?)
//     `;

//     const values = [
//       eventId, // Valor generado manualmente para la columna id
//       event.url || null,
//       event.display,
//       event.title,
//       event.start,
//       event.end,
//       event.allDay ? 1 : 0,
//       event.extendedProps.calendar,
//       event.idCliente,
//       event.weekNumber,
//       1, // Establece 1 para listaSemana
//       event.dias,
//     ];

//     const result = await pool.query(query, values);

//     res.sendStatus(201);
//   } catch (error) {
//     res.status(500).json({ error: 'Error al agregar el evento' });
//   }
// });

router.post('/calendar/add-event', async (req, res) => {
  try {
    const { event } = req.body.data;

  

    // Verificar si existe un registro para el cliente y la semana
    const queryCheck = `
      SELECT * FROM calendar 
      WHERE idCliente = ? AND weekNumber = ?
    `;



    const checkValues = [event.idCliente, event.weekNumber];

    const existingEvents = await pool.query(queryCheck, checkValues);

    const lastEvent = existingEvents[0].length - 1;



   
    if (existingEvents[0].length > 0) {
      // Ya existe un registro para el cliente y la semana

      if (existingEvents[0][lastEvent].listaSemana < event.dias) {
        // Incrementa listaSemana en 1 y crea un nuevo registro

        const newListaSemana = existingEvents[0][lastEvent].listaSemana + 1;

        const lastIndexResult = await pool.query('SELECT COALESCE(MAX(id), 0) AS lastIndex FROM calendar');
        const lastIndex = lastIndexResult[0][0].lastIndex || 0;
        const eventId = lastIndex + 1;

        const query = `
      INSERT INTO calendar (id, url, display, title, start, end, allDay, calendar, idCliente,weekNumber, listaSemana, dias)
      VALUES (?,?, ?,?,?,?,?,?,?,?,?,?)
    `;

        const values = [
          eventId, // Valor generado manualmente para la columna id
          event.url || null,
          event.display,
          event.title,
          event.start,
          event.end,
          event.allDay ? 1 : 0,
          event.extendedProps.calendar,
          event.idCliente,
          event.weekNumber,
          newListaSemana,
          event.dias,
        ];

        const result = await pool.query(query, values);

        res.sendStatus(201);
      } else {
        // listaSemana ya es igual o mayor que dias, no se crea un nuevo registro
        res.json({ error: '401' });
        return;
      }
    } else {
      // No existe un registro para el cliente y la semana, crea uno nuevo con listaSemana en 1
      const lastIndexResult = await pool.query('SELECT COALESCE(MAX(id), 0) AS lastIndex FROM calendar');
      const lastIndex = lastIndexResult[0][0].lastIndex || 0;
      const eventId = lastIndex + 1;

      const query = `
      INSERT INTO calendar (id, url, display, title, start, end, allDay, calendar, idCliente,weekNumber, listaSemana, dias)
      VALUES (?,?, ?,?,?,?,?,?,?,?,?,?)
    `;

    const newListaSemana =  1;

      const values = [
        eventId, // Valor generado manualmente para la columna id
        event.url || null,
        event.display,
        event.title,
        event.start,
        event.end,
        event.allDay ? 1 : 0,
        event.extendedProps.calendar,
        event.idCliente,
        event.weekNumber,
        newListaSemana, // Establece 1 para listaSemana
        event.dias,
      ];

      const result = await pool.query(query, values);

      res.sendStatus(201);
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al agregar el evento' });
  }
});



//Actualizar eventos
router.put('/calendar/update-event', async (req, res) => {
  try {
    const eventData = req.body.data.event;

    // Convertir el Id a número
    eventData.id = Number(eventData.id);

    const query = `
      UPDATE calendar
      SET url = ?, display = ?, title = ?, start = ?, end = ?, allDay = ?, calendar = ?, idCliente = ?
      WHERE id = ?
    `;
    const values = [
      eventData.url || null,
      eventData.display,
      eventData.title,
      eventData.start,
      eventData.end,
      eventData.allDay ? 1 : 0,
      eventData.extendedProps.calendar,
      eventData.idCliente,
      eventData.id
    ];

    const result = await pool.query(query, values);

    if (result.affectedRows === 0) {
      res.status(400).json({ error: `El evento no existe` });

    } else {
      res.status(200).json({ event: eventData });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el evento' });
  }
});


// Eliminar eventos
router.delete('/calendar/remove-event', async (req, res) => {
  try {
    // Obtener el id del evento del query parameter
    const { id } = req.query;

    // Convertir el Id a número
    const eventId = Number(id);


    const query = `
      DELETE FROM calendar
      WHERE id = ?
    `;
    const values = [eventId];

    const result = await pool.query(query, values);


    if (result.affectedRows === 0) {
      res.status(404).json({ error: `El evento no existe` });

    } else {
      res.status(200).json(`El evento no existe`);
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el evento' });
  }
});



export default router;