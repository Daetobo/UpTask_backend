import Proyecto from "../models/Proyecto.js";
import mongoose from "mongoose";
import Tarea from "../models/Tarea.js";

const agregarTarea = async (req, res) => {
    const { proyecto } = req.body;

    if (!mongoose.Types.ObjectId.isValid(proyecto)) {
        const error = new Error('ID no válido');
        return res.status(404).json({ msg: error.message });
    }

    const existeProyecto = await Proyecto.findById(proyecto);

    if (!existeProyecto) {
        const error = new Error('El proyecto no existe');
        return res.status(404).json({ msg: error.message });
    }

    // validación que permite que solo el creador del proyecto añada tareas
    if (existeProyecto.creador.toString() !== req.usuario._id.toString()) {
        const error = new Error('No tienes los permisos para añadir tareas');
        return res.status(403).json({ msg: error.message });
    }

    try {
        const tareaAlmacenada = await Tarea.create(req.body);
        //Almacenar el ID de la tarea en el proyecto
        existeProyecto.tareas.push(tareaAlmacenada._id);
        await existeProyecto.save();
        res.json(tareaAlmacenada);
    } catch (error) {
        console.log(error)
    }
};

const obtenerTarea = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error('ID no válido');
        return res.status(404).json({ msg: error.message });
    }

    // populate hace la relación entre schemas referenciados en el modelo
    const tarea = await Tarea.findById(id).populate("proyecto");

    if (!tarea) {
        const error = new Error('La Tarea no Existe');
        return res.status(404).json({ msg: error.message });
    }

    // Error cuando consulta tareas que no fueron creadas por el usuario creador del proyecto
    if (tarea.proyecto.creador.toString() !== req.usuario._id.toString()) {
        const error = new Error('Acción no Válida');
        return res.status(403).json({ msg: error.message });
    }


    res.json(tarea);
};

const actualizarTarea = async (req, res) => {
    const { id } = req.params;
   
    if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error('ID no válido');
        return res.status(404).json({ msg: error.message });
    }

    // populate hace la relación entre schemas referenciados en el modelo
    const tarea = await Tarea.findById(id).populate("proyecto");

    if (!tarea) {
        const error = new Error('La Tarea no Existe');
        return res.status(404).json({ msg: error.message });
    }

    // Error cuando consulta tareas que no fueron creadas por el usuario creador del proyecto
    if (tarea.proyecto.creador.toString() !== req.usuario._id.toString()) {
        const error = new Error('Acción no Válida');
        return res.status(403).json({ msg: error.message });
    }

    tarea.nombre = req.body.nombre || tarea.nombre;
    tarea.descripcion = req.body.descripcion || tarea.descripcion;
    tarea.estado = req.body.estado || tarea.estado;
    tarea.prioridad = req.body.prioridad || tarea.prioridad;
    tarea.proyecto = req.body.proyecto || tarea.proyecto;

    try {
        const tareAlmacenada = await tarea.save();
        res.json(tareAlmacenada)
    } catch (error) {
        console.log(error);
    }
};

const eliminarTarea = async (req, res) => {
    const { id } = req.params;
   
    if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error('ID no válido');
        return res.status(404).json({ msg: error.message });
    }

    // populate hace la relación entre schemas referenciados en el modelo
    const tarea = await Tarea.findById(id).populate("proyecto");

    if (!tarea) {
        const error = new Error('La Tarea no Existe');
        return res.status(404).json({ msg: error.message });
    }

    // Error cuando consulta tareas que no fueron creadas por el usuario creador del proyecto
    if (tarea.proyecto.creador.toString() !== req.usuario._id.toString()) {
        const error = new Error('Acción no Válida');
        return res.status(403).json({ msg: error.message });
    }

    try {
        const proyecto = await Proyecto.findById(tarea.proyecto)
        proyecto.tareas.pull(tarea._id)
        // promesa que permite solucionar varias peticiones al tiempo
        await Promise.allSettled([await proyecto.save(), await tarea.deleteOne()])
        res.json({msg: "La Tarea se Eliminó Correctamente"})

    } catch (error) {
        console.log(error)
    }
};

const cambiarEstado = async (req, res) => {
    const { id } = req.params;
   
    if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error('ID no válido');
        return res.status(404).json({ msg: error.message });
    }

    // populate hace la relación entre schemas referenciados en el modelo
    const tarea = await Tarea.findById(id).populate("proyecto");

    if (!tarea) {
        const error = new Error('La Tarea no Existe');
        return res.status(404).json({ msg: error.message });
    }

    // Error cuando marca tarea como pmpleta que no fueron creadas por el usuario creador del proyecto
    // o un colaborador
    if (tarea.proyecto.creador.toString() !== req.usuario._id.toString() && !tarea.proyecto.colaboradores.some( colaborador => colaborador._id.toString() === req.usuario._id.toString())) {
        const error = new Error('Acción no Válida');
        return res.status(403).json({ msg: error.message });
    }

    // cambiar el estado de la tarea al valor contrario 
    tarea.estado = !tarea.estado

    //registrar que usuario hace re request para registrarlo quien completa la tarea
    tarea.completado = req.usuario._id
    await tarea.save()
    
    //luego de guardar solo el id vuelvo y consulto con el populate para traerme los datos
    // de quien completa la tarea y enviar esa respuesta al front y luego utilizarla para el state
    const tareaAlmacenada = await Tarea.findById(id).populate("proyecto").populate("completado");
    res.json(tareaAlmacenada)
};

export {
    agregarTarea,
    obtenerTarea,
    actualizarTarea,
    eliminarTarea,
    cambiarEstado
}