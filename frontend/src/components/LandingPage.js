import { Link } from "react-router-dom"
import "../LandingPage.css"

const LandingPage = () => {
  const benefits = [
    {
      icon: "🎯",
      title: "Seguimiento Inteligente",
      description: "Rastrea tus hábitos diarios con recordatorios personalizados y estadísticas detalladas.",
    },
    {
      icon: "📈",
      title: "Progreso Visual",
      description: "Visualiza tu crecimiento con gráficos motivadores y celebra cada logro alcanzado.",
    },
    {
      icon: "🏆",
      title: "Sistema de Logros",
      description: "Desbloquea insignias y recompensas mientras construyes hábitos duraderos.",
    },
    {
      icon: "🧠",
      title: "Sugerencias IA",
      description: "Recibe recomendaciones personalizadas basadas en tu progreso y objetivos.",
    },
  ]

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="header-container">
          <div className="logo">
            <span className="logo-icon">🌱</span>
            <span className="logo-text">habitos</span>
          </div>
          <Link to="/login" className="login-btn">
            Iniciar sesión
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Transforma tu vida con
              <span className="highlight"> hábitos inteligentes</span>
            </h1>
            <p className="hero-description">
              te ayuda a crear, mantener y perfeccionar hábitos saludables que transformarán tu día a día.
              Comienza tu viaje hacia una mejor versión de ti mismo.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="cta-primary">
                Comenzar gratis
              </Link>
            </div>
          </div>
          <div className="hero-image">
            <div className="hero-illustration">
              <div className="floating-card card-1">
                <span>💪</span>
                <span>Ejercicio diario</span>
              </div>
              <div className="floating-card card-2">
                <span>📚</span>
                <span>Leer 30 min</span>
              </div>
              <div className="floating-card card-3">
                <span>💧</span>
                <span>Beber agua</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="benefits-container">
          <div className="section-header">
            <h2 className="section-title">¿Por qué elegir?</h2>
            <p className="section-subtitle">Descubre las herramientas que te ayudarán a alcanzar tus objetivos</p>
          </div>
          <div className="benefits-grid">
            {benefits.map((benefit, index) => (
              <div key={index} className="benefit-card">
                <div className="benefit-icon">{benefit.icon}</div>
                <h3 className="benefit-title">{benefit.title}</h3>
                <p className="benefit-description">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2 className="cta-title">¿Listo para cambiar tu vida?</h2>
          <p className="cta-description">Únete a miles de personas que ya están construyendo mejores hábitos</p>
          <Link to="/register" className="cta-button">
            Empezar ahora - Es gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-logo">
              <span className="logo-icon">🌱</span>
              <span className="logo-text">Habitos</span>
            </div>
            <p className="footer-text">Construyendo mejores hábitos, un día a la vez.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
