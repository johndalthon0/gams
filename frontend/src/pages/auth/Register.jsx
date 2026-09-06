import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useDialog } from "../../context/DialogContext";
import { ThemeContext } from "../../context/ThemeContext";
import { getSistemaConfig } from "../../utils/sistemaConfig";

function Register() {
  const navigate = useNavigate();
  const { avisar } = useDialog();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const sistema = getSistemaConfig();
  const [form, setForm] = useState({ nombre: "", apellido: "", email: "", password: "", telefono: "" });
  const [loading, setLoading] = useState(false);

  const cambiar = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const register = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/register", { ...form, email: form.email.trim().toLowerCase(), rol: "PERSONAL" });
      await avisar("Tu usuario fue registrado correctamente.", "Registro completado");
      navigate("/");
    } catch (error) {
      await avisar(error.response?.data?.message || "No se pudo registrar el usuario.", "Error de registro");
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
      <section className="auth-shell auth-shell-register">
        <aside className="auth-brand-panel">
          <div className="auth-brand-mark">
            {sistema.logo_data ? <img src={sistema.logo_data} alt="Logo institucional" /> : sistema.logo_texto || "GAM"}
            <span className="auth-spark auth-spark-one" aria-hidden="true" />
            <span className="auth-spark auth-spark-two" aria-hidden="true" />
            <span className="auth-spark auth-spark-three" aria-hidden="true" />
          </div>
          <p className="auth-eyebrow">SISTEMA · TI / OPERACIONES</p>
          <h1>Únete a la plataforma</h1>
          <p className="auth-brand-copy">{sistema.nombre_institucion || "Gobierno Autónomo Municipal"}</p>
          <div className="auth-brand-line" />
          <p className="auth-brand-note">Crea tu acceso al portal de activos y soporte tecnológico.</p>
          <div className="auth-system-grid">
            <span><strong>01</strong> Activos</span>
            <span><strong>02</strong> Solicitudes</span>
            <span><strong>03</strong> Soporte</span>
          </div>
        </aside>
        <section className="auth-form-panel">
          <div className="auth-form-heading">
            <p className="auth-kicker">ALTA DE USUARIO · TI</p>
            <h2>Crear cuenta</h2>
            <p>Completa tus datos para comenzar.</p>
          </div>
          <form onSubmit={register} className="auth-form auth-form-grid">
            <div><label htmlFor="register-nombre">Nombre</label><input id="register-nombre" name="nombre" required autoComplete="given-name" placeholder="Tu nombre" value={form.nombre} onChange={cambiar} /></div>
            <div><label htmlFor="register-apellido">Apellido</label><input id="register-apellido" name="apellido" required autoComplete="family-name" placeholder="Tu apellido" value={form.apellido} onChange={cambiar} /></div>
            <div className="auth-field-full"><label htmlFor="register-email">Correo electrónico</label><input id="register-email" name="email" type="email" required autoComplete="email" placeholder="correo@gam.bo" value={form.email} onChange={cambiar} /></div>
            <div className="auth-field-full"><label htmlFor="register-password">Contraseña</label><input id="register-password" name="password" type="password" required minLength="6" autoComplete="new-password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={cambiar} /></div>
            <div className="auth-field-full"><label htmlFor="register-telefono">Teléfono</label><input id="register-telefono" name="telefono" autoComplete="tel" placeholder="70000000" value={form.telefono} onChange={cambiar} /></div>
            <button className="auth-submit auth-field-full" type="submit" disabled={loading}>{loading ? "Creando cuenta..." : "Crear cuenta"}</button>
          </form>
          <div className="auth-switch">¿Ya tienes una cuenta? <button type="button" onClick={() => navigate("/")}>Iniciar sesión</button></div>
        </section>
      </section>
    </main>
  );
}

export default Register;
