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

const date = new Date()
const nextDay = new Date(new Date().getTime() + 24 * 60 * 60 * 1000)

const nextMonth =
  date.getMonth() === 11 ? new Date(date.getFullYear() + 1, 0, 1) : new Date(date.getFullYear(), date.getMonth() + 1, 1)

const prevMonth =
  date.getMonth() === 11 ? new Date(date.getFullYear() - 1, 0, 1) : new Date(date.getFullYear(), date.getMonth() - 1, 1)

const data = {
  events: [
    {
      id: 1,
      url: '',
      title: 'Design Review',
      start: date,
      end: nextDay,
      allDay: false,
      extendedProps: {
        calendar: 'Business'
      }
    },
    {
      id: 2,
      url: '',
      title: 'Meeting With Client',
      start: new Date(date.getFullYear(), date.getMonth() + 1, -11),
      end: new Date(date.getFullYear(), date.getMonth() + 1, -10),
      allDay: true,
      extendedProps: {
        calendar: 'Business'
      }
    },
    {
      id: 3,
      url: '',
      title: 'Family Trip',
      allDay: true,
      start: new Date(date.getFullYear(), date.getMonth() + 1, -9),
      end: new Date(date.getFullYear(), date.getMonth() + 1, -7),
      extendedProps: {
        calendar: 'Holiday'
      }
    },
    {
      id: 4,
      url: '',
      title: "Doctor's Appointment",
      start: new Date(date.getFullYear(), date.getMonth() + 1, -11),
      end: new Date(date.getFullYear(), date.getMonth() + 1, -10),
      allDay: true,
      extendedProps: {
        calendar: 'Personal'
      }
    },
    {
      id: 5,
      url: '',
      title: 'Dart Game?',
      start: new Date(date.getFullYear(), date.getMonth() + 1, -13),
      end: new Date(date.getFullYear(), date.getMonth() + 1, -12),
      allDay: true,
      extendedProps: {
        calendar: 'ETC'
      }
    },
    {
      id: 6,
      url: '',
      title: 'Meditation',
      start: new Date(date.getFullYear(), date.getMonth() + 1, -13),
      end: new Date(date.getFullYear(), date.getMonth() + 1, -12),
      allDay: true,
      extendedProps: {
        calendar: 'Personal'
      }
    },
    {
      id: 7,
      url: '',
      title: 'Dinner',
      start: new Date(date.getFullYear(), date.getMonth() + 1, -13),
      end: new Date(date.getFullYear(), date.getMonth() + 1, -12),
      allDay: true,
      extendedProps: {
        calendar: 'Family'
      }
    },
    {
      id: 8,
      url: '',
      title: 'Product Review',
      start: new Date(date.getFullYear(), date.getMonth() + 1, -13),
      end: new Date(date.getFullYear(), date.getMonth() + 1, -12),
      allDay: true,
      extendedProps: {
        calendar: 'Business'
      }
    },
    {
      id: 9,
      url: '',
      title: 'Monthly Meeting',
      start: nextMonth,
      end: nextMonth,
      allDay: true,
      extendedProps: {
        calendar: 'Business'
      }
    },
    {
      id: 10,
      url: '',
      title: 'Monthly Checkup',
      start: prevMonth,
      end: prevMonth,
      allDay: true,
      extendedProps: {
        calendar: 'Personal'
      }
    }
  ]
}


//Trae todo el calendario
router.get('/calendario/eventos', (req, res) => {
    // Obtener los eventos del calendario solicitados como un Array
    const { calendars } = req.query;
  
    const eventosFiltrados = data.events.filter(evento => calendars.includes(evento.extendedProps.calendar));
  
    res.status(200).json(eventosFiltrados);
  });


// añadir Eventos
  router.post('/calendario/add-event', (req, res) => {
    // Obtener el evento de los datos enviados en el cuerpo de la petición
    const { event } = req.body.data;
    const { length } = data.events;
    let lastIndex = 0;
  
    if (length) {
      lastIndex = data.events[length - 1].id;
    }
  
    event.id = lastIndex + 1;
    data.events.push(event);
  
    res.status(201).json({ event });
  });


  //Actualizar eventos
  router.post('/calendario/update-event', (req, res) => {
    const eventData = req.body.data.event;
  
    // Convertir el Id a número
    eventData.id = Number(eventData.id);
    const evento = data.events.find(ev => ev.id === Number(eventData.id));
  
    if (evento) {
      Object.assign(evento, eventData);
      res.status(200).json({ event: evento });
    } else {
      res.status(400).json({ error: `El evento no existe` });
    }
  });


  //Eliminar eventos
  router.delete('/calendario/remove-event/:id', (req, res) => {
    // Obtener el id del evento de la URL
    const { id } = req.params;
  
    // Convertir el Id a número
    const eventId = Number(id);
    const eventIndex = data.events.findIndex(ev => ev.id === eventId);
    
    if (eventIndex !== -1) {
      data.events.splice(eventIndex, 1);
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  });

export default router;