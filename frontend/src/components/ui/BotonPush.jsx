import { useEffect, useRef, useState } from "react";
import { usePush } from "../../hooks/usePush";
import api from "../../services/api";

// Control de notificaciones push: campana en la barra superior con panel desplegable.
// Para ADMIN incluye además el envío de avisos a todo el personal.
export default function BotonPush() {
  const { estado, ocupado, activar, desactivar, probar } = usePush();
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const esAdmin = user.rol === "ADMIN";

  useEffect(() => {
    const fuera = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false); };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("touchstart", fuera);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("touchstart", fuera);
    };
  }, []);

  if (estado === "cargando" || estado === "no-soportado") return null;

  const activo = estado === "activo";
  const color = activo ? "#22c55e" : estado === "denegado" ? "#ef4444" : "var(--text-secondary)";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setAbierto((v) => !v)}
        title="Notificaciones push"
        style={{
          position: "relative",
          background: abierto ? "var(--bg-surface2)" : "none",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          padding: "6px 9px",
          cursor: "pointer",
          fontSize: "16px",
          lineHeight: 1,
          color: "var(--text-primary)",
        }}
      >
        🔔
        <span style={{
          position: "absolute", bottom: "4px", right: "4px",
          width: "8px", height: "8px", borderRadius: "50%",
          background: color, border: "2px solid var(--topbar-bg, var(--bg-surface))",
        }}/>
      </button>

      {abierto && (
        <div style={{
          position: "fixed", right: "10px", left: "auto", top: "68px", zIndex: 200,
          width: "min(320px, calc(100vw - 20px))",
          maxHeight: "calc(100vh - 84px)", overflowY: "auto",
          background: "var(--bg-surface)", border: "1px solid var(--border)",
          borderRadius: "14px", boxShadow: "0 16px 40px rgba(0,0,0,0.28)", padding: "16px",
        }}>
          <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "13px", color: "var(--text-primary)" }}>
            Notificaciones push
          </p>
          <p style={{ margin: "0 0 12px", fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            {activo
              ? "Recibes avisos aunque la app esté cerrada."
              : estado === "denegado"
              ? "Bloqueadas en el navegador. Actívalas desde la configuración del sitio."
              : "Actívalas para recibir avisos de mantenimientos y solicitudes."}
          </p>

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

          {esAdmin && <Broadcast />}
        </div>
      )}
    </div>
  );
}

function Broadcast() {
  const [titulo, setTitulo] = useState("");
  const [cuerpo, setCuerpo] = useState("");
  const [destino, setDestino] = useState("TODOS");
  const [envio, setEnvio] = useState({ estado: "", texto: "" });
  const [busy, setBusy] = useState(false);

  const enviar = async () => {
    if (!titulo.trim() || !cuerpo.trim()) {
      setEnvio({ estado: "error", texto: "Completa título y mensaje" });
      return;
    }
    setBusy(true);
    setEnvio({ estado: "", texto: "" });
    try {
      const r = await api.post("/push/broadcast", { titulo, cuerpo, destino, url: "/personal/notificaciones" });
      setEnvio({ estado: "ok", texto: r.data.message || "Enviado" });
      setTitulo(""); setCuerpo("");
    } catch (e) {
      setEnvio({ estado: "error", texto: e.response?.data?.message || "Error al enviar" });
    } finally {
      setBusy(false);
    }
  };

  const inp = {
    width: "100%", background: "var(--bg-surface2)", border: "1px solid var(--border)",
    borderRadius: "8px", padding: "7px 10px", color: "var(--text-primary)", fontSize: "12px",
    outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: "8px",
  };

  return (
    <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid var(--border)" }}>
      <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: "12px", color: "var(--text-primary)" }}>
        Enviar aviso
      </p>
      <input style={inp} placeholder="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={80} />
      <textarea style={{ ...inp, resize: "vertical", minHeight: "52px" }} placeholder="Mensaje" value={cuerpo} onChange={(e) => setCuerpo(e.target.value)} maxLength={300} />
      <select style={inp} value={destino} onChange={(e) => setDestino(e.target.value)}>
        <option value="TODOS">Todo el personal</option>
        <option value="PERSONAL">Solo personal</option>
        <option value="EMPLEADO">Solo técnicos</option>
        <option value="ADMIN">Solo administradores</option>
      </select>
      <button onClick={enviar} disabled={busy} style={btn("var(--accent)", "#fff")}>
        {busy ? "Enviando…" : "Enviar notificación"}
      </button>
      {envio.texto && (
        <p style={{ margin: "8px 0 0", fontSize: "11px", fontWeight: 600, color: envio.estado === "ok" ? "#22c55e" : "#ef4444" }}>
          {envio.texto}
        </p>
      )}
    </div>
  );
}

const btn = (bg, color) => ({
  width: "100%", background: bg, color, border: "none", borderRadius: "8px",
  padding: "8px 12px", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
});
