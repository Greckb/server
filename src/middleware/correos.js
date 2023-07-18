import { fileURLToPath } from 'url';
import multer from "multer";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// configurar Multer para guardar los archivos subidos en la carpeta /uploads
const diskstorage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const fileupload = multer({
  storage: diskstorage,
}).single('image');



export {fileupload};