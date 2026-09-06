import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

// ── Links por rol ──────────────────────────────────────────────────────────
const adminLinks = [
  { to: "/admin/dashboard",    icon: "🏠", label: "Dashboard" },
  { to: "/admin/equipos",      icon: "💻", label: "Equipos" },
  { to: "/admin/empleados",    icon: "👥", label: "Empleados" },
  { to: "/admin/asignaciones", icon: "📦", label: "Asignaciones" },
  { to: "/admin/reparaciones", icon: "🛠️", label: "Reparaciones" },
  { to: "/admin/bajas",        icon: "🗑️", label: "Bajas" },
  { to: "/admin/catalogos",    icon: "📋", label: "Catálogos" },
];

const adminInventarioLinks = [
  { to: "/admin/inventario", icon: "📦", label: "Inventario" },
  { to: "/admin/compras",    icon: "🛒", label: "Compras" },
];

const adminIALinks = [
  { to: "/admin/ia", icon: "🤖", label: "IA Predictiva" },
];

const adminSysLinks = [
  { to: "/admin/usuarios",      icon: "👤", label: "Usuarios" },
  { to: "/admin/configuracion", icon: "⚙️", label: "Configuración" },
];

const empleadoLinks = [
  { to: "/empleado/reparaciones", icon: "🛠️", label: "Mis Reparaciones" },
];

const personalLinks = [
  { to: "/personal/dashboard",     icon: "🏠", label: "Dashboard" },
  { to: "/personal/mi-equipo",     icon: "💻", label: "Mis Equipos" },
  { to: "/personal/mis-solicitudes",icon: "📋", label: "Mis Solicitudes" },
  { to: "/personal/solicitar",     icon: "🛠️", label: "Solicitar Mant." },
  { to: "/personal/notificaciones",icon: "🔔", label: "Notificaciones" },
  { to: "/personal/perfil",        icon: "👤", label: "Mi Perfil" },
];

