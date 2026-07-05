import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../../context/ThemeContext";
import api from "../../services/api";

function EmpleadoDashboard() {

  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const [mantenimientos, setMantenimientos] = useState([]);
  const [solicitudes,    setSolicitudes]    = useState([]);
  const [stats, setStats] = useState({
    total: 0, enProceso: 0, finalizados: 0, pendientes: 0
  });

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [man, sol] = await Promise.all([
        api.get("/mantenimientos"),
        api.get("/mantenimientos/solicitudes")
      ]);
      const m = Array.isArray(man.data) ? man.data : [];
      const s = Array.isArray(sol.data) ? sol.data : [];
      setMantenimientos(m);
      setSolicitudes(s);
      setStats({
        total:       m.length,
        enProceso:   m.filter(x => x.estado === "EN_PROCESO").length,
        finalizados: m.filter(x => x.estado === "FINALIZADO").length,
        pendientes:  s.filter(x => x.estado === "PENDIENTE").length,
      });
    } catch (e) {
      console.log(e);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString("es-BO") : "—";

  const Badge = ({ estado }) => {
    const map = {
      PENDIENTE:  { bg: "var(--warning-bg)",  c: "var(--warning)",  b: "var(--warning)" },
      EN_PROCESO: { bg: "var(--accent-light)", c: "var(--accent-text)", b: "var(--accent)" },
      FINALIZADO: { bg: "var(--success-bg)",  c: "var(--success)",  b: "var(--success)" },
    };
    const s = map[estado] || map.PENDIENTE;
    return (
      <span style={{
        background: s.bg, color: s.c,
        border: `1px solid ${s.b}`,
        borderRadius: "6px", padding: "3px 10px",
        fontSize: "12px", fontWeight: 600
      }}>{estado}</span>
    );
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-page)",
      color: "var(--text-primary)"
    }}>

      {/* TOPBAR */}
      <nav style={{
        background: "var(--topbar-bg)",
        borderBottom: "1px solid var(--topbar-border)",
        padding: "0 1.5rem",
        height: "60px",
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
        boxShadow: "var(--shadow)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "34px", height: "34px",
            background: "linear-gradient(135deg,#6c63ff,#a78bfa)",
            borderRadius: "10px", display: "flex",
            alignItems: "center", justifyContent: "center",
            fontSize: "16px"
          }}>🔧</div>
          <div>
            <p style={{ fontWeight: 700, fontSize: "15px", margin: 0, color: "var(--text-primary)" }}>
              Portal Técnico
            </p>
            <p style={{ color: "var(--text-secondary)", fontSize: "11px", margin: 0 }}>
              GAM — Sistema de Mantenimiento TI
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* TOGGLE TEMA */}
          <span style={{ fontSize: "16px" }}>{theme === "dark" ? "🌙" : "☀️"}</span>
          <div
            onClick={toggleTheme}
            style={{
              width: "46px", height: "25px",
              borderRadius: "999px",
              background: theme === "dark" ? "#6c63ff" : "#c4c4c4",
              position: "relative", cursor: "pointer",
              transition: "background 0.25s"
            }}
          >
            <div style={{
              position: "absolute", top: "2.5px",
              left: theme === "dark" ? "23px" : "2.5px",
              width: "20px", height: "20px",
              background: "#fff", borderRadius: "50%",
              transition: "left 0.25s",
              boxShadow: "0 1px 4px rgba(0,0,0,0.25)"
            }} />
          </div>

          {/* AVATAR */}
          <div style={{
            width: "34px", height: "34px", borderRadius: "50%",
            background: "linear-gradient(135deg,#6c63ff,#a78bfa)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "13px", fontWeight: 700, color: "#fff"
          }}>
            {user.nombre?.charAt(0)?.toUpperCase() || "T"}
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 600 }}>
              {user.nombre} {user.apellido || ""}
            </span>
            <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>Técnico</span>
          </div>

          <button onClick={logout} style={{
            background: "var(--danger-bg)",
            border: "1px solid var(--danger)",
            color: "var(--danger)", borderRadius: "8px",
            padding: "7px 14px", fontSize: "13px",
            cursor: "pointer", fontWeight: 500,
            fontFamily: "inherit"
          }}>
            Salir
          </button>
        </div>
      </nav>

      {/* CONTENIDO */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1.25rem" }}>

        {/* BIENVENIDA */}
        <div style={{ marginBottom: "2rem" }}>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: 0 }}>
            Bienvenido de vuelta
          </p>
          <h1 style={{
            fontSize: "28px", fontWeight: 700,
            margin: "4px 0 0", color: "var(--text-primary)"
          }}>
            {user.nombre} {user.apellido || ""}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: "4px 0 0" }}>
            🔧 Técnico de Sistemas — GAM
          </p>
        </div>

        {/* STATS */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "16px", marginBottom: "2rem"
        }}>
          {[
            { l: "Total mantenimientos", v: stats.total,       icon: "🔧", c: "var(--accent-text)",  bg: "var(--accent-light)" },
            { l: "En proceso",           v: stats.enProceso,   icon: "⚙️", c: "var(--warning)",      bg: "var(--warning-bg)" },
            { l: "Finalizados",          v: stats.finalizados, icon: "✅", c: "var(--success)",       bg: "var(--success-bg)" },
            { l: "Solicitudes pendientes",v: stats.pendientes, icon: "📋", c: "var(--danger)",        bg: "var(--danger-bg)" },
          ].map((s, i) => (
            <div key={i} style={{
              background: "var(--bg-surface)", border: "1px solid var(--border)",
              borderRadius: "16px", padding: "1.25rem",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <div>
                <p style={{ color: "var(--text-secondary)", fontSize: "12px", margin: "0 0 4px" }}>{s.l}</p>
                <p style={{ color: s.c, fontSize: "26px", fontWeight: 700, margin: 0 }}>{s.v}</p>
              </div>
              <div style={{
                width: "44px", height: "44px", background: s.bg,
                borderRadius: "12px", display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: "20px"
              }}>{s.icon}</div>
            </div>
          ))}
        </div>

        {/* SOLICITUDES PENDIENTES */}
        <div style={{
          background: "var(--bg-surface)", border: "1px solid var(--border)",
          borderRadius: "16px", overflow: "hidden", marginBottom: "1.5rem"
        }}>
          <div style={{
            padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)",
            display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <h5 style={{ fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>
              📋 Solicitudes Pendientes
            </h5>
            <span style={{
              background: "var(--danger-bg)", color: "var(--danger)",
              border: "1px solid var(--danger)", borderRadius: "6px",
              padding: "2px 10px", fontSize: "12px", fontWeight: 600
            }}>
              {stats.pendientes} pendientes
            </span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ background: "var(--table-header)", borderBottom: "1px solid var(--border)" }}>
                  {["#","Usuario","Equipo","Descripción","Prioridad","Fecha"].map(h => (
                    <th key={h} style={{
                      padding: "10px 14px", textAlign: "left",
                      color: "var(--text-secondary)", fontWeight: 500,
                      fontSize: "12px", textTransform: "uppercase"
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {solicitudes.filter(s => s.estado === "PENDIENTE").length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-secondary)" }}>
                      ✅ No hay solicitudes pendientes
                    </td>
                  </tr>
                ) : solicitudes.filter(s => s.estado === "PENDIENTE").map(s => (
                  <tr key={s.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 14px", color: "var(--text-muted)", fontSize: "12px" }}>#{s.id}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <p style={{ margin: 0, color: "var(--text-primary)", fontWeight: 500 }}>
                        {s.usuario_nombre} {s.usuario_apellido}
                      </p>
                      <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "11px" }}>
                        {s.area || ""} {s.cargo ? `— ${s.cargo}` : ""}
                      </p>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <p style={{ margin: 0, color: "var(--accent-text)", fontWeight: 600, fontSize: "13px" }}>
                        {s.equipo_codigo}
                      </p>
                      <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "11px" }}>
                        {s.equipo_nombre}
                      </p>
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--text-secondary)", fontSize: "13px", maxWidth: "200px" }}>
                      {s.descripcion}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{
                        color: s.prioridad === "ALTA" ? "var(--danger)"
                             : s.prioridad === "MEDIA" ? "var(--warning)"
                             : "var(--success)",
                        fontWeight: 600, fontSize: "13px"
                      }}>
                        {s.prioridad === "ALTA" ? "🔴" : s.prioridad === "MEDIA" ? "🟡" : "🟢"} {s.prioridad}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--text-muted)", fontSize: "12px" }}>
                      {fmt(s.fecha_solicitud)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ÚLTIMOS MANTENIMIENTOS */}
        <div style={{
          background: "var(--bg-surface)", border: "1px solid var(--border)",
          borderRadius: "16px", overflow: "hidden"
        }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
            <h5 style={{ fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>
              🔧 Últimos Mantenimientos
            </h5>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ background: "var(--table-header)", borderBottom: "1px solid var(--border)" }}>
                  {["#","Equipo","Tipo","Técnico","Inicio","Estado"].map(h => (
                    <th key={h} style={{
                      padding: "10px 14px", textAlign: "left",
                      color: "var(--text-secondary)", fontWeight: 500,
                      fontSize: "12px", textTransform: "uppercase"
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mantenimientos.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-secondary)" }}>
                      Sin mantenimientos registrados
                    </td>
                  </tr>
                ) : mantenimientos.slice(0, 8).map(m => (
                  <tr key={m.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 14px", color: "var(--text-muted)", fontSize: "12px" }}>#{m.id}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <p style={{ margin: 0, color: "var(--accent-text)", fontWeight: 600, fontSize: "13px" }}>
                        {m.equipo_codigo}
                      </p>
                      <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "11px" }}>
                        {m.equipo_nombre}
                      </p>
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--text-secondary)", fontSize: "13px" }}>
                      {m.tipo || "—"}
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--text-secondary)", fontSize: "13px" }}>
                      {m.tecnico || "—"}
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--text-muted)", fontSize: "12px" }}>
                      {fmt(m.fecha_inicio)}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <Badge estado={m.estado} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

export default EmpleadoDashboard;