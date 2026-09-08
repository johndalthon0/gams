import { useEffect, useState, useCallback } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import api from "../../services/api";
import { useDialog } from "../../context/DialogContext";

// ── Helpers ────────────────────────────────────────────────────────────────
const fmtBs   = (n) => `Bs ${Number(n || 0).toFixed(2)}`;
const fmtNum  = (n) => Number(n || 0).toLocaleString("es-BO");
const fmtFecha= (d) => d ? new Date(d).toLocaleString("es-BO", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }) : "—";

// ── Estilos base usando variables CSS del tema ─────────────────────────────
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
    fontWeight: 600,
    fontSize: "12px",
    marginBottom: "5px",
    color: "var(--text-secondary)",
    textTransform: "uppercase",
    letterSpacing: "0.4px",
  },
  surface: {
    background: "var(--bg-surface)",
    border: "1px solid var(--border)",
    borderRadius: "16px",
    overflow: "hidden",
  },
  btn: {
    borderRadius: "10px",
    padding: "9px 18px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    border: "none",
    transition: "opacity 0.15s",
  },
};

// ── Colores semánticos ─────────────────────────────────────────────────────
const C = {
  primary:  { bg: "var(--accent)",      text: "#fff"           },
  ghost:    { bg: "var(--bg-surface2)", text: "var(--text-secondary)", border: "1px solid var(--border)" },
  danger:   { bg: "#ef4444",            text: "#fff"           },
  warning:  { bg: "#f59e0b",            text: "#000"           },
  success:  { bg: "#22c55e",            text: "#fff"           },
};

const btn = (color, extra = {}) => ({
  ...S.btn,
  background: color.bg,
  color:      color.text,
  border:     color.border || "none",
  ...extra,
});

