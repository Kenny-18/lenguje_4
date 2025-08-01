import { startOfDay, endOfDay, subDays } from "date-fns"
import MoodNote from "../models/MoodNote.js"
import { createMoodNoteSchema, getMoodNotesSchema } from "../validation/moodNoteValidation.js"

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

    const newMoodNote = new MoodNote({
      userId,
      date: today,
      emoji,
      note,
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
