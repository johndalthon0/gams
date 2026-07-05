import { Link, useLocation, useNavigate } from "react-router-dom";

const adminLinks = [
  { to: "/admin/dashboard",    icon: "🏠", label: "Dashboard" },
  { to: "/admin/equipos",      icon: "💻", label: "Equipos" },
  { to: "/admin/empleados",    icon: "👥", label: "Empleados" },
  { to: "/admin/asignaciones", icon: "📦", label: "Asignaciones" },
  { to: "/admin/reparaciones", icon: "🛠", label: "Reparaciones" },
  { to: "/admin/bajas",        icon: "🗑", label: "Bajas" },
  { to: "/admin/catalogos",    icon: "⚙️", label: "Catálogos" },
  { to: "/admin/ia",           icon: "🤖", label: "IA Predictiva" },
  { to: "/admin/repuestos", icon: "🔩", label: "Repuestos" },
];

const adminSysLinks = [
  { to: "/admin/usuarios",      icon: "👤", label: "Usuarios" },
  { to: "/admin/configuracion", icon: "🔧", label: "Configuración" },
];

// ✅ Ruta propia del técnico
const empleadoLinks = [
  { to: "/empleado/reparaciones", icon: "🛠", label: "Reparaciones" },
];

function Sidebar({ open, onClose }) {

  const location = useLocation();
  const navigate  = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const rol  = user.rol;

  const mainLinks = rol === "EMPLEADO" ? empleadoLinks : adminLinks;
  const sysLinks  = rol === "EMPLEADO" ? [] : adminSysLinks;

  const isActive = (path) => location.pathname === path;

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const linkStyle = (path) => ({
    display: "flex",
    alignItems: "center",
    gap: "11px",
    padding: "10px 14px",
    borderRadius: "10px",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 500,
    marginBottom: "2px",
    color: isActive(path) ? "#fff" : "rgba(255,255,255,0.55)",
    background: isActive(path) ? "rgba(108,99,255,0.35)" : "transparent",
    borderLeft: isActive(path) ? "3px solid #6c63ff" : "3px solid transparent",
    transition: "all 0.15s",
  });

  return (
    <>
      <div
        className={`sidebar-overlay ${open ? "visible" : ""}`}
        onClick={onClose}
      />

      <div className={`sidebar ${open ? "open" : ""}`}>

        {/* LOGO */}
        <div style={{
          padding: "1.1rem 1.1rem 0.9rem",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex", alignItems: "center", gap: "10px"
        }}>
          <div style={{
            width: "36px", height: "36px",
            background: "linear-gradient(135deg,#6c63ff,#a78bfa)",
            borderRadius: "10px", display: "flex",
            alignItems: "center", justifyContent: "center",
            fontSize: "18px", flexShrink: 0
          }}>
            {rol === "EMPLEADO" ? "🔧" : "💼"}
          </div>
          <div>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: "15px", margin: 0 }}>
              GAMS TI
            </p>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px", margin: 0 }}>
              {rol === "EMPLEADO" ? "Portal Técnico" : "Panel Admin"}
            </p>
          </div>
        </div>

        {/* LINKS */}
        <div style={{ flex: 1, padding: "0.9rem 0.75rem", overflowY: "auto" }}>

          <p style={{
            color: "rgba(255,255,255,0.28)", fontSize: "10px",
            fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "1px", padding: "0 8px", marginBottom: "6px"
          }}>
            {rol === "EMPLEADO" ? "Mi trabajo" : "Gestión"}
          </p>

          {mainLinks.map(l => (
            <Link
              key={l.to}
              to={l.to}
              style={linkStyle(l.to)}
              onClick={onClose}
              onMouseEnter={e => {
                if (!isActive(l.to)) {
                  e.currentTarget.style.color = "#fff";
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                }
              }}
              onMouseLeave={e => {
                if (!isActive(l.to)) {
                  e.currentTarget.style.color = "rgba(255,255,255,0.55)";
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <span style={{ fontSize: "15px", flexShrink: 0 }}>{l.icon}</span>
              {l.label}
            </Link>
          ))}

          {sysLinks.length > 0 && (
            <>
              <div style={{
                borderTop: "1px solid rgba(255,255,255,0.08)",
                margin: "10px 0"
              }} />
              <p style={{
                color: "rgba(255,255,255,0.28)", fontSize: "10px",
                fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "1px", padding: "0 8px", marginBottom: "6px"
              }}>Sistema</p>

              {sysLinks.map(l => (
                <Link
                  key={l.to}
                  to={l.to}
                  style={linkStyle(l.to)}
                  onClick={onClose}
                  onMouseEnter={e => {
                    if (!isActive(l.to)) {
                      e.currentTarget.style.color = "#fff";
                      e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive(l.to)) {
                      e.currentTarget.style.color = "rgba(255,255,255,0.55)";
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <span style={{ fontSize: "15px", flexShrink: 0 }}>{l.icon}</span>
                  {l.label}
                </Link>
              ))}
            </>
          )}

        </div>

        {/* FOOTER */}
        <div style={{
          padding: "0.9rem 0.75rem",
          borderTop: "1px solid rgba(255,255,255,0.08)"
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            marginBottom: "10px", padding: "10px 12px",
            background: "rgba(255,255,255,0.05)", borderRadius: "10px"
          }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "50%",
              background: "linear-gradient(135deg,#6c63ff,#a78bfa)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "13px", fontWeight: 700, color: "#fff", flexShrink: 0
            }}>
              {user.nombre?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{
                color: "#fff", fontSize: "13px", fontWeight: 600,
                margin: 0, whiteSpace: "nowrap",
                overflow: "hidden", textOverflow: "ellipsis"
              }}>
                {user.nombre} {user.apellido || ""}
              </p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", margin: 0 }}>
                {rol === "EMPLEADO" ? "🔧 Técnico" : "🔑 Admin"}
              </p>
            </div>
          </div>

          <button onClick={logout} style={{
            width: "100%",
            background: "rgba(248,113,113,0.12)",
            border: "1px solid rgba(248,113,113,0.25)",
            color: "#f87171", borderRadius: "10px",
            padding: "9px", fontSize: "13px",
            fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
          }}>
            🚪 Cerrar sesión
          </button>
        </div>

      </div>
    </>
  );
}

export default Sidebar;