import { useEffect, useState } from "react";
import PersonalLayout from "../../components/layout/PersonalLayout";
import api from "../../services/api";

function Solicitar() {

  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const [form, setForm] = useState({
    equipo_id: "",
    descripcion: "",
    prioridad: "MEDIA"
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await api.get("/equipos/mis-equipos");
      setEquipos(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.log(e);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const guardar = async () => {
    if (!form.equipo_id || !form.descripcion.trim()) {
      alert("Selecciona un equipo y describe el problema");
      return;
    }
    setLoading(true);
    try {
      await api.post("/mantenimientos/solicitudes", form);
      setEnviado(true);
      setForm({ equipo_id: "", descripcion: "", prioridad: "MEDIA" });
      setTimeout(() => setEnviado(false), 4000);
    } catch (e) {
      alert("Error al enviar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  const prioridades = [
    { value: "BAJA",  label: "🟢 Baja",  desc: "No urgente" },
    { value: "MEDIA", label: "🟡 Media", desc: "Moderado" },
    { value: "ALTA",  label: "🔴 Alta",  desc: "Urgente" },
  ];

  return (
    <PersonalLayout>

      {/* HEADER */}
      <div style={{ marginBottom: "2rem" }}>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: 0 }}>
          Portal personal
        </p>
        <h1 style={{
          fontSize: "26px", fontWeight: 700,
          margin: "4px 0 0", color: "var(--text-primary)"
        }}>
          🛠 Solicitar Mantenimiento
        </h1>
      </div>

      {/* ALERTA ÉXITO */}
      {enviado && (
        <div style={{
          background: "var(--success-bg)",
          border: "1px solid var(--success)",
          borderRadius: "12px",
          padding: "14px 20px",
          marginBottom: "1.5rem",
          color: "var(--success)",
          display: "flex", alignItems: "center", gap: "10px",
          fontSize: "14px", fontWeight: 500
        }}>
          ✅ Solicitud enviada correctamente. El equipo técnico la revisará pronto.
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "20px",
        alignItems: "start"
      }}>

        {/* FORMULARIO */}
        <div style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "1.75rem",
          display: "flex", flexDirection: "column", gap: "20px"
        }}>

          {/* EQUIPO */}
          <div>
            <label style={{
              display: "block",
              color: "var(--text-secondary)",
              fontSize: "13px", fontWeight: 500,
              marginBottom: "8px"
            }}>
              Equipo con problema
            </label>
            <select
              name="equipo_id"
              value={form.equipo_id}
              onChange={handleChange}
              style={{
                width: "100%",
                background: "var(--bg-surface2)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "11px 16px",
                color: "var(--text-primary)",
                fontSize: "14px",
                outline: "none",
                fontFamily: "inherit"
              }}
            >
              <option value="">Seleccionar equipo...</option>
              {equipos.map(e => (
                <option key={e.id} value={e.id}>
                  {e.codigo} — {e.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* PRIORIDAD */}
          <div>
            <label style={{
              display: "block",
              color: "var(--text-secondary)",
              fontSize: "13px", fontWeight: 500,
              marginBottom: "8px"
            }}>
              Nivel de prioridad
            </label>
            <div style={{ display: "flex", gap: "10px" }}>
              {prioridades.map(p => (
                <button
                  key={p.value}
                  onClick={() => setForm({ ...form, prioridad: p.value })}
                  style={{
                    flex: 1,
                    padding: "10px 8px",
                    borderRadius: "10px",
                    border: form.prioridad === p.value
                      ? "1px solid var(--accent)"
                      : "1px solid var(--border)",
                    background: form.prioridad === p.value
                      ? "var(--accent-light)"
                      : "var(--bg-surface2)",
                    color: form.prioridad === p.value
                      ? "var(--accent-text)"
                      : "var(--text-secondary)",
                    fontSize: "12px", fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.15s",
                    fontFamily: "inherit"
                  }}
                >
                  <div>{p.label}</div>
                  <div style={{
                    fontSize: "11px",
                    opacity: 0.7,
                    marginTop: "2px"
                  }}>
                    {p.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* DESCRIPCION */}
          <div>
            <label style={{
              display: "block",
              color: "var(--text-secondary)",
              fontSize: "13px", fontWeight: 500,
              marginBottom: "8px"
            }}>
              Descripción del problema
            </label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              rows={5}
              placeholder="Describe detalladamente el problema..."
              style={{
                width: "100%",
                background: "var(--bg-surface2)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "11px 16px",
                color: "var(--text-primary)",
                fontSize: "14px",
                outline: "none",
                resize: "vertical",
                lineHeight: 1.6,
                fontFamily: "inherit",
                boxSizing: "border-box"
              }}
            />
            <p style={{
              color: "var(--text-muted)",
              fontSize: "12px", margin: "6px 0 0"
            }}>
              {form.descripcion.length} caracteres
            </p>
          </div>

          {/* BTN ENVIAR */}
          <button
            onClick={guardar}
            disabled={loading}
            style={{
              background: loading ? "var(--accent-light)" : "var(--accent)",
              border: "none",
              borderRadius: "10px",
              padding: "14px",
              color: loading ? "var(--accent-text)" : "#fff",
              fontSize: "15px", fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "opacity 0.15s",
              fontFamily: "inherit"
            }}
          >
            {loading ? "Enviando..." : "📨 Enviar Solicitud"}
          </button>

        </div>

        {/* PANEL LATERAL INFO */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* TIPS */}
          <div style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            padding: "1.5rem"
          }}>
            <h3 style={{
              color: "var(--text-primary)",
              fontSize: "15px", fontWeight: 600,
              marginBottom: "12px"
            }}>
              📋 ¿Qué incluir?
            </h3>
            {[
              "Describe el error o falla exacta",
              "Indica desde cuándo ocurre",
              "Menciona si afecta tu trabajo",
              "Agrega pasos para reproducirlo",
            ].map((tip, i) => (
              <div key={i} style={{
                display: "flex", gap: "10px",
                alignItems: "flex-start",
                padding: "8px 0",
                borderBottom: i < 3
                  ? "1px solid var(--border)" : "none"
              }}>
                <span style={{
                  minWidth: "22px", height: "22px",
                  background: "var(--accent-light)",
                  borderRadius: "6px",
                  display: "flex", alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  color: "var(--accent-text)",
                  fontWeight: 700
                }}>
                  {i + 1}
                </span>
                <span style={{
                  color: "var(--text-secondary)",
                  fontSize: "13px", lineHeight: 1.5
                }}>
                  {tip}
                </span>
              </div>
            ))}
          </div>

          {/* TIEMPOS */}
          <div style={{
            background: "var(--warning-bg)",
            border: "1px solid var(--warning)",
            borderRadius: "16px",
            padding: "1.25rem"
          }}>
            <p style={{
              color: "var(--warning)",
              fontSize: "13px", fontWeight: 600,
              margin: "0 0 6px"
            }}>
              ⚡ Tiempo de respuesta
            </p>
            <p style={{
              color: "var(--text-secondary)",
              fontSize: "13px", margin: 0, lineHeight: 1.6
            }}>
              Alta: 2–4 horas · Media: 1 día hábil · Baja: 3–5 días hábiles
            </p>
          </div>

        </div>

      </div>

    </PersonalLayout>
  );
}

export default Solicitar;