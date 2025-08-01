import mongoose from "mongoose"

const userPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true, // Una entrada de preferencias por usuario
      index: true,
    },
    theme: {
      type: String,
      enum: ["light", "dark"],
      default: "light",
    },
    // Agrega otras preferencias específicas del usuario aquí si es necesario
  },
  { timestamps: true },
)

const UserPreference = mongoose.model("UserPreference", userPreferenceSchema)

export default UserPreference
