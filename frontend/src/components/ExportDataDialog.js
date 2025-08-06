"use client"

import { useState } from "react"
import "../ExportDataDialog.css"

const ExportDataDialog = ({ isOpen, onClose, onExport }) => {
  const [format, setFormat] = useState("csv")

  if (!isOpen) return null

  const handleExportClick = () => {
    onExport(format)
    onClose()
  }

  return (
    <div className="export-dialog-overlay">
      <div className="export-dialog-content">
        <h3>Exportar Historial</h3>
        <p>Selecciona el formato para descargar tu historial de hábitos y logros.</p>

        <div className="format-options">
          <label>
            <input type="radio" value="csv" checked={format === "csv"} onChange={() => setFormat("csv")} />
            CSV (Valores Separados por Comas)
          </label>
          <label>
            <input type="radio" value="json" checked={format === "json"} onChange={() => setFormat("json")} />
            JSON (JavaScript Object Notation)
          </label>
        </div>

        <div className="dialog-actions">
          <button onClick={handleExportClick} className="export-btn">
            Descargar como ZIP
          </button>
          <button onClick={onClose} className="cancel-btn">
            Cancelar
          </button>
        </div>
        <p className="export-note">
          Tu historial se descargará como un archivo ZIP que contendrá los datos en el formato seleccionado.
        </p>
      </div>
    </div>
  )
}

export default ExportDataDialog
