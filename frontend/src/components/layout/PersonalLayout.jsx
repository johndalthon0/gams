import { Link, useLocation, useNavigate } from "react-router-dom";
import ToastNotificaciones from "../ui/ToastNotificaciones";
import BotonPush from "../ui/BotonPush";

const NAV_LINKS = [
  { to: "/personal/dashboard",       icon: "🏠", label: "Dashboard"       },
  { to: "/personal/mi-equipo",       icon: "💻", label: "Mis Equipos"     },
  { to: "/personal/solicitar",       icon: "🛠️", label: "Solicitar"       },
  { to: "/personal/mis-solicitudes", icon: "📋", label: "Mis Solicitudes" },
  { to: "/personal/notificaciones",  icon: "🔔", label: "Notificaciones"  },
  { to: "/personal/perfil",          icon: "👤", label: "Perfil"          },
];

export default function PersonalLayout({ children }) {
  const location = useLocation();
  const navigate  = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const isActive = (path) => location.pathname === path;

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div style={{
      minHeight:   "100vh",
      background:  "var(--bg-main, #0f0f1a)",
      display:     "flex",
      flexDirection:"column",
    }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        background:   "var(--bg-surface, #1a1a2e)",
        borderBottom: "1px solid var(--border, rgba(255,255,255,0.08))",
        padding:      "0 1.5rem",
        display:      "flex",
        alignItems:   "center",
        gap:          "4px",
        height:       "60px",
        position:     "sticky",
        top:          0,
        zIndex:       100,
        flexWrap:     "wrap",
      }}>

        {/* Links */}
        <div style={{ display:"flex", alignItems:"center", gap:"2px", flex:1, overflowX:"auto", padding:"4px 0" }}>
          {NAV_LINKS.map(l => (
            <Link
              key={l.to}
              to={l.to}
              style={{
                display:        "flex",
                alignItems:     "center",
                gap:            "6px",
                padding:        "7px 14px",
                borderRadius:   "10px",
                textDecoration: "none",
                fontSize:       "13px",
                fontWeight:     600,
                whiteSpace:     "nowrap",
                color:          isActive(l.to) ? "#fff" : "rgba(255,255,255,0.55)",
                background:     isActive(l.to) ? "var(--accent, #6c63ff)" : "transparent",
                border:         isActive(l.to) ? "none" : "1px solid transparent",
                transition:     "all 0.15s",
              }}
            >
              <span style={{ fontSize:"15px" }}>{l.icon}</span>
              {l.label}
            </Link>
          ))}
        </div>

        {/* Usuario + cerrar sesión */}
        <div style={{ display:"flex", alignItems:"center", gap:"10px", flexShrink:0 }}>

          <BotonPush />

          {/* Dark mode toggle — si tienes el contexto */}
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

          <button
            onClick={logout}
            style={{
              background:   "rgba(239,68,68,0.12)",
              border:       "1px solid rgba(239,68,68,0.3)",
              color:        "#f87171",
              borderRadius: "10px",
              padding:      "6px 14px",
              fontSize:     "13px",
              fontWeight:   600,
              cursor:       "pointer",
              fontFamily:   "inherit",
            }}
          >
            Salir
          </button>
        </div>
      </nav>

      {/* ── CONTENIDO ── */}
      <main style={{
        flex:    1,
        padding: "1.75rem 1.5rem",
        maxWidth:"1200px",
        width:   "100%",
        margin:  "0 auto",
      }}>
        {children}
      </main>

      {/* ── TOAST NOTIFICACIONES ── */}
      <ToastNotificaciones />

    </div>
  );
}