import { useEffect, useState } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import api from "../../services/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const inputStyle = {
  width: "100%",
  background: "var(--bg-surface2)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  padding: "10px 14px",
  color: "var(--text-primary)",
  fontSize: "14px",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box"
};

const labelStyle = {
  display: "block",
  color: "var(--text-secondary)",
  fontSize: "13px",
  fontWeight: 500,
  marginBottom: "6px"
};

const Overlay = ({ children, onClose }) => (
  <div
    onClick={onClose}
    style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.6)",
      zIndex: 9999,
      display: "flex", alignItems: "center",
      justifyContent: "center",
      padding: "1rem"
    }}
  >
    <div onClick={e => e.stopPropagation()}>{children}</div>
  </div>
);

function Equipos() {

  const [equipos,     setEquipos]     = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando,    setEditando]    = useState(false);
  const [bajaId,      setBajaId]      = useState(null);
  const [informeBaja, setInformeBaja] = useState("");
  const [detalleBaja, setDetalleBaja] = useState(""); // ✅ nuevo
  const [equipoView,  setEquipoView]  = useState(null);
  const [tipos,       setTipos]       = useState([]);
  const [sucursales,  setSucursales]  = useState([]);
  const [buscar,      setBuscar]      = useState("");

  const emptyForm = {
    id: "", codigo: "", nombre: "", tipo_id: "",
    sucursal_id: "", numero_serie: "",
    tipo_adquisicion: "Propio", caracteristicas: "",
    proveedor: "", fecha_adquisicion: "", observaciones: ""
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [e, t, s] = await Promise.all([
        api.get("/equipos"),
        api.get("/catalogos/tipos"),
        api.get("/catalogos/sucursales")
      ]);
      setEquipos(e.data);
      setTipos(t.data);
      setSucursales(s.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const resetForm = () => {
    setMostrarForm(false);
    setEditando(false);
    setForm(emptyForm);
  };

  const save = async () => {
    try {
      if (!form.codigo || !form.nombre || !form.tipo_id) {
        alert("Completa campos obligatorios");
        return;
      }
      if (editando) {
        await api.put(`/equipos/${form.id}`, form);
      } else {
        await api.post("/equipos", form);
      }
      resetForm();
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Error");
    }
  };

  // ✅ darBaja ahora manda informe_baja + detalle
  const darBaja = async () => {
    if (!informeBaja)
      return alert("Selecciona el motivo de baja");
    try {
      await api.put(`/equipos/baja/${bajaId}`, {
        informe_baja: informeBaja,
        detalle:      detalleBaja
      });
      setBajaId(null);
      setInformeBaja("");
      setDetalleBaja("");
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Error");
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFillColor(108, 99, 255);
    doc.rect(0, 0, 297, 25, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    doc.text("GOBIERNO AUTÓNOMO MUNICIPAL — INVENTARIO DE EQUIPOS TI", 148, 12, { align: "center" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(8);
    doc.text(`Generado: ${new Date().toLocaleString("es-BO")} | Total: ${equiposFiltrados.length} equipos`, 148, 20, { align: "center" });
    doc.setTextColor(30, 30, 30);

    autoTable(doc, {
      startY: 30,
      head: [["Código","Equipo","Tipo","N° Serie","Sucursal","F. Adquisición","Estado"]],
      body: equiposFiltrados.map(e => [
        e.codigo, e.nombre, e.tipo || "—",
        e.numero_serie || "—", e.sucursal || "—",
        e.fecha_adquisicion || "—", e.estado
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [108, 99, 255] }
    });
    doc.save("inventario-equipos.pdf");
  };

  const badgeClass = (estado) => {
    if (estado === "DISPONIBLE")   return "badge-success";
    if (estado === "ASIGNADO")     return "badge-warning";
    if (estado === "BAJA")         return "badge-danger";
    if (estado === "MANTENIMIENTO") return "badge-accent";
    return "badge-accent";
  };

  // Búsqueda
  const equiposFiltrados = equipos.filter(e => {
    const q = buscar.toLowerCase();
    return (
      (e.codigo   || "").toLowerCase().includes(q) ||
      (e.nombre   || "").toLowerCase().includes(q) ||
      (e.tipo     || "").toLowerCase().includes(q) ||
      (e.sucursal || "").toLowerCase().includes(q) ||
      (e.estado   || "").toLowerCase().includes(q)
    );
  });

  // Stats rápidas
  const stats = {
    total:        equipos.length,
    disponibles:  equipos.filter(e => e.estado === "DISPONIBLE").length,
    asignados:    equipos.filter(e => e.estado === "ASIGNADO").length,
    mantenimiento:equipos.filter(e => e.estado === "MANTENIMIENTO").length,
    baja:         equipos.filter(e => e.estado === "BAJA").length,
  };

  return (
    <AdminLayout>

      {/* HEADER */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
          💻 Gestión de Equipos
        </h2>
        <p style={{ color: "var(--text-secondary)", margin: "4px 0 0", fontSize: "14px" }}>
          GAM — Inventario institucional de equipos de computación
        </p>
      </div>

      {/* STATS */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
        gap: "12px", marginBottom: "1.5rem"
      }}>
        {[
          { l: "Total",         v: stats.total,         c: "var(--accent-text)" },
          { l: "Disponibles",   v: stats.disponibles,   c: "var(--success)" },
          { l: "Asignados",     v: stats.asignados,     c: "var(--warning)" },
          { l: "Mantenimiento", v: stats.mantenimiento, c: "var(--accent-text)" },
          { l: "Baja",          v: stats.baja,          c: "var(--danger)" },
        ].map((s, i) => (
          <div key={i} style={{
            background: "var(--bg-surface)", border: "1px solid var(--border)",
            borderRadius: "12px", padding: "0.9rem 1rem", textAlign: "center"
          }}>
            <p style={{ color: "var(--text-secondary)", fontSize: "12px", margin: "0 0 4px" }}>{s.l}</p>
            <p style={{ color: s.c, fontSize: "22px", fontWeight: 700, margin: 0 }}>{s.v}</p>
          </div>
        ))}
      </div>

      {/* BARRA ACCIONES */}
      <div style={{
        display: "flex", gap: "12px", marginBottom: "1.25rem",
        flexWrap: "wrap", alignItems: "center"
      }}>
        <input
          style={{ ...inputStyle, maxWidth: "300px" }}
          placeholder="🔍 Buscar por código, nombre, tipo..."
          value={buscar}
          onChange={e => setBuscar(e.target.value)}
        />
        <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
          {equiposFiltrados.length} equipo{equiposFiltrados.length !== 1 ? "s" : ""}
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: "10px" }}>
          <button
            onClick={() => { setMostrarForm(!mostrarForm); setEditando(false); }}
            style={{
              background: "var(--accent)", color: "#fff",
              border: "none", borderRadius: "10px",
              padding: "10px 18px", fontSize: "14px",
              fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
            }}
          >➕ Registrar</button>
          <button
            onClick={exportPDF}
            style={{
              background: "var(--danger-bg)", border: "1px solid var(--danger)",
              color: "var(--danger)", borderRadius: "10px",
              padding: "10px 18px", fontSize: "14px",
              fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
            }}
          >📄 PDF</button>
        </div>
      </div>

      {/* FORMULARIO */}
      {mostrarForm && (
        <div style={{
          background: "var(--bg-surface)", border: "1px solid var(--border)",
          borderRadius: "16px", marginBottom: "1.25rem", overflow: "hidden"
        }}>
          <div style={{
            padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)",
            display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <h5 style={{ fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>
              {editando ? "✏ Editar Equipo" : "➕ Registrar Equipo"}
            </h5>
            <button onClick={resetForm} style={{
              background: "none", border: "none",
              color: "var(--text-muted)", cursor: "pointer",
              fontSize: "18px", fontFamily: "inherit"
            }}>✖</button>
          </div>

          <div style={{ padding: "1.25rem" }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px"
            }}>
              {[
                { label: "Código *",          name: "codigo",            type: "text" },
                { label: "Equipo / Modelo *", name: "nombre",            type: "text" },
                { label: "Número de Serie",   name: "numero_serie",      type: "text" },
                { label: "Proveedor",         name: "proveedor",         type: "text" },
                { label: "Fecha Adquisición", name: "fecha_adquisicion", type: "date" },
                { label: "Características",   name: "caracteristicas",   type: "text" },
              ].map(f => (
                <div key={f.name}>
                  <label style={labelStyle}>{f.label}</label>
                  <input
                    type={f.type} name={f.name}
                    value={form[f.name]} onChange={handleChange}
                    style={inputStyle}
                  />
                </div>
              ))}

              <div>
                <label style={labelStyle}>Tipo *</label>
                <select name="tipo_id" value={form.tipo_id} onChange={handleChange} style={inputStyle}>
                  <option value="">Seleccione...</option>
                  {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Sucursal</label>
                <select name="sucursal_id" value={form.sucursal_id} onChange={handleChange} style={inputStyle}>
                  <option value="">Seleccione...</option>
                  {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Tipo Adquisición</label>
                <select name="tipo_adquisicion" value={form.tipo_adquisicion} onChange={handleChange} style={inputStyle}>
                  <option>Propio</option>
                  <option>Compra</option>
                  <option>Donación</option>
                </select>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Observaciones</label>
                <textarea
                  name="observaciones" rows={3}
                  value={form.observaciones} onChange={handleChange}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "1.25rem" }}>
              <button onClick={resetForm} style={{
                background: "var(--bg-surface2)", border: "1px solid var(--border)",
                color: "var(--text-secondary)", borderRadius: "10px",
                padding: "10px 18px", cursor: "pointer", fontFamily: "inherit"
              }}>Cancelar</button>
              <button onClick={save} style={{
                background: "var(--accent)", color: "#fff", border: "none",
                borderRadius: "10px", padding: "10px 18px",
                fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
              }}>{editando ? "Actualizar" : "Registrar"}</button>
            </div>
          </div>
        </div>
      )}

      {/* TABLA */}
      <div style={{
        background: "var(--bg-surface)", border: "1px solid var(--border)",
        borderRadius: "16px", overflow: "hidden"
      }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
          <h5 style={{ fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>
            Inventario Actual
          </h5>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="table-base">
            <thead>
              <tr>
                {["Sucursal","Código","Tipo","Equipo","N/S","F. Adquisición","Estado","Acciones"].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {equiposFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
                    {buscar ? `Sin resultados para "${buscar}"` : "No hay equipos registrados"}
                  </td>
                </tr>
              ) : equiposFiltrados.map(e => (
                <tr key={e.id}>
                  <td style={{ color: "var(--text-secondary)" }}>{e.sucursal || "—"}</td>
                  <td style={{ color: "var(--accent-text)", fontWeight: 600 }}>{e.codigo}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{e.tipo}</td>
                  <td style={{ color: "var(--text-primary)" }}>{e.nombre}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{e.numero_serie || "—"}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{e.fecha_adquisicion || "—"}</td>
                  <td><span className={badgeClass(e.estado)}>{e.estado}</span></td>
                  <td>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      <button onClick={() => setEquipoView(e)} style={{
                        background: "var(--accent-light)", border: "1px solid var(--accent)",
                        color: "var(--accent-text)", borderRadius: "8px",
                        padding: "5px 10px", cursor: "pointer", fontSize: "13px"
                      }}>👁</button>

                      {e.estado !== "BAJA" && (
                        <button onClick={() => {
                          setMostrarForm(true); setEditando(true);
                          setForm({
                            id: e.id, codigo: e.codigo || "", nombre: e.nombre || "",
                            tipo_id: e.tipo_id || "", sucursal_id: e.sucursal_id || "",
                            numero_serie: e.numero_serie || "", tipo_adquisicion: e.tipo_adquisicion || "",
                            caracteristicas: e.caracteristicas || "", proveedor: e.proveedor || "",
                            fecha_adquisicion: e.fecha_adquisicion || "", observaciones: e.observaciones || ""
                          });
                        }} style={{
                          background: "var(--warning-bg)", border: "1px solid var(--warning)",
                          color: "var(--warning)", borderRadius: "8px",
                          padding: "5px 10px", cursor: "pointer", fontSize: "13px"
                        }}>✏</button>
                      )}

                      {e.estado !== "BAJA" && (
                        <button onClick={() => {
                          setBajaId(e.id);
                          setInformeBaja("");
                          setDetalleBaja("");
                        }} style={{
                          background: "var(--danger-bg)", border: "1px solid var(--danger)",
                          color: "var(--danger)", borderRadius: "8px",
                          padding: "5px 10px", cursor: "pointer", fontSize: "13px"
                        }}>🗑 Baja</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══ MODAL BAJA ══ */}
      {bajaId && (
        <Overlay onClose={() => { setBajaId(null); setInformeBaja(""); setDetalleBaja(""); }}>
          <div style={{
            background: "var(--bg-surface)", border: "1px solid var(--border)",
            borderRadius: "16px", width: "500px", maxWidth: "95vw", padding: "1.75rem"
          }}>
            <h4 style={{ fontWeight: 700, margin: "0 0 0.5rem", color: "var(--danger)" }}>
              🗑 Dar de Baja — Equipo
            </h4>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: "0 0 1.25rem" }}>
              Esta acción marca el equipo como <strong>BAJA</strong> y queda registrado en el historial.
              Las asignaciones activas serán cerradas automáticamente.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={labelStyle}>Motivo de baja *</label>
                <select style={inputStyle} value={informeBaja}
                  onChange={e => setInformeBaja(e.target.value)}>
                  <option value="">Seleccionar motivo...</option>
                  <option value="Obsolescencia tecnológica">Obsolescencia tecnológica</option>
                  <option value="Daño irreparable">Daño irreparable</option>
                  <option value="Robo o extravío">Robo o extravío</option>
                  <option value="Fin de vida útil">Fin de vida útil</option>
                  <option value="Donación">Donación</option>
                  <option value="Siniestro">Siniestro</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Detalle adicional</label>
                <textarea
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical" }}
                  placeholder="Describe detalladamente el motivo, condición del equipo, número de acta si aplica..."
                  value={detalleBaja}
                  onChange={e => setDetalleBaja(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "1.25rem" }}>
              <button
                onClick={() => { setBajaId(null); setInformeBaja(""); setDetalleBaja(""); }}
                style={{
                  background: "var(--bg-surface2)", border: "1px solid var(--border)",
                  color: "var(--text-secondary)", borderRadius: "10px",
                  padding: "10px 18px", cursor: "pointer", fontFamily: "inherit"
                }}
              >Cancelar</button>
              <button onClick={darBaja} style={{
                background: "var(--danger)", color: "#fff", border: "none",
                borderRadius: "10px", padding: "10px 18px",
                fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
              }}>🗑 Confirmar Baja</button>
            </div>
          </div>
        </Overlay>
      )}

      {/* ══ MODAL VER EQUIPO ══ */}
      {equipoView && (
        <Overlay onClose={() => setEquipoView(null)}>
          <div style={{
            background: "var(--bg-surface)", border: "1px solid var(--border)",
            borderRadius: "16px", width: "820px", maxWidth: "95%",
            maxHeight: "90vh", overflow: "hidden",
            display: "flex", flexDirection: "column"
          }}>
            <div style={{
              background: "var(--accent)", padding: "1rem 1.25rem",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <div>
                <h4 style={{ color: "#fff", fontWeight: 700, margin: 0 }}>
                  💻 Información del Equipo
                </h4>
                <small style={{ color: "rgba(255,255,255,0.75)" }}>
                  {equipoView.codigo} — {equipoView.nombre}
                </small>
              </div>
              <button onClick={() => setEquipoView(null)} style={{
                background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
                color: "#fff", borderRadius: "8px", padding: "6px 12px",
                cursor: "pointer", fontFamily: "inherit"
              }}>✖ Cerrar</button>
            </div>

            <div style={{ padding: "1.25rem", overflowY: "auto", flex: 1 }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "12px"
              }}>
                {[
                  { label: "Código",        value: equipoView.codigo },
                  { label: "Tipo",          value: equipoView.tipo },
                  { label: "Equipo/Modelo", value: equipoView.nombre },
                  { label: "Número Serie",  value: equipoView.numero_serie || "—" },
                  { label: "Sucursal",      value: equipoView.sucursal || "—" },
                  { label: "Adquisición",   value: equipoView.tipo_adquisicion || "—" },
                  { label: "Fecha",         value: equipoView.fecha_adquisicion || "—" },
                  { label: "Proveedor",     value: equipoView.proveedor || "—" },
                ].map(f => (
                  <div key={f.label} style={{
                    background: "var(--bg-surface2)", border: "1px solid var(--border)",
                    borderRadius: "12px", padding: "12px 14px"
                  }}>
                    <p style={{ color: "var(--text-secondary)", fontSize: "12px", margin: "0 0 4px" }}>{f.label}</p>
                    <p style={{ color: "var(--text-primary)", fontWeight: 600, margin: 0, fontSize: "14px" }}>{f.value}</p>
                  </div>
                ))}

                <div style={{
                  background: "var(--bg-surface2)", border: "1px solid var(--border)",
                  borderRadius: "12px", padding: "12px 14px"
                }}>
                  <p style={{ color: "var(--text-secondary)", fontSize: "12px", margin: "0 0 8px" }}>Estado</p>
                  <span className={badgeClass(equipoView.estado)}>{equipoView.estado}</span>
                </div>

                <div style={{
                  gridColumn: "1 / -1", background: "var(--bg-surface2)",
                  border: "1px solid var(--border)", borderRadius: "12px", padding: "12px 14px"
                }}>
                  <p style={{ color: "var(--text-secondary)", fontSize: "12px", margin: "0 0 4px" }}>Características</p>
                  <p style={{ color: "var(--text-primary)", margin: 0, fontSize: "14px", lineHeight: 1.6 }}>
                    {equipoView.caracteristicas || "—"}
                  </p>
                </div>

                <div style={{
                  gridColumn: "1 / -1", background: "var(--bg-surface2)",
                  border: "1px solid var(--border)", borderRadius: "12px", padding: "12px 14px"
                }}>
                  <p style={{ color: "var(--text-secondary)", fontSize: "12px", margin: "0 0 4px" }}>Observaciones</p>
                  <p style={{ color: "var(--text-primary)", margin: 0, fontSize: "14px", lineHeight: 1.6 }}>
                    {equipoView.observaciones || "—"}
                  </p>
                </div>

                {/* Mostrar info de baja si aplica */}
                {equipoView.estado === "BAJA" && equipoView.informe_baja && (
                  <div style={{
                    gridColumn: "1 / -1",
                    background: "var(--danger-bg)", border: "1px solid var(--danger)",
                    borderRadius: "12px", padding: "12px 14px"
                  }}>
                    <p style={{ color: "var(--danger)", fontSize: "12px", fontWeight: 600, margin: "0 0 4px" }}>
                      MOTIVO DE BAJA
                    </p>
                    <p style={{ color: "var(--text-primary)", margin: 0, fontSize: "14px" }}>
                      {equipoView.informe_baja}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Overlay>
      )}

    </AdminLayout>
  );
}

export default Equipos;