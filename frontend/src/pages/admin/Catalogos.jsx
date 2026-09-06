import { useEffect, useState } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import api from "../../services/api";
import { useDialog } from "../../context/DialogContext";

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
  marginBottom: "10px"
};

const sectionCard = {
  background: "var(--bg-surface)",
  border: "1px solid var(--border)",
  borderRadius: "16px",
  overflow: "hidden",
  marginBottom: "1.5rem"
};

const sectionHeader = (color = "var(--accent)") => ({
  background: color,
  padding: "0.9rem 1.25rem",
  display: "flex",
  alignItems: "center",
  gap: "10px"
});

const colBox = {
  background: "var(--bg-surface2)",
  border: "1px solid var(--border)",
  borderRadius: "12px",
  padding: "1.25rem",
  height: "100%"
};

function Catalogos() {

  const { confirmar } = useDialog();

  const [sucursales, setSucursales] = useState([]);
  const [areas,      setAreas]      = useState([]);
  const [cargos,     setCargos]     = useState([]);
  const [tipos,      setTipos]      = useState([]);
  const [lugares,    setLugares]    = useState([]);
  const [repuestos,  setRepuestos]  = useState([]);

  const [editingId,   setEditingId]   = useState(null);
  const [editingType, setEditingType] = useState("");
  const [editingData, setEditingData] = useState({});

  const [sucursal, setSucursal] = useState({ nombre: "", direccion: "" });
  const [area,     setArea]     = useState("");
  const [cargo,    setCargo]    = useState("");
  const [tipo,     setTipo]     = useState("");
  const [lugar,    setLugar]    = useState("");

  // ✅ precio agregado
  const [repuesto, setRepuesto] = useState({
    nombre: "", tipo: "", stock: "", precio: ""
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [s, a, c, t, l, r] = await Promise.all([
        api.get("/catalogos/sucursales"),
        api.get("/catalogos/areas"),
        api.get("/catalogos/cargos"),
        api.get("/catalogos/tipos"),
        api.get("/catalogos/lugares"),
        api.get("/catalogos/repuestos")
      ]);
      setSucursales(s.data);
      setAreas(a.data);
      setCargos(c.data);
      setTipos(t.data);
      setLugares(l.data);
      setRepuestos(r.data);
    } catch (e) {
      console.log(e);
    }
  };

  /* ── CREAR ── */
  const crearSucursal = async () => {
    if (!sucursal.nombre.trim()) return;
    await api.post("/catalogos/sucursales", sucursal);
    setSucursal({ nombre: "", direccion: "" });
    load();
  };

  const crearArea = async () => {
    if (!area.trim()) return;
    await api.post("/catalogos/areas", { nombre: area });
    setArea(""); load();
  };

  const crearCargo = async () => {
    if (!cargo.trim()) return;
    await api.post("/catalogos/cargos", { nombre: cargo });
    setCargo(""); load();
  };

  const crearTipo = async () => {
    if (!tipo.trim()) return;
    await api.post("/catalogos/tipos", { nombre: tipo });
    setTipo(""); load();
  };

  const crearLugar = async () => {
    if (!lugar.trim()) return;
    await api.post("/catalogos/lugares", { nombre: lugar });
    setLugar(""); load();
  };

  const crearRepuesto = async () => {
    if (!repuesto.nombre.trim()) return;
    await api.post("/catalogos/repuestos", repuesto);
    setRepuesto({ nombre: "", tipo: "", stock: "", precio: "" });
    load();
  };

  /* ── ELIMINAR ── */
  const eliminar = async (ruta, id) => {
    if (!(await confirmar("Se eliminará este registro del catálogo. Esta acción no se puede deshacer.", "Eliminar registro"))) return;
    await api.delete(`/catalogos/${ruta}/${id}`);
    load();
  };

  /* ── EDITAR ── */
  const editar = (tipoItem, item) => {
    setEditingId(item.id);
    setEditingType(tipoItem);
    setEditingData({ ...item });
  };

  const guardarEdicion = async (ruta, id) => {
    await api.put(`/catalogos/${ruta}/${id}`, editingData);
    setEditingId(null);
    setEditingType("");
    load();
  };

  /* ── BTN helpers ── */
  const BtnAdd = ({ onClick, color = "var(--accent)" }) => (
    <button onClick={onClick} style={{
      width: "100%", background: color,
      color: "#fff", border: "none",
      borderRadius: "10px", padding: "10px",
      fontSize: "14px", fontWeight: 600,
      cursor: "pointer", fontFamily: "inherit",
      marginBottom: "1rem"
    }}>
      + Agregar
    </button>
  );

  /* ── RENDER ITEM ── */
  const renderItem = (item, tipoItem, ruta, campos = ["nombre"]) => {
    const isEditing = editingId === item.id && editingType === tipoItem;

    return (
      <div key={item.id} style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        padding: "12px 14px",
        marginBottom: "8px"
      }}>
        {isEditing ? (
          <>
            {campos.map(campo => (
              <input
                key={campo}
                style={{ ...inp, marginBottom: "8px" }}
                value={editingData[campo] || ""}
                placeholder={campo}
                type={campo === "stock" || campo === "precio" ? "number" : "text"}
                onChange={e =>
                  setEditingData({ ...editingData, [campo]: e.target.value })
                }
              />
            ))}
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => guardarEdicion(ruta, item.id)}
                style={{
                  background: "var(--success-bg)",
                  border: "1px solid var(--success)",
                  color: "var(--success)",
                  borderRadius: "8px", padding: "6px 14px",
                  cursor: "pointer", fontFamily: "inherit",
                  fontSize: "13px", fontWeight: 600
                }}
              >
                ✅ Guardar
              </button>
              <button
                onClick={() => { setEditingId(null); setEditingType(""); }}
                style={{
                  background: "var(--bg-surface2)",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                  borderRadius: "8px", padding: "6px 14px",
                  cursor: "pointer", fontFamily: "inherit",
                  fontSize: "13px"
                }}
              >
                Cancelar
              </button>
            </div>
          </>
        ) : (
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center", gap: "10px"
          }}>
            <div>
              <p style={{
                color: "var(--text-primary)",
                fontWeight: 600, margin: 0, fontSize: "14px"
              }}>
                {item.nombre}
              </p>
              {item.direccion && (
                <p style={{ color: "var(--text-secondary)", fontSize: "12px", margin: "2px 0 0" }}>
                  📍 {item.direccion}
                </p>
              )}
              {item.tipo && tipoItem === "repuesto" && (
                <p style={{ color: "var(--text-secondary)", fontSize: "12px", margin: "2px 0 0" }}>
                  Tipo: {item.tipo}
                </p>
              )}
              {item.stock !== undefined && (
                <p style={{ color: "var(--text-secondary)", fontSize: "12px", margin: "2px 0 0" }}>
                  Stock: <strong style={{ color: item.stock > 0 ? "var(--success)" : "var(--danger)" }}>
                    {item.stock}
                  </strong>
                  {item.precio !== undefined && (
                    <span style={{ marginLeft: "12px", color: "var(--accent-text)" }}>
                      Bs {Number(item.precio || 0).toFixed(2)}
                    </span>
                  )}
                </p>
              )}
            </div>
            <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
              <button
                onClick={() => editar(tipoItem, item)}
                style={{
                  background: "var(--warning-bg)",
                  border: "1px solid var(--warning)",
                  color: "var(--warning)",
                  borderRadius: "8px", padding: "5px 10px",
                  cursor: "pointer", fontSize: "13px"
                }}
              >✏</button>
              <button
                onClick={() => eliminar(ruta, item.id)}
                style={{
                  background: "var(--danger-bg)",
                  border: "1px solid var(--danger)",
                  color: "var(--danger)",
                  borderRadius: "8px", padding: "5px 10px",
                  cursor: "pointer", fontSize: "13px"
                }}
              >🗑</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ── SECTION TITLE ── */
  const SectionTitle = ({ icon, text, color = "var(--accent)" }) => (
    <div style={sectionHeader(color)}>
      <span style={{ fontSize: "18px" }}>{icon}</span>
      <h5 style={{ color: "#fff", fontWeight: 700, margin: 0, fontSize: "15px" }}>
        {text}
      </h5>
    </div>
  );

  return (
    <AdminLayout>

      {/* HEADER */}
      <div style={{ marginBottom: "1.75rem" }}>
        <h2 style={{ fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
          ⚙️ Gestión de Catálogos
        </h2>
        <p style={{ color: "var(--text-secondary)", margin: "4px 0 0", fontSize: "14px" }}>
          Configuración general del sistema
        </p>
      </div>

      {/* ══ ASIGNACIONES ══ */}
      <div style={sectionCard}>
        <SectionTitle icon="⚙️" text="Configuración de Asignaciones" color="#6c63ff" />

        <div style={{
          padding: "1.25rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "16px"
        }}>

          {/* SUCURSALES */}
          <div style={colBox}>
            <h6 style={{ color: "var(--text-primary)", fontWeight: 700, marginBottom: "12px" }}>
              🏢 Sucursales
            </h6>
            <input style={inp} placeholder="Nombre"
              value={sucursal.nombre}
              onChange={e => setSucursal({ ...sucursal, nombre: e.target.value })}
            />
            <input style={inp} placeholder="Dirección"
              value={sucursal.direccion}
              onChange={e => setSucursal({ ...sucursal, direccion: e.target.value })}
            />
            <BtnAdd onClick={crearSucursal} />
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {sucursales.map(s => renderItem(s, "sucursal", "sucursales", ["nombre", "direccion"]))}
              {sucursales.length === 0 && (
                <p style={{ color: "var(--text-muted)", fontSize: "13px", textAlign: "center" }}>
                  Sin registros
                </p>
              )}
            </div>
          </div>

          {/* ÁREAS */}
          <div style={colBox}>
            <h6 style={{ color: "var(--text-primary)", fontWeight: 700, marginBottom: "12px" }}>
              🧩 Áreas
            </h6>
            <input style={inp} placeholder="Nueva área"
              value={area}
              onChange={e => setArea(e.target.value)}
            />
            <BtnAdd onClick={crearArea} color="#22c55e" />
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {areas.map(a => renderItem(a, "area", "areas"))}
              {areas.length === 0 && (
                <p style={{ color: "var(--text-muted)", fontSize: "13px", textAlign: "center" }}>
                  Sin registros
                </p>
              )}
            </div>
          </div>

          {/* CARGOS */}
          <div style={colBox}>
            <h6 style={{ color: "var(--text-primary)", fontWeight: 700, marginBottom: "12px" }}>
              👨‍💼 Cargos
            </h6>
            <input style={inp} placeholder="Nuevo cargo"
              value={cargo}
              onChange={e => setCargo(e.target.value)}
            />
            <BtnAdd onClick={crearCargo} color="#f59e0b" />
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {cargos.map(c => renderItem(c, "cargo", "cargos"))}
              {cargos.length === 0 && (
                <p style={{ color: "var(--text-muted)", fontSize: "13px", textAlign: "center" }}>
                  Sin registros
                </p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ══ EQUIPOS ══ */}
      <div style={sectionCard}>
        <SectionTitle icon="💻" text="Configuración de Equipos" color="#1e2140" />

        <div style={{
          padding: "1.25rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "16px"
        }}>

          {/* TIPOS */}
          <div style={colBox}>
            <h6 style={{ color: "var(--text-primary)", fontWeight: 700, marginBottom: "12px" }}>
              💻 Tipos de Equipo
            </h6>
            <input style={inp} placeholder="Laptop / PC / Impresora..."
              value={tipo}
              onChange={e => setTipo(e.target.value)}
            />
            <BtnAdd onClick={crearTipo} color="#1e2140" />
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {tipos.map(t => renderItem(t, "tipo", "tipos"))}
              {tipos.length === 0 && (
                <p style={{ color: "var(--text-muted)", fontSize: "13px", textAlign: "center" }}>
                  Sin registros
                </p>
              )}
            </div>
          </div>

          {/* LUGARES */}
          <div style={colBox}>
            <h6 style={{ color: "var(--text-primary)", fontWeight: 700, marginBottom: "12px" }}>
              📍 Lugares
            </h6>
            <input style={inp} placeholder="Oficina Alcalde..."
              value={lugar}
              onChange={e => setLugar(e.target.value)}
            />
            <BtnAdd onClick={crearLugar} color="#64748b" />
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {lugares.map(l => renderItem(l, "lugar", "lugares"))}
              {lugares.length === 0 && (
                <p style={{ color: "var(--text-muted)", fontSize: "13px", textAlign: "center" }}>
                  Sin registros
                </p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ══ REPARACIONES / REPUESTOS ══ */}
      <div style={sectionCard}>
        <SectionTitle icon="🛠" text="Configuración de Reparaciones — Inventario de Repuestos" color="#16a34a" />

        <div style={{
          padding: "1.25rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "16px"
        }}>

          {/* FORM NUEVO REPUESTO */}
          <div style={colBox}>
            <h6 style={{ color: "var(--text-primary)", fontWeight: 700, marginBottom: "14px" }}>
              ➕ Nuevo Repuesto
            </h6>

            <label style={{ color: "var(--text-secondary)", fontSize: "12px", display: "block", marginBottom: "4px" }}>
              Nombre *
            </label>
            <input style={inp} placeholder="Ej: Memoria RAM DDR4"
              value={repuesto.nombre}
              onChange={e => setRepuesto({ ...repuesto, nombre: e.target.value })}
            />

            <label style={{ color: "var(--text-secondary)", fontSize: "12px", display: "block", marginBottom: "4px" }}>
              Tipo / Especificación
            </label>
            <input style={inp} placeholder="Ej: 8GB / 780W / etc."
              value={repuesto.tipo}
              onChange={e => setRepuesto({ ...repuesto, tipo: e.target.value })}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ color: "var(--text-secondary)", fontSize: "12px", display: "block", marginBottom: "4px" }}>
                  Stock inicial
                </label>
                <input
                  type="number" min={0}
                  style={inp}
                  placeholder="0"
                  value={repuesto.stock}
                  onChange={e => setRepuesto({ ...repuesto, stock: e.target.value })}
                />
              </div>
              <div>
                <label style={{ color: "var(--text-secondary)", fontSize: "12px", display: "block", marginBottom: "4px" }}>
                  Precio (Bs) *
                </label>
                <input
                  type="number" min={0} step="0.01"
                  style={inp}
                  placeholder="0.00"
                  value={repuesto.precio}
                  onChange={e => setRepuesto({ ...repuesto, precio: e.target.value })}
                />
              </div>
            </div>

            <button
              onClick={crearRepuesto}
              style={{
                width: "100%",
                background: "#16a34a",
                color: "#fff", border: "none",
                borderRadius: "10px", padding: "11px",
                fontSize: "14px", fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
                marginTop: "4px"
              }}
            >
              + Agregar Repuesto
            </button>
          </div>

          {/* LISTA REPUESTOS */}
          <div style={{ ...colBox, gridColumn: "span 1" }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: "14px"
            }}>
              <h6 style={{ color: "var(--text-primary)", fontWeight: 700, margin: 0 }}>
                📦 Inventario de Repuestos
              </h6>
              <span style={{
                background: "var(--accent-light)",
                color: "var(--accent-text)",
                borderRadius: "6px", padding: "3px 10px",
                fontSize: "12px", fontWeight: 600
              }}>
                {repuestos.length} items
              </span>
            </div>

            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              {repuestos.map(r =>
                renderItem(r, "repuesto", "repuestos", ["nombre", "tipo", "stock", "precio"])
              )}
              {repuestos.length === 0 && (
                <div style={{
                  textAlign: "center", padding: "2rem",
                  color: "var(--text-muted)"
                }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>📦</div>
                  <p style={{ margin: 0, fontSize: "13px" }}>Sin repuestos registrados</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

    </AdminLayout>
  );
}

export default Catalogos;