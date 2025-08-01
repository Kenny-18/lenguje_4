"use client"

import { useTheme } from "../contexts/ThemeContext"
import { Sun, Moon } from "lucide-react" // Requiere 'lucide-react' instalado

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 flex items-center justify-center"
      aria-label={`Alternar a tema ${theme === "light" ? "oscuro" : "claro"}`}
    >
      {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </button>
  )
}

export default ThemeToggle
