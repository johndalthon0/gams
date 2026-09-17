import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiBell, FiSettings, FiCheck, FiSend } from "react-icons/fi";
import { usePush } from "../../hooks/usePush";
import api from "../../services/api";
import { getTipo, fmtRelativo } from "../../utils/notificaciones";

// Campana estilo Facebook: feed de notificaciones reales en el panel,
// con la configuración de push (y el aviso masivo de admin) detrás del
// icono de engranaje, sin perder esa funcionalidad.
export default function BotonPush() {
  const { estado, ocupado, activar, desactivar, probar } = usePush();
  const [abierto, setAbierto] = useState(false);
  const [vista, setVista] = useState("notifs"); // "notifs" | "config"
  const [notifs, setNotifs] = useState([]);
  const [cargando, setCargando] = useState(true);
  const ref = useRef(null);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const esAdmin = user.rol === "ADMIN";
  const rutaTodas = esAdmin ? "/admin/notificaciones" : "/personal/notificaciones";

  const cargarNotifs = useCallback(async () => {
    try {
      const r = await api.get("/mantenimientos/notificaciones");
      setNotifs(Array.isArray(r.data) ? r.data : []);
    } catch {
      // silencioso: la campana no debe romper el layout si falla
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarNotifs();
    const t = setInterval(cargarNotifs, 30000);
    return () => clearInterval(t);
  }, [cargarNotifs]);

  useEffect(() => {
    const fuera = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false); };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("touchstart", fuera);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("touchstart", fuera);
    };
  }, []);

  const noLeidas = notifs.filter((n) => !n.leida).length;

  const leer = async (id) => {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, leida: 1 } : n)));
    try { await api.put(`/mantenimientos/notificaciones/${id}/leer`); } catch {}
  };

  const leerTodas = async () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, leida: 1 })));
    try { await api.put("/mantenimientos/notificaciones/leer-todas"); } catch {}
  };

  const verTodas = () => {
    setAbierto(false);
    navigate(rutaTodas);
  };

  const pushSoportado = estado !== "cargando" && estado !== "no-soportado";
  const activo = estado === "activo";
  const colorPush = activo ? "#22c55e" : estado === "denegado" ? "#ef4444" : "var(--text-secondary)";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => { setAbierto((v) => !v); setVista("notifs"); }}
        title="Notificaciones"
        style={{
          position: "relative",
          background: abierto ? "var(--bg-surface2)" : "none",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          padding: "7px 9px",
          cursor: "pointer",
          lineHeight: 1,
          color: "var(--text-primary)",
          display: "flex",
        }}
      >
        <FiBell size={17} />
        {noLeidas > 0 && (
          <span style={{
            position: "absolute", top: "-5px", right: "-5px",
            minWidth: "17px", height: "17px", padding: "0 4px",
            borderRadius: "999px", background: "#ef4444", color: "#fff",
            fontSize: "10px", fontWeight: 700, lineHeight: "17px", textAlign: "center",
            border: "2px solid var(--topbar-bg, var(--bg-surface))",
          }}>
            {noLeidas > 99 ? "99+" : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div style={{
          position: "fixed", right: "10px", left: "auto", top: "68px", zIndex: 200,
          width: "min(360px, calc(100vw - 20px))",
          maxHeight: "calc(100vh - 84px)", display: "flex", flexDirection: "column",
          background: "var(--bg-surface)", border: "1px solid var(--border)",
          borderRadius: "14px", boxShadow: "0 16px 40px rgba(0,0,0,0.28)", overflow: "hidden",
        }}>
          {/* ── Header ── */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 14px", borderBottom: "1px solid var(--border)", flexShrink: 0,
          }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "15px", color: "var(--text-primary)" }}>
              {vista === "notifs" ? "Notificaciones" : "Notificaciones push"}
            </p>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              {vista === "notifs" && noLeidas > 0 && (
                <button onClick={leerTodas} title="Marcar todas como leídas" style={iconBtn()}>
                  <FiCheck size={15} />
                </button>
              )}
              {pushSoportado && (
                <button
                  onClick={() => setVista((v) => (v === "notifs" ? "config" : "notifs"))}
                  title="Configurar notificaciones push"
                  style={iconBtn(vista === "config")}
                >
                  <FiSettings size={15} />
                </button>
              )}
            </div>
          </div>

          {/* ── Vista: feed de notificaciones ── */}
          {vista === "notifs" && (
            <>
              <div style={{ overflowY: "auto", flex: 1 }}>
                {cargando ? (
                  <p style={{ padding: "24px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px", margin: 0 }}>
                    Cargando…
                  </p>
                ) : notifs.length === 0 ? (
                  <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-muted)" }}>
                    <FiBell size={28} style={{ opacity: 0.4, marginBottom: "8px" }} />
                    <p style={{ margin: 0, fontSize: "13px" }}>Sin notificaciones</p>
                  </div>
                ) : (
                  notifs.slice(0, 8).map((n) => {
                    const cfg = getTipo(n.tipo);
                    return (
                      <div
                        key={n.id}
                        onClick={() => !n.leida && leer(n.id)}
                        style={{
                          display: "flex", gap: "10px", padding: "11px 14px",
                          borderBottom: "1px solid var(--border)",
                          background: n.leida ? "transparent" : "var(--accent-light)",
                          cursor: n.leida ? "default" : "pointer",
                        }}
                      >
                        <span style={{
                          width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0,
                          background: cfg.bg, border: `1px solid ${cfg.color}`,
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px",
                        }}>
                          {cfg.icon}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            margin: 0, fontSize: "13px", lineHeight: 1.35,
                            color: "var(--text-primary)", fontWeight: n.leida ? 500 : 700,
                          }}>
                            {n.titulo}
                          </p>
                          <p style={{
                            margin: "2px 0 0", fontSize: "12px", lineHeight: 1.35,
                            color: "var(--text-secondary)",
                            overflow: "hidden", textOverflow: "ellipsis",
                            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                          }}>
                            {n.mensaje}
                          </p>
                          <p style={{ margin: "4px 0 0", fontSize: "11px", color: cfg.color, fontWeight: 600 }}>
                            {fmtRelativo(n.fecha)}
                          </p>
                        </div>
                        {!n.leida && (
                          <span style={{
                            width: "9px", height: "9px", borderRadius: "50%",
                            background: "var(--accent)", flexShrink: 0, marginTop: "4px",
                          }} />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              <button onClick={verTodas} style={{
                flexShrink: 0, width: "100%", background: "var(--bg-surface2)",
                border: "none", borderTop: "1px solid var(--border)",
                color: "var(--accent-text)", fontWeight: 600, fontSize: "13px",
                padding: "11px", cursor: "pointer", fontFamily: "inherit",
              }}>
                Ver todas las notificaciones
              </button>
            </>
          )}

          {/* ── Vista: configuración de push ── */}
          {vista === "config" && (
            <div style={{ padding: "14px", overflowY: "auto" }}>
              <p style={{ margin: "0 0 12px", fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                {activo
                  ? "Recibes avisos aunque la app esté cerrada."
                  : estado === "denegado"
                  ? "Bloqueadas en el navegador. Actívalas desde la configuración del sitio."
                  : "Actívalas para recibir avisos de mantenimientos y solicitudes."}
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: colorPush }} />
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  {activo ? "Activadas en este dispositivo" : estado === "denegado" ? "Bloqueadas" : "Desactivadas"}
                </span>
              </div>

              {estado === "inactivo" && (
                <button onClick={activar} disabled={ocupado} style={btn("var(--accent)", "#fff")}>
                  {ocupado ? "Activando…" : "Activar en este dispositivo"}
                </button>
              )}

              {activo && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={probar} style={{ ...btn("var(--bg-surface2)", "var(--text-primary)"), flex: 1, border: "1px solid var(--border)" }}>
                    Probar
                  </button>
                  <button onClick={desactivar} disabled={ocupado} style={{ ...btn("rgba(239,68,68,0.1)", "#ef4444"), flex: 1, border: "1px solid rgba(239,68,68,0.35)" }}>
                    Desactivar
                  </button>
                </div>
              )}

              {esAdmin && (
                <button
                  onClick={() => { setAbierto(false); navigate("/admin/notificaciones?tab=enviar"); }}
                  style={{
                    ...btn("var(--bg-surface2)", "var(--accent-text)"),
                    border: "1px solid var(--border)", marginTop: "14px",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  }}
                >
                  <FiSend size={13} /> Enviar aviso al personal
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const btn = (bg, color) => ({
  width: "100%", background: bg, color, border: "none", borderRadius: "8px",
  padding: "8px 12px", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
});

const iconBtn = (active = false) => ({
  background: active ? "var(--accent-light)" : "none",
  border: "1px solid var(--border)",
  color: active ? "var(--accent-text)" : "var(--text-secondary)",
  borderRadius: "8px", padding: "6px 7px", cursor: "pointer", display: "flex",
});
