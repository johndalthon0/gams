import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { ThemeContext } from "../../context/ThemeContext";
import { getSistemaConfig } from "../../utils/sistemaConfig";

function Login() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const sistema = getSistemaConfig();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      const rol = res.data.user.rol;
      if (rol === "ADMIN") navigate("/admin/dashboard");
      if (rol === "EMPLEADO") navigate("/empleado/dashboard");
      if (rol === "PERSONAL") navigate("/personal/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || (err.response
        ? `Error de acceso (${err.response.status})`
        : "No se pudo conectar con el servidor"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-orbit auth-orbit-one" />
      <div className="auth-orbit auth-orbit-two" />
      <button className="auth-theme-toggle" type="button" onClick={toggleTheme} aria-label="Cambiar tema">
        {theme === "dark" ? "☀️ Claro" : "🌙 Oscuro"}
      </button>
      <section className="auth-shell">
        <aside className="auth-brand-panel">
          <div className="auth-brand-mark">
            {sistema.logo_data ? <img src={sistema.logo_data} alt="Logo institucional" /> : sistema.logo_texto || "GAM"}
            <span className="auth-spark auth-spark-one" aria-hidden="true" />
            <span className="auth-spark auth-spark-two" aria-hidden="true" />
            <span className="auth-spark auth-spark-three" aria-hidden="true" />
          </div>
          <p className="auth-eyebrow">SISTEMA · TI / OPERACIONES</p>
          <h1>{sistema.nombre_institucion || "Gobierno Autónomo Municipal"}</h1>
          <p className="auth-brand-copy">{sistema.nombre_sistema || "Sistema de Registro de Equipos"}</p>
          <div className="auth-brand-line" />
          <p className="auth-brand-note">Control centralizado de activos, asignaciones y mantenimiento tecnológico.</p>
          <div className="auth-system-grid">
            <span><strong>01</strong> Inventario</span>
            <span><strong>02</strong> Soporte TI</span>
            <span><strong>03</strong> Seguridad</span>
          </div>
        </aside>
        <section className="auth-form-panel">
          <div className="auth-form-heading">
            <p className="auth-kicker">MÓDULO DE ACCESO · SEGURO</p>
            <h2>Bienvenido de nuevo</h2>
            <p>Ingresa tus credenciales para continuar.</p>
          </div>
          {error && <div className="auth-error" role="alert">{error}</div>}
          <form onSubmit={login} className="auth-form">
            <label htmlFor="login-email">Correo electrónico</label>
            <input id="login-email" type="email" required autoComplete="email" placeholder="correo@gam.bo" value={email} onChange={(e) => setEmail(e.target.value)} />
            <label htmlFor="login-password">Contraseña</label>
            <input id="login-password" type="password" required autoComplete="current-password" placeholder="Ingresa tu contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className="auth-submit" type="submit" disabled={loading}>{loading ? "Verificando..." : "Iniciar sesión"}</button>
          </form>
          <div className="auth-switch">¿Aún no tienes una cuenta? <button type="button" onClick={() => navigate("/register")}>Crear cuenta</button></div>
        </section>
      </section>
    </main>
  );
}

export default Login;
