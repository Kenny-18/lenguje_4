import mongoose from "mongoose"

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, "El ID del usuario es requerido"],
      index: true,
    },
    habitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Habit",
      required: [true, "El ID del hábito es requerido"],
    },
    title: {
      type: String,
      required: [true, "El título es requerido"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "El mensaje es requerido"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["reminder", "achievement", "streak"],
      default: "reminder",
    },
    read: {
      type: Boolean,
      default: false,
    },
    scheduledFor: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

// Índice para optimizar consultas por usuario y fecha
notificationSchema.index({ userId: 1, createdAt: -1 })
notificationSchema.index({ userId: 1, read: 1 })

const Notification = mongoose.model("Notification", notificationSchema)

export default Notification
