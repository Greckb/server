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
router.post('/calendar/add-event', async (req, res) => {
  try {
    const { event } = req.body.data;

    const lastIndexResult = await pool.query('SELECT COALESCE(MAX(id), 0) AS lastIndex FROM calendar');
    const lastIndex = lastIndexResult[0][0].lastIndex || 0;
    const eventId = lastIndex + 1;


    const query = `
      INSERT INTO calendar (id, url, display, title, start, end, allDay, calendar, idCliente)
      VALUES (?,?, ?,?,?,?,?,?,?)
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
      event.idCliente
    ];

    const result = await pool.query(query, values);

    res.sendStatus(201);
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

    if (result.affectedRows > 0) {
      res.status(200).json({ event: eventData });
    } else {
      res.status(400).json({ error: `El evento no existe` });
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

    if (result.affectedRows > 0) {
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el evento' });
  }
});


export default router;