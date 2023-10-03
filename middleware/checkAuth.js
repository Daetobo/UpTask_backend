import jwt from 'jsonwebtoken'
import Usuario from '../models/Usuario.js';

const checkAuth = async (req,res,next) => {
    let token;
    
    // Verifica si existe la propiedad authorization en los encabezados de la solicitud (req.headers.authorization) y si comienza con la cadena 'Bearer'
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            
            //permite verificar el token con jwt.verify
            const decoded = jwt.verify(token,process.env.JWT_SECRET);
            // req.usuario, se indica que se agrega usuario como una propiedad de req
            // lo que permite ser utilizado usuario a traves de otras funciones del middleware
            req.usuario = await Usuario.findById(decoded.id).select('-password -confirmado -token -createdAt -updatedAt -__v');
            
            return next();
        } catch (error) {
            return res.status(402).json({ msg: "Hubo un error"});
        }
    }

    if (!token) {
        const error = new Error('Token no válido');
        return res.status(401).json({ msg: error.message });
    }
    next();
};

export default checkAuth;