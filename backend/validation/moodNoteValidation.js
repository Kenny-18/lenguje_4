import Joi from "joi"

export const createMoodNoteSchema = Joi.object({
  emoji: Joi.string().required().messages({
    "any.required": "El emoji es requerido.",
    "string.empty": "El emoji no puede estar vacío.",
  }),
  note: Joi.string().max(200).allow("").messages({
    "string.max": "La nota no puede exceder los 200 caracteres.",
  }),
})

export const getMoodNotesSchema = Joi.object({
  range: Joi.string().valid("today", "last7days", "last30days", "all").default("last30days").messages({
    "any.only": "El rango debe ser 'today', 'last7days', 'last30days' o 'all'.",
  }),
})
