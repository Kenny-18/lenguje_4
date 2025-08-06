import "./App.css"
import "./Auth.css"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import { ThemeProvider } from "./contexts/ThemeContext" // NEW: Import ThemeProvider
import Login from "./components/Login"
import Register from "./components/Register"
import ForgotPassword from "./components/ForgotPassword"
import Dashboard from "./components/Dashboard"
import ProtectedRoute from "./components/ProtectedRoute"

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          {" "}
          {/* NEW: Wrap with ThemeProvider */}
          <div className="App">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </div>
        </ThemeProvider>{" "}
        {/* NEW: Close ThemeProvider */}
      </AuthProvider>
    </Router>
  )
}

export default App
