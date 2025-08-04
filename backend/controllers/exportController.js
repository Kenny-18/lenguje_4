import archiver from "archiver"
import { Parser } from "json2csv"
import Habit from "../models/Habit.js"
import Achievement from "../models/Achievement.js"
import Checkin from "../models/Checkin.js"
import MoodNote from "../models/MoodNote.js"

export const exportUserData = async (req, res) => {
  try {
    const userId = req.user.uid
    const { format } = req.query

    if (!format || !["csv", "json"].includes(format)) {
      return res.status(400).json({ message: "Formato de exportación inválido. Debe ser 'csv' o 'json'." })
    }

    // Fetch all data for the user
    const habits = await Habit.find({ userId }).lean()
    const achievements = await Achievement.find({ userId }).lean()
    const checkins = await Checkin.find({ userId }).lean()
    const moodNotes = await MoodNote.find({ userId }).lean()

    // Create a zip archive
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Sets the compression level.
    })

    // Set response headers
    res.attachment(`habit_tracker_export_${new Date().toISOString().slice(0, 10)}.zip`)
    archive.pipe(res)

    if (format === "csv") {
      // Convert data to CSV
      const opts = { header: true }

      const habitFields = [
        "_id",
        "title",
        "description",
        "frequency",
        "streakCurrent",
        "streakBest",
        "lastCheckinDate",
        "createdAt",
        "updatedAt",
      ]
      const habitParser = new Parser({ fields: habitFields })
      const habitsCsv = habitParser.parse(habits)
      archive.append(habitsCsv, { name: "habits.csv" })

      const achievementFields = [
        "_id",
        "name",
        "description",
        "type",
        "achievedAt",
        "habitId",
        "createdAt",
        "updatedAt",
      ]
      const achievementParser = new Parser({ fields: achievementFields })
      const achievementsCsv = achievementParser.parse(achievements)
      archive.append(achievementsCsv, { name: "achievements.csv" })

      const checkinFields = ["_id", "habitId", "date", "completed", "createdAt", "updatedAt"]
      const checkinParser = new Parser({ fields: checkinFields })
      const checkinsCsv = checkinParser.parse(checkins)
      archive.append(checkinsCsv, { name: "checkins.csv" })

      const moodNoteFields = ["_id", "date", "emoji", "note", "sentiment", "createdAt", "updatedAt"]
      const moodNoteParser = new Parser({ fields: moodNoteFields })
      const moodNotesCsv = moodNoteParser.parse(moodNotes)
      archive.append(moodNotesCsv, { name: "mood_notes.csv" })
    } else if (format === "json") {
      // Convert data to JSON
      archive.append(JSON.stringify(habits, null, 2), { name: "habits.json" })
      archive.append(JSON.stringify(achievements, null, 2), { name: "achievements.json" })
      archive.append(JSON.stringify(checkins, null, 2), { name: "checkins.json" })
      archive.append(JSON.stringify(moodNotes, null, 2), { name: "mood_notes.json" })
    }

    archive.finalize()
  } catch (error) {
    console.error("Error exporting user data:", error)
    res.status(500).json({
      message: "Error al exportar datos",
      error: error.message,
    })
  }
}
