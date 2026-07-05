import { useEffect, useState } from "react";
import PersonalLayout from "../../components/layout/PersonalLayout";
import api from "../../services/api";

function MiEquipo() {

  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const formatDate = (raw) => {
    if (!raw) return "—";
    return new Date(raw).toLocaleDateString("es-BO", {
      day: "2-digit", month: "short", year: "numeric"
    });
  };

  const estadoColor = (estado) => {
    if (estado === "ASIGNADO")   return "badge-success";
    if (estado === "DISPONIBLE") return "badge-accent";
    if (estado === "BAJA")       return "badge-danger";
    return "badge-warning";
  };

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
          💻 Mis Equipos
        </h1>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-secondary)" }}>
          Cargando equipos...
        </div>
      ) : equipos.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "4rem",
          background: "var(--bg-surface)",
          border: "1px dashed var(--border)",
          borderRadius: "16px",
          color: "var(--text-secondary)"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📭</div>
          <h3 style={{ color: "var(--text-primary)", marginBottom: "8px" }}>
            Sin equipos asignados
          </h3>
          <p style={{ margin: 0, fontSize: "14px" }}>
            Contacta al administrador para solicitar una asignación
          </p>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "16px"
        }}>
          {equipos.map(e => (
            <div key={e.id} style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "16px",
              padding: "1.5rem",
              transition: "border-color 0.2s, transform 0.15s"
            }}
              onMouseEnter={ev => {
                ev.currentTarget.style.borderColor = "var(--accent)";
                ev.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={ev => {
                ev.currentTarget.style.borderColor = "var(--border)";
                ev.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "16px"
              }}>
                <div style={{
                  width: "44px", height: "44px",
                  background: "var(--accent-light)",
                  borderRadius: "12px",
                  display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "20px"
                }}>🖥</div>
                <span className={estadoColor(e.estado)}>
                  {e.estado || "—"}
                </span>
              </div>

              <h3 style={{
                color: "var(--text-primary)",
                fontSize: "16px", fontWeight: 600,
                margin: "0 0 4px"
              }}>
                {e.nombre}
              </h3>
              <p style={{
                color: "var(--accent-text)",
                fontSize: "13px", fontWeight: 600,
                margin: "0 0 16px"
              }}>
                #{e.codigo}
              </p>

              {[
                { label: "Tipo",     value: e.tipo     || "—" },
                { label: "Sucursal", value: e.sucursal || "—" },
                { label: "Asignado", value: formatDate(e.fecha_asignacion) },
              ].map(row => (
                <div key={row.label} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: "1px solid var(--border)"
                }}>
                  <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                    {row.label}
                  </span>
                  <span style={{
                    color: "var(--text-primary)",
                    fontSize: "13px", fontWeight: 500
                  }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

    </PersonalLayout>
  );
}

export default MiEquipo;