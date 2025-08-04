import { startOfDay, endOfDay, subDays } from "date-fns"
import MoodNote from "../models/MoodNote.js"
import { createMoodNoteSchema, getMoodNotesSchema } from "../validation/moodNoteValidation.js"
import Sentiment from "sentiment" // ✅ Cambiar a 'sentiment'

let sentimentAnalyzer

// Function to load the sentiment analyzer once
export async function loadSentimentModel() {
  try {
    console.log("Initializing sentiment analyzer...")
    sentimentAnalyzer = new Sentiment()
    console.log("✅ Sentiment analyzer initialized successfully.")
  } catch (error) {
    console.error("❌ Failed to initialize sentiment analyzer:", error)
    sentimentAnalyzer = null
  }
}

// Function to classify sentiment
const classifySentiment = async (text) => {
  if (!sentimentAnalyzer || !text || text.trim() === "") {
    return "neutral" // Default to neutral if analyzer not loaded or no text
  }

  try {
    // The sentiment library returns a score and comparative
    const result = sentimentAnalyzer.analyze(text)
    const score = result.score

    // Define thresholds for classification based on score
    if (score > 1) {
      return "positive"
    } else if (score < -1) {
      return "negative"
    } else {
      return "neutral"
    }
  } catch (error) {
    console.error("Error classifying sentiment:", error)
    return "neutral" // Fallback to neutral on error
  }
}

// POST /api/moods - Create a new mood note
export const createMoodNote = async (req, res) => {
  try {
    const userId = req.user.uid
    const today = startOfDay(new Date())

    // Validate request body
    const { error, value } = createMoodNoteSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ message: error.details[0].message })
    }

    const { emoji, note } = value

    // Check if a mood note already exists for today for this user
    const existingMoodNote = await MoodNote.findOne({
      userId,
      date: {
        $gte: today,
        $lt: endOfDay(today),
      },
    })

    if (existingMoodNote) {
      return res.status(400).json({
        message: "Ya has registrado tu estado de ánimo para hoy.",
        moodNote: existingMoodNote,
      })
    }

    // Perform sentiment analysis on the note
    const sentimentResult = await classifySentiment(note)

    const newMoodNote = new MoodNote({
      userId,
      date: today,
      emoji,
      note,
      sentiment: sentimentResult,
    })

    const savedMoodNote = await newMoodNote.save()
    res.status(201).json({
      message: "Estado de ánimo registrado exitosamente",
      moodNote: savedMoodNote,
    })
  } catch (error) {
    console.error("Error creating mood note:", error)
    res.status(500).json({
      message: "Error al registrar estado de ánimo",
      error: error.message,
    })
  }
}

// GET /api/moods - Get mood notes for a specific range
export const getMoodNotes = async (req, res) => {
  try {
    const userId = req.user.uid
    const { range } = req.query

    // Validate query parameters
    const { error, value } = getMoodNotesSchema.validate({ range })
    if (error) {
      return res.status(400).json({ message: error.details[0].message })
    }

    const today = startOfDay(new Date())
    let dateFilter = {}

    switch (value.range) {
      case "today":
        dateFilter = { $gte: today, $lt: endOfDay(today) }
        break
      case "last7days":
        dateFilter = { $gte: subDays(today, 6), $lt: endOfDay(today) }
        break
      case "last30days":
        dateFilter = { $gte: subDays(today, 29), $lt: endOfDay(today) }
        break
      case "all":
      default:
        // No date filter for 'all'
        break
    }

    const moodNotes = await MoodNote.find({
      userId,
      ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
    }).sort({ date: -1 }) // Sort by most recent first

    res.status(200).json({
      moodNotes,
      total: moodNotes.length,
      range: value.range,
    })
  } catch (error) {
    console.error("Error getting mood notes:", error)
    res.status(500).json({
      message: "Error al obtener estados de ánimo",
      error: error.message,
    })
  }
}