// ── Modal genérico ─────────────────────────────────────────────────────────
function Modal({ title, subtitle, onClose, children, width = "580px" }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.65)",
        zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "18px",
          width, maxWidth: "95vw", maxHeight: "90vh",
          overflow: "hidden",
          display: "flex", flexDirection: "column",
          boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
        }}
      >
        {/* Header */}
        <div style={{
          background: "var(--accent)",
          padding: "1rem 1.25rem",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <h5 style={{ color: "#fff", fontWeight: 700, margin: 0, fontSize: "16px" }}>{title}</h5>
            {subtitle && <p style={{ color: "rgba(255,255,255,0.7)", margin: "2px 0 0", fontSize: "12px" }}>{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.15)", border: "none",
              color: "#fff", borderRadius: "8px",
              padding: "6px 12px", cursor: "pointer", fontSize: "14px",
            }}
          >✖</button>
        </div>
        {/* Body */}
        <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Badge ──────────────────────────────────────────────────────────────────
function Badge({ label, color, bg, border }) {
  return (
    <span style={{
      background: bg, color, border: `1px solid ${border || bg}`,
      borderRadius: "6px", padding: "2px 10px",
      fontSize: "11px", fontWeight: 700, whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

// ── StatCard ───────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon, sub }) {
  return (
    <div style={{
      background: "var(--bg-surface)",
      border: "1px solid var(--border)",
      borderRadius: "16px",
      padding: "1.25rem",
      display: "flex", justifyContent: "space-between", alignItems: "center",
    }}>
      <div>
        <p style={{ color: "var(--text-secondary)", fontSize: "12px", margin: "0 0 6px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {label}
        </p>
        <p style={{ color: color || "var(--text-primary)", fontSize: "24px", fontWeight: 700, margin: 0 }}>
          {value}
        </p>
        {sub && <p style={{ color: "var(--text-muted)", fontSize: "11px", margin: "4px 0 0" }}>{sub}</p>}
      </div>
      <div style={{
        width: "48px", height: "48px", borderRadius: "14px",
        background: "var(--bg-surface2)",
        border: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "22px", flexShrink: 0,
      }}>
        {icon}
      </div>
    </div>
  );
}

// ── SectionHeader ──────────────────────────────────────────────────────────
function SectionHeader({ title, right }) {
  return (
    <div style={{
      padding: "1rem 1.25rem",
      borderBottom: "1px solid var(--border)",
      display: "flex", justifyContent: "space-between", alignItems: "center",
    }}>
      <h5 style={{ fontWeight: 700, margin: 0, color: "var(--text-primary)", fontSize: "15px" }}>
        {title}
      </h5>
      {right && <div>{right}</div>}
    </div>
  );
}

// ── Tabla base ─────────────────────────────────────────────────────────────
function Tabla({ headers, children, empty, loading }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr style={{ background: "var(--bg-surface2)", borderBottom: "1px solid var(--border)" }}>
            {headers.map(h => (
              <th key={h} style={{
                padding: "10px 14px", textAlign: "left",
                color: "var(--text-secondary)", fontWeight: 600,
                fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px",
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={headers.length} style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>⏳</div>
                Cargando...
              </td>
            </tr>
          ) : children}
        </tbody>
      </table>
      {!loading && empty}
    </div>
  );
}

// ── FORMULARIO PRODUCTO ────────────────────────────────────────────────────
function FormProducto({ inicial, categorias, onClose, onSuccess, showMsg }) {
  const [form, setForm] = useState(inicial || {
    nombre: "", tipo: "", codigo: "", descripcion: "",
    precio: "", stock: "0", stock_minimo: "5",
    unidad: "unidad", categoria_id: "", estado: 1,
  });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const guardar = async () => {
    if (!form.nombre.trim()) return showMsg("error", "El nombre del producto es obligatorio");
    setBusy(true);
    try {
      if (form.id) await api.put(`/inventario/${form.id}`, form);
      else         await api.post("/inventario", form);
      onSuccess("✅ Producto guardado correctamente");
      onClose();
    } catch (e) {
      showMsg("error", e.response?.data?.message || "Error al guardar");
    } finally { setBusy(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={S.lbl}>Nombre del producto *</label>
          <input style={S.inp} value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Ej: Disco SSD 500GB Samsung" />
        </div>
        <div>
          <label style={S.lbl}>Código interno</label>
          <input style={S.inp} value={form.codigo || ""} onChange={e => set("codigo", e.target.value)} placeholder="REP-001" />
        </div>
        <div>
          <label style={S.lbl}>Tipo</label>
          <input style={S.inp} value={form.tipo || ""} onChange={e => set("tipo", e.target.value)} placeholder="Hardware, Cable, Tóner..." />
        </div>
        <div>
          <label style={S.lbl}>Precio unitario (Bs)</label>
          <input type="number" min={0} step="0.01" style={S.inp} value={form.precio || ""} onChange={e => set("precio", e.target.value)} placeholder="0.00" />
        </div>
        <div>
          <label style={S.lbl}>Unidad de medida</label>
          <input style={S.inp} value={form.unidad || ""} onChange={e => set("unidad", e.target.value)} placeholder="unidad, caja, par, metro..." />
        </div>
        {!form.id && (
          <div>
            <label style={S.lbl}>Stock inicial</label>
            <input type="number" min={0} style={S.inp} value={form.stock || 0} onChange={e => set("stock", e.target.value)} />
          </div>
        )}
        <div>
          <label style={S.lbl}>Stock mínimo (alerta)</label>
          <input type="number" min={0} style={S.inp} value={form.stock_minimo || 5} onChange={e => set("stock_minimo", e.target.value)} />
        </div>
        <div style={form.id ? { gridColumn: "1 / -1" } : {}}>
          <label style={S.lbl}>Categoría</label>
          <select style={S.inp} value={form.categoria_id || ""} onChange={e => set("categoria_id", e.target.value)}>
            <option value="">Sin categoría</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label style={S.lbl}>Descripción</label>
        <textarea rows={3} style={{ ...S.inp, resize: "vertical" }}
          value={form.descripcion || ""}
          onChange={e => set("descripcion", e.target.value)}
          placeholder="Descripción del producto, especificaciones técnicas..." />
      </div>

      {form.id && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", background: "var(--bg-surface2)", borderRadius: "10px", border: "1px solid var(--border)" }}>
          <label style={{ ...S.lbl, margin: 0 }}>Estado:</label>
          <button
            onClick={() => set("estado", form.estado ? 0 : 1)}
            style={{
              ...btn(form.estado ? C.success : C.danger),
              padding: "5px 14px", fontSize: "12px",
            }}
          >
            {form.estado ? "✅ Activo" : "❌ Inactivo"}
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "4px" }}>
        <button style={btn(C.ghost)} onClick={onClose}>Cancelar</button>
        <button
          style={{ ...btn(C.primary), opacity: busy ? 0.6 : 1 }}
          disabled={busy}
          onClick={guardar}
        >
          {busy ? "Guardando..." : form.id ? "✅ Actualizar producto" : "✅ Crear producto"}
        </button>
      </div>
    </div>
  );
}

// ── FORMULARIO MOVIMIENTO ──────────────────────────────────────────────────
function FormMovimiento({ producto, tipo, onClose, onSuccess, showMsg }) {
  const [form, setForm] = useState({ cantidad: "1", motivo: "" });
  const [busy, setBusy] = useState(false);

  const esAjuste = tipo === "AJUSTE";
  const diff     = esAjuste ? (parseInt(form.cantidad || 0) - producto.stock) : 0;

  const colorTipo = tipo === "ENTRADA" ? "#22c55e" : tipo === "SALIDA" ? "#ef4444" : "#f59e0b";
  const iconTipo  = tipo === "ENTRADA" ? "⬆️" : tipo === "SALIDA" ? "⬇️" : "⚖️";

  const guardar = async () => {
    const cant = parseInt(form.cantidad);
    if (isNaN(cant) || cant < 0) return showMsg("error", "Cantidad inválida");
    if (!esAjuste && cant <= 0)  return showMsg("error", "La cantidad debe ser mayor a 0");
    if (tipo === "SALIDA" && cant > producto.stock)
      return showMsg("error", `Stock insuficiente — Disponible: ${producto.stock} ${producto.unidad || "unidad(es)"}`);

    setBusy(true);
    try {
      const url  = `/inventario/movimientos/${tipo.toLowerCase()}`;
      const body = esAjuste
        ? { repuesto_id: producto.id, stock_nuevo: cant, motivo: form.motivo }
        : { repuesto_id: producto.id, cantidad: cant,    motivo: form.motivo };
      await api.post(url, body);
      onSuccess(`✅ ${tipo} registrada correctamente`);
      onClose();
    } catch (e) {
      showMsg("error", e.response?.data?.message || "Error al registrar");
    } finally { setBusy(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Info producto */}
      <div style={{
        background: "var(--bg-surface2)", border: "1px solid var(--border)",
        borderRadius: "12px", padding: "14px 16px",
        borderLeft: `4px solid ${colorTipo}`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ margin: 0, fontWeight: 700, color: "var(--text-primary)", fontSize: "15px" }}>
              {iconTipo} {tipo}
            </p>
            <p style={{ margin: "4px 0 0", color: "var(--text-secondary)", fontSize: "13px" }}>
              {producto.nombre}
              {producto.codigo && <span style={{ color: "var(--text-muted)", marginLeft: "8px" }}>({producto.codigo})</span>}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "11px" }}>Stock actual</p>
            <p style={{ margin: 0, color: colorTipo, fontWeight: 700, fontSize: "22px" }}>
              {producto.stock}
            </p>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "11px" }}>
              {producto.unidad || "unidad(es)"}
            </p>
          </div>
        </div>
      </div>

      {/* Cantidad */}
      <div>
        <label style={S.lbl}>
          {esAjuste ? "Nuevo stock total *" : `Cantidad a ${tipo.toLowerCase()} *`}
        </label>
        <input
          type="number"
          style={{ ...S.inp, fontSize: "18px", fontWeight: 700 }}
          value={form.cantidad}
          onChange={e => setForm(f => ({ ...f, cantidad: e.target.value }))}
          min={esAjuste ? 0 : 1}
          autoFocus
        />
        {/* Preview resultado */}
        {form.cantidad && (
          <div style={{ marginTop: "8px", padding: "10px 14px", background: "var(--bg-surface2)", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
              {esAjuste ? "Diferencia:" : "Stock resultante:"}
            </span>
            <span style={{ fontWeight: 700, fontSize: "15px", color: esAjuste ? (diff > 0 ? "#22c55e" : diff < 0 ? "#ef4444" : "var(--text-muted)") : colorTipo }}>
              {esAjuste
                ? `${diff > 0 ? "+" : ""}${diff} unidades`
                : tipo === "ENTRADA"
                  ? `${producto.stock + (parseInt(form.cantidad) || 0)}`
                  : `${producto.stock - (parseInt(form.cantidad) || 0)}`}
            </span>
          </div>
        )}
      </div>

      {/* Motivo */}
      <div>
        <label style={S.lbl}>Motivo u observación</label>
        <input
          style={S.inp}
          value={form.motivo}
          onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))}
          placeholder="Ej: Recepción de compra, uso en mantenimiento, conteo físico..."
        />
      </div>

      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
        <button style={btn(C.ghost)} onClick={onClose}>Cancelar</button>
        <button
          style={{ ...S.btn, background: colorTipo, color: tipo === "AJUSTE" ? "#000" : "#fff", opacity: busy ? 0.6 : 1 }}
          disabled={busy}
          onClick={guardar}
        >
          {busy ? "Registrando..." : `${iconTipo} Registrar ${tipo}`}
        </button>
      </div>
    </div>
  );
}

// ── FORMULARIO CATEGORÍA ───────────────────────────────────────────────────
function FormCategoria({ inicial, onClose, onSuccess, showMsg }) {
  const [form, setForm] = useState(inicial || { nombre: "", descripcion: "" });
  const [busy, setBusy] = useState(false);

  const guardar = async () => {
    if (!form.nombre.trim()) return showMsg("error", "Nombre requerido");
    setBusy(true);
    try {
      if (form.id) await api.put(`/inventario/categorias/${form.id}`, form);
      else         await api.post("/inventario/categorias", form);
      onSuccess("✅ Categoría guardada");
      onClose();
    } catch { showMsg("error", "Error al guardar"); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div>
        <label style={S.lbl}>Nombre *</label>
        <input style={S.inp} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Componentes internos" autoFocus />
      </div>
      <div>
        <label style={S.lbl}>Descripción</label>
        <textarea rows={3} style={{ ...S.inp, resize: "vertical" }}
          value={form.descripcion || ""}
          onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
          placeholder="Descripción opcional de la categoría..." />
      </div>
      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
        <button style={btn(C.ghost)} onClick={onClose}>Cancelar</button>
        <button style={{ ...btn(C.primary), opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={guardar}>
          {busy ? "Guardando..." : "✅ Guardar categoría"}
        </button>
      </div>
    </div>
  );
}

// ── FORMULARIO REPUESTO ────────────────────────────────────────────────────
function FormRepuesto({ inicial, onClose, onSuccess, showMsg }) {
  const [form, setForm] = useState(inicial || { nombre: "", tipo: "", stock: "", precio: "" });
  const [busy, setBusy] = useState(false);

  const guardar = async () => {
    if (!form.nombre.trim()) return showMsg("error", "Nombre requerido");
    setBusy(true);
    try {
      if (form.id) await api.put(`/catalogos/repuestos/${form.id}`, form);
      else         await api.post("/catalogos/repuestos", form);
      onSuccess("✅ Repuesto guardado");
      onClose();
    } catch { showMsg("error", "Error al guardar"); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div>
        <label style={S.lbl}>Nombre *</label>
        <input style={S.inp} value={form.nombre} autoFocus
          onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
          placeholder="Ej: Memoria RAM DDR4" />
      </div>
      <div>
        <label style={S.lbl}>Tipo / Especificación</label>
        <input style={S.inp} value={form.tipo || ""}
          onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
          placeholder="Ej: 8GB / 780W / etc." />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "12px" }}>
        <div>
          <label style={S.lbl}>Stock inicial</label>
          <input type="number" min={0} style={S.inp} value={form.stock}
            onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="0" />
        </div>
        <div>
          <label style={S.lbl}>Precio (Bs)</label>
          <input type="number" min={0} step="0.01" style={S.inp} value={form.precio}
            onChange={e => setForm(f => ({ ...f, precio: e.target.value }))} placeholder="0.00" />
        </div>
      </div>
      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", flexWrap: "wrap" }}>
        <button style={btn(C.ghost)} onClick={onClose}>Cancelar</button>
        <button style={{ ...btn(C.primary), opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={guardar}>
          {busy ? "Guardando..." : "✅ Guardar repuesto"}
        </button>
      </div>
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ───────────────────────────────────────────────────
export default function Inventario() {
  const { confirmar } = useDialog();
  const [tab,           setTab]           = useState("productos");
  const [productos,     setProductos]     = useState([]);
  const [categorias,    setCategorias]    = useState([]);
  const [movimientos,   setMovimientos]   = useState([]);
  const [repuestos,     setRepuestos]     = useState([]);
  const [resumen,       setResumen]       = useState({});
  const [loading,       setLoading]       = useState(true);
  const [buscar,        setBuscar]        = useState("");
  const [filtroAlerta,  setFiltroAlerta]  = useState(false);
  const [filtroCateg,   setFiltroCateg]   = useState("");
  const [filtroMov,     setFiltroMov]     = useState("");
  const [msg,           setMsg]           = useState({ type: "", text: "" });
  const [modalProducto, setModalProducto] = useState(null);
  const [modalCategoria,setModalCategoria]= useState(null);
  const [modalMovim,    setModalMovim]    = useState(null);
  const [modalRepuesto, setModalRepuesto] = useState(null);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 5000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (buscar)       params.set("buscar",    buscar);
      if (filtroAlerta) params.set("alerta",    "1");
      if (filtroCateg)  params.set("categoria", filtroCateg);

      const [p, c, m, r, rep] = await Promise.all([
        api.get(`/inventario?${params}`),
        api.get("/inventario/categorias"),
        api.get("/inventario/movimientos/historial"),
        api.get("/inventario/resumen"),
        api.get("/catalogos/repuestos"),
      ]);
      setProductos(p.data   || []);
      setCategorias(c.data  || []);
      setMovimientos(m.data || []);
      setResumen(r.data     || {});
      setRepuestos(rep.data || []);
    } catch {
      showMsg("error", "Error al cargar el inventario");
    } finally {
      setLoading(false);
    }
  }, [buscar, filtroAlerta, filtroCateg]);

  useEffect(() => { load(); }, [load]);

  const eliminarProducto = async (p) => {
    if (!(await confirmar(`Desactivar "${p.nombre}"?`, "Desactivar producto"))) return;
    try {
      await api.delete(`/inventario/${p.id}`);
      showMsg("success", "Producto desactivado");
      load();
    } catch { showMsg("error", "Error al desactivar"); }
  };

  const eliminarCategoria = async (c) => {
    if (!(await confirmar(`Eliminar categoría "${c.nombre}"?`, "Eliminar categoría"))) return;
    try {
      await api.delete(`/inventario/categorias/${c.id}`);
      showMsg("success", "Categoría eliminada");
      load();
    } catch { showMsg("error", "Error al eliminar"); }
  };

  const eliminarRepuesto = async (r) => {
    if (!(await confirmar(`Eliminar repuesto "${r.nombre}"?`, "Eliminar repuesto"))) return;
    try {
      await api.delete(`/catalogos/repuestos/${r.id}`);
      showMsg("success", "Repuesto eliminado");
      load();
    } catch { showMsg("error", "Error al eliminar"); }
  };

  const movFiltrados = filtroMov
    ? movimientos.filter(m => m.tipo === filtroMov)
    : movimientos;

  const TABS = [
    { key: "productos",   label: "📦 Productos",    badge: resumen.alertas > 0 ? resumen.alertas : null },
    { key: "repuestos",   label: "🔩 Repuestos",    badge: null },
    { key: "categorias",  label: "🏷️ Categorías",   badge: null },
    { key: "movimientos", label: "📋 Movimientos",  badge: null },
  ];

  return (
    <AdminLayout>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "1.75rem" }}>
        <div>
          <h2 style={{ fontWeight: 700, margin: 0, color: "var(--text-primary)", fontSize: "24px" }}>
            📦 Inventario
          </h2>
          <p style={{ color: "var(--text-secondary)", margin: "4px 0 0", fontSize: "14px" }}>
            Gestión de repuestos, materiales y stock
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={btn(C.ghost)} onClick={load}>🔄 Actualizar</button>
          <button style={btn(C.primary)} onClick={() => setModalProducto("nuevo")}>+ Nuevo producto</button>
        </div>
      </div>

      {/* ── MENSAJE ── */}
      {msg.text && (
        <div style={{
          background: msg.type === "success" ? "var(--success-bg)" : "var(--danger-bg)",
          border: `1px solid ${msg.type === "success" ? "var(--success)" : "var(--danger)"}`,
          color: msg.type === "success" ? "var(--success)" : "var(--danger)",
          borderRadius: "10px", padding: "12px 16px",
          marginBottom: "1.25rem", fontSize: "14px", fontWeight: 500,
        }}>
          {msg.text}
        </div>
      )}

      {/* ── STATS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "14px", marginBottom: "1.5rem" }}>
        <StatCard label="Productos activos"  value={fmtNum(resumen.total_productos)} color="var(--accent-text)" icon="📦" sub="En inventario" />
        <StatCard label="Unidades en stock"  value={fmtNum(resumen.stock_total)}     color="#22c55e"           icon="📊" sub="Total unidades" />
        <StatCard label="Valor del inventario" value={fmtBs(resumen.valor_total)}  color="var(--accent-text)" icon="💰" sub="Valorización total" />
        <StatCard label="Alertas de stock"   value={fmtNum(resumen.alertas)}         color={resumen.alertas > 0 ? "#ef4444" : "var(--text-secondary)"} icon="⚠️" sub="Bajo el mínimo" />
      </div>

      {/* ── BANNER ALERTAS ── */}
      {resumen.productos_alerta?.length > 0 && (
        <div style={{
          background: "var(--warning-bg, #fffbeb)",
          border: "1px solid var(--warning, #f59e0b)",
          borderRadius: "12px", padding: "14px 18px",
          marginBottom: "1.5rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <span style={{ fontSize: "20px" }}>⚠️</span>
            <p style={{ fontWeight: 700, color: "var(--text-primary)", margin: 0, fontSize: "14px" }}>
              {resumen.alertas} producto{resumen.alertas !== 1 ? "s" : ""} con stock bajo o agotado
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {resumen.productos_alerta.map(p => (
              <div key={p.id} style={{
                background: "var(--bg-surface)", border: "1px solid var(--border)",
                borderRadius: "8px", padding: "6px 12px",
                display: "flex", alignItems: "center", gap: "8px",
              }}>
                <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "13px" }}>{p.nombre}</span>
                <span style={{ color: "#ef4444", fontWeight: 700, fontSize: "13px" }}>
                  {p.stock} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>/ mín {p.stock_minimo}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TABS ── */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "9px 18px", borderRadius: "10px",
              border:      tab === t.key ? "none" : "1px solid var(--border)",
              background:  tab === t.key ? "var(--accent)" : "var(--bg-surface)",
              color:       tab === t.key ? "#fff" : "var(--text-secondary)",
              fontWeight: 600, fontSize: "13px", cursor: "pointer",
              fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: "6px",
            }}
          >
            {t.label}
            {t.badge > 0 && (
              <span style={{
                background: tab === t.key ? "rgba(255,255,255,0.25)" : "#fef2f2",
                color:      tab === t.key ? "#fff" : "#ef4444",
                borderRadius: "999px", padding: "0 7px",
                fontSize: "11px", fontWeight: 700,
              }}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ════ TAB PRODUCTOS ════ */}
      {tab === "productos" && (
        <div>
          {/* Filtros */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "1rem", alignItems: "center" }}>
            <input
              style={{ ...S.inp, maxWidth: "260px" }}
              placeholder="🔍 Buscar por nombre, código o tipo..."
              value={buscar}
              onChange={e => setBuscar(e.target.value)}
            />
            <select
              style={{ ...S.inp, maxWidth: "200px" }}
              value={filtroCateg}
              onChange={e => setFiltroCateg(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            <label style={{ display: "flex", alignItems: "center", gap: "7px", cursor: "pointer", fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>
              <input type="checkbox" checked={filtroAlerta} onChange={e => setFiltroAlerta(e.target.checked)} />
              Solo con alerta de stock
            </label>
            <span style={{ color: "var(--text-muted)", fontSize: "13px", marginLeft: "auto" }}>
              {productos.length} producto{productos.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div style={S.surface}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "var(--bg-surface2)", borderBottom: "2px solid var(--border)" }}>
                    {["Código","Nombre","Categoría","Tipo","Stock","Mín.","Precio","Estado","Acciones"].map(h => (
                      <th key={h} style={{ padding: "11px 14px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>
                        <div style={{ fontSize: "36px", marginBottom: "10px" }}>⏳</div>
                        Cargando productos...
                      </td>
                    </tr>
                  ) : productos.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: "4rem", textAlign: "center", color: "var(--text-secondary)" }}>
                        <div style={{ fontSize: "48px", marginBottom: "12px" }}>📭</div>
                        <p style={{ margin: 0, fontWeight: 600 }}>Sin productos</p>
                        <p style={{ margin: "4px 0 0", fontSize: "13px" }}>Agrega el primer producto con el botón de arriba</p>
                      </td>
                    </tr>
                  ) : productos.map((p, i) => (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        background: p.alerta_stock ? "rgba(239,68,68,0.04)" : "transparent",
                      }}
                    >
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ color: "var(--accent-text)", fontWeight: 700, fontSize: "12px", background: "var(--accent-light)", borderRadius: "6px", padding: "2px 8px" }}>
                          {p.codigo || "—"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <p style={{ margin: 0, fontWeight: 600, color: "var(--text-primary)" }}>{p.nombre}</p>
                        {p.descripcion && <p style={{ margin: "2px 0 0", color: "var(--text-muted)", fontSize: "11px" }}>{p.descripcion.slice(0, 50)}{p.descripcion.length > 50 ? "..." : ""}</p>}
                      </td>
                      <td style={{ padding: "12px 14px", color: "var(--text-secondary)" }}>{p.categoria_nombre || "—"}</td>
                      <td style={{ padding: "12px 14px", color: "var(--text-secondary)" }}>{p.tipo || "—"}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontWeight: 700, color: p.alerta_stock ? "#ef4444" : "#22c55e", fontSize: "16px" }}>
                            {p.stock}
                          </span>
                          <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>{p.unidad || "u."}</span>
                          {p.alerta_stock && (
                            <span title="Stock bajo" style={{ fontSize: "14px" }}>⚠️</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px", color: "var(--text-muted)", fontSize: "12px" }}>{p.stock_minimo}</td>
                      <td style={{ padding: "12px 14px", color: "#22c55e", fontWeight: 600 }}>{fmtBs(p.precio)}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <Badge
                          label={p.estado ? "Activo" : "Inactivo"}
                          color={p.estado ? "#22c55e" : "#ef4444"}
                          bg={p.estado ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)"}
                          border={p.estado ? "#22c55e" : "#ef4444"}
                        />
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", gap: "5px" }}>
                          <button
                            title="Editar"
                            style={{ ...btn(C.ghost, { padding: "5px 10px", fontSize: "13px" }) }}
                            onClick={() => setModalProducto(p)}
                          >✏️</button>
                          <button
                            title="Registrar entrada"
                            style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid #22c55e", borderRadius: "8px", padding: "5px 10px", cursor: "pointer", fontSize: "13px" }}
                            onClick={() => setModalMovim({ tipo: "ENTRADA", producto: p })}
                          >⬆️</button>
                          <button
                            title="Registrar salida"
                            style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid #ef4444", borderRadius: "8px", padding: "5px 10px", cursor: "pointer", fontSize: "13px" }}
                            onClick={() => setModalMovim({ tipo: "SALIDA", producto: p })}
                          >⬇️</button>
                          <button
                            title="Ajuste de inventario"
                            style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid #f59e0b", borderRadius: "8px", padding: "5px 10px", cursor: "pointer", fontSize: "13px" }}
                            onClick={() => setModalMovim({ tipo: "AJUSTE", producto: p })}
                          >⚖️</button>
                          <button
                            title="Desactivar"
                            style={{ ...btn(C.ghost, { padding: "5px 10px", fontSize: "13px" }) }}
                            onClick={() => eliminarProducto(p)}
                          >🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════ TAB CATEGORÍAS ════ */}
      {tab === "categorias" && (
        <div>
          <div style={{ marginBottom: "1rem" }}>
            <button style={btn(C.primary)} onClick={() => setModalCategoria("nuevo")}>+ Nueva categoría</button>
          </div>

          <div style={S.surface}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "var(--bg-surface2)", borderBottom: "2px solid var(--border)" }}>
                    {["#","Nombre","Descripción","Acciones"].map(h => (
                      <th key={h} style={{ padding: "11px 14px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {categorias.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: "4rem", textAlign: "center", color: "var(--text-secondary)" }}>
                        <div style={{ fontSize: "48px", marginBottom: "12px" }}>🏷️</div>
                        <p style={{ margin: 0, fontWeight: 600 }}>Sin categorías</p>
                      </td>
                    </tr>
                  ) : categorias.map(c => (
                    <tr key={c.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 14px", color: "var(--text-muted)", fontSize: "12px" }}>#{c.id}</td>
                      <td style={{ padding: "12px 14px", fontWeight: 600, color: "var(--text-primary)" }}>{c.nombre}</td>
                      <td style={{ padding: "12px 14px", color: "var(--text-secondary)" }}>{c.descripcion || "—"}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button style={{ ...btn(C.ghost, { padding: "5px 12px", fontSize: "12px" }) }} onClick={() => setModalCategoria(c)}>✏️ Editar</button>
                          <button style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid #ef4444", borderRadius: "8px", padding: "5px 12px", cursor: "pointer", fontSize: "12px", fontWeight: 600 }} onClick={() => eliminarCategoria(c)}>🗑️ Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════ TAB REPUESTOS ════ */}
      {tab === "repuestos" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", gap: "10px", flexWrap: "wrap" }}>
            <button style={btn(C.primary)} onClick={() => setModalRepuesto("nuevo")}>+ Nuevo repuesto</button>
            <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>{repuestos.length} repuestos</span>
          </div>

          <div style={S.surface}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "var(--bg-surface2)", borderBottom: "2px solid var(--border)" }}>
                    {["#","Nombre","Tipo / Especificación","Stock","Precio","Acciones"].map(h => (
                      <th key={h} style={{ padding: "11px 14px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {repuestos.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: "4rem", textAlign: "center", color: "var(--text-secondary)" }}>
                        <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔩</div>
                        <p style={{ margin: 0, fontWeight: 600 }}>Sin repuestos</p>
                      </td>
                    </tr>
                  ) : repuestos.map(r => (
                    <tr key={r.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 14px", color: "var(--text-muted)", fontSize: "12px" }}>#{r.id}</td>
                      <td style={{ padding: "12px 14px", fontWeight: 600, color: "var(--text-primary)" }}>{r.nombre}</td>
                      <td style={{ padding: "12px 14px", color: "var(--text-secondary)" }}>{r.tipo || "—"}</td>
                      <td style={{ padding: "12px 14px", fontWeight: 700, color: Number(r.stock) > 0 ? "#22c55e" : "#ef4444" }}>{r.stock ?? 0}</td>
                      <td style={{ padding: "12px 14px", color: "var(--text-primary)" }}>{fmtBs(r.precio)}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button style={{ ...btn(C.ghost, { padding: "5px 12px", fontSize: "12px" }) }} onClick={() => setModalRepuesto(r)}>✏️ Editar</button>
                          <button style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid #ef4444", borderRadius: "8px", padding: "5px 12px", cursor: "pointer", fontSize: "12px", fontWeight: 600 }} onClick={() => eliminarRepuesto(r)}>🗑️ Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════ TAB MOVIMIENTOS ════ */}
      {tab === "movimientos" && (
        <div>
          {/* Filtro tipo */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "1rem", flexWrap: "wrap" }}>
            {["","ENTRADA","SALIDA","AJUSTE"].map(t => {
              const colors = { ENTRADA: "#22c55e", SALIDA: "#ef4444", AJUSTE: "#f59e0b" };
              const active = filtroMov === t;
              return (
                <button key={t} onClick={() => setFiltroMov(t)} style={{
                  padding: "7px 16px", borderRadius: "8px",
                  border: active ? "none" : "1px solid var(--border)",
                  background: active ? (colors[t] || "var(--accent)") : "var(--bg-surface)",
                  color: active ? (t === "AJUSTE" ? "#000" : "#fff") : "var(--text-secondary)",
                  fontWeight: 600, fontSize: "12px", cursor: "pointer", fontFamily: "inherit",
                }}>
                  {t === "" ? "Todos" : t === "ENTRADA" ? "⬆️ Entradas" : t === "SALIDA" ? "⬇️ Salidas" : "⚖️ Ajustes"}
                </button>
              );
            })}
            <span style={{ color: "var(--text-muted)", fontSize: "13px", alignSelf: "center", marginLeft: "auto" }}>
              {movFiltrados.length} registros
            </span>
          </div>

          <div style={S.surface}>    
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "var(--bg-surface2)", borderBottom: "2px solid var(--border)" }}>
                    {["Fecha","Producto","Tipo","Cantidad","Antes","Después","Motivo","Referencia","Usuario"].map(h => (
                      <th key={h} style={{ padding: "11px 14px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {movFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: "4rem", textAlign: "center", color: "var(--text-secondary)" }}>
                        <div style={{ fontSize: "48px", marginBottom: "12px" }}>📋</div>
                        <p style={{ margin: 0, fontWeight: 600 }}>Sin movimientos</p>
                      </td>
                    </tr>
                  ) : movFiltrados.map(m => {
                    const colorMov = m.tipo === "ENTRADA" ? "#22c55e" : m.tipo === "SALIDA" ? "#ef4444" : "#f59e0b";
                    return (
                      <tr key={m.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "11px 14px", color: "var(--text-muted)", fontSize: "12px", whiteSpace: "nowrap" }}>
                          {fmtFecha(m.fecha)}
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          <p style={{ margin: 0, fontWeight: 600, color: "var(--text-primary)" }}>{m.producto_nombre}</p>
                          {m.producto_codigo && <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "11px" }}>{m.producto_codigo}</p>}
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          <Badge
                            label={m.tipo === "ENTRADA" ? "⬆ ENTRADA" : m.tipo === "SALIDA" ? "⬇ SALIDA" : "⚖ AJUSTE"}
                            color={colorMov}
                            bg={`rgba(${m.tipo === "ENTRADA" ? "34,197,94" : m.tipo === "SALIDA" ? "239,68,68" : "245,158,11"},0.12)`}
                            border={colorMov}
                          />
                        </td>
                        <td style={{ padding: "11px 14px", fontWeight: 700, color: colorMov, fontSize: "15px" }}>
                          {m.tipo === "SALIDA" ? "-" : m.tipo === "ENTRADA" ? "+" : ""}{m.cantidad}
                        </td>
                        <td style={{ padding: "11px 14px", color: "var(--text-muted)" }}>{m.stock_antes}</td>
                        <td style={{ padding: "11px 14px", fontWeight: 700, color: "var(--text-primary)" }}>{m.stock_despues}</td>
                        <td style={{ padding: "11px 14px", color: "var(--text-secondary)", maxWidth: "160px" }}>{m.motivo || "—"}</td>
                        <td style={{ padding: "11px 14px" }}>
                          {m.referencia ? (
                            <span style={{ background: "var(--accent-light)", color: "var(--accent-text)", borderRadius: "6px", padding: "2px 8px", fontSize: "11px", fontWeight: 600 }}>
                              {m.referencia}
                            </span>
                          ) : "—"}
                        </td>
                        <td style={{ padding: "11px 14px", color: "var(--text-secondary)", fontSize: "12px" }}>
                          {m.usuario_nombre ? `${m.usuario_nombre} ${m.usuario_apellido || ""}`.trim() : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MODALES ── */}
      {modalProducto && (
        <Modal
          title={modalProducto === "nuevo" ? "Nuevo producto" : "Editar producto"}
          subtitle={modalProducto !== "nuevo" ? modalProducto.nombre : "Completa los datos del nuevo producto"}
          onClose={() => setModalProducto(null)}
          width="640px"
        >
          <FormProducto
            inicial={modalProducto === "nuevo" ? null : modalProducto}
            categorias={categorias}
            onClose={() => setModalProducto(null)}
            onSuccess={(m) => { showMsg("success", m); load(); }}
            showMsg={showMsg}
          />
        </Modal>
      )}

      {modalCategoria && (
        <Modal
          title={modalCategoria === "nuevo" ? "Nueva categoría" : "Editar categoría"}
          onClose={() => setModalCategoria(null)}
        >
          <FormCategoria
            inicial={modalCategoria === "nuevo" ? null : modalCategoria}
            onClose={() => setModalCategoria(null)}
            onSuccess={(m) => { showMsg("success", m); load(); }}
            showMsg={showMsg}
          />
        </Modal>
      )}

      {modalRepuesto && (
        <Modal
          title={modalRepuesto === "nuevo" ? "Nuevo repuesto" : "Editar repuesto"}
          subtitle={modalRepuesto !== "nuevo" ? modalRepuesto.nombre : "Repuestos usados en mantenimientos"}
          onClose={() => setModalRepuesto(null)}
        >
          <FormRepuesto
            inicial={modalRepuesto === "nuevo" ? null : modalRepuesto}
            onClose={() => setModalRepuesto(null)}
            onSuccess={(m) => { showMsg("success", m); load(); }}
            showMsg={showMsg}
          />
        </Modal>
      )}

      {modalMovim && (
        <Modal
          title={`Registrar ${modalMovim.tipo}`}
          subtitle={modalMovim.producto.nombre}
          onClose={() => setModalMovim(null)}
        >
          <FormMovimiento
            producto={modalMovim.producto}
            tipo={modalMovim.tipo}
            onClose={() => setModalMovim(null)}
            onSuccess={(m) => { showMsg("success", m); load(); }}
            showMsg={showMsg}
          />
        </Modal>
      )}

    </AdminLayout>
  );
}