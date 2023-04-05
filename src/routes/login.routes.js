import { Router } from "express";
import { pool } from '../db.js'

const router = Router()

//Traer los cliente de DB
router.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(req.body)
    try {
        // Verificar credenciales del usuario en la base de datos
        const user = await pool.query('SELECT * FROM ADMINISTRADORES WHERE email = ? AND password = ?', [email, password]);
        if (user.length < 1) {
            // Credenciales inválidas
            return res.status(401).json({ error: 'Credenciales inválidas' });
        } else {
            // Credenciales válidas
            const { email, password, role,fullName, id } = user[0][0];
            res.status(200).json({ email, password, role, fullName, id});
        }
    } catch (error) {
       
        res.status(500).json({ error: 'Error al conectar con la base de datos' });
    }
});

export default router
