import mongoose from "mongoose";
import Proyecto from "../models/Proyecto.js";
import Usuario from "../models/Usuario.js";

const obtenerProyectos = async (req, res) => {
    const proyectos = await Proyecto.find({
        $or: [
            {colaboradores: { $in: req.usuario }},
            {creador: { $in: req.usuario }},
        ]
    })
        .select("-tareas");

    res.json(proyectos);
};

const nuevoProyecto = async (req, res) => {
    const proyecto = new Proyecto(req.body);
    proyecto.creador = req.usuario._id;
    try {
        const proyectoAlmacenado = await proyecto.save();
        res.json(proyectoAlmacenado)
    } catch (error) {
        console.log(error);
    }
};

const obtenerProyecto = async (req, res) => {
    const { id } = req.params;
    
      // Verificar si el ID es válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error('Proyecto No Encontrado');
        return res.status(400).json({ msg: error.message });
    }

    const proyecto = await Proyecto.findById(id)
        //aplica un populate a un populate para traer toda la info de tareas relacionada en schema 
        // Proyecto y luego se anida otro populate para traeer de esas tareas el campo completado
        // que relaciona el id del usuario que esta completando la Tarea, para traer los datos del 
        // schema usuario y relacionar el nombre del mismo     
        .populate({path: 'tareas',populate:{path:'completado',select: 'nombre'}})
        .populate('colaboradores',"nombre email");

    if (!proyecto) {
        const error = new Error('No Encontrado');
        return res.status(404).json({ msg: error.message });
    }

    // si el usuario que hace la peticion no es el creador del proyecto && si el
    // usuario que hace la peticion no es un colaborador del proyecto no permite ver el proyecto
    if (proyecto.creador.toString() !== req.usuario._id.toString() && !proyecto.colaboradores.some(colaborador => colaborador._id.toString() === req.usuario._id.toString())) {
        const error = new Error('Acción no Válida')
        return res.status(401).json({ msg: error.message })

    }

    res.json(
        proyecto,
        )
};

const editarProyecto = async (req, res) => {
    const { id } = req.params;
        
      // Verificar si el ID es válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error('ID no válido');
        return res.status(400).json({ msg: error.message });
    }

    const proyecto = await Proyecto.findById(id);

    if (!proyecto) {
        const error = new Error('No Encontrado');
        return res.status(404).json({ msg: error.message });
    }

    // restringir la edición de proyectos cuando el que hace la peticón no es el creador del proyecto
    if (proyecto.creador.toString() !== req.usuario._id.toString()) {
        const error = new Error('Acción no Válida');
        return res.status(401).json({ msg: error.message });

    }

    proyecto.nombre = req.body.nombre || proyecto.nombre;
    proyecto.descripcion = req.body.descripcion || proyecto.descripcion;
    proyecto.fechaInicio = req.body.fechaInicio || proyecto.fechaInicio;
    proyecto.fechaEntrega = req.body.fechaEntrega || proyecto.fechaEntrega;
    proyecto.cliente = req.body.cliente || proyecto.cliente;

   try {
    const proyectoAlmacenado = await proyecto.save();
    res.json(proyectoAlmacenado);
   } catch (error) {
    console.log(error);
   }
    
};

const eliminarProyecto = async (req, res) => {
    const { id } = req.params;
        
    // Verificar si el ID es válido
  if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error('ID no válido');
      return res.status(400).json({ msg: error.message });
  }

  const proyecto = await Proyecto.findById(id);
  
  if (!proyecto) {
      const error = new Error('No Encontrado');
      return res.status(404).json({ msg: error.message });
  }

  // restringir la eliminación de proyectos cuando el que hace la peticón no es el creador del proyecto
  if (proyecto.creador.toString() !== req.usuario._id.toString()) {
      const error = new Error('Acción no Válida');
      return res.status(401).json({ msg: error.message });

  }

  try {
    await proyecto.deleteOne();
    res.json({msg: "Proyecto Eliminado"});
  } catch (error) {
    console.log(error);
  }

};

const buscarColaborador = async (req, res) => {
    const { email } = req.body
    const usuario = await Usuario.findOne({email}).select('-confirmado -createdAt -password -token -updatedAt -__v')

    if (!usuario) {
        const error = new Error('Usuario no encontrado')
        return res.status(404).json({msg: error.message})
    }

    res.json(usuario)
};

const agregarColaborador = async (req, res) => {
    const proyecto = await Proyecto.findById(req.params.id);

    if (!proyecto) {
        const error = new Error('Proyecto No Encontrado')
        return res.status(404).json({msg:error.message})
    }

    //restringir quien solo el que crea el proyecto puede agregar colaboradores
    if (proyecto.creador.toString() !== req.usuario._id.toString()) {
        const error = new Error('Acción no válida');
        return res.status(404).json({msg:error.message})
    }

    const { email } = req.body
    const usuario = await Usuario.findOne({email}).select('-confirmado -createdAt -password -token -updatedAt -__v')

    if (!usuario) {
        const error = new Error('Usuario no encontrado')
        return res.status(404).json({msg: error.message})
    }

    //El colaborador no es el Admin del proyecto
    if (proyecto.creador.toString() === usuario.id.toString()) {
        const error = new Error('El creador del proyecto no puede ser colaborador')
        return res.status(404).json({msg: error.message})
    }

    //Revisar que el colaborador ya no esté agregado al proyecto
    if (proyecto.colaboradores.includes(usuario._id)) {
        const error = new Error('El colaborador ya pertenece al proyecto')
        return res.status(404).json({msg: error.message})
    }

    //si esta bien, Agregamos colaborador
    proyecto.colaboradores.push(usuario._id)
    await proyecto.save()
    res.json({msg: 'Colaborador Agregado Correctamente'})
};

const eliminarColaborador = async (req, res) => {
    const proyecto = await Proyecto.findById(req.params.id);

    if (!proyecto) {
        const error = new Error('Proyecto No Encontrado')
        return res.status(404).json({msg:error.message})
    }

    //restringir quien solo el que crea el proyecto puede agregar colaboradores
    if (proyecto.creador.toString() !== req.usuario._id.toString()) {
        const error = new Error('Acción no válida');
        return res.status(404).json({msg:error.message})
    }

    //si esta bien, Agregaos eliminar
    console.log(req.body.id)

    proyecto.colaboradores.pull(req.body.id)
    await proyecto.save()
    res.json({msg: 'Colaborador Eliminado Correctamente'})
    
};

export {
    obtenerProyectos,
    nuevoProyecto,
    obtenerProyecto,
    editarProyecto,
    eliminarProyecto,
    buscarColaborador,
    agregarColaborador,
    eliminarColaborador,
}