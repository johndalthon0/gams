import { useEffect, useState, useCallback } from "react";
import PersonalLayout from "../../components/layout/PersonalLayout";
import api from "../../services/api";

const fmt = (d) => d
  ? new Date(d).toLocaleDateString("es-BO",{day:"2-digit",month:"short",year:"numeric"})
  : "—";
const fmtFull = (d) => d ? new Date(d).toLocaleString("es-BO") : "—";

const COLOR_EQ = {
  DISPONIBLE:    {c:"#22c55e",bg:"#f0fdf4",b:"#22c55e",label:"Disponible"},
  ASIGNADO:      {c:"var(--accent-text)",bg:"var(--accent-light)",b:"var(--accent)",label:"Asignado"},
  MANTENIMIENTO: {c:"#f59e0b",bg:"#fffbeb",b:"#f59e0b",label:"En mantenimiento"},
  BAJA:          {c:"#ef4444",bg:"#fef2f2",b:"#ef4444",label:"De baja"},
};

const COLOR_SOL = {
  PENDIENTE:  {c:"#f59e0b",bg:"rgba(245,158,11,0.12)",b:"#f59e0b",label:"Solicitud pendiente"},
  EN_PROCESO: {c:"var(--accent-text)",bg:"var(--accent-light)",b:"var(--accent)",label:"En proceso"},
};

function InfoField({ label, value }) {
  return (
    <div style={{background:"var(--bg-surface2)",border:"1px solid var(--border)",borderRadius:"10px",padding:"10px 12px"}}>
      <p style={{color:"var(--text-muted)",fontSize:"11px",margin:"0 0 3px",textTransform:"uppercase",letterSpacing:"0.4px",fontWeight:600}}>{label}</p>
      <div style={{color:"var(--text-primary)",fontWeight:500,fontSize:"13px"}}>{value??("—")}</div>
    </div>
  );
}

