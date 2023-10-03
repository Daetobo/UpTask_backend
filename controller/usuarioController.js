import Usuario from "../models/Usuario.js";
import generarId from "../helpers/generarId.js";
import generarJWT from "../helpers/generarJWT.js";
import { emailRegistro, emailOlvidePassword } from "../helpers/emails.js";

const registrar = async (req, res) => {

    // Evitar usuarios duplicados
    const { email,user } = req.body;
    // findOne busca en la bd de mongo registro email para validar si ya existe
    const existeUsuario = await Usuario.findOne({ email });
    const userExiste = await Usuario.findOne({user});

    if (existeUsuario) {
        const error = new Error('Usuario ya registrado');
        return res.status(400).json({msg : error.message})
    }

    if (userExiste) {
        const error = new Error('Nombre de usuario no disponible');
        return res.status(400).json({msg : error.message})
    }

    try {
        const usuario = new Usuario(req.body);
        usuario.token = generarId();
        const usuarioAlmacenado = await usuario.save();

        //enviar email de confirmación
        const { nombre, email, token } = usuario
        emailRegistro({
            nombre,
            email,
            token
        })

        // res.json(usuarioAlmacenado);
        res.json({ msg: "Usuario Creado Correctamente, Revisa tu Email para confirmar tu cuenta" });
    } catch (error) {
        console.log(error)
    }
 };

 const autenticar = async (req, res) => {
    const { email, password } = req.body;
    // Comprobar si el usuario existe
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
        const error = new Error('usuario no existe');
        return res.status(404).json({msg: error.message});
    }
    // Comprobar si el user esta confirmado
    if (!usuario.confirmado) {
        const error = new Error('Tu cuenta no ha sido confirmada');
        return res.status(403).json({msg: error.message});
    }
    // comprobar su password
    if (await usuario.comprobarPassword(password)) {
        res.json({
            _id: usuario._id,
            nombre: usuario.nombre,
            email: usuario.email,
            token: generarJWT(usuario._id),
        })
    } else {
        const error = new Error('El Password es Incorrecto');
        return res.status(403).json({msg: error.message}); 
    }
 }

 const confirmar = async (req, res) => {
    const { token } = req.params;
    const usuarioConfirmar = await Usuario.findOne({ token });
    if (!usuarioConfirmar) {
        const error = new Error('Token no válido')
        return res.status(403).json({ msg: error.message })
    }

    try {
        usuarioConfirmar.confirmado = true;
        usuarioConfirmar.token = '';
        await usuarioConfirmar.save();
        res.json({msg: "Usuario confirmado Correctamente"})
    } catch (error) {
        console.log(error)
    }
    
 }

 const olvidePassword = async (req, res) => {
    const { email } = req.body;
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
        const error = new Error('usuario no existe');
        return res.status(404).json({msg: error.message});
    }

    try {
        usuario.token = generarId()
        await usuario.save();

        //Enviar Email
        const { nombre, email, token } = usuario
        emailOlvidePassword({
            nombre,
            email,
            token
        })
        res.json({ msg : "Hemos enviado un email con las instrucciones"})

    } catch (error) {
        console.log(error)
    }
 }

 const comprobarToken = async (req, res) => {
    const { token } = req.params;
    const tokenValido = await Usuario.findOne({ token })
    if (tokenValido) {
        res.json({
            msg: "Token Válido y el Usuario existe"
        })
    } else {
        const error = new Error('Token No Válido');
        return res.status(404).json({msg: error.message});
    }
 }

 const nuevoPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    const usuario = await Usuario.findOne({ token });
    if (usuario) {
        usuario.password = password;
        usuario.token = '';
        try {
            await usuario.save();
        } catch (error) {
            console.log(error);
        }
        res.json({ msg: "Password Modificado Correctamente" })
    } else {
        const error = new Error('Token No Válido');
        return res.status(404).json({msg: error.message});
    }
 };

 const perfil = async (req, res) => {
    const { usuario } = req;
    res.json(usuario)
 };

 export { registrar,autenticar, confirmar, olvidePassword, comprobarToken, nuevoPassword, perfil };