import { useEffect, useState, useCallback } from "react";
import PersonalLayout from "../../components/layout/PersonalLayout";
import api from "../../services/api";

const inp = {
  background: "var(--bg-surface2)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  padding: "10px 14px",
  color: "var(--text-primary)",
  fontSize: "14px",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
  width: "100%",
};

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("es-BO", {
    day:"2-digit", month:"short", year:"numeric",
    hour:"2-digit", minute:"2-digit",
  }) : "—";

// ── Estado config ─────────────────────────────
const ESTADO_CONFIG = {
  PENDIENTE:  { bg:"#fffbeb",              c:"#f59e0b",              b:"#f59e0b",              label:"Pendiente",   desc:"Esperando revisión del administrador" },
  EN_PROCESO: { bg:"var(--accent-light)",  c:"var(--accent-text)",   b:"var(--accent)",        label:"En proceso",  desc:"El técnico ya está trabajando en esto" },
  FINALIZADO: { bg:"var(--success-bg)",    c:"var(--success)",       b:"var(--success)",       label:"Finalizado",  desc:"Mantenimiento completado" },
  RECHAZADO:  { bg:"var(--danger-bg)",     c:"var(--danger)",        b:"var(--danger)",        label:"Rechazada",   desc:"Fue rechazada, puedes reenviarla" },
};

// Regla: ¿se puede editar?
// Solo cuando está PENDIENTE (aún no fue atendida)
const puedeEditar   = (s) => s.estado === "PENDIENTE";

// Regla: ¿se puede reenviar?
// Solo cuando fue RECHAZADA
const puedeReenviar = (s) => s.estado === "RECHAZADO";

// Regla: ¿se puede enviar nueva solicitud para este equipo?
// NO si ya existe una PENDIENTE o EN_PROCESO para el mismo equipo
const tieneActiva = (solicitudes, equipo_id) =>
  solicitudes.some(s => s.equipo_id === equipo_id && ["PENDIENTE","EN_PROCESO"].includes(s.estado));

// ── Badge Estado ──────────────────────────────
function BadgeEstado({ estado }) {
  const c = ESTADO_CONFIG[estado] || ESTADO_CONFIG.PENDIENTE;
  return (
    <span style={{
      background:c.bg, color:c.c, border:`1px solid ${c.b}`,
      borderRadius:"6px", padding:"3px 10px",
      fontSize:"12px", fontWeight:600,
    }}>
      {c.label}
    </span>
  );
}

// ── Badge Prioridad ───────────────────────────
function BadgePrioridad({ prioridad }) {
  const map = {
    ALTA:  { c:"#ef4444", icon:"🔴" },
    MEDIA: { c:"#f59e0b", icon:"🟡" },
    BAJA:  { c:"#22c55e", icon:"🟢" },
  };
  const s = map[prioridad] || map.MEDIA;
  return (
    <span style={{ color:s.c, fontWeight:600, fontSize:"13px" }}>
      {s.icon} {prioridad}
    </span>
  );
}

