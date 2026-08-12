import { useEffect, useState, useCallback } from "react";
import PersonalLayout from "../../components/layout/PersonalLayout";
import api from "../../services/api";

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("es-BO", { day:"2-digit", month:"short", year:"numeric" }) : "—";

const fmtFull = (d) =>
  d ? new Date(d).toLocaleString("es-BO") : "—";

const COLOR_EQ = {
  DISPONIBLE:    { c:"#22c55e", bg:"#f0fdf4", b:"#22c55e", label:"Disponible" },
  ASIGNADO:      { c:"var(--accent-text)", bg:"var(--accent-light)", b:"var(--accent)", label:"Asignado" },
  MANTENIMIENTO: { c:"#f59e0b", bg:"#fffbeb", b:"#f59e0b", label:"En mantenimiento" },
  BAJA:          { c:"#ef4444", bg:"#fef2f2", b:"#ef4444", label:"De baja" },
};

const COLOR_MANT = {
  PENDIENTE_CONFIRMACION: { c:"#f59e0b", bg:"#fffbeb", b:"#f59e0b", label:"Pendiente confirmación" },
  PROGRAMADO:             { c:"#3b82f6", bg:"#eff6ff", b:"#3b82f6", label:"Programado" },
  EN_PROCESO:             { c:"var(--accent-text)", bg:"var(--accent-light)", b:"var(--accent)", label:"En proceso" },
  PAUSADO:                { c:"var(--text-muted)", bg:"var(--bg-surface2)", b:"var(--border)", label:"Pausado" },
  REPROGRAMAR:            { c:"#ef4444", bg:"#fef2f2", b:"#ef4444", label:"Solicitud reprogramación" },
  FINALIZADO:             { c:"#22c55e", bg:"#f0fdf4", b:"#22c55e", label:"Finalizado" },
  PENDIENTE:              { c:"#f59e0b", bg:"#fffbeb", b:"#f59e0b", label:"Solicitud pendiente" },
  EN_PROCESO_SOL:         { c:"var(--accent-text)", bg:"var(--accent-light)", b:"var(--accent)", label:"Solicitud en proceso" },
};

function PillEq({ estado }) {
  const c = COLOR_EQ[estado] || COLOR_EQ.DISPONIBLE;
  return (
    <span style={{
      background:c.bg, color:c.c, border:`1px solid ${c.b}`,
      borderRadius:"6px", padding:"3px 10px",
      fontSize:"11px", fontWeight:700,
    }}>
      {c.label}
    </span>
  );
}

function PillMant({ estado }) {
  const c = COLOR_MANT[estado] || { c:"var(--text-muted)", bg:"var(--bg-surface2)", b:"var(--border)", label:estado };
  return (
    <span style={{
      background:c.bg, color:c.c, border:`1px solid ${c.b}`,
      borderRadius:"6px", padding:"3px 10px",
      fontSize:"11px", fontWeight:700,
    }}>
      {c.label}
    </span>
  );
}

