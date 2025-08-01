import mongoose from "mongoose"

const checkinSchema = new mongoose.Schema(
  {
    habitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Habit",
      required: [true, "El ID del hábito es requerido"],
      index: true,
    },
    userId: {
      type: String,
      required: [true, "El ID del usuario es requerido"],
      index: true,
    },
    date: {
      type: Date,
      required: [true, "La fecha es requerida"],
      index: true,
    },
    completed: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

// Índice compuesto para evitar duplicados por hábito+fecha+usuario
checkinSchema.index({ habitId: 1, userId: 1, date: 1 }, { unique: true })

const Checkin = mongoose.model("Checkin", checkinSchema)

export default Checkin