// ── Modal Editar ──────────────────────────────
function ModalEditar({ solicitud, onClose, onGuardado }) {
  const [form, setForm] = useState({
    descripcion: solicitud.descripcion || "",
    prioridad:   solicitud.prioridad   || "MEDIA",
  });
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState("");

  const guardar = async () => {
    if (!form.descripcion.trim()) return setErr("La descripción es obligatoria");
    setBusy(true);
    try {
      await api.put(`/mantenimientos/solicitudes/${solicitud.id}`, form);
      onGuardado();
      onClose();
    } catch (e) {
      setErr(e.response?.data?.message || "Error al guardar");
    } finally { setBusy(false); }
  };

  return (
    <div onClick={onClose} style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.65)",
      zIndex:9999, display:"flex", alignItems:"center",
      justifyContent:"center", padding:"1rem",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:"var(--bg-surface)", border:"1px solid var(--border)",
        borderRadius:"16px", width:"520px", maxWidth:"95vw", overflow:"hidden",
      }}>
        {/* Header */}
        <div style={{ background:"var(--accent)", padding:"1rem 1.25rem", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <h4 style={{ color:"#fff", fontWeight:700, margin:0 }}>✏️ Editar solicitud #{solicitud.id}</h4>
            <small style={{ color:"rgba(255,255,255,0.8)" }}>
              {solicitud.equipo_codigo} — {solicitud.equipo_nombre}
            </small>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.15)", border:"none", color:"#fff", borderRadius:"8px", padding:"6px 12px", cursor:"pointer", fontFamily:"inherit" }}>
            ✖
          </button>
        </div>

        {/* Body */}
        <div style={{ padding:"1.25rem", display:"flex", flexDirection:"column", gap:"14px" }}>

          {err && (
            <div style={{ background:"var(--danger-bg)", border:"1px solid var(--danger)", borderRadius:"8px", padding:"10px 14px", color:"var(--danger)", fontSize:"13px" }}>
              ⚠️ {err}
            </div>
          )}

          {/* Info equipo (solo lectura) */}
          <div style={{ background:"var(--bg-surface2)", border:"1px solid var(--border)", borderRadius:"10px", padding:"10px 14px" }}>
            <p style={{ color:"var(--text-muted)", fontSize:"11px", margin:"0 0 3px", textTransform:"uppercase" }}>Equipo (no editable)</p>
            <p style={{ color:"var(--accent-text)", fontWeight:600, fontSize:"14px", margin:0 }}>
              {solicitud.equipo_codigo} — {solicitud.equipo_nombre}
            </p>
          </div>

          {/* Descripción */}
          <div>
            <label style={{ display:"block", color:"var(--text-secondary)", fontSize:"13px", fontWeight:500, marginBottom:"6px" }}>
              Descripción del problema *
            </label>
            <textarea rows={4} value={form.descripcion}
              onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              placeholder="Describe el problema con detalle..."
              style={{ ...inp, resize:"vertical" }}
            />
          </div>

          {/* Prioridad */}
          <div>
            <label style={{ display:"block", color:"var(--text-secondary)", fontSize:"13px", fontWeight:500, marginBottom:"6px" }}>
              Prioridad
            </label>
            <select value={form.prioridad} onChange={e => setForm(f => ({ ...f, prioridad: e.target.value }))} style={inp}>
              <option value="BAJA">🟢 Baja — No urgente</option>
              <option value="MEDIA">🟡 Media — Moderada</option>
              <option value="ALTA">🔴 Alta — Urgente</option>
            </select>
          </div>

          {/* Aviso */}
          <div style={{ background:"#fffbeb", border:"1px solid #f59e0b", borderRadius:"8px", padding:"10px 14px" }}>
            <p style={{ color:"#78350f", fontSize:"12px", margin:0 }}>
              ℹ️ Solo puedes editar mientras la solicitud está en estado <strong>Pendiente</strong>. Una vez atendida por el técnico no podrás modificarla.
            </p>
          </div>

          {/* Botones */}
          <div style={{ display:"flex", gap:"10px", justifyContent:"flex-end" }}>
            <button onClick={onClose} style={{ background:"var(--bg-surface2)", border:"1px solid var(--border)", color:"var(--text-secondary)", borderRadius:"10px", padding:"10px 18px", fontSize:"14px", cursor:"pointer", fontFamily:"inherit" }}>
              Cancelar
            </button>
            <button onClick={guardar} disabled={busy} style={{ background:"var(--accent)", color:"#fff", border:"none", borderRadius:"10px", padding:"10px 18px", fontSize:"14px", fontWeight:600, cursor:busy?"not-allowed":"pointer", fontFamily:"inherit", opacity:busy?0.6:1 }}>
              {busy ? "Guardando..." : "✅ Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ──────────────────────
export default function MisSolicitudes() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [editando,    setEditando]    = useState(null);
  const [msg,         setMsg]         = useState({ type:"", text:"" });

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type:"", text:"" }), 5000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/mantenimientos/mis-solicitudes");
      setSolicitudes(Array.isArray(res.data) ? res.data : []);
    } catch { showMsg("error","Error al cargar solicitudes"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const reenviar = async (id) => {
    try {
      await api.put(`/mantenimientos/solicitudes/${id}/reenviar`);
      showMsg("success", "✅ Solicitud reenviada. El administrador la revisará pronto.");
      load();
    } catch (e) {
      showMsg("error", e.response?.data?.message || "Error al reenviar");
    }
  };

  const stats = [
    { label:"Total",      value: solicitudes.length,                                        color:"var(--accent-text)" },
    { label:"Pendientes", value: solicitudes.filter(s=>s.estado==="PENDIENTE").length,       color:"#f59e0b" },
    { label:"En proceso", value: solicitudes.filter(s=>s.estado==="EN_PROCESO").length,      color:"var(--accent-text)" },
    { label:"Finalizadas",value: solicitudes.filter(s=>s.estado==="FINALIZADO").length,      color:"#22c55e" },
    { label:"Rechazadas", value: solicitudes.filter(s=>s.estado==="RECHAZADO").length,       color:"#ef4444" },
  ];

  return (
    <PersonalLayout>

      {/* HEADER */}
      <div style={{ marginBottom:"1.5rem" }}>
        <p style={{ color:"var(--text-secondary)", fontSize:"14px", margin:0 }}>Portal personal</p>
        <h1 style={{ fontSize:"26px", fontWeight:700, margin:"4px 0 0", color:"var(--text-primary)" }}>
          📋 Mis Solicitudes
        </h1>
      </div>

      {/* MENSAJE */}
      {msg.text && (
        <div style={{
          background: msg.type==="success"?"var(--success-bg)":"var(--danger-bg)",
          border:`1px solid ${msg.type==="success"?"var(--success)":"var(--danger)"}`,
          color: msg.type==="success"?"var(--success)":"var(--danger)",
          borderRadius:"10px", padding:"12px 16px", marginBottom:"1.25rem",
          fontSize:"14px", fontWeight:500,
        }}>
          {msg.text}
        </div>
      )}

      {/* STATS */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:"12px", marginBottom:"1.5rem" }}>
        {stats.map((s,i) => (
          <div key={i} style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"12px", padding:"1rem", textAlign:"center" }}>
            <p style={{ color:"var(--text-secondary)", fontSize:"12px", margin:"0 0 4px" }}>{s.label}</p>
            <p style={{ color:s.color, fontSize:"22px", fontWeight:700, margin:0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* TABLA */}
      <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"16px", overflow:"hidden" }}>
        <div style={{ padding:"1rem 1.25rem", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <h5 style={{ fontWeight:600, margin:0, color:"var(--text-primary)" }}>
            Historial de solicitudes
          </h5>
          <a href="/personal/solicitar" style={{
            background:"var(--accent)", color:"#fff", textDecoration:"none",
            borderRadius:"8px", padding:"7px 16px", fontSize:"13px", fontWeight:600,
          }}>
            + Nueva solicitud
          </a>
        </div>

        {loading ? (
          <div style={{ padding:"3rem", textAlign:"center", color:"var(--text-secondary)" }}>Cargando...</div>
        ) : solicitudes.length === 0 ? (
          <div style={{ padding:"4rem", textAlign:"center", color:"var(--text-secondary)" }}>
            <div style={{ fontSize:"48px", marginBottom:"12px" }}>📭</div>
            <h3 style={{ color:"var(--text-primary)", marginBottom:"8px" }}>Sin solicitudes</h3>
            <p style={{ margin:0, fontSize:"14px" }}>Aún no has enviado solicitudes de mantenimiento</p>
          </div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"14px" }}>
              <thead>
                <tr style={{ background:"var(--table-header)", borderBottom:"1px solid var(--border)" }}>
                  {["#","Equipo","Descripción","Prioridad","Estado","Fecha","Acciones"].map(h => (
                    <th key={h} style={{ padding:"12px 16px", textAlign:"left", color:"var(--text-secondary)", fontWeight:500, fontSize:"12px", textTransform:"uppercase", letterSpacing:"0.5px" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {solicitudes.map(s => {
                  const conf    = ESTADO_CONFIG[s.estado] || ESTADO_CONFIG.PENDIENTE;
                  const editar  = puedeEditar(s);
                  const reenviar_ = puedeReenviar(s);

                  return (
                    <tr key={s.id}
                      style={{ borderBottom:"1px solid var(--border)", transition:"background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--hover)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding:"14px 16px", color:"var(--text-muted)", fontSize:"12px" }}>#{s.id}</td>

                      <td style={{ padding:"14px 16px" }}>
                        <p style={{ margin:0, color:"var(--accent-text)", fontWeight:600 }}>{s.equipo_codigo}</p>
                        <p style={{ margin:0, color:"var(--text-secondary)", fontSize:"12px" }}>{s.equipo_nombre}</p>
                      </td>

                      <td style={{ padding:"14px 16px", color:"var(--text-secondary)", fontSize:"13px", maxWidth:"220px" }}>
                        {s.descripcion}
                      </td>

                      <td style={{ padding:"14px 16px" }}>
                        <BadgePrioridad prioridad={s.prioridad} />
                      </td>

                      <td style={{ padding:"14px 16px" }}>
                        <BadgeEstado estado={s.estado} />
                        <p style={{ color:conf.c, fontSize:"11px", margin:"4px 0 0", lineHeight:1.4 }}>
                          {conf.desc}
                        </p>
                      </td>

                      <td style={{ padding:"14px 16px", color:"var(--text-muted)", fontSize:"12px", whiteSpace:"nowrap" }}>
                        {fmt(s.fecha_solicitud)}
                      </td>

                      <td style={{ padding:"14px 16px" }}>
                        <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", alignItems:"center" }}>

                          {/* ✏️ Editar — solo PENDIENTE */}
                          {editar && (
                            <button onClick={() => setEditando(s)} style={{
                              background:"var(--accent-light)", border:"1px solid var(--accent)",
                              color:"var(--accent-text)", borderRadius:"8px",
                              padding:"5px 12px", cursor:"pointer",
                              fontSize:"12px", fontWeight:600, fontFamily:"inherit",
                            }}>
                              ✏️ Editar
                            </button>
                          )}

                          {/* 🔁 Reenviar — solo RECHAZADO */}
                          {reenviar_ && (
                            <button onClick={() => {
                              if (window.confirm("¿Reenviar esta solicitud al administrador?")) reenviar(s.id);
                            }} style={{
                              background:"var(--warning-bg)", border:"1px solid var(--warning)",
                              color:"var(--warning)", borderRadius:"8px",
                              padding:"5px 12px", cursor:"pointer",
                              fontSize:"12px", fontWeight:600, fontFamily:"inherit",
                            }}>
                              🔁 Reenviar
                            </button>
                          )}

                          {/* Estado bloqueado */}
                          {!editar && !reenviar_ && (
                            <span style={{ color:"var(--text-muted)", fontSize:"11px" }}>
                              {s.estado === "EN_PROCESO" ? "🔒 En proceso"
                               : s.estado === "FINALIZADO" ? "✅ Completado"
                               : "—"}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL EDITAR */}
      {editando && (
        <ModalEditar
          solicitud={editando}
          onClose={() => setEditando(null)}
          onGuardado={() => {
            showMsg("success", "✅ Solicitud actualizada correctamente");
            load();
          }}
        />
      )}

    </PersonalLayout>
  );
}