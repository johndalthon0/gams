import { useEffect, useState, useCallback } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import api from "../../services/api";

// ─────────────────────────────────────────────────────────────
// ESTILOS BASE
// ─────────────────────────────────────────────────────────────
const S = {
  inp: {
    width: "100%",
    background: "var(--bg-surface2)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    padding: "10px 14px",
    color: "var(--text-primary)",
    fontSize: "14px",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  lbl: {
    display: "block",
    color: "var(--text-secondary)",
    fontSize: "12px",
    fontWeight: 600,
    marginBottom: "5px",
    textTransform: "uppercase",
    letterSpacing: "0.4px",
  },
  surface: {
    background: "var(--bg-surface)",
    border: "1px solid var(--border)",
    borderRadius: "16px",
    overflow: "hidden",
  },
};

const mkBtn = (bg, color, border) => ({
  borderRadius: "10px", padding: "9px 18px",
  fontSize: "14px", fontWeight: 600,
  cursor: "pointer", fontFamily: "inherit",
  border: border || "none",
  background: bg, color,
  transition: "opacity 0.15s",
  whiteSpace: "nowrap",
});

const btnP    = mkBtn("var(--accent)", "#fff");
const btnG    = mkBtn("var(--bg-surface2)", "var(--text-secondary)", "1px solid var(--border)");
const btnOk   = mkBtn("#22c55e", "#fff");
const btnWarn = mkBtn("rgba(245,158,11,0.15)", "#f59e0b", "1px solid #f59e0b");
const btnDng  = mkBtn("rgba(239,68,68,0.12)", "#ef4444", "1px solid #ef4444");

// ─────────────────────────────────────────────────────────────
// UTILIDADES
// ─────────────────────────────────────────────────────────────
const fmt     = (d) => d ? new Date(d).toLocaleDateString("es-BO",{day:"2-digit",month:"short",year:"numeric"}) : "—";
const fmtFull = (d) => d ? new Date(d).toLocaleString("es-BO") : "—";
const fmtBs   = (n) => (n != null && n !== "") ? `Bs ${Number(n).toFixed(2)}` : "—";
const seg     = (n, a) => [n,a].filter(x=>x&&x!=="null"&&x!=="None"&&x!=="undefined").join(" ").trim()||"—";

const ORDEN = {
  EN_PROCESO:3, PROGRAMADO:2, PENDIENTE_CONFIRMACION:1,
  PAUSADO:4, REPROGRAMAR:5, PENDIENTE:6, FINALIZADO:7, RECHAZADO:8,
};

const CE = {
  PENDIENTE_CONFIRMACION:{c:"#f59e0b",bg:"rgba(245,158,11,0.12)",b:"#f59e0b"},
  PROGRAMADO:            {c:"#3b82f6",bg:"rgba(59,130,246,0.12)", b:"#3b82f6"},
  EN_PROCESO:            {c:"var(--accent-text)",bg:"var(--accent-light)",b:"var(--accent)"},
  PAUSADO:               {c:"var(--text-muted)",bg:"var(--bg-surface2)",b:"var(--border)"},
  REPROGRAMAR:           {c:"#ef4444",bg:"rgba(239,68,68,0.12)",b:"#ef4444"},
  PENDIENTE:             {c:"var(--text-secondary)",bg:"var(--bg-surface2)",b:"var(--border)"},
  FINALIZADO:            {c:"#22c55e",bg:"rgba(34,197,94,0.12)",b:"#22c55e"},
  RECHAZADO:             {c:"#ef4444",bg:"rgba(239,68,68,0.12)",b:"#ef4444"},
};

// ─────────────────────────────────────────────────────────────
// COMPONENTES PEQUEÑOS
// ─────────────────────────────────────────────────────────────
function Pill({ estado }) {
  const c = CE[estado] || CE.PENDIENTE;
  return (
    <span style={{background:c.bg,color:c.c,border:`1px solid ${c.b}`,borderRadius:"8px",padding:"3px 10px",fontSize:"11px",fontWeight:700,whiteSpace:"nowrap"}}>
      {estado?.replace(/_/g," ")}
    </span>
  );
}

function InfoCard({ label, value }) {
  return (
    <div style={{background:"var(--bg-surface2)",border:"1px solid var(--border)",borderRadius:"10px",padding:"10px 12px"}}>
      <p style={{color:"var(--text-muted)",fontSize:"11px",margin:"0 0 3px",textTransform:"uppercase",letterSpacing:"0.4px",fontWeight:600}}>{label}</p>
      <div style={{color:"var(--text-primary)",fontWeight:500,fontSize:"13px"}}>{value??("—")}</div>
    </div>
  );
}

function Stat({ label, value, color, icon }) {
  return (
    <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:"14px",padding:"1rem",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div>
        <p style={{color:"var(--text-secondary)",fontSize:"11px",margin:"0 0 4px",textTransform:"uppercase",letterSpacing:"0.5px"}}>{label}</p>
        <p style={{color:color||"var(--text-primary)",fontSize:"22px",fontWeight:700,margin:0}}>{value}</p>
      </div>
      <span style={{fontSize:"24px"}}>{icon}</span>
    </div>
  );
}

function Toast({ msg }) {
  if (!msg.text) return null;
  const ok = msg.type === "success";
  return (
    <div style={{position:"fixed",top:"1.25rem",right:"1.25rem",zIndex:99999,background:ok?"var(--success-bg)":"var(--danger-bg)",border:`1px solid ${ok?"var(--success)":"var(--danger)"}`,color:ok?"var(--success)":"var(--danger)",borderRadius:"12px",padding:"14px 20px",fontSize:"14px",fontWeight:600,boxShadow:"0 8px 24px rgba(0,0,0,0.25)",maxWidth:"380px",animation:"fadeIn .2s ease"}}>
      {ok?"✅":"⚠️"} {msg.text}
    </div>
  );
}

function Alerta({ text, onClose }) {
  if (!text) return null;
  return (
    <div style={{background:"var(--danger-bg)",border:"1px solid var(--danger)",color:"var(--danger)",borderRadius:"10px",padding:"10px 16px",marginBottom:"1rem",fontSize:"13px",fontWeight:500,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      ⚠️ {text}
      <button onClick={onClose} style={{background:"none",border:"none",color:"inherit",cursor:"pointer",fontSize:"16px"}}>✕</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// OVERLAY / MODAL
// ─────────────────────────────────────────────────────────────
function Overlay({ onClose, children }) {
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem",backdropFilter:"blur(4px)"}}>
      <div onClick={e=>e.stopPropagation()}>{children}</div>
    </div>
  );
}

function Modal({ title, subtitle, onClose, children, width="760px" }) {
  return (
    <Overlay onClose={onClose}>
      <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:"18px",width,maxWidth:"96vw",maxHeight:"92vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 24px 60px rgba(0,0,0,0.4)"}}>
        <div style={{background:"var(--accent)",padding:"1rem 1.25rem",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <div>
            <h5 style={{color:"#fff",fontWeight:700,margin:0,fontSize:"16px"}}>{title}</h5>
            {subtitle&&<p style={{color:"rgba(255,255,255,0.75)",margin:"2px 0 0",fontSize:"12px"}}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",borderRadius:"8px",padding:"6px 12px",cursor:"pointer",fontSize:"16px"}}>✖</button>
        </div>
        <div style={{padding:"1.5rem",overflowY:"auto",flex:1}}>{children}</div>
      </div>
    </Overlay>
  );
}

function ModalConfirm({ titulo, desc, labelOk, colorOk="#ef4444", onConfirm, onClose }) {
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:10000,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem",backdropFilter:"blur(6px)"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:"16px",width:"420px",maxWidth:"95vw",padding:"2rem",boxShadow:"0 24px 60px rgba(0,0,0,0.45)"}}>
        <div style={{textAlign:"center",marginBottom:"1.5rem"}}>
          <div style={{fontSize:"52px",marginBottom:"12px"}}>{colorOk==="#22c55e"?"✅":"⚠️"}</div>
          <h4 style={{fontWeight:700,color:"var(--text-primary)",margin:"0 0 8px",fontSize:"18px"}}>{titulo}</h4>
          {desc&&<p style={{color:"var(--text-secondary)",margin:0,fontSize:"14px",lineHeight:1.6}}>{desc}</p>}
        </div>
        <div style={{display:"flex",gap:"10px"}}>
          <button onClick={onClose} style={{...btnG,flex:1}}>Cancelar</button>
          <button onClick={()=>{onConfirm();onClose();}} style={{...mkBtn(colorOk,colorOk==="#f59e0b"?"#000":"#fff"),flex:1}}>
            {labelOk||"Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MODAL DETALLE — GESTIÓN COMPLETA
// ─────────────────────────────────────────────────────────────
function ModalDetalle({ mant, onClose, onAction, cargando }) {
  const [solucion,  setSolucion]  = useState(mant.descripcion_solucion||"");
  const [costo,     setCosto]     = useState(mant.costo||"");
  const [obs,       setObs]       = useState("");
  const [fechaN,    setFechaN]    = useState("");
  const [historial, setHistorial] = useState([]);
  const [repCat,    setRepCat]    = useState([]);
  const [repUsados, setRepUsados] = useState([]);
  const [repSel,    setRepSel]    = useState({repuesto_id:"",cantidad:1});
  const [alerta,    setAlerta]    = useState("");
  const [loadH,     setLoadH]     = useState(true);

  useEffect(()=>{
    setLoadH(true);
    Promise.all([
      api.get(`/mantenimientos/${mant.id}/historial`).then(r=>setHistorial(r.data||[])),
      api.get("/mantenimientos/repuestos").then(r=>setRepCat(r.data||[])),
    ]).finally(()=>setLoadH(false));
  },[mant.id]);

  const agregarRep = () => {
    if (!repSel.repuesto_id) return setAlerta("Selecciona un repuesto");
    const cat = repCat.find(r=>String(r.id)===String(repSel.repuesto_id));
    if (!cat) return;
    if (repUsados.find(r=>String(r.repuesto_id)===String(cat.id)))
      return setAlerta("Este repuesto ya fue agregado");
    if (parseInt(repSel.cantidad)>cat.stock)
      return setAlerta(`Stock insuficiente para "${cat.nombre}". Disponible: ${cat.stock}`);
    setAlerta("");
    setRepUsados(p=>[...p,{repuesto_id:cat.id,nombre:cat.nombre,cantidad:parseInt(repSel.cantidad)||1,precio:Number(cat.precio||0)}]);
    setRepSel({repuesto_id:"",cantidad:1});
  };

  const quitarRep = (id) => setRepUsados(p=>p.filter(r=>r.repuesto_id!==id));

  const icoH = (a) => ({CREAR:"📝",INICIAR:"▶️",PAUSAR:"⏸️",FINALIZAR:"✅",CONFIRMAR:"👍",REPROGRAMAR:"📅",SOLICITAR_REPROGRAMAR:"📅"}[a]||"🔄");

  const totalRep = repUsados.reduce((a,r)=>a+r.cantidad*r.precio,0);

  const esFinalizado = mant.estado==="FINALIZADO";

  return (
    <Modal title={`🔧 Mantenimiento #${mant.id}`} subtitle={`${mant.equipo_codigo} — ${mant.equipo_nombre}`} onClose={onClose} width="820px">
      <Alerta text={alerta} onClose={()=>setAlerta("")} />

      {/* Badges estado */}
      <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"1.25rem",alignItems:"center"}}>
        <Pill estado={mant.estado}/>
        {mant.tipo&&<span style={{background:"var(--bg-surface2)",color:"var(--text-secondary)",border:"1px solid var(--border)",borderRadius:"6px",padding:"3px 10px",fontSize:"11px",fontWeight:600}}>{mant.tipo}</span>}
        {mant.nivel_riesgo_ia&&<span style={{background:"rgba(239,68,68,0.12)",color:"#ef4444",border:"1px solid #ef4444",borderRadius:"6px",padding:"3px 10px",fontSize:"11px",fontWeight:700}}>⚠️ IA: {mant.nivel_riesgo_ia} — {mant.probabilidad_ia}%</span>}
      </div>

      {/* Info cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(148px,1fr))",gap:"10px",marginBottom:"1.25rem"}}>
        <InfoCard label="Equipo"        value={`${mant.equipo_codigo} — ${mant.equipo_nombre}`}/>
        <InfoCard label="Tipo equipo"   value={mant.equipo_tipo||"—"}/>
        <InfoCard label="Tipo mant."    value={mant.tipo||"—"}/>
        <InfoCard label="Técnico"       value={mant.tecnico_nombre_completo||mant.tecnico||"—"}/>
        <InfoCard label="Responsable"   value={mant.responsable_nombre_completo||"—"}/>
        <InfoCard label="Área"          value={mant.area||"—"}/>
        <InfoCard label="F. Programada" value={fmt(mant.fecha_programada)}/>
        <InfoCard label="F. Inicio"     value={mant.fecha_inicio?fmtFull(mant.fecha_inicio):"—"}/>
        <InfoCard label="F. Fin"        value={mant.fecha_fin?fmtFull(mant.fecha_fin):"—"}/>
        <InfoCard label="Costo"         value={fmtBs(mant.costo)}/>
      </div>

      {/* Motivo IA */}
      {mant.motivo_ia&&(
        <div style={{background:"rgba(245,158,11,0.1)",border:"1px solid #f59e0b",borderRadius:"10px",padding:"12px 14px",marginBottom:"1rem"}}>
          <p style={{color:"var(--text-secondary)",fontSize:"11px",fontWeight:600,textTransform:"uppercase",margin:"0 0 4px"}}>Motivo detectado por IA</p>
          <p style={{color:"var(--text-primary)",fontSize:"13px",margin:0,lineHeight:1.6}}>{mant.motivo_ia}</p>
        </div>
      )}

      {/* Problema */}
      {mant.descripcion_problema&&(
        <div style={{marginBottom:"1rem"}}>
          <p style={{color:"var(--text-secondary)",fontSize:"11px",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.4px",margin:"0 0 6px"}}>Problema reportado</p>
          <div style={{background:"var(--bg-surface2)",border:"1px solid var(--border)",borderRadius:"10px",padding:"12px 14px",color:"var(--text-primary)",fontSize:"13px",lineHeight:1.6}}>{mant.descripcion_problema}</div>
        </div>
      )}

      {/* Solución si finalizado */}
      {esFinalizado&&mant.descripcion_solucion&&(
        <div style={{marginBottom:"1rem"}}>
          <p style={{color:"var(--text-secondary)",fontSize:"11px",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.4px",margin:"0 0 6px"}}>Solución aplicada</p>
          <div style={{background:"rgba(34,197,94,0.08)",border:"1px solid #22c55e",borderRadius:"10px",padding:"12px 14px",color:"var(--text-primary)",fontSize:"13px",lineHeight:1.6}}>{mant.descripcion_solucion}</div>
        </div>
      )}

      {/* Reprogramar info */}
      {mant.estado==="REPROGRAMAR"&&(
        <div style={{background:"rgba(239,68,68,0.08)",border:"1px solid #ef4444",borderRadius:"10px",padding:"12px 14px",marginBottom:"1rem"}}>
          <p style={{color:"#ef4444",fontSize:"11px",fontWeight:600,textTransform:"uppercase",margin:"0 0 6px"}}>Solicitud de reprogramación</p>
          {mant.motivo_reprogramar&&<p style={{margin:"0 0 4px",color:"var(--text-primary)",fontSize:"13px"}}><strong>Motivo:</strong> {mant.motivo_reprogramar}</p>}
          {mant.fecha_sugerida_rep&&<p style={{margin:0,color:"var(--text-primary)",fontSize:"13px"}}><strong>Fecha sugerida:</strong> {fmt(mant.fecha_sugerida_rep)}</p>}
        </div>
      )}

      {/* Pendiente confirmación */}
      {mant.estado==="PENDIENTE_CONFIRMACION"&&(
        <div style={{background:"rgba(245,158,11,0.08)",border:"1px solid #f59e0b",borderRadius:"12px",padding:"1rem",marginBottom:"1rem"}}>
          <p style={{color:"#f59e0b",fontWeight:700,fontSize:"13px",margin:"0 0 4px"}}>⏳ Esperando confirmación del responsable</p>
          <p style={{color:"var(--text-secondary)",fontSize:"12px",margin:0}}>El responsable fue notificado. Cuando confirme, el estado pasará a PROGRAMADO automáticamente.</p>
        </div>
      )}

      {/* ── ACCIONES ── */}

      {/* Reprogramar admin */}
      {mant.estado==="REPROGRAMAR"&&(
        <div style={{marginBottom:"1rem"}}>
          <p style={{color:"var(--text-secondary)",fontSize:"11px",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.4px",margin:"0 0 8px"}}>Fijar nueva fecha</p>
          <div style={{display:"flex",gap:"10px",alignItems:"flex-end"}}>
            <div style={{flex:1}}>
              <label style={S.lbl}>Nueva fecha programada *</label>
              <input type="date" style={S.inp} value={fechaN} onChange={e=>setFechaN(e.target.value)}/>
            </div>
            <button onClick={()=>{if(!fechaN)return setAlerta("Selecciona una fecha");onAction("REPROGRAMAR_ADMIN",{fecha_programada:fechaN});}} disabled={!fechaN||cargando} style={{...btnP,opacity:(!fechaN||cargando)?0.6:1}}>
              📅 Reprogramar
            </button>
          </div>
        </div>
      )}

      {/* Iniciar */}
      {["PROGRAMADO","PENDIENTE"].includes(mant.estado)&&(
        <div style={{marginBottom:"1rem"}}>
          <button onClick={()=>onAction("INICIAR")} disabled={cargando} style={{...btnP,opacity:cargando?0.6:1}}>
            ▶ Iniciar mantenimiento
          </button>
        </div>
      )}

      {/* En proceso / Pausado */}
      {["EN_PROCESO","PAUSADO"].includes(mant.estado)&&(
        <div style={{display:"flex",flexDirection:"column",gap:"1rem",marginBottom:"1rem"}}>

          {/* Pausar / Reanudar */}
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
            {mant.estado==="EN_PROCESO"&&(
              <button onClick={()=>onAction("PAUSAR",{observacion:obs})} disabled={cargando} style={{...btnWarn,opacity:cargando?0.6:1}}>⏸ Pausar</button>
            )}
            {mant.estado==="PAUSADO"&&(
              <button onClick={()=>onAction("INICIAR")} disabled={cargando} style={{...btnP,opacity:cargando?0.6:1}}>▶ Reanudar</button>
            )}
          </div>

          {/* Repuestos */}
          <div style={{background:"var(--bg-surface2)",border:"1px solid var(--border)",borderRadius:"12px",padding:"1rem"}}>
            <p style={{fontWeight:700,color:"var(--text-primary)",fontSize:"13px",margin:"0 0 12px"}}>🔩 Registrar repuestos utilizados</p>
            <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"10px"}}>
              <div style={{flex:2,minWidth:"180px"}}>
                <label style={S.lbl}>Repuesto</label>
                <select style={S.inp} value={repSel.repuesto_id} onChange={e=>setRepSel(r=>({...r,repuesto_id:e.target.value}))}>
                  <option value="">Seleccionar...</option>
                  {repCat.map(r=><option key={r.id} value={r.id}>{r.nombre} — Stock: {r.stock} — Bs {Number(r.precio||0).toFixed(2)}</option>)}
                </select>
              </div>
              <div style={{minWidth:"80px"}}>
                <label style={S.lbl}>Cant.</label>
                <input type="number" min={1} style={S.inp} value={repSel.cantidad} onChange={e=>setRepSel(r=>({...r,cantidad:parseInt(e.target.value)||1}))}/>
              </div>
              <div style={{display:"flex",alignItems:"flex-end"}}>
                <button onClick={agregarRep} style={{...btnP,padding:"10px 14px"}}>+ Agregar</button>
              </div>
            </div>

            {repUsados.length>0&&(
              <>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:"13px"}}>
                  <thead>
                    <tr style={{borderBottom:"1px solid var(--border)"}}>
                      {["Repuesto","Cant.","P.Unit.","Subtotal",""].map(h=>(
                        <th key={h} style={{padding:"7px 10px",textAlign:"left",color:"var(--text-secondary)",fontWeight:600,fontSize:"11px",textTransform:"uppercase"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {repUsados.map(r=>(
                      <tr key={r.repuesto_id} style={{borderBottom:"1px solid var(--border)"}}>
                        <td style={{padding:"8px 10px",fontWeight:600,color:"var(--text-primary)"}}>{r.nombre}</td>
                        <td style={{padding:"8px 10px",color:"var(--text-secondary)"}}>{r.cantidad}</td>
                        <td style={{padding:"8px 10px",color:"var(--text-secondary)"}}>Bs {r.precio.toFixed(2)}</td>
                        <td style={{padding:"8px 10px",color:"var(--accent-text)",fontWeight:700}}>Bs {(r.cantidad*r.precio).toFixed(2)}</td>
                        <td style={{padding:"8px 10px"}}>
                          <button onClick={()=>quitarRep(r.repuesto_id)} style={{background:"rgba(239,68,68,0.12)",border:"1px solid #ef4444",color:"#ef4444",borderRadius:"6px",padding:"3px 8px",cursor:"pointer",fontSize:"12px"}}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{display:"flex",justifyContent:"flex-end",padding:"8px 10px 0",fontWeight:700,color:"var(--accent-text)",fontSize:"15px"}}>
                  Total repuestos: Bs {totalRep.toFixed(2)}
                </div>
              </>
            )}
          </div>

          {/* Finalizar */}
          <div style={{background:"var(--bg-surface2)",border:"2px solid #22c55e",borderRadius:"14px",padding:"1.25rem"}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"14px"}}>
              <span style={{fontSize:"20px"}}>✅</span>
              <p style={{fontWeight:700,color:"var(--text-primary)",fontSize:"15px",margin:0}}>Finalizar mantenimiento</p>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
              <div>
                <label style={S.lbl}>Descripción de la solución / trabajo realizado *</label>
                <textarea rows={4} style={{...S.inp,resize:"vertical"}} value={solucion} onChange={e=>setSolucion(e.target.value)} placeholder="Describe detalladamente el trabajo realizado, piezas reemplazadas, configuraciones realizadas..."/>
              </div>
              <div style={{display:"flex",gap:"12px",alignItems:"flex-end"}}>
                <div style={{flex:1}}>
                  <label style={S.lbl}>Costo total del mantenimiento (Bs)</label>
                  <input type="number" min={0} step="0.01" style={S.inp} value={costo} onChange={e=>setCosto(e.target.value)} placeholder="0.00"/>
                </div>
                <button
                  onClick={()=>{
                    if (!solucion.trim()) return setAlerta("Describe la solución aplicada antes de finalizar");
                    onAction("FINALIZAR",{descripcion_solucion:solucion,costo:parseFloat(costo)||0,repuestos:repUsados});
                  }}
                  disabled={cargando}
                  style={{...btnOk,padding:"10px 24px",fontSize:"15px",opacity:cargando?0.6:1}}
                >
                  {cargando?"Finalizando...":"✅ Finalizar"}
                </button>
              </div>
              {repUsados.length>0&&(
                <p style={{color:"var(--text-muted)",fontSize:"12px",margin:0}}>
                  ℹ️ Se descontarán {repUsados.length} repuesto(s) del inventario al finalizar.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Repuestos ya registrados */}
      {mant.repuestos?.length>0&&(
        <div style={{marginBottom:"1rem"}}>
          <p style={{color:"var(--text-secondary)",fontSize:"11px",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.4px",margin:"0 0 8px"}}>Repuestos registrados en este mantenimiento</p>
          <div style={{border:"1px solid var(--border)",borderRadius:"10px",overflow:"hidden"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:"13px"}}>
              <thead>
                <tr style={{background:"var(--bg-surface2)",borderBottom:"1px solid var(--border)"}}>
                  {["Repuesto","Tipo","Cant.","P.Unit.","Subtotal"].map(h=>(
                    <th key={h} style={{padding:"8px 12px",textAlign:"left",color:"var(--text-secondary)",fontWeight:600,fontSize:"11px",textTransform:"uppercase"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mant.repuestos.map((r,i)=>(
                  <tr key={i} style={{borderBottom:"1px solid var(--border)"}}>
                    <td style={{padding:"8px 12px",fontWeight:600,color:"var(--text-primary)"}}>{r.nombre}</td>
                    <td style={{padding:"8px 12px",color:"var(--text-secondary)"}}>{r.tipo||"—"}</td>
                    <td style={{padding:"8px 12px",color:"var(--text-secondary)"}}>{r.cantidad}</td>
                    <td style={{padding:"8px 12px",color:"var(--text-secondary)"}}>Bs {Number(r.precio_unitario||0).toFixed(2)}</td>
                    <td style={{padding:"8px 12px",color:"var(--accent-text)",fontWeight:700}}>Bs {(r.cantidad*(r.precio_unitario||0)).toFixed(2)}</td>
                  </tr>
                ))}
                <tr style={{background:"var(--bg-surface)",borderTop:"2px solid var(--border)"}}>
                  <td colSpan={4} style={{padding:"10px 12px",textAlign:"right",fontWeight:700,color:"var(--text-secondary)",fontSize:"12px",textTransform:"uppercase"}}>TOTAL:</td>
                  <td style={{padding:"10px 12px",fontWeight:700,color:"var(--accent-text)",fontSize:"15px"}}>
                    Bs {mant.repuestos.reduce((a,r)=>a+r.cantidad*(r.precio_unitario||0),0).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Historial */}
      {!loadH&&historial.length>0&&(
        <div>
          <p style={{color:"var(--text-secondary)",fontSize:"11px",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.4px",margin:"0 0 10px"}}>
            📋 Historial de acciones ({historial.length})
          </p>
          <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
            {historial.map((h,i)=>(
              <div key={i} style={{display:"flex",gap:"10px",padding:"10px 12px",background:"var(--bg-surface2)",border:"1px solid var(--border)",borderRadius:"10px"}}>
                <span style={{fontSize:"16px",flexShrink:0}}>{icoH(h.accion)}</span>
                <div style={{flex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"4px"}}>
                    <p style={{margin:0,color:"var(--text-primary)",fontWeight:700,fontSize:"13px"}}>
                      {h.accion?.replace(/_/g," ")}
                      {h.estado_anterior&&h.estado_nuevo&&(
                        <span style={{color:"var(--text-muted)",fontWeight:400,fontSize:"12px"}}> · {h.estado_anterior} → {h.estado_nuevo}</span>
                      )}
                    </p>
                    <span style={{color:"var(--text-muted)",fontSize:"11px",whiteSpace:"nowrap"}}>{fmtFull(h.fecha)}</span>
                  </div>
                  {h.observacion&&<p style={{margin:"3px 0 0",color:"var(--text-secondary)",fontSize:"12px"}}>{h.observacion}</p>}
                  {h.usuario_nombre&&<p style={{margin:"2px 0 0",color:"var(--accent-text)",fontSize:"11px",fontWeight:500}}>por {h.usuario_nombre}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// MODAL NUEVO MANTENIMIENTO
// ─────────────────────────────────────────────────────────────
function ModalNuevo({ sol, equipos, tecnicos, repuestosCat, currentUser, onClose, onGuardado }) {
  const rol = currentUser?.rol;
  const [alerta,   setAlerta]   = useState("");
  const [buscarEq, setBuscarEq] = useState("");
  const [busy,     setBusy]     = useState(false);
  const [form,     setForm]     = useState({
    solicitud_id:         sol?.id        || "",
    equipo_id:            sol?.equipo_id || "",
    tipo:                 "CORRECTIVO",
    descripcion_problema: sol?.descripcion || "",
    descripcion_solucion: "",
    tecnico:              rol==="EMPLEADO" ? seg(currentUser?.nombre,currentUser?.apellido) : "",
    tecnico_usuario_id:   rol==="EMPLEADO" ? currentUser?.id : "",
    costo:                "",
    estado:               sol ? "EN_PROCESO" : "EN_PROCESO",
    fecha_programada:     "",
    repuestos:            [],
  });
  const [repSel, setRepSel] = useState({repuesto_id:"",cantidad:1});

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const eqFilt = equipos.filter(e=>{
    const q = buscarEq.toLowerCase();
    return (e.codigo||"").toLowerCase().includes(q)||(e.nombre||"").toLowerCase().includes(q)||(e.tipo||"").toLowerCase().includes(q);
  });
  const eqSel = equipos.find(e=>String(e.id)===String(form.equipo_id));

  const agregarRep = () => {
    if (!repSel.repuesto_id) return setAlerta("Selecciona un repuesto");
    const cat = repuestosCat.find(r=>String(r.id)===String(repSel.repuesto_id));
    if (!cat) return;
    if (form.repuestos.find(r=>String(r.repuesto_id)===String(cat.id))) return setAlerta("Este repuesto ya fue agregado");
    if (parseInt(repSel.cantidad)>cat.stock) return setAlerta(`Stock insuficiente para "${cat.nombre}". Disponible: ${cat.stock}`);
    setAlerta("");
    setForm(f=>({...f,repuestos:[...f.repuestos,{repuesto_id:cat.id,nombre:cat.nombre,precio:Number(cat.precio||0),cantidad:parseInt(repSel.cantidad)||1}]}));
    setRepSel({repuesto_id:"",cantidad:1});
  };

  const quitarRep = (id) => setForm(f=>({...f,repuestos:f.repuestos.filter(r=>r.repuesto_id!==id)}));

  const guardar = async () => {
    if (!form.equipo_id)            return setAlerta("Selecciona un equipo");
    if (!form.descripcion_problema) return setAlerta("La descripción del problema es obligatoria");
    setBusy(true); setAlerta("");
    try {
      await api.post("/mantenimientos",{
        ...form,
        descripcion: form.descripcion_problema,
        repuestos: form.repuestos.map(r=>({repuesto_id:r.repuesto_id,cantidad:r.cantidad,precio:r.precio})),
      });
      onGuardado();
      onClose();
    } catch(e) {
      setAlerta(e.response?.data?.message||"Error al guardar");
    } finally { setBusy(false); }
  };

  const totalRep = form.repuestos.reduce((a,r)=>a+r.cantidad*r.precio,0);

  return (
    <Modal title="🔧 Registrar Mantenimiento" subtitle={sol?`Solicitud #${sol.id} — ${sol.equipo_codigo}`:"Nuevo mantenimiento manual"} onClose={onClose} width="860px">
      <Alerta text={alerta} onClose={()=>setAlerta("")}/>

      {/* Info solicitud */}
      {sol?.usuario_nombre&&(
        <div style={{background:"var(--bg-surface2)",border:"1px solid var(--border)",borderRadius:"12px",padding:"12px 16px",marginBottom:"1.25rem",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:"10px"}}>
          <InfoCard label="Personal"    value={seg(sol.usuario_nombre,sol.usuario_apellido)}/>
          <InfoCard label="Cargo"       value={sol.cargo||"—"}/>
          <InfoCard label="Área"        value={sol.area||"—"}/>
          <InfoCard label="Sucursal"    value={sol.sucursal||"—"}/>
          <InfoCard label="Equipo"      value={`${sol.equipo_codigo} — ${sol.equipo_nombre}`}/>
          <InfoCard label="Tipo equipo" value={sol.equipo_tipo||"—"}/>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"14px",marginBottom:"14px"}}>

        {/* Equipo */}
        {form.equipo_id ? (
          <div style={{gridColumn:"1/-1"}}>
            <label style={S.lbl}>Equipo seleccionado</label>
            <div style={{display:"flex",alignItems:"center",gap:"10px",background:"var(--bg-surface2)",border:"1px solid var(--border)",borderRadius:"10px",padding:"10px 14px"}}>
              <div style={{flex:1}}>
                <span style={{color:"var(--accent-text)",fontWeight:700,marginRight:"10px"}}>{eqSel?.codigo}</span>
                <span style={{color:"var(--text-primary)"}}>{eqSel?.nombre}</span>
                {eqSel?.tipo&&<span style={{color:"var(--text-muted)",fontSize:"12px",marginLeft:"8px"}}>· {eqSel.tipo}</span>}
              </div>
              {!sol&&<button onClick={()=>{set("equipo_id","");setBuscarEq("");}} style={{...btnDng,padding:"4px 10px",fontSize:"12px"}}>Cambiar</button>}
            </div>
          </div>
        ) : (
          <div style={{gridColumn:"1/-1"}}>
            <label style={S.lbl}>Equipo * — escribe para buscar</label>
            <input style={{...S.inp,marginBottom:"8px"}} placeholder="🔍 Código, nombre o tipo..." value={buscarEq} onChange={e=>setBuscarEq(e.target.value)}/>
            {buscarEq&&(
              <div style={{border:"1px solid var(--border)",borderRadius:"10px",maxHeight:"210px",overflowY:"auto",background:"var(--bg-surface2)"}}>
                {eqFilt.length===0 ? (
                  <div style={{padding:"1.5rem",textAlign:"center",color:"var(--text-muted)",fontSize:"13px"}}>Sin resultados para "{buscarEq}"</div>
                ) : eqFilt.map(e=>(
                  <div key={e.id} onClick={()=>{set("equipo_id",e.id);setBuscarEq("");}}
                    style={{padding:"10px 14px",borderBottom:"1px solid var(--border)",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}
                    onMouseEnter={ev=>ev.currentTarget.style.background="var(--accent-light)"}
                    onMouseLeave={ev=>ev.currentTarget.style.background="transparent"}
                  >
                    <div>
                      <span style={{color:"var(--accent-text)",fontWeight:700,fontSize:"13px",marginRight:"10px"}}>{e.codigo}</span>
                      <span style={{color:"var(--text-primary)",fontSize:"13px"}}>{e.nombre}</span>
                      {e.tipo&&<span style={{color:"var(--text-muted)",fontSize:"12px",marginLeft:"8px"}}>· {e.tipo}</span>}
                    </div>
                    <span style={{fontSize:"11px",fontWeight:600,color:e.estado==="DISPONIBLE"?"#22c55e":e.estado==="ASIGNADO"?"#f59e0b":"#ef4444",background:e.estado==="DISPONIBLE"?"rgba(34,197,94,0.12)":e.estado==="ASIGNADO"?"rgba(245,158,11,0.12)":"rgba(239,68,68,0.12)",border:`1px solid ${e.estado==="DISPONIBLE"?"#22c55e":e.estado==="ASIGNADO"?"#f59e0b":"#ef4444"}`,borderRadius:"6px",padding:"2px 8px"}}>
                      {e.estado}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tipo */}
        <div>
          <label style={S.lbl}>Tipo de mantenimiento</label>
          <select style={S.inp} value={form.tipo} onChange={e=>set("tipo",e.target.value)}>
            <option value="CORRECTIVO">Correctivo</option>
            <option value="PREVENTIVO">Preventivo</option>
          </select>
        </div>

        {/* Técnico */}
        <div>
          <label style={S.lbl}>Técnico responsable</label>
          {rol==="EMPLEADO" ? (
            <input style={{...S.inp,opacity:0.75}} value={form.tecnico} disabled/>
          ) : (
            <select style={S.inp} value={form.tecnico_usuario_id}
              onChange={e=>{const t=tecnicos.find(x=>String(x.id)===e.target.value);setForm(f=>({...f,tecnico_usuario_id:e.target.value,tecnico:t?seg(t.nombre,t.apellido):""}));}}>
              <option value="">Sin asignar</option>
              {tecnicos.map(t=>(
                <option key={t.id} value={t.id}>{seg(t.nombre,t.apellido)}{t.cargo?` — ${t.cargo}`:""}</option>
              ))}
            </select>
          )}
        </div>

        {/* Estado inicial */}
        <div>
          <label style={S.lbl}>Estado inicial</label>
          {sol ? (
            <select style={S.inp} value={form.estado} onChange={e=>set("estado",e.target.value)}>
              <option value="EN_PROCESO">⚙️ En proceso (iniciar ahora)</option>
              <option value="PROGRAMADO">📅 Programado</option>
              <option value="FINALIZADO">✅ Finalizado</option>
            </select>
          ) : (
            <select style={S.inp} value={form.estado} onChange={e=>set("estado",e.target.value)}>
              <option value="EN_PROCESO">⚙️ En proceso (iniciar ahora)</option>
              <option value="PROGRAMADO">📅 Programado</option>
              <option value="PENDIENTE_CONFIRMACION">⏳ Pend. confirmación responsable</option>
              <option value="FINALIZADO">✅ Finalizado</option>
            </select>
          )}
        </div>

        {/* Fecha programada */}
        <div>
          <label style={S.lbl}>Fecha programada (opcional)</label>
          <input type="date" style={S.inp} value={form.fecha_programada} onChange={e=>set("fecha_programada",e.target.value)}/>
          {form.estado==="PENDIENTE_CONFIRMACION"&&form.fecha_programada&&(
            <p style={{color:"var(--accent-text)",fontSize:"11px",margin:"4px 0 0"}}>ℹ️ El responsable será notificado para confirmar disponibilidad</p>
          )}
        </div>

        {/* Costo */}
        <div>
          <label style={S.lbl}>Costo estimado (Bs)</label>
          <input type="number" min={0} step="0.01" style={S.inp} placeholder="0.00" value={form.costo} onChange={e=>set("costo",e.target.value)}/>
        </div>

        {/* Descripción */}
        <div style={{gridColumn:"1/-1"}}>
          <label style={S.lbl}>📋 Descripción del problema *</label>
          <textarea rows={3} style={{...S.inp,resize:"vertical"}} value={form.descripcion_problema} onChange={e=>set("descripcion_problema",e.target.value)} placeholder="Describe el problema detectado, síntomas, error reportado..."/>
        </div>

        {/* Solución */}
        <div style={{gridColumn:"1/-1"}}>
          <label style={S.lbl}>🔧 Solución / trabajo realizado (opcional)</label>
          <textarea rows={3} style={{...S.inp,resize:"vertical"}} value={form.descripcion_solucion} onChange={e=>set("descripcion_solucion",e.target.value)} placeholder="Si ya se realizó el trabajo, descríbelo aquí..."/>
        </div>
      </div>

      {/* Repuestos */}
      <div style={{background:"var(--bg-surface2)",border:"1px solid var(--border)",borderRadius:"12px",padding:"1rem",marginBottom:"1.25rem"}}>
        <p style={{fontWeight:700,color:"var(--text-primary)",fontSize:"13px",margin:"0 0 12px"}}>
          🔩 Repuestos utilizados {form.repuestos.length>0?`(${form.repuestos.length})`:""}
        </p>
        <div style={{display:"flex",gap:"10px",flexWrap:"wrap",marginBottom:"10px"}}>
          <div style={{flex:2,minWidth:"180px"}}>
            <label style={S.lbl}>Repuesto</label>
            <select style={S.inp} value={repSel.repuesto_id} onChange={e=>setRepSel(r=>({...r,repuesto_id:e.target.value}))}>
              <option value="">Seleccionar repuesto...</option>
              {repuestosCat.map(r=>(
                <option key={r.id} value={r.id}>{r.nombre} — Stock: {r.stock} — Bs {Number(r.precio||0).toFixed(2)}</option>
              ))}
            </select>
          </div>
          <div style={{minWidth:"80px"}}>
            <label style={S.lbl}>Cant.</label>
            <input type="number" min={1} style={S.inp} value={repSel.cantidad} onChange={e=>setRepSel(r=>({...r,cantidad:parseInt(e.target.value)||1}))}/>
          </div>
          <div style={{display:"flex",alignItems:"flex-end"}}>
            <button onClick={agregarRep} style={btnP}>+ Agregar</button>
          </div>
        </div>
        {form.repuestos.length>0 ? (
          <>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:"13px"}}>
              <thead>
                <tr style={{borderBottom:"1px solid var(--border)"}}>
                  {["Repuesto","Cant.","P.Unit.","Subtotal",""].map(h=>(
                    <th key={h} style={{padding:"8px 10px",textAlign:"left",color:"var(--text-secondary)",fontWeight:600,fontSize:"11px",textTransform:"uppercase"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {form.repuestos.map(r=>(
                  <tr key={r.repuesto_id} style={{borderBottom:"1px solid var(--border)"}}>
                    <td style={{padding:"8px 10px",fontWeight:600,color:"var(--text-primary)"}}>{r.nombre}</td>
                    <td style={{padding:"8px 10px",color:"var(--text-secondary)"}}>{r.cantidad}</td>
                    <td style={{padding:"8px 10px",color:"var(--text-secondary)"}}>Bs {r.precio.toFixed(2)}</td>
                    <td style={{padding:"8px 10px",color:"var(--accent-text)",fontWeight:700}}>Bs {(r.cantidad*r.precio).toFixed(2)}</td>
                    <td style={{padding:"8px 10px"}}>
                      <button onClick={()=>quitarRep(r.repuesto_id)} style={{background:"rgba(239,68,68,0.12)",border:"1px solid #ef4444",color:"#ef4444",borderRadius:"6px",padding:"3px 8px",cursor:"pointer",fontSize:"12px"}}>✕</button>
                    </td>
                  </tr>
                ))}
                <tr style={{borderTop:"2px solid var(--border)",background:"var(--bg-surface)"}}>
                  <td colSpan={3} style={{padding:"10px",textAlign:"right",fontWeight:700,color:"var(--text-secondary)",fontSize:"12px",textTransform:"uppercase"}}>TOTAL:</td>
                  <td style={{padding:"10px",color:"var(--accent-text)",fontWeight:700,fontSize:"15px"}}>Bs {totalRep.toFixed(2)}</td>
                  <td/>
                </tr>
              </tbody>
            </table>
          </>
        ) : (
          <p style={{color:"var(--text-muted)",fontSize:"12px",textAlign:"center",margin:0}}>Sin repuestos agregados</p>
        )}
      </div>

      <div style={{display:"flex",gap:"10px",justifyContent:"flex-end"}}>
        <button style={btnG} onClick={onClose}>Cancelar</button>
        <button onClick={guardar} disabled={busy} style={{...btnP,opacity:busy?0.6:1,padding:"10px 24px"}}>
          {busy?"Guardando...":"✅ Registrar Mantenimiento"}
        </button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function Reparaciones() {
  const currentUser = JSON.parse(localStorage.getItem("user")||"{}");
  const rol         = currentUser.rol;

  const [tab,            setTab]            = useState("mantenimientos");
  const [solicitudes,    setSolicitudes]    = useState([]);
  const [mantenimientos, setMantenimientos] = useState([]);
  const [equipos,        setEquipos]        = useState([]);
  const [repuestosCat,   setRepuestosCat]   = useState([]);
  const [tecnicos,       setTecnicos]       = useState([]);
  const [reportes,       setReportes]       = useState([]);
  const [totales,        setTotales]        = useState({});
  const [loading,        setLoading]        = useState(true);
  const [cargando,       setCargando]       = useState(false);
  const [msg,            setMsg]            = useState({type:"",text:""});
  const [confirm,        setConfirm]        = useState(null);
  const [modalNuevo,     setModalNuevo]     = useState(null);
  const [modalDetalle,   setModalDetalle]   = useState(null);
  const [modalReasig,    setModalReasig]    = useState(null);
  const [reasigForm,     setReasigForm]     = useState({tecnico:"",tecnico_usuario_id:""});
  const [buscarMant,     setBuscarMant]     = useState("");
  const [filtroEstado,   setFiltroEstado]   = useState("TODOS");
  const [filtros,        setFiltros]        = useState({equipo:"",usuario:"",estado:"",fecha_ini:"",fecha_fin:""});

  const showMsg = (type,text) => {
    setMsg({type,text});
    setTimeout(()=>setMsg({type:"",text:""}),4000);
  };

  const load = useCallback(async()=>{
    setLoading(true);
    try {
      const [sol,man,eq,rep] = await Promise.all([
        api.get("/mantenimientos/solicitudes"),
        api.get("/mantenimientos"),
        api.get("/mantenimientos/equipos"),
        api.get("/mantenimientos/repuestos"),
      ]);
      let tecs=[];
      try{const r=await api.get("/empleados/tecnicos");tecs=r.data||[];}catch{}

      setSolicitudes(Array.isArray(sol.data)?sol.data:[]);
      const sorted=(Array.isArray(man.data)?man.data:[]).sort((a,b)=>{
        const oa=ORDEN[a.estado]||99,ob=ORDEN[b.estado]||99;
        if(oa!==ob)return oa-ob;
        if(a.fecha_programada&&b.fecha_programada)return new Date(a.fecha_programada)-new Date(b.fecha_programada);
        return b.id-a.id;
      });
      setMantenimientos(sorted);
      setEquipos(Array.isArray(eq.data)?eq.data:[]);
      setRepuestosCat(Array.isArray(rep.data)?rep.data:[]);
      setTecnicos(tecs);
    }catch{showMsg("error","Error cargando datos");}
    finally{setLoading(false);}
  },[]);

  useEffect(()=>{load();},[load]);

  const loadReportes = async()=>{
    try{
      const p=new URLSearchParams();
      if(filtros.equipo)    p.append("equipo",    filtros.equipo);
      if(filtros.usuario)   p.append("usuario",   filtros.usuario);
      if(filtros.estado)    p.append("estado",    filtros.estado);
      if(filtros.fecha_ini) p.append("fecha_ini", filtros.fecha_ini);
      if(filtros.fecha_fin) p.append("fecha_fin", filtros.fecha_fin);
      const res=await api.get(`/mantenimientos/reportes?${p}`);
      setReportes(res.data.data||[]);
      setTotales(res.data.totales||{});
    }catch{showMsg("error","Error cargando reportes");}
  };
  useEffect(()=>{if(tab==="reportes")loadReportes();},[tab]);

  const accionMant = async(accion,extra={})=>{
    if(!modalDetalle)return;
    setCargando(true);
    try{
      const id=modalDetalle.id;
      const map={
        INICIAR:           ()=>api.put(`/mantenimientos/${id}/iniciar`,          extra),
        PAUSAR:            ()=>api.put(`/mantenimientos/${id}/pausar`,           extra),
        FINALIZAR:         ()=>api.put(`/mantenimientos/${id}/finalizar`,        extra),
        REPROGRAMAR_ADMIN: ()=>api.put(`/mantenimientos/${id}/reprogramar-admin`,extra),
      };
      if(!map[accion])return;
      await map[accion]();
      showMsg("success","✅ Acción realizada correctamente");
      setModalDetalle(null);
      load();
    }catch(e){
      showMsg("error",e.response?.data?.message||"Error al ejecutar acción");
    }finally{setCargando(false);}
  };

  const reasignar = async()=>{
    try{
      await api.put(`/mantenimientos/reasignar/${modalReasig.id}`,reasigForm);
      showMsg("success","✅ Técnico reasignado");
      setModalReasig(null);load();
    }catch(e){showMsg("error",e.response?.data?.message||"Error");}
  };

  const mantFiltrados = mantenimientos.filter(m=>{
    const q=buscarMant.toLowerCase();
    const ok=filtroEstado==="TODOS"||m.estado===filtroEstado;
    return ok&&(
      (m.equipo_codigo||"").toLowerCase().includes(q)||
      (m.equipo_nombre||"").toLowerCase().includes(q)||
      (m.tecnico_nombre_completo||m.tecnico||"").toLowerCase().includes(q)||
      (m.responsable_nombre_completo||"").toLowerCase().includes(q)
    );
  });

  const solPend   = solicitudes.filter(s=>s.estado==="PENDIENTE").length;
  const reprogr   = mantenimientos.filter(m=>m.estado==="REPROGRAMAR");
  const resumen   = {
    pend_conf:   mantenimientos.filter(m=>m.estado==="PENDIENTE_CONFIRMACION").length,
    programados: mantenimientos.filter(m=>m.estado==="PROGRAMADO").length,
    en_proceso:  mantenimientos.filter(m=>m.estado==="EN_PROCESO").length,
    pausados:    mantenimientos.filter(m=>m.estado==="PAUSADO").length,
    reprogramar: mantenimientos.filter(m=>m.estado==="REPROGRAMAR").length,
    finalizados: mantenimientos.filter(m=>m.estado==="FINALIZADO").length,
  };

  const EFILTRO = [
    {k:"TODOS",l:"Todos"},
    {k:"EN_PROCESO",l:"En proceso"},
    {k:"PROGRAMADO",l:"Programado"},
    {k:"PENDIENTE_CONFIRMACION",l:"Pend. Confirm."},
    {k:"PAUSADO",l:"Pausado"},
    {k:"REPROGRAMAR",l:"Reprogramar"},
    {k:"FINALIZADO",l:"Finalizado"},
  ];

  const TABS=[
    {key:"mantenimientos",label:"🔧 Mantenimientos",badge:resumen.en_proceso+resumen.pausados+resumen.reprogramar},
    {key:"solicitudes",   label:"📋 Solicitudes",   badge:solPend},
    {key:"reportes",      label:"📊 Reportes",      badge:0},
  ];
  const tabsVis=rol==="EMPLEADO"?TABS.filter(t=>t.key==="mantenimientos"):TABS;

  return (
    <AdminLayout>
      <Toast msg={msg}/>

      {/* HEADER */}
      <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:"12px",marginBottom:"1.75rem"}}>
        <div>
          <h2 style={{fontWeight:700,margin:0,color:"var(--text-primary)",fontSize:"24px"}}>🛠️ Reparaciones y Mantenimiento</h2>
          <p style={{color:"var(--text-secondary)",margin:"4px 0 0",fontSize:"14px"}}>
            Gestión completa del ciclo de mantenimiento
            {rol==="EMPLEADO"&&(
              <span style={{marginLeft:"10px",background:"var(--accent-light)",color:"var(--accent-text)",borderRadius:"6px",padding:"2px 10px",fontSize:"11px",fontWeight:600}}>
                🔧 Técnico: {seg(currentUser.nombre,currentUser.apellido)}
              </span>
            )}
          </p>
        </div>
        <div style={{display:"flex",gap:"10px"}}>
          <button style={btnG} onClick={load}>🔄 Actualizar</button>
          <button style={btnP} onClick={()=>setModalNuevo("nuevo")}>+ Nuevo Mantenimiento</button>
        </div>
      </div>

      {/* STATS */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:"12px",marginBottom:"1.5rem"}}>
        <Stat label="En proceso"     value={resumen.en_proceso}  color="var(--accent-text)" icon="⚙️"/>
        <Stat label="Programados"    value={resumen.programados} color="#3b82f6"            icon="📅"/>
        <Stat label="Pend. confirm." value={resumen.pend_conf}   color="#f59e0b"            icon="⏳"/>
        <Stat label="Pausados"       value={resumen.pausados}    color="var(--text-muted)"  icon="⏸️"/>
        <Stat label="Reprogramar"    value={resumen.reprogramar} color="#ef4444"            icon="🔄"/>
        <Stat label="Finalizados"    value={resumen.finalizados} color="#22c55e"            icon="✅"/>
        <Stat label="Solicitudes"    value={solPend}             color="#f59e0b"            icon="📋"/>
      </div>

      {/* TABS */}
      <div style={{display:"flex",gap:"6px",marginBottom:"1.25rem",flexWrap:"wrap"}}>
        {tabsVis.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)} style={{padding:"9px 18px",borderRadius:"10px",border:tab===t.key?"none":"1px solid var(--border)",background:tab===t.key?"var(--accent)":"var(--bg-surface)",color:tab===t.key?"#fff":"var(--text-secondary)",fontWeight:600,fontSize:"13px",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:"6px"}}>
            {t.label}
            {t.badge>0&&<span style={{background:tab===t.key?"rgba(255,255,255,0.25)":"rgba(239,68,68,0.12)",color:tab===t.key?"#fff":"#ef4444",borderRadius:"999px",padding:"0 7px",fontSize:"11px",fontWeight:700}}>{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* ════ MANTENIMIENTOS ════ */}
      {tab==="mantenimientos"&&(
        <div>
          {/* Alertas reprogramación */}
          {reprogr.length>0&&(
            <div style={{marginBottom:"1.25rem",display:"flex",flexDirection:"column",gap:"8px"}}>
              {reprogr.map(m=>(
                <div key={m.id} style={{background:"rgba(239,68,68,0.08)",border:"1px solid #ef4444",borderRadius:"12px",padding:"12px 16px",display:"flex",alignItems:"center",gap:"12px",flexWrap:"wrap"}}>
                  <span style={{fontSize:"18px"}}>📅</span>
                  <div style={{flex:1}}>
                    <p style={{color:"#ef4444",fontWeight:700,margin:"0 0 2px",fontSize:"13px"}}>Reprogramación solicitada — {m.equipo_codigo} {m.equipo_nombre}</p>
                    <p style={{color:"var(--text-secondary)",fontSize:"12px",margin:0}}>
                      {m.motivo_reprogramar?`Motivo: ${m.motivo_reprogramar}`:"Sin motivo"}
                      {m.fecha_sugerida_rep?` · Sugerida: ${fmt(m.fecha_sugerida_rep)}`:""}
                    </p>
                  </div>
                  <button onClick={async()=>{try{const r=await api.get(`/mantenimientos/${m.id}`);setModalDetalle({...m,...r.data});}catch{setModalDetalle(m);}}} style={{...btnDng,padding:"6px 14px",fontSize:"12px"}}>📅 Reprogramar</button>
                </div>
              ))}
            </div>
          )}

          {/* Filtros */}
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"1rem",alignItems:"center"}}>
            <input style={{...S.inp,maxWidth:"260px"}} placeholder="🔍 Buscar equipo, técnico..." value={buscarMant} onChange={e=>setBuscarMant(e.target.value)}/>
            <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
              {EFILTRO.map(f=>(
                <button key={f.k} onClick={()=>setFiltroEstado(f.k)} style={{padding:"6px 12px",borderRadius:"8px",border:filtroEstado===f.k?"none":"1px solid var(--border)",background:filtroEstado===f.k?"var(--accent)":"var(--bg-surface)",color:filtroEstado===f.k?"#fff":"var(--text-secondary)",fontWeight:600,fontSize:"12px",cursor:"pointer",fontFamily:"inherit"}}>
                  {f.l}
                </button>
              ))}
            </div>
            <span style={{color:"var(--text-muted)",fontSize:"13px",marginLeft:"auto"}}>{mantFiltrados.length} registros</span>
          </div>

          <div style={S.surface}>
            {loading ? (
              <div style={{padding:"5rem",textAlign:"center",color:"var(--text-secondary)"}}>
                <div style={{fontSize:"40px",marginBottom:"12px"}}>⚙️</div>
                Cargando mantenimientos...
              </div>
            ) : (
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:"13px"}}>
                  <thead>
                    <tr style={{background:"var(--bg-surface2)",borderBottom:"2px solid var(--border)"}}>
                      {["#","Equipo","Tipo","Estado","Técnico","Responsable","F. Programada","F. Inicio","Riesgo IA","Costo","Acciones"].map(h=>(
                        <th key={h} style={{padding:"11px 14px",textAlign:"left",color:"var(--text-secondary)",fontWeight:600,fontSize:"11px",textTransform:"uppercase",letterSpacing:"0.5px",whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mantFiltrados.length===0 ? (
                      <tr><td colSpan={11} style={{padding:"5rem",textAlign:"center",color:"var(--text-secondary)"}}>
                        <div style={{fontSize:"52px",marginBottom:"14px"}}>📭</div>
                        <p style={{margin:0,fontWeight:600,fontSize:"15px"}}>Sin mantenimientos</p>
                        <p style={{margin:"4px 0 0",fontSize:"13px"}}>Registra el primero con el botón de arriba</p>
                      </td></tr>
                    ) : mantFiltrados.map(m=>(
                      <tr key={m.id} style={{borderBottom:"1px solid var(--border)",transition:"background 0.1s"}}
                        onMouseEnter={e=>e.currentTarget.style.background="var(--hover,rgba(108,99,255,0.03))"}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                      >
                        <td style={{padding:"12px 14px",color:"var(--text-muted)",fontSize:"12px"}}>#{m.id}</td>
                        <td style={{padding:"12px 14px"}}>
                          <p style={{margin:0,color:"var(--accent-text)",fontWeight:700,fontSize:"13px"}}>{m.equipo_codigo}</p>
                          <p style={{margin:0,color:"var(--text-secondary)",fontSize:"11px"}}>{m.equipo_nombre}</p>
                          {m.equipo_tipo&&<p style={{margin:0,color:"var(--text-muted)",fontSize:"10px"}}>{m.equipo_tipo}</p>}
                        </td>
                        <td style={{padding:"12px 14px",color:"var(--text-secondary)",fontSize:"12px"}}>{m.tipo||"—"}</td>
                        <td style={{padding:"12px 14px"}}><Pill estado={m.estado}/></td>
                        <td style={{padding:"12px 14px",color:"var(--text-secondary)",fontSize:"12px"}}>
                          {m.tecnico_nombre_completo||m.tecnico||"—"}
                          {rol==="EMPLEADO"&&m.tecnico_usuario_id===currentUser.id&&(
                            <span style={{display:"block",background:"rgba(34,197,94,0.12)",color:"#22c55e",border:"1px solid #22c55e",borderRadius:"4px",padding:"1px 6px",fontSize:"10px",fontWeight:600,marginTop:"3px",width:"fit-content"}}>✅ Tú</span>
                          )}
                        </td>
                        <td style={{padding:"12px 14px",color:"var(--text-secondary)",fontSize:"12px"}}>{m.responsable_nombre_completo||"—"}</td>
                        <td style={{padding:"12px 14px",fontSize:"12px"}}>
                          {m.fecha_programada ? (
                            <span style={{color:new Date(m.fecha_programada)<new Date()&&!["FINALIZADO","RECHAZADO"].includes(m.estado)?"#ef4444":"var(--text-secondary)"}}>
                              {fmt(m.fecha_programada)}
                            </span>
                          ):"—"}
                        </td>
                        <td style={{padding:"12px 14px",color:"var(--text-muted)",fontSize:"12px",whiteSpace:"nowrap"}}>{m.fecha_inicio?fmtFull(m.fecha_inicio):"—"}</td>
                        <td style={{padding:"12px 14px",textAlign:"center"}}>
                          {m.nivel_riesgo_ia?(
                            <span style={{background:"rgba(239,68,68,0.12)",color:"#ef4444",border:"1px solid #ef4444",borderRadius:"6px",padding:"2px 8px",fontSize:"11px",fontWeight:600,whiteSpace:"nowrap"}}>⚠️ {m.nivel_riesgo_ia}</span>
                          ):"—"}
                        </td>
                        <td style={{padding:"12px 14px",color:"#22c55e",fontWeight:600}}>{fmtBs(m.costo)}</td>
                        <td style={{padding:"12px 14px"}}>
                          <div style={{display:"flex",gap:"5px"}}>
                            <button title="Ver detalles y gestionar"
                              style={{background:"var(--accent-light)",border:"1px solid var(--accent)",color:"var(--accent-text)",borderRadius:"8px",padding:"5px 10px",cursor:"pointer",fontSize:"13px"}}
                              onClick={async()=>{try{const r=await api.get(`/mantenimientos/${m.id}`);setModalDetalle({...m,...r.data});}catch{setModalDetalle(m);}}}
                            >👁</button>
                            {rol==="ADMIN"&&["EN_PROCESO","PROGRAMADO","PAUSADO"].includes(m.estado)&&(
                              <button title="Reasignar técnico"
                                style={{background:"rgba(245,158,11,0.12)",border:"1px solid #f59e0b",color:"#f59e0b",borderRadius:"8px",padding:"5px 10px",cursor:"pointer",fontSize:"13px"}}
                                onClick={()=>{setModalReasig(m);setReasigForm({tecnico:m.tecnico||"",tecnico_usuario_id:m.tecnico_usuario_id||"",});}}
                              >🔄</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════ SOLICITUDES ════ */}
      {tab==="solicitudes"&&(
        <div>
          {reprogr.length>0&&(
            <div style={{background:"rgba(239,68,68,0.08)",border:"1px solid #ef4444",borderRadius:"12px",padding:"12px 16px",marginBottom:"1.25rem",display:"flex",alignItems:"center",gap:"10px"}}>
              <span style={{fontSize:"20px"}}>🔄</span>
              <div style={{flex:1}}>
                <p style={{color:"#ef4444",fontWeight:700,margin:"0 0 2px",fontSize:"14px"}}>{reprogr.length} mantenimiento(s) requieren reprogramación</p>
                <p style={{color:"var(--text-secondary)",fontSize:"12px",margin:0}}>Ve al tab Mantenimientos para fijar la nueva fecha.</p>
              </div>
              <button onClick={()=>setTab("mantenimientos")} style={{...btnDng,padding:"6px 14px",fontSize:"12px"}}>Ver →</button>
            </div>
          )}

          <div style={S.surface}>
            <div style={{padding:"1rem 1.25rem",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <h5 style={{fontWeight:600,margin:0,color:"var(--text-primary)"}}>Solicitudes de Mantenimiento</h5>
              <span style={{color:"var(--text-secondary)",fontSize:"13px"}}>{solPend} pendiente{solPend!==1?"s":""}</span>
            </div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:"13px"}}>
                <thead>
                  <tr style={{background:"var(--bg-surface2)",borderBottom:"2px solid var(--border)"}}>
                    {["#","Usuario","Área","Sucursal","Equipo","Descripción","Prioridad","Fecha","Estado","Acción"].map(h=>(
                      <th key={h} style={{padding:"11px 14px",textAlign:"left",color:"var(--text-secondary)",fontWeight:600,fontSize:"11px",textTransform:"uppercase",letterSpacing:"0.5px"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {solicitudes.length===0 ? (
                    <tr><td colSpan={10} style={{padding:"4rem",textAlign:"center",color:"var(--text-secondary)"}}>
                      <div style={{fontSize:"48px",marginBottom:"12px"}}>📭</div>
                      <p style={{margin:0,fontWeight:600}}>Sin solicitudes</p>
                    </td></tr>
                  ) : solicitudes.map(s=>(
                    <tr key={s.id} style={{borderBottom:"1px solid var(--border)"}}>
                      <td style={{padding:"12px 14px",color:"var(--text-muted)",fontSize:"12px"}}>#{s.id}</td>
                      <td style={{padding:"12px 14px"}}>
                        <p style={{margin:0,color:"var(--text-primary)",fontWeight:500}}>{seg(s.usuario_nombre,s.usuario_apellido)}</p>
                        <p style={{margin:0,color:"var(--text-muted)",fontSize:"11px"}}>{s.usuario_email}</p>
                      </td>
                      <td style={{padding:"12px 14px",color:"var(--text-secondary)",fontSize:"12px"}}>{s.area||"—"}</td>
                      <td style={{padding:"12px 14px",color:"var(--text-secondary)",fontSize:"12px"}}>{s.sucursal||"—"}</td>
                      <td style={{padding:"12px 14px"}}>
                        <p style={{margin:0,color:"var(--accent-text)",fontWeight:600,fontSize:"13px"}}>{s.equipo_codigo}</p>
                        <p style={{margin:0,color:"var(--text-secondary)",fontSize:"11px"}}>{s.equipo_nombre}</p>
                      </td>
                      <td style={{padding:"12px 14px",color:"var(--text-secondary)",fontSize:"12px",maxWidth:"180px"}}>{s.descripcion}</td>
                      <td style={{padding:"12px 14px"}}>
                        <span style={{color:s.prioridad==="ALTA"?"#ef4444":s.prioridad==="MEDIA"?"#f59e0b":"#22c55e",fontWeight:600,fontSize:"12px"}}>
                          {s.prioridad==="ALTA"?"🔴":s.prioridad==="MEDIA"?"🟡":"🟢"} {s.prioridad}
                        </span>
                      </td>
                      <td style={{padding:"12px 14px",color:"var(--text-muted)",fontSize:"12px",whiteSpace:"nowrap"}}>{fmt(s.fecha_solicitud)}</td>
                      <td style={{padding:"12px 14px"}}>
                        <span style={{background:s.estado==="PENDIENTE"?"rgba(245,158,11,0.12)":s.estado==="EN_PROCESO"?"var(--accent-light)":s.estado==="FINALIZADO"?"rgba(34,197,94,0.12)":"var(--bg-surface2)",color:s.estado==="PENDIENTE"?"#f59e0b":s.estado==="EN_PROCESO"?"var(--accent-text)":s.estado==="FINALIZADO"?"#22c55e":"var(--text-muted)",border:`1px solid ${s.estado==="PENDIENTE"?"#f59e0b":s.estado==="EN_PROCESO"?"var(--accent)":s.estado==="FINALIZADO"?"#22c55e":"var(--border)"}`,borderRadius:"6px",padding:"2px 10px",fontSize:"11px",fontWeight:700}}>
                          {s.estado}
                        </span>
                      </td>
                      <td style={{padding:"12px 14px"}}>
                        {s.estado==="PENDIENTE"&&(
                          <button onClick={()=>setModalNuevo(s)} style={{background:"rgba(34,197,94,0.12)",border:"1px solid #22c55e",color:"#22c55e",borderRadius:"8px",padding:"6px 14px",fontSize:"12px",cursor:"pointer",fontWeight:600,fontFamily:"inherit"}}>
                            ✅ Atender
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════ REPORTES ════ */}
      {tab==="reportes"&&(
        <div>
          <div style={{...S.surface,padding:"1.25rem",marginBottom:"1.25rem"}}>
            <h5 style={{fontWeight:600,margin:"0 0 1rem",color:"var(--text-primary)"}}>🔍 Filtros de búsqueda</h5>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:"12px"}}>
              <div><label style={S.lbl}>Equipo</label><input style={S.inp} placeholder="Código o nombre" value={filtros.equipo} onChange={e=>setFiltros(f=>({...f,equipo:e.target.value}))}/></div>
              <div><label style={S.lbl}>Personal</label><input style={S.inp} placeholder="Nombre" value={filtros.usuario} onChange={e=>setFiltros(f=>({...f,usuario:e.target.value}))}/></div>
              <div>
                <label style={S.lbl}>Estado</label>
                <select style={S.inp} value={filtros.estado} onChange={e=>setFiltros(f=>({...f,estado:e.target.value}))}>
                  <option value="">Todos</option>
                  <option value="EN_PROCESO">En proceso</option>
                  <option value="PROGRAMADO">Programado</option>
                  <option value="FINALIZADO">Finalizado</option>
                  <option value="PENDIENTE_CONFIRMACION">Pend. Confirmación</option>
                </select>
              </div>
              <div><label style={S.lbl}>Desde</label><input type="date" style={S.inp} value={filtros.fecha_ini} onChange={e=>setFiltros(f=>({...f,fecha_ini:e.target.value}))}/></div>
              <div><label style={S.lbl}>Hasta</label><input type="date" style={S.inp} value={filtros.fecha_fin} onChange={e=>setFiltros(f=>({...f,fecha_fin:e.target.value}))}/></div>
            </div>
            <div style={{display:"flex",gap:"10px",marginTop:"1rem"}}>
              <button style={btnP} onClick={loadReportes}>🔍 Buscar</button>
              <button style={btnG} onClick={()=>{setFiltros({equipo:"",usuario:"",estado:"",fecha_ini:"",fecha_fin:""});setTimeout(loadReportes,100);}}>Limpiar</button>
            </div>
          </div>

          {reportes.length>0&&(
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:"12px",marginBottom:"1.25rem"}}>
              <Stat label="Registros"       value={totales.registros||0}                                  color="var(--accent-text)" icon="📋"/>
              <Stat label="Repuestos (u)"   value={totales.repuestos_qty||0}                              color="#f59e0b"            icon="🔩"/>
              <Stat label="Costo repuestos" value={`Bs ${Number(totales.repuestos_costo||0).toFixed(2)}`} color="#f59e0b"            icon="💰"/>
              <Stat label="Costo mant."     value={`Bs ${Number(totales.costo_total||0).toFixed(2)}`}     color="#22c55e"            icon="🛠️"/>
              <Stat label="Total general"   value={`Bs ${Number(totales.costo_general||0).toFixed(2)}`}   color="#ef4444"            icon="📊"/>
            </div>
          )}

          <div style={S.surface}>
            <div style={{padding:"1rem 1.25rem",borderBottom:"1px solid var(--border)"}}>
              <h5 style={{fontWeight:600,margin:0,color:"var(--text-primary)"}}>
                Historial
                {reportes.length>0&&<span style={{marginLeft:"10px",background:"var(--accent-light)",color:"var(--accent-text)",borderRadius:"6px",padding:"2px 10px",fontSize:"12px"}}>{reportes.length} resultados</span>}
              </h5>
            </div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:"13px"}}>
                <thead>
                  <tr style={{background:"var(--bg-surface2)",borderBottom:"2px solid var(--border)"}}>
                    {["#","Equipo","Tipo","Técnico","Personal","Estado","F.Prog.","Inicio","Fin","Rep.","C.Rep.","Costo"].map(h=>(
                      <th key={h} style={{padding:"11px 14px",textAlign:"left",color:"var(--text-secondary)",fontWeight:600,fontSize:"11px",textTransform:"uppercase",letterSpacing:"0.5px",whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportes.length===0 ? (
                    <tr><td colSpan={12} style={{padding:"4rem",textAlign:"center",color:"var(--text-secondary)"}}>
                      <div style={{fontSize:"36px",marginBottom:"10px"}}>🔍</div>
                      Usa los filtros y presiona Buscar
                    </td></tr>
                  ) : reportes.map(r=>(
                    <tr key={r.id} style={{borderBottom:"1px solid var(--border)"}}>
                      <td style={{padding:"11px 14px",color:"var(--text-muted)",fontSize:"12px"}}>#{r.id}</td>
                      <td style={{padding:"11px 14px"}}>
                        <p style={{margin:0,color:"var(--accent-text)",fontWeight:700,fontSize:"12px"}}>{r.equipo_codigo}</p>
                        <p style={{margin:0,color:"var(--text-secondary)",fontSize:"11px"}}>{r.equipo_nombre}</p>
                      </td>
                      <td style={{padding:"11px 14px",color:"var(--text-secondary)",fontSize:"12px"}}>{r.tipo||"—"}</td>
                      <td style={{padding:"11px 14px",color:"var(--text-secondary)",fontSize:"12px"}}>{r.tecnico||"—"}</td>
                      <td style={{padding:"11px 14px",color:"var(--text-primary)",fontSize:"12px"}}>{`${r.usuario_nombre||""} ${r.usuario_apellido||""}`.trim()||"—"}</td>
                      <td style={{padding:"11px 14px"}}><Pill estado={r.estado}/></td>
                      <td style={{padding:"11px 14px",color:"var(--text-secondary)",fontSize:"12px"}}>{fmt(r.fecha_programada)}</td>
                      <td style={{padding:"11px 14px",color:"var(--text-muted)",fontSize:"12px"}}>{fmt(r.fecha_inicio)}</td>
                      <td style={{padding:"11px 14px",color:"var(--text-muted)",fontSize:"12px"}}>{r.fecha_fin?fmt(r.fecha_fin):"En proceso"}</td>
                      <td style={{padding:"11px 14px",color:"#f59e0b",fontWeight:600,textAlign:"center"}}>{r.total_repuestos_qty||0}</td>
                      <td style={{padding:"11px 14px",color:"#f59e0b",fontWeight:600}}>Bs {Number(r.total_repuestos_costo||0).toFixed(2)}</td>
                      <td style={{padding:"11px 14px",color:"#22c55e",fontWeight:600}}>{fmtBs(r.costo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MODALES ── */}
      {modalNuevo&&(
        <ModalNuevo
          sol={modalNuevo!=="nuevo"?modalNuevo:null}
          equipos={equipos}
          tecnicos={tecnicos}
          repuestosCat={repuestosCat}
          currentUser={currentUser}
          onClose={()=>setModalNuevo(null)}
          onGuardado={()=>{load();showMsg("success","✅ Mantenimiento registrado correctamente");}}
        />
      )}

      {modalDetalle&&(
        <ModalDetalle
          mant={modalDetalle}
          onClose={()=>setModalDetalle(null)}
          onAction={accionMant}
          cargando={cargando}
        />
      )}

      {modalReasig&&(
        <Overlay onClose={()=>setModalReasig(null)}>
          <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:"16px",width:"440px",maxWidth:"95vw",padding:"1.75rem",boxShadow:"0 24px 60px rgba(0,0,0,0.35)"}}>
            <h4 style={{fontWeight:700,margin:"0 0 6px",color:"var(--text-primary)"}}>🔄 Reasignar Técnico</h4>
            <p style={{color:"var(--text-secondary)",fontSize:"13px",margin:"0 0 1.25rem"}}>
              Mantenimiento #{modalReasig.id} — Actual: <strong>{reasigForm.tecnico||"Sin asignar"}</strong>
            </p>
            <label style={S.lbl}>Nuevo técnico</label>
            <select style={{...S.inp,marginBottom:"1.25rem"}} value={reasigForm.tecnico_usuario_id}
              onChange={e=>{const t=tecnicos.find(x=>String(x.id)===e.target.value);setReasigForm({tecnico_usuario_id:e.target.value,tecnico:t?seg(t.nombre,t.apellido):"",});}}>
              <option value="">Sin asignar</option>
              {tecnicos.map(t=>(
                <option key={t.id} value={t.id}>{seg(t.nombre,t.apellido)}{t.cargo?` — ${t.cargo}`:""}</option>
              ))}
            </select>
            <div style={{display:"flex",gap:"10px",justifyContent:"flex-end"}}>
              <button style={btnG} onClick={()=>setModalReasig(null)}>Cancelar</button>
              <button style={{...mkBtn("#f59e0b","#000")}} onClick={reasignar}>🔄 Reasignar</button>
            </div>
          </div>
        </Overlay>
      )}

      {confirm&&(
        <ModalConfirm
          titulo={confirm.titulo}
          desc={confirm.desc}
          labelOk={confirm.label}
          colorOk={confirm.color}
          onConfirm={()=>confirm.action()}
          onClose={()=>setConfirm(null)}
        />
      )}

    </AdminLayout>
  );
}