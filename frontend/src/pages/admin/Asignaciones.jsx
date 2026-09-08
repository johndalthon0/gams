import { useEffect, useState } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import api from "../../services/api";
import { useDialog } from "../../context/DialogContext";

const inp = {
  width: "100%", background: "var(--bg-surface2)",
  border: "1px solid var(--border)", borderRadius: "10px",
  padding: "10px 14px", color: "var(--text-primary)",
  fontSize: "14px", outline: "none",
  fontFamily: "inherit", boxSizing: "border-box"
};
const lbl = {
  display: "block", color: "var(--text-secondary)",
  fontSize: "13px", fontWeight: 500, marginBottom: "6px"
};
const btnP = {
  background: "var(--accent)", color: "#fff", border: "none",
  borderRadius: "10px", padding: "10px 18px", fontSize: "14px",
  fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
};
const btnG = (c = "var(--text-secondary)") => ({
  background: "var(--bg-surface2)", border: "1px solid var(--border)",
  color: c, borderRadius: "10px", padding: "10px 18px",
  fontSize: "14px", cursor: "pointer", fontFamily: "inherit"
});

const Overlay = ({ children, onClose }) => (
  <div onClick={onClose} style={{
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
    zIndex: 9999, padding: "1.5rem 1rem", overflowY: "auto",
    display: "flex", alignItems: "flex-start", justifyContent: "center"
  }}>
    <div onClick={e => e.stopPropagation()} style={{
      width: "min(560px, 100%)", margin: "auto 0"
    }}>{children}</div>
  </div>
);

