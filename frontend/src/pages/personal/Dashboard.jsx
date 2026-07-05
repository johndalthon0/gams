import { useEffect, useState } from "react";
import PersonalLayout from "../../components/layout/PersonalLayout";
import api from "../../services/api";

function Dashboard() {

  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await api.get("/equipos/mis-equipos");
      setEquipos(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  // ✅ fecha limpia
  const formatDate = (raw) => {
    if (!raw) return "—";
    return new Date(raw).toLocaleDateString("es-BO", {
      day: "2-digit", month: "short", year: "numeric"
    });
  };

  const stats = [
    { label: "Equipos asignados", value: equipos.length, icon: "💻", color: "var(--accent-text)" },
    { label: "Estado cuenta",     value: "Activo",       icon: "✅", color: "var(--success)" },
    { label: "Rol",               value: user.rol || "—",icon: "👤", color: "var(--warning)" },
  ];

  return (
    <PersonalLayout>

      {/* BIENVENIDA */}
      <div style={{ marginBottom: "2rem" }}>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: 0 }}>
          Bienvenido de vuelta
        </p>
        <h1 style={{
          fontSize: "clamp(22px, 4vw, 32px)",
          fontWeight: 700,
          margin: "4px 0 0",
          color: "var(--text-primary)"
        }}>
          {user.nombre} {user.apellido}
        </h1>
      </div>

      {/* STATS */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "16px",
        marginBottom: "2rem"
      }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            padding: "1.25rem"
          }}>
            <span style={{ fontSize: "24px" }}>{s.icon}</span>
            <p style={{
              color: "var(--text-secondary)",
              fontSize: "13px",
              margin: "10px 0 4px"
            }}>
              {s.label}
            </p>
            <p style={{
              color: s.color,
              fontSize: "22px",
              fontWeight: 700,
              margin: 0
            }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* TABLA */}
      <div style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        overflow: "hidden"
      }}>
        <div style={{
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid var(--border)"
        }}>
          <h2 style={{
            fontSize: "15px", fontWeight: 600,
            margin: 0, color: "var(--text-primary)"
          }}>
            💻 Mis Equipos Asignados
          </h2>
        </div>

        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>
            Cargando...
          </div>
        ) : equipos.length === 0 ? (
          <div style={{
            padding: "3rem", textAlign: "center",
            color: "var(--text-secondary)"
          }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>📭</div>
            <p style={{ margin: 0 }}>No tienes equipos asignados aún</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table-base">
              <thead>
                <tr>
                  {["Código","Nombre","Tipo","Fecha","Estado"].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {equipos.map(e => (
                  <tr key={e.id}>
                    <td style={{ color: "var(--accent-text)", fontWeight: 600 }}>
                      {e.codigo}
                    </td>
                    <td style={{ color: "var(--text-primary)" }}>{e.nombre}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{e.tipo || "—"}</td>
                    <td style={{ color: "var(--text-secondary)" }}>
                      {formatDate(e.fecha_asignacion)}
                    </td>
                    <td>
                      <span className="badge-success">Asignado</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </PersonalLayout>
  );
}

export default Dashboard;