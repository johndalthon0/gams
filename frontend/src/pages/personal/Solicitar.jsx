import { useEffect, useState } from "react";
import PersonalLayout from "../../components/layout/PersonalLayout";
import api from "../../services/api";

const inp = {
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
};

const lbl = {
  display: "block",
  color: "var(--text-secondary)",
  fontSize: "13px",
  fontWeight: 500,
  marginBottom: "6px",
};

export default function Solicitar() {
  const [equipos,      setEquipos]      = useState([]);
  const [solicitudes,  setSolicitudes]  = useState([]);
  const [mantenimien,  setMantenimien]  = useState([]);
  const [form,         setForm]         = useState({ equipo_id:"", descripcion:"", prioridad:"MEDIA" });
  const [loading,      setLoading]      = useState(true);
  const [enviando,     setEnviando]     = useState(false);
  const [msg,          setMsg]          = useState({ type:"", text:"" });

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type:"", text:"" }), 6000);
  };

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      try {
        const [eqRes, solRes, mantRes] = await Promise.all([
          api.get("/equipos/mis-equipos"),
          api.get("/mantenimientos/mis-solicitudes"),
          api.get("/mantenimientos/mis-mantenimientos"),
        ]);
        setEquipos(Array.isArray(eqRes.data)  ? eqRes.data  : []);
        setSolicitudes(Array.isArray(solRes.data) ? solRes.data : []);
        setMantenimien(Array.isArray(mantRes.data) ? mantRes.data : []);
      } catch {
        showMsg("error", "Error al cargar los equipos");
      } finally { setLoading(false); }
    };
    cargar();
  }, []);

  // ── Calcular estado bloqueado por equipo ──────────────────────────────────
  const getBloqueo = (equipo_id) => {
    // Solicitud activa
    const solActiva = solicitudes.find(
      s => s.equipo_id === equipo_id && ["PENDIENTE","EN_PROCESO"].includes(s.estado)
    );
    if (solActiva) {
      return {
        bloqueado: true,
        razon: solActiva.estado === "PENDIENTE"
          ? "Ya tienes una solicitud pendiente de revisión"
          : "Ya tienes una solicitud en proceso por el técnico",
        tipo: solActiva.estado,
      };
    }

    // Mantenimiento activo
    const mantActivo = mantenimien.find(
      m => m.equipo_id === equipo_id &&
           ["PENDIENTE_CONFIRMACION","PROGRAMADO","EN_PROCESO","PAUSADO","REPROGRAMAR"].includes(m.estado)
    );
    if (mantActivo) {
      const labels = {
        PENDIENTE_CONFIRMACION: "El equipo tiene un mantenimiento pendiente de confirmación",
        PROGRAMADO:             "El equipo tiene un mantenimiento programado",
        EN_PROCESO:             "El equipo está en mantenimiento en este momento",
        PAUSADO:                "El equipo tiene un mantenimiento pausado",
        REPROGRAMAR:            "El equipo tiene un mantenimiento en proceso de reprogramación",
      };
      return {
        bloqueado: true,
        razon: labels[mantActivo.estado] || "El equipo tiene un mantenimiento activo",
        tipo: mantActivo.estado,
      };
    }

    return { bloqueado: false };
  };

  const equipoSeleccionado = form.equipo_id ? equipos.find(e => e.id == form.equipo_id) : null;
  const bloqueo = form.equipo_id ? getBloqueo(parseInt(form.equipo_id)) : null;

  const enviar = async () => {
    if (!form.equipo_id) return showMsg("error", "Selecciona un equipo");
    if (!form.descripcion.trim()) return showMsg("error", "Describe el problema");
    if (bloqueo?.bloqueado) return showMsg("error", bloqueo.razon);

    setEnviando(true);
    try {
      await api.post("/mantenimientos/solicitudes", form);
      showMsg("success", "✅ Solicitud enviada correctamente. El administrador la revisará pronto.");
      setForm({ equipo_id:"", descripcion:"", prioridad:"MEDIA" });

      // Recargar datos para reflejar el nuevo estado
      const [solRes, mantRes] = await Promise.all([
        api.get("/mantenimientos/mis-solicitudes"),
        api.get("/mantenimientos/mis-mantenimientos"),
      ]);
      setSolicitudes(Array.isArray(solRes.data)  ? solRes.data  : []);
      setMantenimien(Array.isArray(mantRes.data) ? mantRes.data : []);
    } catch (e) {
      showMsg("error", e.response?.data?.message || "Error al enviar");
    } finally { setEnviando(false); }
  };

  // Equipos con su estado de bloqueo
  const equiposConEstado = equipos.map(eq => ({
    ...eq,
    bloqueo: getBloqueo(eq.id),
  }));

  const disponibles = equiposConEstado.filter(e => !e.bloqueo.bloqueado);
  const bloqueados  = equiposConEstado.filter(e =>  e.bloqueo.bloqueado);

  return (
    <PersonalLayout>

      {/* HEADER */}
      <div style={{ marginBottom:"1.5rem" }}>
        <p style={{ color:"var(--text-secondary)", fontSize:"14px", margin:0 }}>Portal personal</p>
        <h1 style={{ fontSize:"26px", fontWeight:700, margin:"4px 0 0", color:"var(--text-primary)" }}>
          📋 Nueva Solicitud de Mantenimiento
        </h1>
      </div>

      {/* MENSAJE */}
      {msg.text && (
        <div style={{
          background: msg.type==="success" ? "var(--success-bg)" : "var(--danger-bg)",
          border: `1px solid ${msg.type==="success" ? "var(--success)" : "var(--danger)"}`,
          color:  msg.type==="success" ? "var(--success)" : "var(--danger)",
          borderRadius:"12px", padding:"14px 18px", marginBottom:"1.5rem",
          fontSize:"14px", fontWeight:500,
        }}>
          {msg.text}
        </div>
      )}

      {loading ? (
        <div style={{ padding:"4rem", textAlign:"center", color:"var(--text-secondary)" }}>
          Cargando tus equipos...
        </div>
      ) : equipos.length === 0 ? (
        <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"16px", padding:"4rem", textAlign:"center", color:"var(--text-secondary)" }}>
          <div style={{ fontSize:"48px", marginBottom:"12px" }}>📭</div>
          <h3 style={{ color:"var(--text-primary)", marginBottom:"8px" }}>Sin equipos asignados</h3>
          <p>No tienes equipos asignados. Contacta al administrador.</p>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))", gap:"1.5rem" }}>

          {/* FORMULARIO */}
          <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"16px", overflow:"hidden" }}>
            <div style={{ padding:"1rem 1.25rem", borderBottom:"1px solid var(--border)" }}>
              <h5 style={{ fontWeight:600, margin:0, color:"var(--text-primary)" }}>📝 Datos de la solicitud</h5>
            </div>
            <div style={{ padding:"1.25rem", display:"flex", flexDirection:"column", gap:"16px" }}>

              {/* Selector de equipo */}
              <div>
                <label style={lbl}>Equipo *</label>
                <select
                  value={form.equipo_id}
                  onChange={e => setForm(f => ({ ...f, equipo_id: e.target.value }))}
                  style={{
                    ...inp,
                    borderColor: bloqueo?.bloqueado ? "var(--danger)" : "var(--border)",
                  }}
                >
                  <option value="">Selecciona un equipo...</option>

                  {disponibles.length > 0 && (
                    <optgroup label="✅ Disponibles para solicitud">
                      {disponibles.map(eq => (
                        <option key={eq.id} value={eq.id}>
                          {eq.codigo} — {eq.nombre} ({eq.tipo || "Sin tipo"})
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {bloqueados.length > 0 && (
                    <optgroup label="🔒 No disponibles (ya tienen mantenimiento activo)">
                      {bloqueados.map(eq => (
                        <option key={eq.id} value={eq.id} disabled>
                          🔒 {eq.codigo} — {eq.nombre}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>

                {/* Info del equipo seleccionado */}
                {equipoSeleccionado && (
                  <div style={{ marginTop:"8px", background:"var(--bg-surface2)", border:`1px solid ${bloqueo?.bloqueado?"var(--danger)":"var(--border)"}`, borderRadius:"10px", padding:"12px 14px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <p style={{ margin:0, color:"var(--accent-text)", fontWeight:700, fontSize:"14px" }}>{equipoSeleccionado.codigo}</p>
                        <p style={{ margin:"2px 0 0", color:"var(--text-secondary)", fontSize:"12px" }}>{equipoSeleccionado.nombre} · {equipoSeleccionado.tipo||"—"}</p>
                      </div>
                      <span style={{
                        background: equipoSeleccionado.estado==="DISPONIBLE"?"var(--success-bg)":equipoSeleccionado.estado==="MANTENIMIENTO"?"#fffbeb":"var(--accent-light)",
                        color:      equipoSeleccionado.estado==="DISPONIBLE"?"var(--success)":equipoSeleccionado.estado==="MANTENIMIENTO"?"#f59e0b":"var(--accent-text)",
                        border:     `1px solid ${equipoSeleccionado.estado==="DISPONIBLE"?"var(--success)":equipoSeleccionado.estado==="MANTENIMIENTO"?"#f59e0b":"var(--accent)"}`,
                        borderRadius:"6px", padding:"2px 8px", fontSize:"11px", fontWeight:600,
                      }}>
                        {equipoSeleccionado.estado}
                      </span>
                    </div>

                    {/* Bloqueo */}
                    {bloqueo?.bloqueado && (
                      <div style={{ marginTop:"10px", background:"var(--danger-bg)", border:"1px solid var(--danger)", borderRadius:"8px", padding:"10px 12px" }}>
                        <p style={{ color:"var(--danger)", fontSize:"12px", fontWeight:600, margin:"0 0 2px" }}>
                          🔒 No puedes enviar una solicitud para este equipo
                        </p>
                        <p style={{ color:"var(--danger)", fontSize:"12px", margin:0 }}>
                          {bloqueo.razon}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Prioridad */}
              <div>
                <label style={lbl}>Prioridad</label>
                <select value={form.prioridad} onChange={e => setForm(f=>({...f,prioridad:e.target.value}))} style={inp}>
                  <option value="BAJA">🟢 Baja — No urgente, puede esperar</option>
                  <option value="MEDIA">🟡 Media — Requiere atención pronto</option>
                  <option value="ALTA">🔴 Alta — Urgente, afecta el trabajo</option>
                </select>
              </div>

              {/* Descripción */}
              <div>
                <label style={lbl}>Descripción del problema *</label>
                <textarea
                  rows={5}
                  value={form.descripcion}
                  onChange={e => setForm(f=>({...f,descripcion:e.target.value}))}
                  placeholder="Describe el problema con el mayor detalle posible:&#10;- ¿Qué está fallando?&#10;- ¿Cuándo comenzó?&#10;- ¿Afecta tu trabajo?"
                  style={{ ...inp, resize:"vertical" }}
                  disabled={bloqueo?.bloqueado}
                />
                <div style={{ display:"flex", justifyContent:"flex-end", marginTop:"4px" }}>
                  <span style={{ color:"var(--text-muted)", fontSize:"12px" }}>
                    {form.descripcion.length} caracteres
                  </span>
                </div>
              </div>

              {/* Botón */}
              <button
                onClick={enviar}
                disabled={enviando || !form.equipo_id || !form.descripcion.trim() || bloqueo?.bloqueado}
                style={{
                  background: (enviando || !form.equipo_id || !form.descripcion.trim() || bloqueo?.bloqueado)
                    ? "var(--bg-surface2)" : "var(--accent)",
                  color: (enviando || !form.equipo_id || !form.descripcion.trim() || bloqueo?.bloqueado)
                    ? "var(--text-muted)" : "#fff",
                  border: "none",
                  borderRadius:"10px", padding:"12px",
                  fontSize:"15px", fontWeight:600,
                  cursor: (enviando || bloqueo?.bloqueado) ? "not-allowed" : "pointer",
                  fontFamily:"inherit",
                  transition:"all 0.2s",
                }}
              >
                {enviando ? "⏳ Enviando..." : bloqueo?.bloqueado ? "🔒 No disponible" : "✅ Enviar solicitud"}
              </button>
            </div>
          </div>

          {/* PANEL DERECHO — estado de equipos */}
          <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>

            {/* Equipos disponibles */}
            <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"16px", overflow:"hidden" }}>
              <div style={{ padding:"1rem 1.25rem", borderBottom:"1px solid var(--border)" }}>
                <h5 style={{ fontWeight:600, margin:0, color:"var(--text-primary)" }}>
                  ✅ Disponibles ({disponibles.length})
                </h5>
              </div>
              <div style={{ padding:"1rem" }}>
                {disponibles.length === 0 ? (
                  <p style={{ color:"var(--text-muted)", fontSize:"13px", margin:0, textAlign:"center", padding:"1rem 0" }}>
                    Todos los equipos tienen actividad activa
                  </p>
                ) : disponibles.map((eq, i) => (
                  <div key={i} onClick={() => setForm(f => ({...f, equipo_id: String(eq.id)}))}
                    style={{
                      display:"flex", justifyContent:"space-between", alignItems:"center",
                      padding:"10px 12px", borderRadius:"10px", marginBottom:"6px",
                      background: form.equipo_id == eq.id ? "var(--accent-light)" : "var(--bg-surface2)",
                      border: `1px solid ${form.equipo_id == eq.id ? "var(--accent)" : "var(--border)"}`,
                      cursor:"pointer", transition:"all 0.15s",
                    }}>
                    <div>
                      <p style={{ margin:0, color:"var(--accent-text)", fontWeight:600, fontSize:"13px" }}>{eq.codigo}</p>
                      <p style={{ margin:0, color:"var(--text-secondary)", fontSize:"11px" }}>{eq.nombre}</p>
                    </div>
                    <span style={{ background:"var(--success-bg)", color:"var(--success)", border:"1px solid var(--success)", borderRadius:"6px", padding:"2px 8px", fontSize:"10px", fontWeight:600 }}>
                      Disponible
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Equipos bloqueados */}
            {bloqueados.length > 0 && (
              <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"16px", overflow:"hidden" }}>
                <div style={{ padding:"1rem 1.25rem", borderBottom:"1px solid var(--border)" }}>
                  <h5 style={{ fontWeight:600, margin:0, color:"var(--text-primary)" }}>
                    🔒 No disponibles ({bloqueados.length})
                  </h5>
                </div>
                <div style={{ padding:"1rem" }}>
                  {bloqueados.map((eq, i) => (
                    <div key={i} style={{
                      padding:"10px 12px", borderRadius:"10px", marginBottom:"6px",
                      background:"var(--bg-surface2)", border:"1px solid var(--border)",
                      opacity:0.75,
                    }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                        <div>
                          <p style={{ margin:0, color:"var(--text-primary)", fontWeight:600, fontSize:"13px" }}>{eq.codigo}</p>
                          <p style={{ margin:0, color:"var(--text-secondary)", fontSize:"11px" }}>{eq.nombre}</p>
                        </div>
                        <span style={{ background:"var(--danger-bg)", color:"var(--danger)", border:"1px solid var(--danger)", borderRadius:"6px", padding:"2px 8px", fontSize:"10px", fontWeight:600, flexShrink:0 }}>
                          🔒 Bloqueado
                        </span>
                      </div>
                      <p style={{ margin:"6px 0 0", color:"var(--text-muted)", fontSize:"11px" }}>
                        {eq.bloqueo.razon}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Consejos */}
            <div style={{ background:"var(--accent-light)", border:"1px solid var(--accent)", borderRadius:"12px", padding:"1rem 1.25rem" }}>
              <p style={{ color:"var(--accent-text)", fontWeight:600, fontSize:"13px", margin:"0 0 8px" }}>💡 Consejos</p>
              <ul style={{ color:"var(--accent-text)", fontSize:"12px", margin:0, paddingLeft:"16px", lineHeight:1.8 }}>
                <li>Sé específico sobre el problema para agilizar la atención</li>
                <li>Usa prioridad <strong>Alta</strong> solo si afecta directamente tu trabajo</li>
                <li>Puedes editar tu solicitud mientras esté <strong>Pendiente</strong></li>
                <li>Un equipo bloqueado ya tiene atención activa — espera a que finalice</li>
              </ul>
            </div>
          </div>
        </div>
      )}

    </PersonalLayout>
  );
}