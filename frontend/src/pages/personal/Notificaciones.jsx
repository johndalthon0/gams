import { useEffect, useState, useCallback } from "react";
import PersonalLayout from "../../components/layout/PersonalLayout";
import api from "../../services/api";


// ── Helpers ───────────────────────────────────────────────────
const fmtFull = (d) =>
  d ? new Date(d).toLocaleString("es-BO", {
    day:"2-digit", month:"short", year:"numeric",
    hour:"2-digit", minute:"2-digit",
  }) : "—";

const fmtRelativo = (d) => {
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

// ── Config por tipo ───────────────────────────────────────────
const TIPO_CONFIG = {
  SOLICITUD:        { icon:"📋", color:"#3b82f6", bg:"rgba(59,130,246,0.1)",  label:"Solicitud"     },
  SOLICITUD_MANT:   { icon:"🛠️", color:"var(--accent-text)", bg:"var(--accent-light)", label:"Mantenimiento" },
  MANT_INICIADO:    { icon:"⚙️", color:"var(--accent-text)", bg:"var(--accent-light)", label:"En proceso"    },
  MANT_CONFIRMADO:  { icon:"✅", color:"#22c55e", bg:"rgba(34,197,94,0.1)",   label:"Confirmado"    },
  MANT_FINALIZADO:  { icon:"🏁", color:"#22c55e", bg:"rgba(34,197,94,0.1)",   label:"Finalizado"    },
  REPROGRAMAR:      { icon:"📅", color:"#f59e0b", bg:"rgba(245,158,11,0.1)",  label:"Reprogramación"},
  ASIGNACION:       { icon:"👤", color:"#8b5cf6", bg:"rgba(139,92,246,0.1)",  label:"Asignación"    },
  ORDEN_TRABAJO:    { icon:"🤖", color:"#ec4899", bg:"rgba(236,72,153,0.1)",  label:"IA"            },
  ALERTA:           { icon:"⚠️", color:"#ef4444", bg:"rgba(239,68,68,0.1)",   label:"Alerta"        },
  DEFAULT:          { icon:"🔔", color:"var(--text-secondary)", bg:"var(--bg-surface2)", label:"Notificación" },
};

function getTipo(tipo) {
  return TIPO_CONFIG[tipo] || TIPO_CONFIG.DEFAULT;
}

// ── Tarjeta notificación ──────────────────────────────────────
function TarjetaNotif({ notif, onLeer }) {
  const cfg = getTipo(notif.tipo);

  return (
    <div
      onClick={() => !notif.leida && onLeer(notif.id)}
      style={{
        display:      "flex",
        gap:          "14px",
        padding:      "14px 16px",
        borderRadius: "14px",
        border:       `1px solid ${notif.leida ? "var(--border)" : cfg.color}`,
        background:   notif.leida ? "var(--bg-surface)" : cfg.bg,
        cursor:       notif.leida ? "default" : "pointer",
        transition:   "all 0.2s",
        position:     "relative",
        marginBottom: "10px",
      }}
    >
      {/* Punto no leída */}
      {!notif.leida && (
        <div style={{
          position: "absolute", top:"12px", right:"12px",
          width:"10px", height:"10px", borderRadius:"50%",
          background: cfg.color,
          boxShadow:  `0 0 6px ${cfg.color}`,
        }}/>
      )}

      {/* Icono */}
      <div style={{
        width:"44px", height:"44px", borderRadius:"12px",
        background: cfg.bg,
        border:     `1px solid ${cfg.color}`,
        display:    "flex", alignItems:"center", justifyContent:"center",
        fontSize:   "20px", flexShrink:0,
      }}>
        {cfg.icon}
      </div>

      {/* Contenido */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"4px", marginBottom:"4px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", flexWrap:"wrap" }}>
            <p style={{ margin:0, color:"var(--text-primary)", fontWeight: notif.leida ? 500 : 700, fontSize:"14px" }}>
              {notif.titulo}
            </p>
            <span style={{ background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.color}`, borderRadius:"6px", padding:"1px 8px", fontSize:"10px", fontWeight:600 }}>
              {cfg.label}
            </span>
          </div>
          <span style={{ color:"var(--text-muted)", fontSize:"11px", whiteSpace:"nowrap" }}>
            {fmtRelativo(notif.fecha)}
          </span>
        </div>
        <p style={{ margin:0, color: notif.leida ? "var(--text-secondary)" : "var(--text-primary)", fontSize:"13px", lineHeight:1.5 }}>
          {notif.mensaje}
        </p>
        {!notif.leida && (
          <p style={{ margin:"6px 0 0", color:cfg.color, fontSize:"11px", fontWeight:600 }}>
            Toca para marcar como leída
          </p>
        )}
      </div>
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────
export default function Notificaciones() {
  const [notifs,   setNotifs]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filtro,   setFiltro]   = useState("TODAS");
  const [msg,      setMsg]      = useState("");

  const showMsg = (text) => { setMsg(text); setTimeout(()=>setMsg(""),4000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/mantenimientos/notificaciones");
      setNotifs(Array.isArray(res.data) ? res.data : []);
    } catch {
      showMsg("Error al cargar notificaciones");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const leer = async (id) => {
    try {
      await api.put(`/mantenimientos/notificaciones/${id}/leer`);
      setNotifs(prev => prev.map(n => n.id === id ? {...n, leida:1} : n));
    } catch {}
  };

  const leerTodas = async () => {
    try {
      await api.put("/mantenimientos/notificaciones/leer-todas");
      setNotifs(prev => prev.map(n => ({...n, leida:1})));
      showMsg("✅ Todas marcadas como leídas");
    } catch { showMsg("Error al marcar"); }
  };

  // Filtros
  const FILTROS = [
    { k:"TODAS",        l:"Todas"        },
    { k:"NO_LEIDAS",    l:"No leídas"    },
    { k:"SOLICITUD_MANT",l:"Mantenimiento"},
    { k:"MANT_FINALIZADO",l:"Finalizados"},
    { k:"REPROGRAMAR",  l:"Reprogramar"  },
    { k:"ALERTA",       l:"Alertas"      },
  ];

  const filtradas = notifs.filter(n => {
    if (filtro === "TODAS")     return true;
    if (filtro === "NO_LEIDAS") return !n.leida;
    return n.tipo === filtro;
  });

  const noLeidas = notifs.filter(n => !n.leida).length;

  const stats = [
    { label:"Total",      value:notifs.length,   color:"var(--accent-text)", icon:"🔔" },
    { label:"No leídas",  value:noLeidas,         color:noLeidas>0?"#ef4444":"#22c55e", icon:"📬" },
    { label:"Leídas",     value:notifs.length - noLeidas, color:"#22c55e", icon:"✅" },
    { label:"Este mes",   value:notifs.filter(n=>{const d=new Date(n.fecha);const hoy=new Date();return d.getMonth()===hoy.getMonth()&&d.getFullYear()===hoy.getFullYear();}).length, color:"var(--accent-text)", icon:"📅" },
  ];

  return (
    <PersonalLayout>

      {/* HEADER */}
      <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:"12px", marginBottom:"1.5rem" }}>
        <div>
          <p style={{ color:"var(--text-secondary)", fontSize:"14px", margin:0 }}>Portal personal</p>
          <h1 style={{ fontSize:"26px", fontWeight:700, margin:"4px 0 0", color:"var(--text-primary)", display:"flex", alignItems:"center", gap:"10px" }}>
            🔔 Notificaciones
            {noLeidas > 0 && (
              <span style={{ background:"#ef4444", color:"#fff", borderRadius:"999px", padding:"2px 10px", fontSize:"14px", fontWeight:700 }}>
                {noLeidas}
              </span>
            )}
          </h1>
        </div>
        <div style={{ display:"flex", gap:"10px", alignItems:"center" }}>
          <button onClick={load} style={{ background:"var(--bg-surface2)", border:"1px solid var(--border)", color:"var(--text-secondary)", borderRadius:"10px", padding:"8px 16px", fontSize:"13px", cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>
            🔄 Actualizar
          </button>
          {noLeidas > 0 && (
            <button onClick={leerTodas} style={{ background:"var(--accent)", color:"#fff", border:"none", borderRadius:"10px", padding:"8px 16px", fontSize:"13px", cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>
              ✅ Leer todas
            </button>
          )}
        </div>
      </div>

      {/* MENSAJE */}
      {msg && (
        <div style={{ background:"var(--success-bg)", border:"1px solid var(--success)", color:"var(--success)", borderRadius:"10px", padding:"10px 16px", marginBottom:"1.25rem", fontSize:"13px", fontWeight:500 }}>
          {msg}
        </div>
      )}

      {/* STATS */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:"12px", marginBottom:"1.5rem" }}>
        {stats.map((s,i)=>(
          <div key={i} style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"14px", padding:"1rem", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <p style={{ color:"var(--text-secondary)", fontSize:"11px", margin:"0 0 4px", textTransform:"uppercase", letterSpacing:"0.5px" }}>{s.label}</p>
              <p style={{ color:s.color, fontSize:"22px", fontWeight:700, margin:0 }}>{s.value}</p>
            </div>
            <span style={{ fontSize:"20px" }}>{s.icon}</span>
          </div>
        ))}
      </div>

      {/* FILTROS */}
      <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", marginBottom:"1.25rem" }}>
        {FILTROS.map(f=>(
          <button key={f.k} onClick={()=>setFiltro(f.k)} style={{ padding:"7px 14px", borderRadius:"8px", border:filtro===f.k?"none":"1px solid var(--border)", background:filtro===f.k?"var(--accent)":"var(--bg-surface)", color:filtro===f.k?"#fff":"var(--text-secondary)", fontWeight:600, fontSize:"12px", cursor:"pointer", fontFamily:"inherit" }}>
            {f.l}
            {f.k==="NO_LEIDAS" && noLeidas>0 && (
              <span style={{ marginLeft:"6px", background:filtro===f.k?"rgba(255,255,255,0.25)":"#ef4444", color:"#fff", borderRadius:"999px", padding:"1px 6px", fontSize:"10px" }}>
                {noLeidas}
              </span>
            )}
          </button>
        ))}
        <span style={{ color:"var(--text-muted)", fontSize:"13px", marginLeft:"auto", alignSelf:"center" }}>
          {filtradas.length} notificación{filtradas.length !== 1 ? "es" : ""}
        </span>
      </div>

      {/* LISTA */}
      {loading ? (
        <div style={{ padding:"4rem", textAlign:"center", color:"var(--text-secondary)" }}>
          <div style={{ fontSize:"40px", marginBottom:"12px" }}>🔔</div>
          <p>Cargando notificaciones...</p>
        </div>
      ) : filtradas.length === 0 ? (
        <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"16px", padding:"4rem", textAlign:"center", color:"var(--text-secondary)" }}>
          <div style={{ fontSize:"56px", marginBottom:"14px" }}>📭</div>
          <h3 style={{ color:"var(--text-primary)", marginBottom:"8px" }}>
            {filtro === "NO_LEIDAS" ? "Todo al día 🎉" : "Sin notificaciones"}
          </h3>
          <p style={{ margin:0, fontSize:"14px" }}>
            {filtro === "NO_LEIDAS"
              ? "No tienes notificaciones pendientes de leer"
              : "No hay notificaciones en esta categoría"}
          </p>
        </div>
      ) : (
        <div>
          {filtradas.map(n => (
            <TarjetaNotif key={n.id} notif={n} onLeer={leer} />
          ))}
        </div>
      )}

    </PersonalLayout>
  );
}