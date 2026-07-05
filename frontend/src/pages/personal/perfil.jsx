import { useEffect, useState } from "react";
import PersonalLayout from "../../components/layout/PersonalLayout";
import api from "../../services/api";

function Perfil() {

  const [user, setUser] = useState({});

  useEffect(() => {
    api.get("/auth/perfil")
      .then(res => setUser(res.data))
      .catch(() => setUser(
        JSON.parse(localStorage.getItem("user") || "{}")
      ));
  }, []);

  const inicial = user.nombre?.charAt(0)?.toUpperCase() || "U";

  const campos = [
    { label: "Nombre",   value: user.nombre   || "—", icon: "👤" },
    { label: "Apellido", value: user.apellido  || "—", icon: "👤" },
    { label: "Email",    value: user.email     || "—", icon: "📧" },
    { label: "Teléfono", value: user.telefono  || "—", icon: "📱" },
    { label: "Rol",      value: user.rol       || "—", icon: "🏷" },
  ];

  return (
    <PersonalLayout>

      <div style={{ marginBottom: "2rem" }}>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: 0 }}>
          Portal personal
        </p>
        <h1 style={{
          fontSize: "26px", fontWeight: 700,
          margin: "4px 0 0", color: "var(--text-primary)"
        }}>
          👤 Mi Perfil
        </h1>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: "20px",
        alignItems: "start"
      }}>

        {/* AVATAR */}
        <div style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "2rem",
          textAlign: "center"
        }}>
          <div style={{
            width: "80px", height: "80px",
            borderRadius: "50%",
            background: "linear-gradient(135deg,#6c63ff,#a78bfa)",
            display: "flex", alignItems: "center",
            justifyContent: "center",
            fontSize: "32px", fontWeight: 700,
            color: "#fff", margin: "0 auto 16px"
          }}>
            {inicial}
          </div>
          <h2 style={{
            color: "var(--text-primary)",
            fontSize: "18px", fontWeight: 700,
            margin: "0 0 4px"
          }}>
            {user.nombre} {user.apellido}
          </h2>
          <p style={{
            color: "var(--text-secondary)",
            fontSize: "13px", margin: "0 0 16px"
          }}>
            {user.email}
          </p>
          <span className="badge-success">✓ Cuenta activa</span>
        </div>

        {/* DATOS */}
        <div style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "1.75rem"
        }}>
          <h3 style={{
            color: "var(--text-primary)",
            fontSize: "15px", fontWeight: 600,
            margin: "0 0 1.25rem"
          }}>
            Información de la cuenta
          </h3>

          {campos.map((c, i) => (
            <div key={i} style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "13px 0",
              borderBottom: i < campos.length - 1
                ? "1px solid var(--border)" : "none"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "16px" }}>{c.icon}</span>
                <span style={{
                  color: "var(--text-secondary)", fontSize: "14px"
                }}>
                  {c.label}
                </span>
              </div>
              <span style={{
                color: c.label === "Rol"
                  ? "var(--accent-text)"
                  : "var(--text-primary)",
                fontSize: "14px",
                fontWeight: c.label === "Rol" ? 600 : 400
              }}>
                {c.value}
              </span>
            </div>
          ))}
        </div>

      </div>

    </PersonalLayout>
  );
}

export default Perfil;