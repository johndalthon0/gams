import { useEffect, useState, useCallback } from "react";
import api from "../../services/api";

const TIPO_CONFIG = {
  SOLICITUD:        { icon:"📋", color:"#3b82f6" },
  SOLICITUD_MANT:   { icon:"🛠️", color:"var(--accent-text)" },
  MANT_INICIADO:    { icon:"⚙️", color:"var(--accent-text)" },
  MANT_CONFIRMADO:  { icon:"✅", color:"#22c55e" },
  MANT_FINALIZADO:  { icon:"🏁", color:"#22c55e" },
  MANT_RECORDATORIO:{ icon:"📅", color:"#f59e0b" },
  REPROGRAMAR:      { icon:"📅", color:"#f59e0b" },
  ASIGNACION:       { icon:"👤", color:"#8b5cf6" },
  ORDEN_TRABAJO:    { icon:"🤖", color:"#ec4899" },
  ALERTA:           { icon:"⚠️", color:"#ef4444" },
  DEFAULT:          { icon:"🔔", color:"var(--text-secondary)" },
};

export default function ToastNotificaciones() {
  const [toasts,  setToasts]  = useState([]);
  const [lastId,  setLastId]  = useState(null);

  const checkNotifs = useCallback(async () => {
    try {
      const res = await api.get("/mantenimientos/notificaciones");
      const all = Array.isArray(res.data) ? res.data : [];
      const noLeidas = all.filter(n => !n.leida);

      if (noLeidas.length === 0) return;

      // Solo mostrar las nuevas (mayor ID que el último visto)
      const maxId = noLeidas[0]?.id;
      if (lastId === null) { setLastId(maxId); return; }
      if (maxId <= lastId) return;

      const nuevas = noLeidas.filter(n => n.id > lastId).slice(0, 3);
      setLastId(maxId);

      nuevas.forEach(n => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { ...n, _tid: id }]);
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t._tid !== id));
        }, 6000);
      });
    } catch {}
  }, [lastId]);

  useEffect(() => {
    checkNotifs();
    const interval = setInterval(checkNotifs, 30000); // cada 30s
    return () => clearInterval(interval);
  }, [checkNotifs]);

  const cerrar = (tid) => setToasts(prev => prev.filter(t => t._tid !== tid));

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position:   "fixed",
      bottom:     "1.5rem",
      right:      "1.5rem",
      zIndex:     99999,
      display:    "flex",
      flexDirection: "column-reverse",
      gap:        "10px",
      maxWidth:   "380px",
      width:      "calc(100vw - 2rem)",
    }}>
      {toasts.map(t => {
        const cfg = TIPO_CONFIG[t.tipo] || TIPO_CONFIG.DEFAULT;
        return (
          <div key={t._tid} style={{
            background:   "var(--bg-surface)",
            border:       `1px solid ${cfg.color}`,
            borderLeft:   `4px solid ${cfg.color}`,
            borderRadius: "14px",
            padding:      "14px 16px",
            display:      "flex",
            gap:          "12px",
            alignItems:   "flex-start",
            boxShadow:    "0 8px 32px rgba(0,0,0,0.25)",
            animation:    "slideIn 0.3s ease",
          }}>
            <span style={{ fontSize:"22px", flexShrink:0 }}>{cfg.icon}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ margin:"0 0 4px", fontWeight:700, color:"var(--text-primary)", fontSize:"13px" }}>
                {t.titulo}
              </p>
              <p style={{ margin:0, color:"var(--text-secondary)", fontSize:"12px", lineHeight:1.4 }}>
                {t.mensaje?.length > 100 ? t.mensaje.substring(0,100)+"..." : t.mensaje}
              </p>
            </div>
            <button onClick={()=>cerrar(t._tid)} style={{ background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer", fontSize:"16px", flexShrink:0, padding:0, lineHeight:1 }}>
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}