// ── Modal reprogramar ─────────────────────────────────────────
function ModalReprog({ mant, onClose, onGuardado }) {
  const [motivo,   setMotivo]   = useState("");
  const [fechaSug, setFechaSug] = useState("");
  const [busy,     setBusy]     = useState(false);
  const [err,      setErr]      = useState("");

  const enviar = async () => {
    if (!motivo.trim()) return setErr("Describe el motivo de la reprogramación");
    setBusy(true);
    try {
      await api.put(`/mantenimientos/${mant.id}/reprogramar`, {
        motivo,
        fecha_sugerida: fechaSug || null,
      });
      onGuardado("✅ Solicitud de reprogramación enviada al administrador");
      onClose();
    } catch(e) {
      setErr(e.response?.data?.message || "Error al enviar");
    } finally { setBusy(false); }
  };

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem",backdropFilter:"blur(4px)"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:"16px",width:"480px",maxWidth:"95vw",overflow:"hidden",boxShadow:"0 24px 60px rgba(0,0,0,0.35)"}}>

        <div style={{background:"#f59e0b",padding:"1rem 1.25rem",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <h5 style={{color:"#fff",fontWeight:700,margin:0}}>📅 Solicitar reprogramación</h5>
            <small style={{color:"rgba(255,255,255,0.8)"}}>{mant.equipo_codigo} — {mant.equipo_nombre}</small>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.2)",border:"none",color:"#fff",borderRadius:"8px",padding:"6px 12px",cursor:"pointer"}}>✖</button>
        </div>

        <div style={{padding:"1.25rem",display:"flex",flexDirection:"column",gap:"14px"}}>
          {err && (
            <div style={{background:"var(--danger-bg)",border:"1px solid var(--danger)",color:"var(--danger)",borderRadius:"8px",padding:"10px 14px",fontSize:"13px"}}>
              ⚠️ {err}
            </div>
          )}

          <div>
            <label style={{display:"block",color:"var(--text-secondary)",fontSize:"12px",fontWeight:600,marginBottom:"5px",textTransform:"uppercase"}}>
              Motivo de la reprogramación *
            </label>
            <textarea
              rows={3}
              value={motivo}
              onChange={e=>setMotivo(e.target.value)}
              placeholder="Ej: Tengo una reunión importante ese día, viaje programado..."
              style={{width:"100%",background:"var(--bg-surface2)",border:"1px solid var(--border)",borderRadius:"10px",padding:"10px 14px",color:"var(--text-primary)",fontSize:"14px",outline:"none",fontFamily:"inherit",boxSizing:"border-box",resize:"vertical"}}
            />
          </div>

          <div>
            <label style={{display:"block",color:"var(--text-secondary)",fontSize:"12px",fontWeight:600,marginBottom:"5px",textTransform:"uppercase"}}>
              Fecha sugerida (opcional)
            </label>
            <input
              type="date"
              value={fechaSug}
              onChange={e=>setFechaSug(e.target.value)}
              style={{width:"100%",background:"var(--bg-surface2)",border:"1px solid var(--border)",borderRadius:"10px",padding:"10px 14px",color:"var(--text-primary)",fontSize:"14px",outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}
            />
          </div>

          <div style={{background:"rgba(245,158,11,0.1)",border:"1px solid #f59e0b",borderRadius:"8px",padding:"10px 14px"}}>
            <p style={{color:"#78350f",fontSize:"12px",margin:0}}>
              ℹ️ El administrador recibirá tu solicitud y fijará una nueva fecha. Te notificaremos cuando esté lista.
            </p>
          </div>

          <div style={{display:"flex",gap:"10px",justifyContent:"flex-end"}}>
            <button onClick={onClose} style={{background:"var(--bg-surface2)",border:"1px solid var(--border)",color:"var(--text-secondary)",borderRadius:"10px",padding:"10px 18px",fontSize:"14px",cursor:"pointer",fontFamily:"inherit"}}>
              Cancelar
            </button>
            <button onClick={enviar} disabled={busy} style={{background:"#f59e0b",color:"#000",border:"none",borderRadius:"10px",padding:"10px 18px",fontSize:"14px",fontWeight:600,cursor:busy?"not-allowed":"pointer",fontFamily:"inherit",opacity:busy?0.6:1}}>
              {busy?"Enviando...":"📅 Enviar solicitud"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tarjeta Equipo ────────────────────────────────────────────
function TarjetaEquipo({ equipo, solicitudes, onConfirmar, onReprogramar }) {
  const [expandido, setExpandido] = useState(false);

  const solActiva = solicitudes.find(
    s => s.equipo_id === equipo.id && ["PENDIENTE","EN_PROCESO"].includes(s.estado)
  );

  const mantActivo = equipo.mantenimientos?.find(m =>
    ["PENDIENTE_CONFIRMACION","PROGRAMADO","EN_PROCESO","PAUSADO","REPROGRAMAR"].includes(m.estado)
  );
  const historial = (equipo.mantenimientos||[]).filter(m=>m.estado==="FINALIZADO");

  const crEq = COLOR_EQ[equipo.estado] || COLOR_EQ.DISPONIBLE;

  return (
    <div style={{background:"var(--bg-surface)",border:`2px solid ${crEq.b}`,borderRadius:"16px",overflow:"hidden",marginBottom:"16px"}}>

      {/* ── BANNER PENDIENTE CONFIRMACION ── */}
      {mantActivo?.estado === "PENDIENTE_CONFIRMACION" && (
        <div style={{background:"#f59e0b",padding:"10px 16px",display:"flex",alignItems:"center",gap:"10px",flexWrap:"wrap"}}>
          <span style={{fontSize:"18px"}}>⚠️</span>
          <p style={{color:"#fff",fontWeight:700,fontSize:"13px",margin:0,flex:1}}>
            Mantenimiento preventivo programado para el {fmt(mantActivo.fecha_programada)} — Confirma tu disponibilidad
          </p>
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
            <button
              onClick={()=>onConfirmar(mantActivo.id)}
              style={{background:"#fff",color:"#f59e0b",border:"none",borderRadius:"8px",padding:"6px 14px",fontSize:"13px",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}
            >
              ✅ Confirmar
            </button>
            <button
              onClick={()=>onReprogramar(mantActivo)}
              style={{background:"rgba(255,255,255,0.2)",color:"#fff",border:"1px solid rgba(255,255,255,0.5)",borderRadius:"8px",padding:"6px 14px",fontSize:"13px",fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}
            >
              📅 Reprogramar
            </button>
          </div>
        </div>
      )}

      {/* ── BANNER SOLICITUD PENDIENTE ── */}
      {solActiva?.estado === "PENDIENTE" && !mantActivo && (
        <div style={{background:"#3b82f6",padding:"8px 16px",display:"flex",alignItems:"center",gap:"8px"}}>
          <span style={{fontSize:"16px"}}>📋</span>
          <p style={{color:"#fff",fontWeight:700,fontSize:"13px",margin:0}}>
            Tu solicitud de mantenimiento está siendo revisada por el administrador
          </p>
        </div>
      )}

      {/* ── BANNER EN PROCESO ── */}
      {mantActivo?.estado === "EN_PROCESO" && (
        <div style={{background:"var(--accent)",padding:"8px 16px",display:"flex",alignItems:"center",gap:"8px"}}>
          <span style={{fontSize:"16px"}}>⚙️</span>
          <p style={{color:"#fff",fontWeight:700,fontSize:"13px",margin:0}}>
            El técnico {mantActivo.tecnico_nombre_completo||""} está realizando el mantenimiento
          </p>
        </div>
      )}

      {/* ── BANNER REPROGRAMAR ── */}
      {mantActivo?.estado === "REPROGRAMAR" && (
        <div style={{background:"#ef4444",padding:"8px 16px",display:"flex",alignItems:"center",gap:"8px"}}>
          <span style={{fontSize:"16px"}}>🔄</span>
          <p style={{color:"#fff",fontWeight:700,fontSize:"13px",margin:0}}>
            Tu solicitud de reprogramación fue enviada — El administrador fijará una nueva fecha
          </p>
        </div>
      )}

      {/* ── CABECERA EQUIPO ── */}
      <div style={{padding:"1rem 1.25rem",background:`linear-gradient(135deg,${crEq.bg},var(--bg-surface))`,borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:"12px",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
          <div style={{width:"50px",height:"50px",borderRadius:"12px",background:crEq.bg,border:`2px solid ${crEq.b}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"22px",flexShrink:0}}>
            {equipo.estado==="MANTENIMIENTO"?"🔧":"💻"}
          </div>
          <div>
            <p style={{margin:0,color:"var(--accent-text)",fontWeight:700,fontSize:"16px"}}>{equipo.codigo}</p>
            <p style={{margin:"2px 0 0",color:"var(--text-primary)",fontWeight:500,fontSize:"14px"}}>{equipo.nombre}</p>
            <p style={{margin:"2px 0 0",color:"var(--text-muted)",fontSize:"12px"}}>{equipo.tipo} · Desde {fmt(equipo.fecha_asignacion)}</p>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"6px"}}>
          <span style={{background:crEq.bg,color:crEq.c,border:`1px solid ${crEq.b}`,borderRadius:"8px",padding:"4px 12px",fontSize:"12px",fontWeight:700}}>
            {crEq.label}
          </span>
          {mantActivo && (
            <span style={{background:CE_MANT[mantActivo.estado]?.bg||"var(--bg-surface2)",color:CE_MANT[mantActivo.estado]?.c||"var(--text-muted)",border:`1px solid ${CE_MANT[mantActivo.estado]?.b||"var(--border)"}`,borderRadius:"6px",padding:"2px 8px",fontSize:"11px",fontWeight:600}}>
              {mantActivo.estado.replace(/_/g," ")}
            </span>
          )}
        </div>
      </div>

      {/* ── SOLICITUD ACTIVA (sin mantenimiento) ── */}
      {solActiva && !mantActivo && (
        <div style={{padding:"1rem 1.25rem",borderBottom:"1px solid var(--border)"}}>
          <p style={{color:"var(--text-secondary)",fontSize:"12px",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px",margin:"0 0 10px"}}>
            Solicitud de mantenimiento
          </p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:"10px"}}>
            <InfoField label="Estado"      value={<span style={{color:COLOR_SOL[solActiva.estado]?.c||"#f59e0b",fontWeight:700}}>{COLOR_SOL[solActiva.estado]?.label||solActiva.estado}</span>}/>
            <InfoField label="Prioridad"   value={<span style={{color:solActiva.prioridad==="ALTA"?"#ef4444":solActiva.prioridad==="MEDIA"?"#f59e0b":"#22c55e",fontWeight:600}}>{solActiva.prioridad==="ALTA"?"🔴":solActiva.prioridad==="MEDIA"?"🟡":"🟢"} {solActiva.prioridad}</span>}/>
            <InfoField label="Descripción" value={solActiva.descripcion}/>
            <InfoField label="Enviada"     value={fmt(solActiva.fecha_solicitud)}/>
          </div>
        </div>
      )}

      {/* ── MANTENIMIENTO ACTIVO ── */}
      {mantActivo && (
        <div style={{padding:"1rem 1.25rem",borderBottom:"1px solid var(--border)"}}>
          <p style={{color:"var(--text-secondary)",fontSize:"12px",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px",margin:"0 0 10px"}}>
            Mantenimiento {mantActivo.estado==="PENDIENTE_CONFIRMACION"?"programado":"en curso"}
          </p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:"10px",marginBottom: mantActivo.motivo_ia?"12px":"0"}}>
            <InfoField label="Tipo"         value={mantActivo.tipo}/>
            <InfoField label="Técnico"      value={mantActivo.tecnico_nombre_completo||"Sin asignar"}/>
            <InfoField label="F. Programada"value={fmt(mantActivo.fecha_programada)}/>
            <InfoField label="F. Inicio"    value={mantActivo.fecha_inicio?fmtFull(mantActivo.fecha_inicio):"—"}/>
            {mantActivo.nivel_riesgo_ia&&(
              <InfoField label="Riesgo IA" value={
                <span style={{background:"#fef2f2",color:"#ef4444",border:"1px solid #ef4444",borderRadius:"6px",padding:"2px 8px",fontSize:"11px",fontWeight:600}}>
                  ⚠️ {mantActivo.nivel_riesgo_ia} — {mantActivo.probabilidad_ia}%
                </span>
              }/>
            )}
            {mantActivo.dias_restantes!==null&&!["FINALIZADO"].includes(mantActivo.estado)&&(
              <InfoField label="Días restantes" value={
                <span style={{color:mantActivo.dias_restantes<0?"#ef4444":mantActivo.dias_restantes<=3?"#f59e0b":"var(--text-primary)",fontWeight:700,fontSize:"16px"}}>
                  {mantActivo.dias_restantes<0?`Vencido hace ${Math.abs(mantActivo.dias_restantes)}d`:`${mantActivo.dias_restantes} días`}
                </span>
              }/>
            )}
          </div>

          {mantActivo.motivo_ia&&(
            <div style={{background:"rgba(245,158,11,0.1)",border:"1px solid #f59e0b",borderRadius:"10px",padding:"12px",marginTop:"10px"}}>
              <p style={{color:"#92400e",fontSize:"11px",fontWeight:600,textTransform:"uppercase",margin:"0 0 4px"}}>Motivo IA</p>
              <p style={{color:"#78350f",fontSize:"13px",margin:0,lineHeight:1.6}}>{mantActivo.motivo_ia}</p>
            </div>
          )}

          {/* Botón reprogramar si está PROGRAMADO o EN_PROCESO */}
          {["PROGRAMADO","EN_PROCESO","PAUSADO"].includes(mantActivo.estado)&&(
            <div style={{marginTop:"12px"}}>
              <button
                onClick={()=>onReprogramar(mantActivo)}
                style={{background:"rgba(245,158,11,0.12)",border:"1px solid #f59e0b",color:"#f59e0b",borderRadius:"8px",padding:"7px 16px",fontSize:"12px",fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}
              >
                📅 Solicitar reprogramación
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── SIN ACTIVIDAD ── */}
      {!solActiva && !mantActivo && (
        <div style={{padding:"1rem 1.25rem",borderBottom:"1px solid var(--border)",textAlign:"center"}}>
          <span style={{fontSize:"24px"}}>✅</span>
          <p style={{margin:"6px 0 0",fontSize:"13px",color:"var(--text-secondary)"}}>Sin mantenimientos activos</p>
        </div>
      )}

      {/* ── HISTORIAL ── */}
      <div style={{padding:"1rem 1.25rem"}}>
        <button onClick={()=>setExpandido(!expandido)} style={{background:"var(--bg-surface2)",border:"1px solid var(--border)",borderRadius:"8px",padding:"6px 14px",color:"var(--text-secondary)",fontSize:"12px",fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
          {expandido?"▲ Ocultar":`▼ Historial (${historial.length} finalizados)`}
        </button>
        {expandido&&(
          <div style={{marginTop:"12px",display:"flex",flexDirection:"column",gap:"8px"}}>
            {historial.length===0?(
              <p style={{color:"var(--text-muted)",fontSize:"13px",margin:0}}>Sin mantenimientos finalizados</p>
            ):historial.map((m,i)=>(
              <div key={i} style={{background:"var(--bg-surface2)",border:"1px solid var(--border)",borderRadius:"12px",padding:"12px 14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:"8px",marginBottom:"6px"}}>
                  <div>
                    <p style={{margin:0,color:"var(--text-primary)",fontWeight:600,fontSize:"13px"}}>{m.tipo} — {fmt(m.fecha_programada||m.fecha_inicio)}</p>
                    <p style={{margin:"2px 0 0",color:"var(--text-muted)",fontSize:"11px"}}>Técnico: {m.tecnico_nombre_completo||"—"} · Fin: {fmtFull(m.fecha_fin)}</p>
                  </div>
                  <span style={{background:"rgba(34,197,94,0.12)",color:"#22c55e",border:"1px solid #22c55e",borderRadius:"6px",padding:"2px 8px",fontSize:"11px",fontWeight:700}}>Finalizado</span>
                </div>
                {m.descripcion_solucion&&<p style={{margin:0,color:"var(--text-secondary)",fontSize:"12px",lineHeight:1.5}}><strong>Solución:</strong> {m.descripcion_solucion}</p>}
                {m.costo>0&&<p style={{margin:"4px 0 0",color:"#22c55e",fontWeight:600,fontSize:"12px"}}>Costo: Bs {Number(m.costo).toFixed(2)}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Colores estado mantenimiento
const CE_MANT = {
  PENDIENTE_CONFIRMACION: {c:"#f59e0b",bg:"rgba(245,158,11,0.12)",b:"#f59e0b"},
  PROGRAMADO:             {c:"#3b82f6",bg:"rgba(59,130,246,0.12)", b:"#3b82f6"},
  EN_PROCESO:             {c:"var(--accent-text)",bg:"var(--accent-light)",b:"var(--accent)"},
  PAUSADO:                {c:"var(--text-muted)",bg:"var(--bg-surface2)",b:"var(--border)"},
  REPROGRAMAR:            {c:"#ef4444",bg:"rgba(239,68,68,0.12)",b:"#ef4444"},
  FINALIZADO:             {c:"#22c55e",bg:"rgba(34,197,94,0.12)",b:"#22c55e"},
};

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────
export default function MiEquipo() {
  const [datos,       setDatos]       = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [msg,         setMsg]         = useState("");
  const [modalReprog, setModalReprog] = useState(null);

  const showMsg = (text) => { setMsg(text); setTimeout(()=>setMsg(""),5000); };

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [mantRes, solRes] = await Promise.all([
        api.get("/mantenimientos/mis-mantenimientos"),
        api.get("/mantenimientos/mis-solicitudes"),
      ]);
      setDatos(Array.isArray(mantRes.data)?mantRes.data:[]);
      setSolicitudes(Array.isArray(solRes.data)?solRes.data:[]);
    } catch {
      setError("Error al cargar tus equipos");
    } finally { setLoading(false); }
  },[]);

  useEffect(()=>{ load(); },[load]);

  // Confirmar disponibilidad
  const confirmarMant = async (id) => {
    try {
      await api.put(`/mantenimientos/${id}/confirmar`);
      showMsg("✅ Disponibilidad confirmada. El técnico coordinará el mantenimiento.");
      load();
    } catch(e) {
      showMsg("Error: " + (e.response?.data?.message||"No se pudo confirmar"));
    }
  };

  // Agrupar mantenimientos por equipo
  const equiposMap = {};
  datos.forEach(d=>{
    if (!d.equipo_id) return;
    if (!equiposMap[d.equipo_id]) {
      equiposMap[d.equipo_id]={
        id:               d.equipo_id,
        codigo:           d.equipo_codigo,
        nombre:           d.equipo_nombre,
        tipo:             d.equipo_tipo,
        estado:           d.equipo_estado,
        fecha_asignacion: d.fecha_asignacion,
        mantenimientos:   [],
      };
    }
    if (d.id) equiposMap[d.equipo_id].mantenimientos.push(d);
  });

  // Agregar equipos que solo tienen solicitudes
  solicitudes.forEach(s=>{
    if (s.equipo_id&&!equiposMap[s.equipo_id]) {
      equiposMap[s.equipo_id]={
        id:             s.equipo_id,
        codigo:         s.equipo_codigo,
        nombre:         s.equipo_nombre,
        tipo:           s.equipo_tipo,
        estado:         "ASIGNADO",
        mantenimientos: [],
      };
    }
  });

  const equipos = Object.values(equiposMap);

  return (
    <PersonalLayout>

      {/* HEADER */}
      <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:"12px",marginBottom:"1.5rem"}}>
        <div>
          <h2 style={{fontWeight:700,margin:0,color:"var(--text-primary)"}}>💻 Mis Equipos</h2>
          <p style={{color:"var(--text-secondary)",margin:"4px 0 0",fontSize:"14px"}}>
            Estado y mantenimientos de tus equipos asignados
          </p>
        </div>
        <button onClick={load} disabled={loading} style={{background:"var(--bg-surface2)",border:"1px solid var(--border)",borderRadius:"10px",padding:"10px 16px",color:"var(--text-secondary)",fontSize:"13px",cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",opacity:loading?0.6:1}}>
          🔄 Actualizar
        </button>
      </div>

      {/* MENSAJE */}
      {msg&&(
        <div style={{background:msg.startsWith("Error")?"var(--danger-bg)":"var(--success-bg)",border:`1px solid ${msg.startsWith("Error")?"var(--danger)":"var(--success)"}`,color:msg.startsWith("Error")?"var(--danger)":"var(--success)",borderRadius:"10px",padding:"12px 16px",marginBottom:"1.25rem",fontSize:"14px",fontWeight:500}}>
          {msg}
        </div>
      )}

      {/* ERROR */}
      {error&&(
        <div style={{background:"var(--danger-bg)",border:"1px solid var(--danger)",borderRadius:"10px",padding:"12px 16px",marginBottom:"1.25rem",color:"var(--danger)",fontSize:"14px"}}>
          ⚠️ {error}
        </div>
      )}

      {/* CONTENIDO */}
      {loading ? (
        <div style={{padding:"4rem",textAlign:"center",color:"var(--text-secondary)"}}>
          <div style={{fontSize:"40px",marginBottom:"12px"}}>💻</div>
          <p style={{fontSize:"16px"}}>Cargando tus equipos...</p>
        </div>
      ) : equipos.length === 0 ? (
        <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:"16px",padding:"4rem",textAlign:"center",color:"var(--text-secondary)"}}>
          <div style={{fontSize:"48px",marginBottom:"12px"}}>📭</div>
          <h3 style={{color:"var(--text-primary)",marginBottom:"8px"}}>Sin equipos asignados</h3>
          <p>Contacta al administrador para que te asigne un equipo.</p>
        </div>
      ) : (
        equipos.map((eq,i)=>(
          <TarjetaEquipo
            key={i}
            equipo={eq}
            solicitudes={solicitudes}
            onConfirmar={confirmarMant}
            onReprogramar={setModalReprog}
          />
        ))
      )}

      {/* MODAL REPROGRAMAR */}
      {modalReprog&&(
        <ModalReprog
          mant={modalReprog}
          onClose={()=>setModalReprog(null)}
          onGuardado={(m)=>{ showMsg(m); load(); }}
        />
      )}

    </PersonalLayout>
  );
}