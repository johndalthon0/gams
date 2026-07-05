import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const navigate = useNavigate();

  const login = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:3000/api/auth/login", {
        email,
        password
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user",  JSON.stringify(res.data.user));

      const rol = res.data.user.rol;

      if (rol === "ADMIN")    navigate("/admin/dashboard");
      if (rol === "EMPLEADO") navigate("/empleado/reparaciones"); // ✅ ruta propia
      if (rol === "PERSONAL") navigate("/personal/dashboard");

    } catch (err) {
      setError(
        err.response?.data?.message || "Credenciales incorrectas"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-page)",
      display: "flex", alignItems: "center",
      justifyContent: "center", padding: "1rem"
    }}>
      <div style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        padding: "2rem",
        width: "100%", maxWidth: "400px",
        boxShadow: "var(--shadow)"
      }}>

        {/* LOGO */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            width: "56px", height: "56px",
            background: "linear-gradient(135deg,#6c63ff,#a78bfa)",
            borderRadius: "16px", margin: "0 auto 12px",
            display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "26px"
          }}>💼</div>
          <h2 style={{
            fontWeight: 700, margin: 0,
            color: "var(--text-primary)", fontSize: "22px"
          }}>
            GAMS TI
          </h2>
          <p style={{
            color: "var(--text-secondary)",
            fontSize: "13px", margin: "4px 0 0"
          }}>
            Sistema de Registro de Equipos — GAM
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div style={{
            background: "var(--danger-bg)",
            border: "1px solid var(--danger)",
            color: "var(--danger)",
            borderRadius: "10px", padding: "10px 14px",
            fontSize: "13px", marginBottom: "1.25rem"
          }}>
            ❌ {error}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={login}>

          <div style={{ marginBottom: "14px" }}>
            <label style={{
              display: "block", color: "var(--text-secondary)",
              fontSize: "13px", fontWeight: 500, marginBottom: "6px"
            }}>
              Email
            </label>
            <input
              type="email"
              required
              placeholder="correo@gam.bo"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                width: "100%", background: "var(--bg-surface2)",
                border: "1px solid var(--border)", borderRadius: "10px",
                padding: "11px 16px", color: "var(--text-primary)",
                fontSize: "14px", outline: "none",
                fontFamily: "inherit", boxSizing: "border-box"
              }}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{
              display: "block", color: "var(--text-secondary)",
              fontSize: "13px", fontWeight: 500, marginBottom: "6px"
            }}>
              Contraseña
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{
                width: "100%", background: "var(--bg-surface2)",
                border: "1px solid var(--border)", borderRadius: "10px",
                padding: "11px 16px", color: "var(--text-primary)",
                fontSize: "14px", outline: "none",
                fontFamily: "inherit", boxSizing: "border-box"
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: loading ? "var(--accent-light)" : "var(--accent)",
              color: loading ? "var(--accent-text)" : "#fff",
              border: "none", borderRadius: "10px",
              padding: "13px", fontSize: "15px",
              fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit", transition: "opacity 0.15s"
            }}
          >
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>

        </form>

        <button
          onClick={() => navigate("/register")}
          style={{
            width: "100%", background: "none",
            border: "none", color: "var(--accent-text)",
            fontSize: "13px", cursor: "pointer",
            marginTop: "1rem", fontFamily: "inherit",
            textDecoration: "underline"
          }}
        >
          Crear cuenta nueva
        </button>

      </div>
    </div>
  );
}

export default Login;