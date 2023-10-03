import mongoose from "mongoose";

const tareaSchema = mongoose.Schema({
    nombre: {
        type: String,
        trim: true,
        require: true,
    },
    descripcion: {
        type: String,
        trim: true,
        require: true,
    },
    comentarios: {
        type: String,
        trim: true,
    },
    estado: {
        type: Boolean,
        trim: true,
        default: false,
    },
    fechaEntrega: {
        type: Date,
        require: true,
        default: Date.now()
    },
    prioridad: {
        type: String,
        trim: true,
        enum: ['Baja', 'Media', 'Alta'],
    },
    sprint: {
        type: String,
        trim: true,
        require: true,
    },
    tiempo: {
        type: Number,
        trim: true,
        default: 0,
    },
    proyecto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Proyecto',
    },
    completado: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
    },
}, {
    timestamps: true
});

const Tarea = mongoose.model("Tarea",tareaSchema)

export default Tarea;