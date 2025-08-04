import express from "express"
import { exportUserData } from "../controllers/exportController.js"
import { authenticateUser } from "../middleware/auth.js"

const router = express.Router()

router.use((req, res, next) => {
  console.log(`📦 Export ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`)
  next()
})

router.get("/", authenticateUser, exportUserData)

export default router
