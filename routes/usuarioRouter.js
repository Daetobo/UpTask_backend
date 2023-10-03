import express, { Router } from 'express'
import { 
    registrar,
    autenticar,
    confirmar,
    olvidePassword,
    comprobarToken,
    nuevoPassword,
    perfil
} from '../controller/usuarioController.js'; 
import checkAuth from '../middleware/checkAuth.js';

const router = express.Router();
// Autenticación, Registro y Confrimación de Usuarios
 router.post('/',registrar); // crea un nuevo usuario
 router.post('/login',autenticar); // autenticación user
 router.get('/confirmar/:token',confirmar); // confirmar user
 router.post('/olvide-password',olvidePassword); // olvido password
 router.route('/olvide-password/:token').get(comprobarToken).post(nuevoPassword)
 router.get('/perfil', checkAuth, perfil);



 export default router