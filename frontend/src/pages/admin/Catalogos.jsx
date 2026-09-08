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
  borderRadius: "18px",
  overflow: "hidden",
  marginBottom: "1.5rem"
};

const sectionHeader = (color = "var(--accent)") => ({
  padding: "1rem 1.25rem",
  display: "flex",
  alignItems: "center",
  gap: "12px",
  borderBottom: "1px solid var(--border)",
  borderLeft: `3px solid ${color}`,
});

const colBox = {
  background: "var(--bg-surface2)",
  border: "1px solid var(--border)",
  borderRadius: "14px",
  padding: "1.1rem",
  height: "100%",
  display: "flex",
  flexDirection: "column",
};

const colHead = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "12px",
};

const countPill = {
  background: "var(--bg-surface)",
  border: "1px solid var(--border)",
  color: "var(--text-secondary)",
  borderRadius: "999px",
  padding: "1px 9px",
  fontSize: "11px",
  fontWeight: 700,
};

function Catalogos() {

  const { confirmar } = useDialog();

  const [sucursales, setSucursales] = useState([]);
  const [areas,      setAreas]      = useState([]);
  const [cargos,     setCargos]     = useState([]);
  const [tipos,      setTipos]      = useState([]);
  const [lugares,    setLugares]    = useState([]);

  const [editingId,   setEditingId]   = useState(null);
  const [editingType, setEditingType] = useState("");
  const [editingData, setEditingData] = useState({});

  const [sucursal, setSucursal] = useState({ nombre: "", direccion: "" });
  const [area,     setArea]     = useState("");
  const [cargo,    setCargo]    = useState("");
  const [tipo,     setTipo]     = useState("");
  const [lugar,    setLugar]    = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [s, a, c, t, l] = await Promise.all([
        api.get("/catalogos/sucursales"),
        api.get("/catalogos/areas"),
        api.get("/catalogos/cargos"),
        api.get("/catalogos/tipos"),
        api.get("/catalogos/lugares"),
      ]);
      setSucursales(s.data);
      setAreas(a.data);
      setCargos(c.data);
      setTipos(t.data);
      setLugares(l.data);
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
      width: "100%", background: "transparent",
      color, border: `1px dashed ${color}`,
      borderRadius: "10px", padding: "9px",
      fontSize: "13px", fontWeight: 700,
      cursor: "pointer", fontFamily: "inherit",
      marginBottom: "1rem"
    }}>
      + Agregar
    </button>
  );

  /* ── Columna de catálogo ── */
  const CatCol = ({ icon, title, count, children }) => (
    <div style={colBox}>
      <div style={colHead}>
        <h6 style={{ color: "var(--text-primary)", fontWeight: 700, margin: 0, fontSize: "14px" }}>
          {icon} {title}
        </h6>
        <span style={countPill}>{count}</span>
      </div>
      {children}
    </div>
  );

  const Vacio = () => (
    <p style={{ color: "var(--text-muted)", fontSize: "12px", textAlign: "center", padding: "1rem 0", margin: 0 }}>
      Sin registros
    </p>
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
  const SectionTitle = ({ icon, text, sub, color = "var(--accent)" }) => (
    <div style={sectionHeader(color)}>
      <span style={{
        fontSize: "16px", width: "34px", height: "34px", flexShrink: 0,
        display: "grid", placeItems: "center", borderRadius: "10px",
        background: "var(--bg-surface2)", border: "1px solid var(--border)",
      }}>{icon}</span>
      <div>
        <h5 style={{ color: "var(--text-primary)", fontWeight: 700, margin: 0, fontSize: "14px" }}>{text}</h5>
        {sub && <p style={{ color: "var(--text-muted)", margin: "1px 0 0", fontSize: "12px" }}>{sub}</p>}
      </div>
    </div>
  );

  const gridWrap = {
    padding: "1.25rem",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "14px",
  };
  const lista = { flex: 1, overflowY: "auto", maxHeight: "320px" };

  return (
    <AdminLayout>

      {/* HEADER */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontWeight: 700, margin: 0, color: "var(--text-primary)", fontSize: "22px" }}>
          Catálogos
        </h2>
        <p style={{ color: "var(--text-secondary)", margin: "3px 0 0", fontSize: "13px" }}>
          Listas base del sistema — sucursales, áreas, cargos, tipos de equipo y lugares
        </p>
      </div>

      {/* ══ ASIGNACIONES ══ */}
      <div style={sectionCard}>
        <SectionTitle icon="🏢" text="Organización" sub="Datos de sucursales, áreas y cargos" color="#6c63ff" />
        <div style={gridWrap}>

          <CatCol icon="🏢" title="Sucursales" count={sucursales.length}>
            <input style={inp} placeholder="Nombre"
              value={sucursal.nombre}
              onChange={e => setSucursal({ ...sucursal, nombre: e.target.value })} />
            <input style={inp} placeholder="Dirección"
              value={sucursal.direccion}
              onChange={e => setSucursal({ ...sucursal, direccion: e.target.value })} />
            <BtnAdd onClick={crearSucursal} color="#6c63ff" />
            <div style={lista}>
              {sucursales.map(s => renderItem(s, "sucursal", "sucursales", ["nombre", "direccion"]))}
              {sucursales.length === 0 && <Vacio />}
            </div>
          </CatCol>

          <CatCol icon="🧩" title="Áreas" count={areas.length}>
            <input style={inp} placeholder="Nueva área"
              value={area} onChange={e => setArea(e.target.value)} />
            <BtnAdd onClick={crearArea} color="#22c55e" />
            <div style={lista}>
              {areas.map(a => renderItem(a, "area", "areas"))}
              {areas.length === 0 && <Vacio />}
            </div>
          </CatCol>

          <CatCol icon="👨‍💼" title="Cargos" count={cargos.length}>
            <input style={inp} placeholder="Nuevo cargo"
              value={cargo} onChange={e => setCargo(e.target.value)} />
            <BtnAdd onClick={crearCargo} color="#f59e0b" />
            <div style={lista}>
              {cargos.map(c => renderItem(c, "cargo", "cargos"))}
              {cargos.length === 0 && <Vacio />}
            </div>
          </CatCol>

        </div>
      </div>

      {/* ══ EQUIPOS ══ */}
      <div style={sectionCard}>
        <SectionTitle icon="💻" text="Equipos" sub="Tipos de equipo y ubicaciones físicas" color="#3b82f6" />
        <div style={gridWrap}>

          <CatCol icon="💻" title="Tipos de Equipo" count={tipos.length}>
            <input style={inp} placeholder="Laptop / PC / Impresora..."
              value={tipo} onChange={e => setTipo(e.target.value)} />
            <BtnAdd onClick={crearTipo} color="#3b82f6" />
            <div style={lista}>
              {tipos.map(t => renderItem(t, "tipo", "tipos"))}
              {tipos.length === 0 && <Vacio />}
            </div>
          </CatCol>

          <CatCol icon="📍" title="Lugares" count={lugares.length}>
            <input style={inp} placeholder="Oficina Alcalde..."
              value={lugar} onChange={e => setLugar(e.target.value)} />
            <BtnAdd onClick={crearLugar} color="#64748b" />
            <div style={lista}>
              {lugares.map(l => renderItem(l, "lugar", "lugares"))}
              {lugares.length === 0 && <Vacio />}
            </div>
          </CatCol>

        </div>
      </div>

      <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: "0.5rem 0 0" }}>
        🔩 Los repuestos ahora se gestionan en el módulo <strong>Inventario → Repuestos</strong>.
      </p>

    </AdminLayout>
  );
}

export default Catalogos;