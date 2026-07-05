import { useContext, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ThemeContext } from "../../context/ThemeContext";
import { useWindowSize } from "../../hooks/useWindowSize";

const links = [
  { to: "/personal/dashboard",      icon: "🏠", label: "Dashboard" },
  { to: "/personal/miequipo",       icon: "💻", label: "Mis Equipos" },
  { to: "/personal/solicitar",      icon: "🛠",  label: "Solicitar" },
  { to: "/personal/missolicitudes", icon: "📋", label: "Mis Solicitudes" }, // ← nuevo
  { to: "/personal/perfil",         icon: "👤", label: "Perfil" },
];

function PersonalLayout({ children }) {

  const { theme, toggleTheme } = useContext(ThemeContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const width    = useWindowSize();
  const isMobile = width <= 768;

  const isActive = (path) => location.pathname === path;
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <>
      {/* OVERLAY */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 299,
            backdropFilter: "blur(2px)"
          }}
        />
      )}

      {/* DRAWER MOBILE */}
      <div style={{
        position: "fixed",
        top: 0, left: 0,
        width: "250px",
        height: "100vh",
        background: "var(--bg-sidebar)",
        zIndex: 300,
        transform: menuOpen ? "translateX(0)" : "translateX(-250px)",
        transition: "transform 0.25s ease",
        display: "flex",
        flexDirection: "column"
      }}>

        <div style={{
          padding: "1.1rem",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex", alignItems: "center", gap: "10px"
        }}>
          <div style={{
            width: "36px", height: "36px",
            background: "linear-gradient(135deg,#6c63ff,#a78bfa)",
            borderRadius: "10px",
            display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "18px"
          }}>💼</div>
          <div>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: "15px", margin: 0 }}>
              Portal Personal
            </p>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px", margin: 0 }}>
              {user.nombre} {user.apellido}
            </p>
          </div>
        </div>

        <div style={{ flex: 1, padding: "0.9rem 0.75rem", overflowY: "auto" }}>
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMenuOpen(false)}
              style={{
                display: "flex", alignItems: "center",
                gap: "11px", padding: "11px 14px",
                borderRadius: "10px",
                textDecoration: "none",
                fontSize: "14px", fontWeight: 500,
                marginBottom: "3px",
                color: isActive(l.to) ? "#fff" : "rgba(255,255,255,0.6)",
                background: isActive(l.to)
                  ? "rgba(108,99,255,0.35)" : "transparent",
                borderLeft: isActive(l.to)
                  ? "3px solid #6c63ff" : "3px solid transparent",
                transition: "all 0.15s"
              }}
            >
              <span style={{ fontSize: "16px" }}>{l.icon}</span>
              {l.label}
            </Link>
          ))}
        </div>

        <div style={{
          padding: "0.9rem 0.75rem",
          borderTop: "1px solid rgba(255,255,255,0.08)"
        }}>
          <button onClick={logout} style={{
            width: "100%",
            background: "rgba(248,113,113,0.12)",
            border: "1px solid rgba(248,113,113,0.25)",
            color: "#f87171", borderRadius: "10px",
            padding: "10px", fontSize: "13px",
            fontWeight: 600, cursor: "pointer",
            fontFamily: "inherit"
          }}>
            🚪 Cerrar sesión
          </button>
        </div>

      </div>

      {/* PÁGINA */}
      <div style={{
        minHeight: "100vh",
        background: "var(--bg-page)",
        color: "var(--text-primary)",
        display: "flex",
        flexDirection: "column"
      }}>

        {/* TOPBAR STICKY */}
        <nav style={{
          background: "var(--topbar-bg)",
          borderBottom: "1px solid var(--topbar-border)",
          padding: "0 1.25rem",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0, zIndex: 100,
          boxShadow: "var(--shadow)",
          gap: "10px"
        }}>

          {/* IZQUIERDA */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>

            {/* HAMBURGER — solo mobile */}
            {isMobile ? (
              <button
                className="hamburger"
                style={{ display: "flex", flexShrink: 0 }}
                onClick={() => setMenuOpen(p => !p)}
                aria-label="Menú"
              >
                <span />
                <span />
                <span />
              </button>
            ) : (
              /* LINKS DESKTOP */
              <div style={{ display: "flex", gap: "4px" }}>
                {links.map(l => (
                  <Link key={l.to} to={l.to} style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontSize: "14px", fontWeight: 500,
                    color: isActive(l.to)
                      ? "var(--accent-text)"
                      : "var(--text-secondary)",
                    background: isActive(l.to)
                      ? "var(--accent-light)" : "transparent",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s"
                  }}>
                    {l.icon} {l.label}
                  </Link>
                ))}
              </div>
            )}

          </div>

          {/* DERECHA */}
          <div style={{
            display: "flex", alignItems: "center",
            gap: "10px", flexShrink: 0
          }}>

            <span style={{ fontSize: "16px" }}>
              {theme === "dark" ? "🌙" : "☀️"}
            </span>

            {/* TOGGLE */}
            <div
              className="theme-toggle"
              onClick={toggleTheme}
              title="Cambiar tema"
              style={{
                background: theme === "dark" ? "#6c63ff" : "#c4c4c4"
              }}
            >
              <div
                className="theme-toggle-thumb"
                style={{ left: theme === "dark" ? "23px" : "2.5px" }}
              />
            </div>

            {/* AVATAR */}
            <div style={{
              width: "34px", height: "34px",
              borderRadius: "50%",
              background: "linear-gradient(135deg,#6c63ff,#a78bfa)",
              display: "flex", alignItems: "center",
              justifyContent: "center",
              fontSize: "13px", fontWeight: 700,
              color: "#fff", flexShrink: 0
            }}>
              {user.nombre?.charAt(0)?.toUpperCase() || "U"}
            </div>

            {/* SALIR solo desktop */}
            {!isMobile && (
              <button onClick={logout} style={{
                background: "var(--danger-bg)",
                border: "1px solid var(--danger)",
                color: "var(--danger)",
                borderRadius: "8px",
                padding: "7px 14px",
                fontSize: "13px",
                cursor: "pointer",
                fontWeight: 500,
                fontFamily: "inherit",
                whiteSpace: "nowrap"
              }}>
                Salir
              </button>
            )}

          </div>

        </nav>

        {/* CONTENIDO */}
        <div style={{
          maxWidth: "1100px",
          width: "100%",
          margin: "0 auto",
          padding: "1.5rem 1.25rem",
          flex: 1
        }}>
          {children}
        </div>

      </div>
    </>
  );
}

export default PersonalLayout;