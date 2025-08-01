import mongoose from "mongoose"

const userIntegrationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true, // One integration entry per user
      index: true,
    },
    google: {
      refreshToken: {
        type: String,
        required: false, // Not required initially, only after OAuth
      },
      // You might store accessToken and expiry here if needed for client-side,
      // but for server-side, it's usually generated from refreshToken
      lastSync: {
        type: Date,
        default: null,
      },
    },
    // Add other integrations here if needed
  },
  { timestamps: true },
)

const UserIntegration = mongoose.model("UserIntegration", userIntegrationSchema)

export default UserIntegration
