import mongoose from "mongoose"

const achievementSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, "El ID del usuario es requerido"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "El nombre del logro es requerido"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ["streak", "total_checkins", "perfect_week", "custom"], // Define types
      required: true,
    },
    criteria: {
      type: Object, // e.g., { days: 7 } for streak achievements
      required: false,
    },
    badgeSvg: {
      type: String, // Store SVG content directly
      required: [true, "El SVG de la medalla es requerido"],
    },
    achievedAt: {
      type: Date,
      default: Date.now,
    },
    habitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Habit",
      required: false, // Optional, if achievement is global or not tied to a specific habit
    },
  },
  {
    timestamps: true,
  },
)

// Compound index to prevent duplicate achievements for the same user/type/habit
achievementSchema.index(
  { userId: 1, type: 1, habitId: 1 },
  { unique: true, partialFilterExpression: { habitId: { $exists: true } } },
)
achievementSchema.index(
  { userId: 1, type: 1, name: 1 },
  { unique: true, partialFilterExpression: { habitId: { $exists: false } } },
)

const Achievement = mongoose.model("Achievement", achievementSchema)

export default Achievement
