import mongoose from "mongoose"

const habitSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "El título es requerido"],
      trim: true,
      maxlength: [100, "El título no puede exceder 100 caracteres"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "La descripción no puede exceder 500 caracteres"],
    },
    frequency: {
      type: String,
      enum: {
        values: ["daily", "weekly", "monthly"],
        message: "La frecuencia debe ser: daily, weekly o monthly",
      },
      required: [true, "La frecuencia es requerida"],
      default: "daily",
    },
    userId: {
      type: String,
      required: [true, "El ID del usuario es requerido"],
      index: true, // Agregar índice para mejorar las consultas
    },
    userEmail: {
      type: String,
      required: [true, "El email del usuario es requerido"],
    },
  },
  {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
  },
)

const Habit = mongoose.model("Habit", habitSchema)

export default Habit
