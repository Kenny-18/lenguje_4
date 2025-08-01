import express from "express"
import { createMoodNote, getMoodNotes } from "../controllers/moodController.js"
import { authenticateUser } from "../middleware/auth.js"

const router = express.Router()

// Middleware for specific mood routes logging
router.use((req, res, next) => {
  console.log(`😊 Moods ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`)
  next()
})

// Apply authentication to all mood routes
router.use(authenticateUser)

// Routes for mood notes
router.post("/", createMoodNote) // POST /api/moods
router.get("/", getMoodNotes) // GET /api/moods

export default router
