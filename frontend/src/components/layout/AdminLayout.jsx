import { useContext, useState } from "react";
import { ThemeContext } from "../../context/ThemeContext";
import Sidebar from "../ui/Sidebar";
import { useWindowSize } from "../../hooks/useWindowSize";

function AdminLayout({ children }) {

  const { theme, toggleTheme } = useContext(ThemeContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const width    = useWindowSize();           // ✅ tiempo real
  const isMobile = width <= 1024;
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: "var(--bg-page)",
      color: "var(--text-primary)"
    }}>

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div style={{
        flex: 1,
        marginLeft: isMobile ? 0 : "250px",  // ✅ React controla, no CSS
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        minWidth: 0,
        transition: "margin-left 0.25s"
      }}>

        {/* TOPBAR */}
        <div style={{
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
          gap: "12px"
        }}>

          {/* IZQUIERDA */}
          <div style={{ display:"flex", alignItems:"center", gap:"12px", minWidth:0 }}>

            {/* ✅ HAMBURGER — React decide si se muestra */}
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(p => !p)}
                aria-label="Abrir menú"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "5px",
                  background: "none",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  padding: "8px 10px",
                  cursor: "pointer",
                  flexShrink: 0
                }}
              >
                <span style={{ display:"block", width:"18px", height:"2px", background:"var(--text-primary)", borderRadius:"2px" }} />
                <span style={{ display:"block", width:"18px", height:"2px", background:"var(--text-primary)", borderRadius:"2px" }} />
                <span style={{ display:"block", width:"18px", height:"2px", background:"var(--text-primary)", borderRadius:"2px" }} />
              </button>
            )}

            <div style={{ minWidth: 0 }}>
              <p style={{
                fontWeight: 700,
                fontSize: isMobile ? "14px" : "15px",
                margin: 0,
                color: "var(--text-primary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}>
                {isMobile ? "GAMS TI" : "Sistema Inventario TI"}
              </p>
              {!isMobile && (
                <p style={{
                  color: "var(--text-secondary)",
                  fontSize: "12px", margin: 0
                }}>
                  Panel Administrativo
                </p>
              )}
            </div>

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
              onClick={toggleTheme}
              title="Cambiar tema"
              style={{
                width: "46px", height: "25px",
                borderRadius: "999px",
                background: theme === "dark" ? "#6c63ff" : "#c4c4c4",
                position: "relative",
                cursor: "pointer",
                transition: "background 0.25s",
                flexShrink: 0
              }}
            >
              <div style={{
                position: "absolute",
                top: "2.5px",
                left: theme === "dark" ? "23px" : "2.5px",
                width: "20px", height: "20px",
                background: "#fff",
                borderRadius: "50%",
                transition: "left 0.25s",
                boxShadow: "0 1px 4px rgba(0,0,0,0.25)"
              }} />
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
              {user.nombre?.charAt(0)?.toUpperCase() || "A"}
            </div>

          </div>

        </div>

        {/* CONTENT */}
        <div style={{ padding: "1.5rem", flex: 1 }}>
          {children}
        </div>

      </div>

    </div>
  );
}

export default AdminLayout;