function TarjetaEquipo({ equipo, solicitudes }) {
  const [expandido, setExpandido] = useState(false);

  // Solicitud activa del equipo
  const solActiva = solicitudes.find(
    s => s.equipo_id === equipo.id && ["PENDIENTE","EN_PROCESO"].includes(s.estado)
  );

  // Mantenimientos activos del equipo
  const mantActivo = equipo.mantenimientos?.find(m =>
    ["PENDIENTE_CONFIRMACION","PROGRAMADO","EN_PROCESO","PAUSADO","REPROGRAMAR"].includes(m.estado)
  );
  const historial = (equipo.mantenimientos || []).filter(m => m.estado === "FINALIZADO");

  const crEq = COLOR_EQ[equipo.estado] || COLOR_EQ.DISPONIBLE;

  // Estado visual unificado del equipo
  const estadoUnificado = () => {
    if (mantActivo) return mantActivo.estado;
    if (solActiva?.estado === "PENDIENTE") return "PENDIENTE";
    if (solActiva?.estado === "EN_PROCESO") return "EN_PROCESO_SOL";
    return equipo.estado;
  };

  return (
    <div style={{
      background:"var(--bg-surface)", border:`2px solid ${crEq.b}`,
      borderRadius:"16px", overflow:"hidden", marginBottom:"16px",
    }}>
      {/* Banner si hay solicitud pendiente */}
      {solActiva?.estado === "PENDIENTE" && !mantActivo && (
        <div style={{ background:"#f59e0b", padding:"8px 16px", display:"flex", alignItems:"center", gap:"8px" }}>
          <span style={{ fontSize:"16px" }}>📋</span>
          <p style={{ color:"#fff", fontWeight:700, fontSize:"13px", margin:0 }}>
            Tienes una solicitud de mantenimiento pendiente de revisión por el administrador
          </p>
        </div>
      )}

      {/* Banner si hay mantenimiento programado pendiente de confirmación */}
      {mantActivo?.estado === "PENDIENTE_CONFIRMACION" && (
        <div style={{ background:"#f59e0b", padding:"8px 16px", display:"flex", alignItems:"center", gap:"8px" }}>
          <span style={{ fontSize:"16px" }}>⚠️</span>
          <p style={{ color:"#fff", fontWeight:700, fontSize:"13px", margin:0 }}>
            Tu equipo tiene un mantenimiento preventivo programado — Revisa los detalles abajo
          </p>
        </div>
      )}

      {/* Cabecera equipo */}
      <div style={{
        padding:"1rem 1.25rem",
        background:`linear-gradient(135deg, ${crEq.bg}, var(--bg-surface))`,
        borderBottom:"1px solid var(--border)",
        display:"flex", justifyContent:"space-between",
        flexWrap:"wrap", gap:"12px", alignItems:"center",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
          <div style={{
            width:"50px", height:"50px", borderRadius:"12px",
            background:crEq.bg, border:`2px solid ${crEq.b}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:"22px", flexShrink:0,
          }}>
            {equipo.estado === "MANTENIMIENTO" ? "🔧" : "💻"}
          </div>
          <div>
            <p style={{ margin:0, color:"var(--accent-text)", fontWeight:700, fontSize:"16px" }}>
              {equipo.codigo}
            </p>
            <p style={{ margin:"2px 0 0", color:"var(--text-primary)", fontWeight:500, fontSize:"14px" }}>
              {equipo.nombre}
            </p>
            <p style={{ margin:"2px 0 0", color:"var(--text-muted)", fontSize:"12px" }}>
              {equipo.tipo} · Asignado desde {fmt(equipo.fecha_asignacion)}
            </p>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"6px" }}>
          <PillEq estado={equipo.estado} />
          <PillMant estado={estadoUnificado()} />
        </div>
      </div>

      {/* Solicitud activa (si no hay mantenimiento) */}
      {solActiva && !mantActivo && (
        <div style={{ padding:"1rem 1.25rem", borderBottom:"1px solid var(--border)" }}>
          <p style={{ color:"var(--text-secondary)", fontSize:"12px", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px", margin:"0 0 10px" }}>
            Solicitud de mantenimiento
          </p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:"10px" }}>
            <InfoField label="Estado"     value={<PillMant estado={solActiva.estado === "PENDIENTE" ? "PENDIENTE" : "EN_PROCESO_SOL"} />} />
            <InfoField label="Prioridad"  value={
              <span style={{ color: solActiva.prioridad==="ALTA"?"#ef4444":solActiva.prioridad==="MEDIA"?"#f59e0b":"#22c55e", fontWeight:600 }}>
                {solActiva.prioridad==="ALTA"?"🔴":solActiva.prioridad==="MEDIA"?"🟡":"🟢"} {solActiva.prioridad}
              </span>
            } />
            <InfoField label="Descripción" value={solActiva.descripcion} />
            <InfoField label="Enviada"     value={fmt(solActiva.fecha_solicitud)} />
          </div>
          {solActiva.estado === "PENDIENTE" && (
            <p style={{ color:"var(--text-muted)", fontSize:"12px", margin:"10px 0 0" }}>
              ℹ️ Tu solicitud está siendo revisada por el administrador. Cuando sea atendida, aparecerá un mantenimiento programado.
            </p>
          )}
          {solActiva.estado === "EN_PROCESO" && (
            <p style={{ color:"var(--accent-text)", fontSize:"12px", margin:"10px 0 0", fontWeight:500 }}>
              ⚙️ El técnico ya está trabajando en base a tu solicitud.
            </p>
          )}
        </div>
      )}

      {/* Mantenimiento activo */}
      {mantActivo && (
        <div style={{ padding:"1rem 1.25rem", borderBottom:"1px solid var(--border)" }}>
          <p style={{ color:"var(--text-secondary)", fontSize:"12px", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px", margin:"0 0 10px" }}>
            Mantenimiento en curso
          </p>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:"10px", marginBottom: mantActivo.motivo_ia?"12px":"0" }}>
            <InfoField label="Tipo"           value={mantActivo.tipo} />
            <InfoField label="Técnico"        value={mantActivo.tecnico_nombre_completo || "Sin asignar"} />
            <InfoField label="F. programada"  value={fmt(mantActivo.fecha_programada)} />
            <InfoField label="F. inicio"      value={mantActivo.fecha_inicio ? fmtFull(mantActivo.fecha_inicio) : "—"} />
            {mantActivo.nivel_riesgo_ia && (
              <InfoField label="Riesgo IA" value={
                <span style={{ background:"#fef2f2", color:"#ef4444", border:"1px solid #ef4444", borderRadius:"6px", padding:"2px 8px", fontSize:"11px", fontWeight:600 }}>
                  ⚠️ {mantActivo.nivel_riesgo_ia} — {mantActivo.probabilidad_ia}%
                </span>
              } />
            )}
            {mantActivo.dias_restantes !== null && !["FINALIZADO"].includes(mantActivo.estado) && (
              <InfoField label="Días restantes" value={
                <span style={{
                  color: mantActivo.dias_restantes < 0 ? "#ef4444" : mantActivo.dias_restantes <= 3 ? "#f59e0b" : "var(--text-primary)",
                  fontWeight:700, fontSize:"16px",
                }}>
                  {mantActivo.dias_restantes < 0 ? `Vencido hace ${Math.abs(mantActivo.dias_restantes)}d` : `${mantActivo.dias_restantes} días`}
                </span>
              } />
            )}
          </div>

          {/* Motivo IA */}
          {mantActivo.motivo_ia && (
            <div style={{ background:"#fffbeb", border:"1px solid #f59e0b", borderRadius:"10px", padding:"12px", marginTop:"10px" }}>
              <p style={{ color:"#92400e", fontSize:"11px", fontWeight:600, textTransform:"uppercase", margin:"0 0 4px" }}>Motivo IA</p>
              <p style={{ color:"#78350f", fontSize:"13px", margin:0, lineHeight:1.6 }}>{mantActivo.motivo_ia}</p>
            </div>
          )}

          {/* Estado EN_PROCESO */}
          {mantActivo.estado === "EN_PROCESO" && (
            <div style={{ background:"var(--accent-light)", border:"1px solid var(--accent)", borderRadius:"10px", padding:"12px", marginTop:"10px" }}>
              <p style={{ color:"var(--accent-text)", fontSize:"13px", fontWeight:600, margin:0 }}>
                ⚙️ El técnico {mantActivo.tecnico_nombre_completo || ""} está realizando el mantenimiento. El equipo no está disponible.
              </p>
            </div>
          )}

          {/* Estado REPROGRAMAR */}
          {mantActivo.estado === "REPROGRAMAR" && (
            <div style={{ background:"#fef2f2", border:"1px solid #ef4444", borderRadius:"10px", padding:"12px", marginTop:"10px" }}>
              <p style={{ color:"#ef4444", fontSize:"12px", fontWeight:600, margin:"0 0 4px" }}>Solicitud de reprogramación enviada</p>
              {mantActivo.motivo_reprogramar && <p style={{ margin:0, color:"var(--text-primary)", fontSize:"13px" }}><strong>Motivo:</strong> {mantActivo.motivo_reprogramar}</p>}
              {mantActivo.fecha_sugerida_rep && <p style={{ margin:"4px 0 0", color:"var(--text-primary)", fontSize:"13px" }}><strong>Fecha sugerida:</strong> {fmt(mantActivo.fecha_sugerida_rep)}</p>}
              <p style={{ color:"var(--text-muted)", fontSize:"12px", margin:"6px 0 0" }}>El administrador coordinará una nueva fecha.</p>
            </div>
          )}
        </div>
      )}

      {/* Sin actividad */}
      {!solActiva && !mantActivo && (
        <div style={{ padding:"1rem 1.25rem", borderBottom:"1px solid var(--border)", textAlign:"center" }}>
          <span style={{ fontSize:"24px" }}>✅</span>
          <p style={{ margin:"6px 0 0", fontSize:"13px", color:"var(--text-secondary)" }}>Sin mantenimientos activos</p>
        </div>
      )}

      {/* Historial expandible */}
      <div style={{ padding:"1rem 1.25rem" }}>
        <button onClick={() => setExpandido(!expandido)} style={{
          background:"var(--bg-surface2)", border:"1px solid var(--border)",
          borderRadius:"8px", padding:"6px 14px",
          color:"var(--text-secondary)", fontSize:"12px",
          fontWeight:600, cursor:"pointer", fontFamily:"inherit",
        }}>
          {expandido ? "▲ Ocultar" : `▼ Historial (${historial.length} finalizados)`}
        </button>

        {expandido && (
          <div style={{ marginTop:"12px", display:"flex", flexDirection:"column", gap:"8px" }}>
            {historial.length === 0 ? (
              <p style={{ color:"var(--text-muted)", fontSize:"13px", margin:0 }}>Sin mantenimientos finalizados</p>
            ) : historial.map((m,i) => (
              <div key={i} style={{
                background:"var(--bg-surface2)", border:"1px solid var(--border)",
                borderRadius:"12px", padding:"12px 14px",
              }}>
                <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:"8px", marginBottom:"6px" }}>
                  <div>
                    <p style={{ margin:0, color:"var(--text-primary)", fontWeight:600, fontSize:"13px" }}>
                      {m.tipo} — {fmt(m.fecha_programada || m.fecha_inicio)}
                    </p>
                    <p style={{ margin:"2px 0 0", color:"var(--text-muted)", fontSize:"11px" }}>
                      Técnico: {m.tecnico_nombre_completo || "—"} · Finalizado: {fmtFull(m.fecha_fin)}
                    </p>
                  </div>
                  <span style={{ background:"#f0fdf4", color:"#22c55e", border:"1px solid #22c55e", borderRadius:"6px", padding:"2px 8px", fontSize:"11px", fontWeight:700 }}>
                    Finalizado
                  </span>
                </div>
                {m.descripcion_solucion && (
                  <p style={{ margin:0, color:"var(--text-secondary)", fontSize:"12px", lineHeight:1.5 }}>
                    <strong>Solución:</strong> {m.descripcion_solucion}
                  </p>
                )}
                {m.costo > 0 && (
                  <p style={{ margin:"4px 0 0", color:"#22c55e", fontWeight:600, fontSize:"12px" }}>
                    Costo: Bs {Number(m.costo).toFixed(2)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoField({ label, value }) {
  return (
    <div style={{ background:"var(--bg-surface2)", border:"1px solid var(--border)", borderRadius:"10px", padding:"10px 12px" }}>
      <p style={{ color:"var(--text-muted)", fontSize:"11px", margin:"0 0 3px", textTransform:"uppercase", letterSpacing:"0.4px" }}>{label}</p>
      <div style={{ color:"var(--text-primary)", fontWeight:500, fontSize:"13px" }}>{value ?? "—"}</div>
    </div>
  );
}

export default function MiEquipo() {
  const [datos,      setDatos]      = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [mantRes, solRes] = await Promise.all([
        api.get("/mantenimientos/mis-mantenimientos"),
        api.get("/mantenimientos/mis-solicitudes"),
      ]);
      setDatos(Array.isArray(mantRes.data) ? mantRes.data : []);
      setSolicitudes(Array.isArray(solRes.data) ? solRes.data : []);
    } catch {
      setError("Error al cargar tus equipos");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Agrupar mantenimientos por equipo
  const equiposMap = {};
  datos.forEach(d => {
    if (!d.equipo_id) return;
    if (!equiposMap[d.equipo_id]) {
      equiposMap[d.equipo_id] = {
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

  // Si hay equipos en solicitudes pero sin mantenimientos, agregarlos
  solicitudes.forEach(s => {
    if (s.equipo_id && !equiposMap[s.equipo_id]) {
      equiposMap[s.equipo_id] = {
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
      <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:"12px", marginBottom:"1.5rem" }}>
        <div>
          <h2 style={{ fontWeight:700, margin:0, color:"var(--text-primary)" }}>💻 Mis Equipos</h2>
          <p style={{ color:"var(--text-secondary)", margin:"4px 0 0", fontSize:"14px" }}>
            Estado y mantenimientos de tus equipos asignados
          </p>
        </div>
        <button onClick={load} disabled={loading} style={{
          background:"var(--bg-surface2)", border:"1px solid var(--border)",
          borderRadius:"10px", padding:"10px 16px",
          color:"var(--text-secondary)", fontSize:"13px",
          cursor:loading?"not-allowed":"pointer",
          fontFamily:"inherit", opacity:loading?0.6:1,
        }}>
          🔄 Actualizar
        </button>
      </div>

      {error && (
        <div style={{ background:"var(--danger-bg)", border:"1px solid var(--danger)", borderRadius:"10px", padding:"12px 16px", marginBottom:"1.25rem", color:"var(--danger)", fontSize:"14px" }}>
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding:"4rem", textAlign:"center", color:"var(--text-secondary)" }}>
          <div style={{ fontSize:"40px", marginBottom:"12px" }}>💻</div>
          <p style={{ fontSize:"16px" }}>Cargando tus equipos...</p>
        </div>
      ) : equipos.length === 0 ? (
        <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"16px", padding:"4rem", textAlign:"center", color:"var(--text-secondary)" }}>
          <div style={{ fontSize:"48px", marginBottom:"12px" }}>📭</div>
          <h3 style={{ color:"var(--text-primary)", marginBottom:"8px" }}>Sin equipos asignados</h3>
          <p>No tienes equipos asignados. Contacta al administrador.</p>
        </div>
      ) : (
        equipos.map((eq, i) => (
          <TarjetaEquipo key={i} equipo={eq} solicitudes={solicitudes} />
        ))
      )}
    </PersonalLayout>
  );
}