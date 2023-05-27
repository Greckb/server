import { fileURLToPath } from 'url';
import multer from "multer";
import path from "path";
import Jimp from 'jimp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// configurar Multer para guardar los archivos subidos en la carpeta /uploads
const diskstorage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (req, file, cb) => {
    cb(null, 'Esi-' + Date.now() + file.originalname);
  },
});

const fileupload = multer({
  storage: diskstorage,
}).single('image');


// Middleware de reducción de tamaño de imagen
const processImage = async (req, res, next) => {
    try {
      
      // Abrir la imagen con Jimp
      const image = await Jimp.read(req.file.path);
      // Redimensionar la imagen a un ancho máximo de 800 píxeles
      image.resize(800, Jimp.AUTO);
      // Cambiar el formato de la imagen a JPG
    await image.quality(50).writeAsync(req.file.path.replace(/\.[^.]+$/, '.jpg'));
      // // Sobreescribir el archivo original con la versión reducida
      // await image.writeAsync(req.file.path);
      // Llamar al siguiente middleware
      next();
    } catch (error) {
      // Enviar una respuesta de error si algo sale mal
      res.status(500).json({ error: 'No se pudo reducir el tamaño de la imagen.' });
    }
  };

export {fileupload, processImage};

