// Config y helpers compartidos para notificaciones (bell, toasts, página).

export const TIPO_CONFIG = {
  SOLICITUD:         { icon: "📋", color: "#3b82f6",           bg: "rgba(59,130,246,0.1)",  label: "Solicitud" },
  SOLICITUD_MANT:    { icon: "🛠️", color: "var(--accent-text)", bg: "var(--accent-light)",   label: "Mantenimiento" },
  MANT_INICIADO:     { icon: "⚙️", color: "var(--accent-text)", bg: "var(--accent-light)",   label: "En proceso" },
  MANT_CONFIRMADO:   { icon: "✅", color: "#22c55e",           bg: "rgba(34,197,94,0.1)",   label: "Confirmado" },
  MANT_FINALIZADO:   { icon: "🏁", color: "#22c55e",           bg: "rgba(34,197,94,0.1)",   label: "Finalizado" },
  MANT_RECORDATORIO: { icon: "📅", color: "#f59e0b",           bg: "rgba(245,158,11,0.1)",  label: "Recordatorio" },
  REPROGRAMAR:       { icon: "📅", color: "#f59e0b",           bg: "rgba(245,158,11,0.1)",  label: "Reprogramación" },
  ASIGNACION:        { icon: "👤", color: "#8b5cf6",           bg: "rgba(139,92,246,0.1)",  label: "Asignación" },
  ORDEN_TRABAJO:     { icon: "🤖", color: "#ec4899",           bg: "rgba(236,72,153,0.1)",  label: "IA" },
  IA_RIESGO:         { icon: "🤖", color: "#ec4899",           bg: "rgba(236,72,153,0.1)",  label: "IA" },
  ALERTA:            { icon: "⚠️", color: "#ef4444",           bg: "rgba(239,68,68,0.1)",   label: "Alerta" },
  DEFAULT:           { icon: "🔔", color: "var(--text-secondary)", bg: "var(--bg-surface2)", label: "Notificación" },
};

export const getTipo = (tipo) => TIPO_CONFIG[tipo] || TIPO_CONFIG.DEFAULT;

// Siempre en hora de Bolivia, sin importar la zona horaria del dispositivo
// que esté viendo la pantalla (si no, cada admin vería una hora distinta).
export const fmtFull = (d) =>
  d ? new Date(d).toLocaleString("es-BO", {
    timeZone: "America/La_Paz",
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }) : "—";

export const fmtRelativo = (d) => {
  if (!d) return "—";
  const diff = Date.now() - new Date(d).getTime();
  const min  = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const dias = Math.floor(diff / 86400000);
  if (min  < 1)  return "Ahora mismo";
  if (min  < 60) return `Hace ${min} min`;
  if (hrs  < 24) return `Hace ${hrs} h`;
  if (dias < 7)  return `Hace ${dias} día${dias > 1 ? "s" : ""}`;
  return fmtFull(d);
};