function Asignaciones() {

  const { avisar } = useDialog();

  const [asignaciones, setAsignaciones] = useState([]);
  const [usuarios,     setUsuarios]     = useState([]);
  const [equipos,      setEquipos]      = useState([]);
  const [catalogos,    setCatalogos]    = useState({ areas: [], cargos: [], sucursales: [] });
  const [buscar,       setBuscar]       = useState("");
  const [filtroEstado, setFiltroEstado] = useState("activas");
  const [mostrarForm,  setMostrarForm]  = useState(false);

  // Modal devolución
  const [modalDev,  setModalDev]  = useState(null);
  const [devForm,   setDevForm]   = useState({ condicion: "", observaciones: "" });

  // Modal ver detalle
  const [modalVer,  setModalVer]  = useState(null);

  const emptyForm = {
    usuario_id: "", equipo_id: "",
    area_id: "", cargo_id: "", sucursal_id: ""
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [a, u, e, c] = await Promise.all([
        api.get("/asignaciones"),
        api.get("/asignaciones/usuarios"),
        api.get("/asignaciones/equipos"),
        api.get("/asignaciones/catalogos")
      ]);
      setAsignaciones(Array.isArray(a.data) ? a.data : []);
      setUsuarios(Array.isArray(u.data) ? u.data : []);
      setEquipos(Array.isArray(e.data) ? e.data : []);
      setCatalogos(c.data || { areas: [], cargos: [], sucursales: [] });
    } catch (err) {
      console.log(err);
    }
  };

  const crear = async () => {
    if (!form.usuario_id || !form.equipo_id)
      return avisar("Selecciona un usuario y un equipo antes de continuar.");
    try {
      await api.post("/asignaciones", form);
      setForm(emptyForm);
      setMostrarForm(false);
      loadAll();
    } catch (err) {
      avisar(err.response?.data?.message || "No se pudo realizar la asignación.", "Error de asignación");
    }
  };

  const abrirDevolucion = (a) => {
    setModalDev(a);
    setDevForm({ condicion: "", observaciones: "" });
  };

  const confirmarDevolucion = async () => {
    if (!devForm.condicion)
      return avisar("Selecciona la condición del equipo al devolver.");
    try {
      await api.put(`/asignaciones/devolver/${modalDev.id}`, devForm);
      setModalDev(null);
      loadAll();
    } catch (err) {
      avisar(err.response?.data?.message || "No se pudo registrar la devolución.", "Error de devolución");
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString("es-BO", {
    day: "2-digit", month: "short", year: "numeric"
  }) : "—";

  // Filtros
  const filtradas = asignaciones.filter(a => {
    const q = buscar.toLowerCase();
    const matchBuscar = (
      (a.equipo_codigo || "").toLowerCase().includes(q) ||
      (a.equipo        || "").toLowerCase().includes(q) ||
      (a.usuario       || "").toLowerCase().includes(q) ||
      (a.apellido      || "").toLowerCase().includes(q) ||
      (a.area          || "").toLowerCase().includes(q) ||
      (a.cargo         || "").toLowerCase().includes(q) ||
      (a.sucursal      || "").toLowerCase().includes(q)
    );
    const matchEstado =
      filtroEstado === "todas"    ? true :
      filtroEstado === "activas"  ? a.estado === 1 :
      filtroEstado === "historial"? a.estado === 0 : true;
    return matchBuscar && matchEstado;
  });

  const activas   = asignaciones.filter(a => a.estado === 1).length;
  const historial = asignaciones.filter(a => a.estado === 0).length;

  const condiciones = [
    { v: "BUENO",       l: "✅ Bueno — Sin daños, funciona correctamente" },
    { v: "REGULAR",     l: "🟡 Regular — Desgaste normal de uso" },
    { v: "DETERIORADO", l: "🟠 Deteriorado — Daños visibles pero funcional" },
    { v: "DAÑADO",      l: "🔴 Dañado — No funciona o daño significativo" },
  ];

  return (
    <AdminLayout>

      {/* HEADER */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
          📦 Gestión de Asignaciones
        </h2>
        <p style={{ color: "var(--text-secondary)", margin: "4px 0 0", fontSize: "14px" }}>
          GAM — Asignación y devolución de equipos al personal
        </p>
      </div>

      {/* STATS */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: "12px", marginBottom: "1.5rem"
      }}>
        {[
          { l: "Total",            v: asignaciones.length, c: "var(--accent-text)" },
          { l: "Activas",          v: activas,             c: "var(--success)" },
          { l: "Devueltas",        v: historial,           c: "var(--text-secondary)" },
          { l: "Equipos libres",   v: equipos.length,      c: "var(--warning)" },
        ].map((s, i) => (
          <div key={i} style={{
            background: "var(--bg-surface)", border: "1px solid var(--border)",
            borderRadius: "12px", padding: "1rem", textAlign: "center"
          }}>
            <p style={{ color: "var(--text-secondary)", fontSize: "12px", margin: "0 0 4px" }}>{s.l}</p>
            <p style={{ color: s.c, fontSize: "22px", fontWeight: 700, margin: 0 }}>{s.v}</p>
          </div>
        ))}
      </div>

      {/* BARRA */}
      <div style={{
        display: "flex", gap: "10px", marginBottom: "1.25rem",
        flexWrap: "wrap", alignItems: "center"
      }}>
        <input
          style={{ ...inp, maxWidth: "280px" }}
          placeholder="🔍 Buscar por equipo, usuario, área..."
          value={buscar}
          onChange={e => setBuscar(e.target.value)}
        />
        <div style={{ display: "flex", gap: "6px" }}>
          {[
            { v: "activas",   l: `Activas (${activas})` },
            { v: "historial", l: `Historial (${historial})` },
            { v: "todas",     l: "Todas" },
          ].map(f => (
            <button key={f.v} onClick={() => setFiltroEstado(f.v)} style={{
              padding: "8px 14px", borderRadius: "8px", fontSize: "13px",
              border: filtroEstado === f.v ? "none" : "1px solid var(--border)",
              background: filtroEstado === f.v ? "var(--accent)" : "var(--bg-surface)",
              color: filtroEstado === f.v ? "#fff" : "var(--text-secondary)",
              cursor: "pointer", fontFamily: "inherit", fontWeight: 500
            }}>{f.l}</button>
          ))}
        </div>
        <button onClick={() => { setMostrarForm(!mostrarForm); setForm(emptyForm); }}
          style={{ ...btnP, marginLeft: "auto" }}>
          ➕ Nueva Asignación
        </button>
      </div>

      {/* FORMULARIO NUEVA ASIGNACIÓN */}
      {mostrarForm && (
        <div style={{
          background: "var(--bg-surface)", border: "1px solid var(--border)",
          borderRadius: "16px", overflow: "hidden", marginBottom: "1.25rem"
        }}>
          <div style={{
            padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)",
            display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <h5 style={{ fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>
              ➕ Nueva Asignación
            </h5>
            <button onClick={() => setMostrarForm(false)} style={{
              background: "none", border: "none",
              color: "var(--text-muted)", cursor: "pointer", fontSize: "18px"
            }}>✖</button>
          </div>

          <div style={{ padding: "1.25rem" }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "14px"
            }}>
              <div>
                <label style={lbl}>Usuario / Personal *</label>
                <select value={form.usuario_id}
                  onChange={e => setForm({ ...form, usuario_id: e.target.value })} style={inp}>
                  <option value="">Seleccionar usuario...</option>
                  {usuarios.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.nombre} {u.apellido || ""} — {u.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={lbl}>Equipo disponible *</label>
                <select value={form.equipo_id}
                  onChange={e => setForm({ ...form, equipo_id: e.target.value })} style={inp}>
                  <option value="">Seleccionar equipo...</option>
                  {equipos.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.codigo} — {e.nombre} {e.tipo ? `(${e.tipo})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={lbl}>Área</label>
                <select value={form.area_id}
                  onChange={e => setForm({ ...form, area_id: e.target.value })} style={inp}>
                  <option value="">Seleccionar área...</option>
                  {catalogos.areas.map(a => (
                    <option key={a.id} value={a.id}>{a.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={lbl}>Cargo</label>
                <select value={form.cargo_id}
                  onChange={e => setForm({ ...form, cargo_id: e.target.value })} style={inp}>
                  <option value="">Seleccionar cargo...</option>
                  {catalogos.cargos.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={lbl}>Sucursal</label>
                <select value={form.sucursal_id}
                  onChange={e => setForm({ ...form, sucursal_id: e.target.value })} style={inp}>
                  <option value="">Seleccionar sucursal...</option>
                  {catalogos.sucursales.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "1.25rem" }}>
              <button onClick={() => setMostrarForm(false)} style={btnG()}>Cancelar</button>
              <button onClick={crear} style={btnP}>✅ Confirmar Asignación</button>
            </div>
          </div>
        </div>
      )}

      {/* TABLA */}
      <div style={{
        background: "var(--bg-surface)", border: "1px solid var(--border)",
        borderRadius: "16px", overflow: "hidden"
      }}>
        <div style={{
          padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <h5 style={{ fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>
            {filtroEstado === "activas"   ? "Asignaciones Activas" :
             filtroEstado === "historial" ? "Historial de Devoluciones" :
             "Todas las Asignaciones"}
          </h5>
          <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
            {filtradas.length} registro{filtradas.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="table-base">
            <thead>
              <tr>
                {["#","Equipo","Usuario","Área","Cargo","Sucursal",
                  "Fecha asig.","Fecha dev.","Condición devolución","Estado","Acciones"].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
                    {buscar ? `Sin resultados para "${buscar}"` : "Sin asignaciones en esta vista"}
                  </td>
                </tr>
              ) : filtradas.map(a => (
                <tr key={a.id} style={{ opacity: a.estado === 0 ? 0.65 : 1 }}>
                  <td style={{ color: "var(--text-muted)", fontSize: "12px" }}>#{a.id}</td>
                  <td>
                    <p style={{ margin: 0, color: "var(--accent-text)", fontWeight: 600, fontSize: "13px" }}>
                      {a.equipo_codigo}
                    </p>
                    <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "11px" }}>
                      {a.equipo}
                    </p>
                  </td>
                  <td>
                    <p style={{ margin: 0, color: "var(--text-primary)", fontWeight: 500, fontSize: "13px" }}>
                      {a.usuario} {a.apellido || ""}
                    </p>
                    <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "11px" }}>{a.email}</p>
                  </td>
                  <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{a.area     || "—"}</td>
                  <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{a.cargo    || "—"}</td>
                  <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{a.sucursal || "—"}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: "12px", whiteSpace: "nowrap" }}>
                    {fmt(a.fecha_asignacion)}
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: "12px", whiteSpace: "nowrap" }}>
                    {a.fecha_devolucion ? fmt(a.fecha_devolucion) : "—"}
                  </td>
                  <td style={{ maxWidth: "180px" }}>
                    {a.observaciones_devolucion ? (
                      <button onClick={() => setModalVer(a)} style={{
                        background: "none", border: "none",
                        color: "var(--accent-text)", cursor: "pointer",
                        fontSize: "12px", textAlign: "left",
                        fontFamily: "inherit", padding: 0,
                        textDecoration: "underline"
                      }}>
                        {a.observaciones_devolucion.substring(0, 40)}
                        {a.observaciones_devolucion.length > 40 ? "..." : ""}
                      </button>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>—</span>
                    )}
                  </td>
                  <td>
                    <span className={a.estado === 1 ? "badge-success" : "badge-accent"}>
                      {a.estado === 1 ? "✅ Activa" : "📦 Devuelto"}
                    </span>
                  </td>
                  <td>
                    {a.estado === 1 && (
                      <button onClick={() => abrirDevolucion(a)} style={{
                        background: "var(--warning-bg)", border: "1px solid var(--warning)",
                        color: "var(--warning)", borderRadius: "8px",
                        padding: "5px 12px", cursor: "pointer",
                        fontSize: "13px", fontWeight: 600, fontFamily: "inherit",
                        whiteSpace: "nowrap"
                      }}>
                        📦 Devolver
                      </button>
                    )}
                    {a.estado === 0 && (
                      <button onClick={() => setModalVer(a)} style={{
                        background: "var(--accent-light)", border: "1px solid var(--accent)",
                        color: "var(--accent-text)", borderRadius: "8px",
                        padding: "5px 10px", cursor: "pointer", fontSize: "13px"
                      }}>👁 Ver</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══ MODAL DEVOLUCIÓN ══ */}
      {modalDev && (
        <Overlay onClose={() => setModalDev(null)}>
          <div style={{
            background: "var(--bg-surface)", border: "1px solid var(--border)",
            borderRadius: "16px", width: "100%", overflow: "hidden"
          }}>
            <div style={{
              background: "var(--warning)", padding: "1rem 1.25rem",
              display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px"
            }}>
              <div>
                <h4 style={{ color: "#fff", fontWeight: 700, margin: 0 }}>
                  📦 Registrar Devolución
                </h4>
                <small style={{ color: "rgba(255,255,255,0.85)" }}>
                  {modalDev.equipo_codigo} — {modalDev.equipo}
                </small>
              </div>
              <button onClick={() => setModalDev(null)} style={{
                background: "rgba(255,255,255,0.2)", border: "none",
                color: "#fff", borderRadius: "8px", padding: "6px 12px",
                cursor: "pointer", fontFamily: "inherit"
              }}>✖</button>
            </div>

            <div style={{ padding: "1.25rem" }}>

              {/* Info asignación */}
              <div style={{
                background: "var(--bg-surface2)", border: "1px solid var(--border)",
                borderRadius: "12px", padding: "12px 16px", marginBottom: "1.25rem",
                display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px"
              }}>
                {[
                  { l: "Equipo",     v: `${modalDev.equipo_codigo} — ${modalDev.equipo}` },
                  { l: "Usuario",    v: `${modalDev.usuario} ${modalDev.apellido || ""}` },
                  { l: "Área",       v: modalDev.area     || "—" },
                  { l: "Cargo",      v: modalDev.cargo    || "—" },
                  { l: "Sucursal",   v: modalDev.sucursal || "—" },
                  { l: "Asignado",   v: fmt(modalDev.fecha_asignacion) },
                ].map(f => (
                  <div key={f.l}>
                    <p style={{ color: "var(--text-muted)", fontSize: "11px", margin: "0 0 2px" }}>{f.l}</p>
                    <p style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 500, margin: 0 }}>{f.v}</p>
                  </div>
                ))}
              </div>

              {/* Condición */}
              <div style={{ marginBottom: "16px" }}>
                <label style={lbl}>Condición del equipo al devolver *</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {condiciones.map(c => (
                    <label key={c.v} style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "10px 14px", borderRadius: "10px", cursor: "pointer",
                      border: `1px solid ${devForm.condicion === c.v ? "var(--accent)" : "var(--border)"}`,
                      background: devForm.condicion === c.v ? "var(--accent-light)" : "var(--bg-surface2)",
                      transition: "all 0.15s"
                    }}>
                      <input
                        type="radio" name="condicion"
                        value={c.v} checked={devForm.condicion === c.v}
                        onChange={() => setDevForm({ ...devForm, condicion: c.v })}
                        style={{ accentColor: "var(--accent)" }}
                      />
                      <span style={{
                        color: devForm.condicion === c.v ? "var(--accent-text)" : "var(--text-primary)",
                        fontSize: "13px", fontWeight: devForm.condicion === c.v ? 600 : 400
                      }}>{c.l}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Observaciones */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={lbl}>Observaciones adicionales</label>
                <textarea rows={3}
                  value={devForm.observaciones}
                  onChange={e => setDevForm({ ...devForm, observaciones: e.target.value })}
                  style={{ ...inp, resize: "vertical" }}
                  placeholder="Describe el estado del equipo, accesorios entregados, daños observados, etc..."
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", flexWrap: "wrap" }}>
                <button onClick={() => setModalDev(null)} style={btnG()}>Cancelar</button>
                <button
                  onClick={confirmarDevolucion}
                  disabled={!devForm.condicion}
                  style={{
                    background: devForm.condicion ? "var(--warning)" : "var(--bg-surface2)",
                    color: devForm.condicion ? "#fff" : "var(--text-muted)",
                    border: "none", borderRadius: "10px", padding: "10px 18px",
                    fontSize: "14px", fontWeight: 600,
                    cursor: devForm.condicion ? "pointer" : "not-allowed",
                    fontFamily: "inherit"
                  }}
                >📦 Confirmar Devolución</button>
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {/* ══ MODAL VER DETALLE ══ */}
      {modalVer && (
        <Overlay onClose={() => setModalVer(null)}>
          <div style={{
            background: "var(--bg-surface)", border: "1px solid var(--border)",
            borderRadius: "16px", width: "100%", overflow: "hidden"
          }}>
            <div style={{
              background: "var(--accent)", padding: "1rem 1.25rem",
              display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px"
            }}>
              <div>
                <h4 style={{ color: "#fff", fontWeight: 700, margin: 0 }}>
                  📋 Detalle de Asignación #{modalVer.id}
                </h4>
                <small style={{ color: "rgba(255,255,255,0.75)" }}>
                  {modalVer.equipo_codigo} — {modalVer.equipo}
                </small>
              </div>
              <button onClick={() => setModalVer(null)} style={{
                background: "rgba(255,255,255,0.15)", border: "none",
                color: "#fff", borderRadius: "8px", padding: "6px 12px",
                cursor: "pointer", fontFamily: "inherit"
              }}>✖</button>
            </div>

            <div style={{ padding: "1.25rem" }}>
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                gap: "10px", marginBottom: "1.25rem"
              }}>
                {[
                  { l: "Equipo",        v: `${modalVer.equipo_codigo} — ${modalVer.equipo}` },
                  { l: "Usuario",       v: `${modalVer.usuario} ${modalVer.apellido || ""}` },
                  { l: "Área",          v: modalVer.area     || "—" },
                  { l: "Cargo",         v: modalVer.cargo    || "—" },
                  { l: "Sucursal",      v: modalVer.sucursal || "—" },
                  { l: "F. Asignación", v: fmt(modalVer.fecha_asignacion) },
                  { l: "F. Devolución", v: fmt(modalVer.fecha_devolucion) },
                  { l: "Estado",        v: modalVer.estado === 1 ? "Activa" : "Devuelto" },
                ].map(f => (
                  <div key={f.l} style={{
                    background: "var(--bg-surface2)", border: "1px solid var(--border)",
                    borderRadius: "10px", padding: "10px 12px"
                  }}>
                    <p style={{ color: "var(--text-muted)", fontSize: "11px", margin: "0 0 3px" }}>{f.l}</p>
                    <p style={{ color: "var(--text-primary)", fontWeight: 500, fontSize: "13px", margin: 0 }}>{f.v}</p>
                  </div>
                ))}
              </div>

              {modalVer.observaciones_devolucion && (
                <div>
                  <p style={{
                    color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600,
                    textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 6px"
                  }}>
                    Condición y observaciones al devolver
                  </p>
                  <div style={{
                    background: "var(--warning-bg)", border: "1px solid var(--warning)",
                    borderRadius: "10px", padding: "12px 14px",
                    color: "var(--text-primary)", fontSize: "14px", lineHeight: 1.6
                  }}>
                    {modalVer.observaciones_devolucion}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.25rem" }}>
                <button onClick={() => setModalVer(null)} style={btnG()}>Cerrar</button>
              </div>
            </div>
          </div>
        </Overlay>
      )}

    </AdminLayout>
  );
}

export default Asignaciones;