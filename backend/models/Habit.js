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
      index: true,
    },
    userEmail: {
      type: String,
      required: [true, "El email del usuario es requerido"],
    },
    streakCurrent: {
      type: Number,
      default: 0,
      min: 0,
    },
    streakBest: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastCheckinDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

const Habit = mongoose.model("Habit", habitSchema)

export default Habit
