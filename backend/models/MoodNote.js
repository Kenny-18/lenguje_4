import mongoose from "mongoose"

const moodNoteSchema = new mongoose.Schema(
  {
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
    emoji: {
      type: String,
      required: [true, "El emoji es requerido"],
      trim: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [200, "La nota no puede exceder 200 caracteres"],
      default: "",
    },
  },
  {
    timestamps: true,
  },
)

// Compound index to ensure only one mood note per user per day
moodNoteSchema.index({ userId: 1, date: 1 }, { unique: true })

const MoodNote = mongoose.model("MoodNote", moodNoteSchema)

export default MoodNote
