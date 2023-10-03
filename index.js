import express from "express";
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from "./config/db.js";
import usuarioRouter from "./routes/usuarioRouter.js";
import proyectoRoutes from './routes/proyectoRoutes.js'
import tareaRoutes from './routes/tareaRoutes.js'

const app = express();
// lee datos en json desde express
app.use(express.json()); 

// configuración para utilizar variables de entorno
dotenv.config();

// llama la función de conexión a la bd
connectDB();

// Configurar CORS
const whiteList = [process.env.FRONTEND_URL];

const corsOptions = {
    origin: function (origin, callback) {
        console.log(origin);
        if (whiteList.includes(origin)) {
            //Puede consultar API
            callback(null, true);
        } else {
            //No esta permitido su request
            callback(new Error('Error de Cors'));
        }
    }
};

app.use(cors(corsOptions));

// -------- ROUTING -----------------------------------------

// "use" es el verbo o metodo ejm get, post (recibe todos los verbos con use)
app.use("/api/usuarios",usuarioRouter)
app.use("/api/proyectos",proyectoRoutes)
app.use("/api/tareas",tareaRoutes)

const PORT = process.env.PORT || 4000;

const servidor = app.listen(PORT,() =>{
    console.log(`Servidor corriendo en el puerto ${PORT}`)
})

//Socket.io
import { Server } from 'socket.io';

const io = new Server(servidor,{
    pingTimeout: 60000,
    cors:{
        origin:process.env.FRONTEND_URL,
    },
})

io.on('connection',(socket) => {
    // console.log('conctado a Socket.io')

    //Definir los eventos de socket io
    socket.on('abrir proyecto', (proyecto) => {
        socket.join(proyecto)

    });

    socket.on('nueva tarea', (tarea) => {
        const proyecto = tarea.proyecto;
        socket.to(proyecto).emit('tarea agregada',tarea);
    });

    socket.on('eliminar tarea', tarea => {
        const proyecto = tarea.proyecto;
        socket.to(proyecto).emit('tarea eliminada',tarea)
    });

    socket.on('editar tarea', tarea =>{
        const proyecto = tarea.proyecto
        socket.to(proyecto).emit('tarea editada',tarea)
    });

    socket.on('cambiar estado', tarea => {
        const proyecto = tarea.proyecto._id
        socket.to(proyecto).emit('estado actualizado', tarea)
    })
});