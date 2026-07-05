import { useEffect, useState } from "react";
import PersonalLayout from "../../components/layout/PersonalLayout";
import api from "../../services/api";

function MisSolicitudes() {

  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await api.get("/mantenimientos/mis-solicitudes");
      setSolicitudes(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (raw) => {
    if (!raw) return "—";
    return new Date(raw).toLocaleDateString("es-BO", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  const badgeEstado = (estado) => {
    const map = {
      PENDIENTE:  { bg: "var(--warning-bg)",  color: "var(--warning)",  border: "var(--warning)" },
      EN_PROCESO: { bg: "var(--accent-light)", color: "var(--accent-text)", border: "var(--accent)" },
      FINALIZADO: { bg: "var(--success-bg)",  color: "var(--success)",  border: "var(--success)" },
      RECHAZADO:  { bg: "var(--danger-bg)",   color: "var(--danger)",   border: "var(--danger)" },
      APROBADO:   { bg: "var(--success-bg)",  color: "var(--success)",  border: "var(--success)" },
    };
    const s = map[estado] || map.PENDIENTE;
    return (
      <span style={{
        background: s.bg, color: s.color,
        border: `1px solid ${s.border}`,
        borderRadius: "6px", padding: "3px 10px",
        fontSize: "12px", fontWeight: 600
      }}>
        {estado}
      </span>
    );
  };

  const badgePrioridad = (p) => {
    const map = {
      ALTA:  { color: "var(--danger)",  icon: "🔴" },
      MEDIA: { color: "var(--warning)", icon: "🟡" },
      BAJA:  { color: "var(--success)", icon: "🟢" },
    };
    const s = map[p] || map.MEDIA;
    return (
      <span style={{ color: s.color, fontWeight: 600, fontSize: "13px" }}>
        {s.icon} {p}
      </span>
    );
  };

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
          📋 Mis Solicitudes
        </h1>
      </div>

      {/* STATS */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: "12px",
        marginBottom: "1.5rem"
      }}>
        {[
          { label: "Total",      value: solicitudes.length,                                          color: "var(--accent-text)" },
          { label: "Pendientes", value: solicitudes.filter(s => s.estado === "PENDIENTE").length,    color: "var(--warning)" },
          { label: "En proceso", value: solicitudes.filter(s => s.estado === "EN_PROCESO").length,   color: "var(--accent-text)" },
          { label: "Finalizadas",value: solicitudes.filter(s => s.estado === "FINALIZADO").length,   color: "var(--success)" },
        ].map((s, i) => (
          <div key={i} style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "1rem",
            textAlign: "center"
          }}>
            <p style={{ color: "var(--text-secondary)", fontSize: "12px", margin: "0 0 4px" }}>
              {s.label}
            </p>
            <p style={{ color: s.color, fontSize: "22px", fontWeight: 700, margin: 0 }}>
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
          padding: "1rem 1.25rem",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <h5 style={{ fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>
            Historial de Solicitudes
          </h5>
          <a href="/personal/solicitar" style={{
            background: "var(--accent)",
            color: "#fff", textDecoration: "none",
            borderRadius: "8px", padding: "7px 16px",
            fontSize: "13px", fontWeight: 600
          }}>
            + Nueva Solicitud
          </a>
        </div>

        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>
            Cargando...
          </div>
        ) : solicitudes.length === 0 ? (
          <div style={{
            padding: "4rem", textAlign: "center",
            color: "var(--text-secondary)"
          }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>📭</div>
            <h3 style={{ color: "var(--text-primary)", marginBottom: "8px" }}>
              Sin solicitudes
            </h3>
            <p style={{ margin: 0, fontSize: "14px" }}>
              Aún no has enviado solicitudes de mantenimiento
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{
                  background: "var(--table-header)",
                  borderBottom: "1px solid var(--border)"
                }}>
                  {["#","Equipo","Descripción","Prioridad","Estado","Fecha"].map(h => (
                    <th key={h} style={{
                      padding: "12px 16px", textAlign: "left",
                      color: "var(--text-secondary)", fontWeight: 500,
                      fontSize: "12px", textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {solicitudes.map(s => (
                  <tr key={s.id} style={{
                    borderBottom: "1px solid var(--border)",
                    transition: "background 0.15s"
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--hover)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "14px 16px", color: "var(--text-muted)", fontSize: "12px" }}>
                      #{s.id}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <p style={{ margin: 0, color: "var(--accent-text)", fontWeight: 600 }}>
                        {s.equipo_codigo}
                      </p>
                      <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "12px" }}>
                        {s.equipo_nombre}
                      </p>
                    </td>
                    <td style={{
                      padding: "14px 16px", color: "var(--text-secondary)",
                      fontSize: "13px", maxWidth: "250px"
                    }}>
                      {s.descripcion}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      {badgePrioridad(s.prioridad)}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      {badgeEstado(s.estado)}
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--text-muted)", fontSize: "12px", whiteSpace: "nowrap" }}>
                      {formatDate(s.fecha_solicitud)}
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

export default MisSolicitudes;