// ── Componente ─────────────────────────────────────────────────────────────
function Sidebar({ open, onClose }) {
  const location = useLocation();
  const navigate  = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const rol  = user.rol;
  const [sistema, setSistema] = useState(() => {
    try { return JSON.parse(localStorage.getItem("gam_sistema_config") || "{}"); } catch { return {}; }
  });

  useEffect(() => {
    const actualizar = () => {
      try { setSistema(JSON.parse(localStorage.getItem("gam_sistema_config") || "{}")); } catch {}
    };
    window.addEventListener("gams-sistema-actualizado", actualizar);
    return () => window.removeEventListener("gams-sistema-actualizado", actualizar);
  }, []);

  const isActive = (path) => location.pathname === path;

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const linkStyle = (path) => ({
    display:        "flex",
    alignItems:     "center",
    gap:            "11px",
    padding:        "10px 14px",
    borderRadius:   "10px",
    textDecoration: "none",
    fontSize:       "14px",
    fontWeight:     500,
    marginBottom:   "2px",
    color:          isActive(path) ? "#fff" : "rgba(255,255,255,0.92)",
    background:     isActive(path) ? "rgba(108,99,255,0.72)" : "transparent",
    borderLeft:     isActive(path) ? "3px solid #a78bfa" : "3px solid transparent",
    transition:     "all 0.15s",
  });

  const hoverOn = (e, path) => {
    if (!isActive(path)) {
      e.currentTarget.style.color      = "#fff";
      e.currentTarget.style.background = "rgba(255,255,255,0.06)";
    }
  };
  const hoverOff = (e, path) => {
    if (!isActive(path)) {
      e.currentTarget.style.color      = "rgba(255,255,255,0.92)";
      e.currentTarget.style.background = "transparent";
    }
  };

  const NavLink = ({ to, icon, label }) => (
    <Link
      to={to}
      style={linkStyle(to)}
      onClick={onClose}
      onMouseEnter={e => hoverOn(e, to)}
      onMouseLeave={e => hoverOff(e, to)}
    >
      <span style={{ fontSize: "15px", flexShrink: 0 }}>{icon}</span>
      {label}
    </Link>
  );

  const SectionLabel = ({ label }) => (
    <p style={{
      color:          "rgba(255,255,255,0.72)",
      fontSize:       "10px",
      fontWeight:     700,
      textTransform:  "uppercase",
      letterSpacing:  "1px",
      padding:        "0 8px",
      marginBottom:   "6px",
      marginTop:      "10px",
    }}>
      {label}
    </p>
  );

  const Divider = () => (
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.16)", margin: "10px 0" }} />
  );

  // Determinar qué menú mostrar
  const isAdmin    = rol === "ADMIN";
  const isEmpleado = rol === "EMPLEADO";
  const isPersonal = rol === "PERSONAL";

  return (
    <>
      {/* Overlay móvil */}
      <div
        className={`sidebar-overlay ${open ? "visible" : ""}`}
        onClick={onClose}
      />

      <div className={`sidebar ${open ? "open" : ""}`}>

        {/* ── LOGO ── */}
        <div style={{
          padding:      "1.1rem 1.1rem 0.9rem",
          borderBottom: "1px solid rgba(255,255,255,0.16)",
          display:      "flex",
          alignItems:   "center",
          gap:          "10px",
        }}>
          <div style={{
            width:          "36px",
            height:         "36px",
            background:     "linear-gradient(135deg,#6c63ff,#a78bfa)",
            borderRadius:   "10px",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            fontSize:       "18px",
            flexShrink:     0,
          }}>
            {sistema.logo_data ? <img src={sistema.logo_data} alt="Logo institucional" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "10px" }} /> : (sistema.logo_texto || (isEmpleado ? "🔧" : isPersonal ? "👤" : "💼"))}
          </div>
          <div>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: "15px", margin: 0 }}>
              {sistema.nombre_institucion || "GAMS TI"}
            </p>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px", margin: 0 }}>
              {sistema.nombre_sistema || (isEmpleado ? "Portal Técnico" : isPersonal ? "Portal Personal" : "Panel Admin")}
            </p>
          </div>
        </div>

        {/* ── LINKS ── */}
        <div style={{ flex: 1, padding: "0.9rem 0.75rem", overflowY: "auto" }}>

          {/* ── ADMIN ── */}
          {isAdmin && (
            <>
              <SectionLabel label="Gestión" />
              {adminLinks.map(l => <NavLink key={l.to} {...l} />)}

              <Divider />
              <SectionLabel label="Inventario" />
              {adminInventarioLinks.map(l => <NavLink key={l.to} {...l} />)}

              <Divider />
              <SectionLabel label="Inteligencia" />
              {adminIALinks.map(l => <NavLink key={l.to} {...l} />)}

              <Divider />
              <SectionLabel label="Sistema" />
              {adminSysLinks.map(l => <NavLink key={l.to} {...l} />)}
            </>
          )}

          {/* ── EMPLEADO / TÉCNICO ── */}
          {isEmpleado && (
            <>
              <SectionLabel label="Mi trabajo" />
              {empleadoLinks.map(l => <NavLink key={l.to} {...l} />)}
            </>
          )}

          {/* ── PERSONAL ── */}
          {isPersonal && (
            <>
              <SectionLabel label="Mi portal" />
              {personalLinks.map(l => <NavLink key={l.to} {...l} />)}
            </>
          )}

        </div>

        {/* ── FOOTER usuario ── */}
        <div style={{
          padding:    "0.9rem 0.75rem",
          borderTop:  "1px solid rgba(255,255,255,0.08)",
        }}>
          <div style={{
            display:       "flex",
            alignItems:    "center",
            gap:           "10px",
            marginBottom:  "10px",
            padding:       "10px 12px",
            background:    "rgba(255,255,255,0.05)",
            borderRadius:  "10px",
          }}>
            <div style={{
              width:          "32px",
              height:         "32px",
              borderRadius:   "50%",
              background:     "linear-gradient(135deg,#6c63ff,#a78bfa)",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              fontSize:       "13px",
              fontWeight:     700,
              color:          "#fff",
              flexShrink:     0,
            }}>
              {user.nombre?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{
                color:         "#fff",
                fontSize:      "13px",
                fontWeight:    600,
                margin:        0,
                whiteSpace:    "nowrap",
                overflow:      "hidden",
                textOverflow:  "ellipsis",
              }}>
                {user.nombre} {user.apellido || ""}
              </p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", margin: 0 }}>
                {isEmpleado ? "🔧 Técnico" : isPersonal ? "👤 Personal" : "🔑 Admin"}
              </p>
            </div>
          </div>

          <button onClick={logout} style={{
            width:        "100%",
            background:   "rgba(248,113,113,0.12)",
            border:       "1px solid rgba(248,113,113,0.25)",
            color:        "#f87171",
            borderRadius: "10px",
            padding:      "9px",
            fontSize:     "13px",
            fontWeight:   600,
            cursor:       "pointer",
            fontFamily:   "inherit",
          }}>
            🚪 Cerrar sesión
          </button>
        </div>

      </div>
    </>
  );
}

export default Sidebar;