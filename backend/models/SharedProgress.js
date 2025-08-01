import mongoose from "mongoose"

const sharedProgressSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    imageUrl: {
      type: String, // Base64 string or URL if uploaded to external storage
      required: true,
    },
    sharedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    // Optional: could add more context like habitId, date range, etc.
  },
  {
    timestamps: true,
  },
)

const SharedProgress = mongoose.model("SharedProgress", sharedProgressSchema)

export default SharedProgress
