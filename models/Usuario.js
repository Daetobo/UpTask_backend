import mongoose from "mongoose";
import bcrypt from "bcrypt";

const usuarioSchema = mongoose.Schema({
    nombre: {
        type: String,
        require: true,
        // trim elimina espacios adicionales en el centro
        trim: true,
    },
    password: {
        type: String,
        require: true,
        trim: true,
    },
    email: {
        type: String,
        require: true,
        trim: true,
        unique: true,
    },
    user: {
        type: String,
        require: true,
        // trim elimina espacios adicionales en el centro
        trim: true,
        unique: true,
    },
    token: {
        type: String,
    },
    confirmado: {
        type: Boolean,
        default: false,
    }
}, {
    // crea dos columnas más una de creado y otra de actualizado.
    timestamps: true,
});

// antes que se guarde el registro en la bd se hashea el password
usuarioSchema.pre("save", async function (next) {
    // con esto !this.isModified("password") se indica que si la contraseña
    // no se ha cambiado o no es una nueva no haga el hasheo y se continue con el siguiente
    // middleware
    if (!this.isModified("password")) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password,salt);
});

usuarioSchema.methods.comprobarPassword = async function (passwordForm) {
    return await bcrypt.compare(passwordForm,this.password)
}

const Usuario = mongoose.model("Usuario",usuarioSchema);

export default Usuario;

