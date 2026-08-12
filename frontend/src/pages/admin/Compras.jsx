import { useEffect, useState, useCallback } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import api from "../../services/api";

// ── Helpers ────────────────────────────────────────────────────────────────
const fmtBs    = (n) => `Bs ${Number(n || 0).toFixed(2)}`;
const fmtFecha = (d) => d ? new Date(d).toLocaleDateString("es-BO", { day:"2-digit", month:"short", year:"numeric" }) : "—";
const fmtFull  = (d) => d ? new Date(d).toLocaleString("es-BO", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }) : "—";

// ── Estilos con variables CSS del tema ────────────────────────────────────
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

const btn = (bg, color, border) => ({
  ...S.btn,
  background: bg,
  color,
  border: border || "none",
});

// ── Colores estado ─────────────────────────────────────────────────────────
const COLOR_ESTADO = {
  PENDIENTE: { c: "#f59e0b", bg: "rgba(245,158,11,0.12)", b: "#f59e0b", label: "⏳ Pendiente" },
  RECIBIDA:  { c: "#22c55e", bg: "rgba(34,197,94,0.12)",  b: "#22c55e", label: "✅ Recibida"  },
  CANCELADA: { c: "#ef4444", bg: "rgba(239,68,68,0.12)",  b: "#ef4444", label: "❌ Cancelada" },
};

function PillEstado({ estado }) {
  const s = COLOR_ESTADO[estado] || COLOR_ESTADO.PENDIENTE;
  return (
    <span style={{ background: s.bg, color: s.c, border: `1px solid ${s.b}`, borderRadius: "8px", padding: "4px 12px", fontSize: "12px", fontWeight: 700, whiteSpace: "nowrap" }}>
      {s.label}
    </span>
  );
}

// ── Modal con confirmación interna ────────────────────────────────────────
function Modal({ title, subtitle, onClose, children, width = "580px" }) {
  return (
    <div
      onClick={onClose}
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem", backdropFilter:"blur(4px)" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"18px", width, maxWidth:"95vw", maxHeight:"92vh", overflow:"hidden", display:"flex", flexDirection:"column", boxShadow:"0 24px 60px rgba(0,0,0,0.35)" }}
      >
        <div style={{ background:"var(--accent)", padding:"1rem 1.25rem", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <h5 style={{ color:"#fff", fontWeight:700, margin:0, fontSize:"16px" }}>{title}</h5>
            {subtitle && <p style={{ color:"rgba(255,255,255,0.7)", margin:"2px 0 0", fontSize:"12px" }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.15)", border:"none", color:"#fff", borderRadius:"8px", padding:"6px 12px", cursor:"pointer", fontSize:"14px" }}>✖</button>
        </div>
        <div style={{ padding:"1.5rem", overflowY:"auto", flex:1 }}>{children}</div>
      </div>
    </div>
  );
}

// ── Modal de confirmación interno (sin window.confirm) ─────────────────────
function ModalConfirm({ titulo, descripcion, labelOk, colorOk, onConfirm, onClose }) {
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:10000, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem", backdropFilter:"blur(6px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"16px", width:"420px", maxWidth:"95vw", padding:"2rem", boxShadow:"0 24px 60px rgba(0,0,0,0.4)" }}>
        <div style={{ textAlign:"center", marginBottom:"1.5rem" }}>
          <div style={{ fontSize:"48px", marginBottom:"12px" }}>
            {colorOk === "#22c55e" ? "✅" : "⚠️"}
          </div>
          <h4 style={{ fontWeight:700, color:"var(--text-primary)", margin:"0 0 8px", fontSize:"18px" }}>{titulo}</h4>
          <p style={{ color:"var(--text-secondary)", margin:0, fontSize:"14px", lineHeight:1.6 }}>{descripcion}</p>
        </div>
        <div style={{ display:"flex", gap:"10px" }}>
          <button
            onClick={onClose}
            style={{ ...btn("var(--bg-surface2)", "var(--text-secondary)", "1px solid var(--border)"), flex:1 }}
          >
            Cancelar
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            style={{ ...btn(colorOk || "var(--accent)", "#fff"), flex:1 }}
          >
            {labelOk || "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon, sub }) {
  return (
    <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"16px", padding:"1.25rem", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
      <div>
        <p style={{ color:"var(--text-secondary)", fontSize:"12px", margin:"0 0 6px", fontWeight:500, textTransform:"uppercase", letterSpacing:"0.5px" }}>{label}</p>
        <p style={{ color: color || "var(--text-primary)", fontSize:"24px", fontWeight:700, margin:0 }}>{value}</p>
        {sub && <p style={{ color:"var(--text-muted)", fontSize:"11px", margin:"4px 0 0" }}>{sub}</p>}
      </div>
      <div style={{ width:"48px", height:"48px", borderRadius:"14px", background:"var(--bg-surface2)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px", flexShrink:0 }}>
        {icon}
      </div>
    </div>
  );
}

// ── InfoField ─────────────────────────────────────────────────────────────
function InfoField({ label, value }) {
  return (
    <div style={{ background:"var(--bg-surface2)", border:"1px solid var(--border)", borderRadius:"12px", padding:"12px 14px" }}>
      <p style={{ color:"var(--text-muted)", fontSize:"11px", margin:"0 0 4px", textTransform:"uppercase", letterSpacing:"0.4px", fontWeight:600 }}>{label}</p>
      <div style={{ fontWeight:500, fontSize:"14px", color:"var(--text-primary)" }}>{value ?? "—"}</div>
    </div>
  );
}

// ── DETALLE COMPRA ────────────────────────────────────────────────────────
function DetalleCompra({ compra, onClose, onEstado, showMsg }) {
  const [confirm, setConfirm] = useState(null); // { estado, titulo, desc, color }
  const [busy,    setBusy]    = useState(false);

  const ejecutar = async (estado) => {
    setBusy(true);
    try {
      await onEstado(compra.id, estado);
      onClose();
    } catch { showMsg("error","Error al cambiar estado"); }
    finally { setBusy(false); }
  };

  const total = (compra.detalle || []).reduce((a, d) => a + Number(d.subtotal || 0), 0);

  return (
    <div>
      {/* Info general */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:"10px", marginBottom:"1.5rem" }}>
        <InfoField label="Estado"        value={<PillEstado estado={compra.estado} />} />
        <InfoField label="Proveedor"     value={compra.proveedor_nombre || "Sin proveedor"} />
        <InfoField label="N° Factura"    value={compra.nro_factura || "—"} />
        <InfoField label="Fecha compra"  value={fmtFecha(compra.fecha_compra)} />
        <InfoField label="F. recepción"  value={fmtFecha(compra.fecha_recepcion)} />
        <InfoField label="Total"         value={<span style={{ color:"var(--accent-text)", fontWeight:700, fontSize:"16px" }}>{fmtBs(compra.total)}</span>} />
        <InfoField label="Registrado por" value={`${compra.usuario_nombre || ""} ${compra.usuario_apellido || ""}`.trim() || "—"} />
      </div>

      {/* Observaciones */}
      {compra.observaciones && (
        <div style={{ background:"rgba(245,158,11,0.1)", border:"1px solid #f59e0b", borderRadius:"10px", padding:"12px 14px", marginBottom:"1.25rem" }}>
          <p style={{ color:"var(--text-secondary)", fontSize:"12px", fontWeight:600, textTransform:"uppercase", margin:"0 0 4px" }}>Observaciones</p>
          <p style={{ color:"var(--text-primary)", fontSize:"14px", margin:0 }}>{compra.observaciones}</p>
        </div>
      )}

      {/* Detalle productos */}
      <p style={{ fontWeight:700, color:"var(--text-primary)", fontSize:"14px", margin:"0 0 10px" }}>Productos incluidos</p>
      <div style={{ background:"var(--bg-surface2)", border:"1px solid var(--border)", borderRadius:"12px", overflow:"hidden", marginBottom:"1.5rem" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"13px" }}>
          <thead>
            <tr style={{ background:"var(--bg-surface)", borderBottom:"1px solid var(--border)" }}>
              {["Producto","Tipo","Cant.","P. Unit.","Subtotal","Stock actual"].map(h => (
                <th key={h} style={{ padding:"10px 12px", textAlign:"left", color:"var(--text-secondary)", fontWeight:600, fontSize:"11px", textTransform:"uppercase", letterSpacing:"0.4px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(compra.detalle || []).length === 0 ? (
              <tr><td colSpan={6} style={{ padding:"2rem", textAlign:"center", color:"var(--text-muted)" }}>Sin productos</td></tr>
            ) : (compra.detalle || []).map((d, i) => (
              <tr key={i} style={{ borderBottom:"1px solid var(--border)" }}>
                <td style={{ padding:"10px 12px", fontWeight:600, color:"var(--text-primary)" }}>{d.producto_nombre}</td>
                <td style={{ padding:"10px 12px", color:"var(--text-secondary)" }}>{d.producto_tipo || "—"}</td>
                <td style={{ padding:"10px 12px", color:"var(--text-primary)", fontWeight:600 }}>{d.cantidad}</td>
                <td style={{ padding:"10px 12px", color:"var(--text-secondary)" }}>{fmtBs(d.precio_unit)}</td>
                <td style={{ padding:"10px 12px", color:"var(--accent-text)", fontWeight:700 }}>{fmtBs(d.subtotal)}</td>
                <td style={{ padding:"10px 12px" }}>
                  <span style={{ color: d.stock_actual <= 0 ? "#ef4444" : "#22c55e", fontWeight:700 }}>
                    {d.stock_actual}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Total */}
        <div style={{ padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", borderTop:"2px solid var(--border)" }}>
          <span style={{ fontWeight:700, color:"var(--text-primary)", fontSize:"14px" }}>TOTAL COMPRA</span>
          <span style={{ fontWeight:700, color:"var(--accent-text)", fontSize:"22px" }}>{fmtBs(compra.total)}</span>
        </div>
      </div>

      {/* Acciones según estado */}
      {compra.estado === "PENDIENTE" && (
        <div style={{ display:"flex", gap:"12px" }}>
          <button
            onClick={() => setConfirm({
              estado:  "RECIBIDA",
              titulo:  "Marcar compra como RECIBIDA",
              desc:    "Al confirmar, el stock de todos los productos incluidos se actualizará automáticamente en el inventario.",
              color:   "#22c55e",
              label:   "✅ Sí, marcar como recibida",
            })}
            disabled={busy}
            style={{ ...btn("#22c55e", "#fff"), flex:2, opacity: busy ? 0.6 : 1 }}
          >
            ✅ Marcar como RECIBIDA — Actualiza stock
          </button>
          <button
            onClick={() => setConfirm({
              estado:  "CANCELADA",
              titulo:  "Cancelar esta compra",
              desc:    "La compra quedará cancelada. El stock no se modificará. Esta acción no se puede deshacer.",
              color:   "#ef4444",
              label:   "❌ Sí, cancelar compra",
            })}
            disabled={busy}
            style={{ ...btn("rgba(239,68,68,0.12)", "#ef4444", "1px solid #ef4444"), flex:1, opacity: busy ? 0.6 : 1 }}
          >
            ❌ Cancelar compra
          </button>
        </div>
      )}

      {compra.estado === "RECIBIDA" && (
        <div style={{ background:"rgba(34,197,94,0.1)", border:"1px solid #22c55e", borderRadius:"12px", padding:"14px 16px", display:"flex", alignItems:"center", gap:"10px" }}>
          <span style={{ fontSize:"20px" }}>✅</span>
          <p style={{ color:"#22c55e", fontWeight:600, margin:0 }}>Esta compra ya fue recibida. El stock fue actualizado automáticamente.</p>
        </div>
      )}

      {compra.estado === "CANCELADA" && (
        <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid #ef4444", borderRadius:"12px", padding:"14px 16px", display:"flex", alignItems:"center", gap:"10px" }}>
          <span style={{ fontSize:"20px" }}>❌</span>
          <p style={{ color:"#ef4444", fontWeight:600, margin:0 }}>Esta compra fue cancelada. El stock no fue modificado.</p>
        </div>
      )}

      {/* Modal confirmación interno */}
      {confirm && (
        <ModalConfirm
          titulo={confirm.titulo}
          descripcion={confirm.desc}
          labelOk={confirm.label}
          colorOk={confirm.color}
          onConfirm={() => ejecutar(confirm.estado)}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

// ── NUEVA COMPRA ──────────────────────────────────────────────────────────
function FormNuevaCompra({ proveedores, productos, onClose, onGuardado, showMsg }) {
  const [form, setForm] = useState({ proveedor_id:"", nro_factura:"", fecha_compra:"", observaciones:"", detalle:[] });
  const [item, setItem] = useState({ repuesto_id:"", cantidad:"1", precio_unit:"" });
  const [busy, setBusy] = useState(false);

  const total = form.detalle.reduce((a, d) => a + (parseFloat(d.precio_unit || 0) * parseInt(d.cantidad || 0)), 0);

  const agregarItem = () => {
    if (!item.repuesto_id || parseInt(item.cantidad) <= 0)
      return showMsg("error", "Selecciona un producto y cantidad válida");
    const prod = productos.find(p => String(p.id) === String(item.repuesto_id));
    if (!prod) return;
    if (form.detalle.find(d => String(d.repuesto_id) === String(item.repuesto_id)))
      return showMsg("error", "Este producto ya fue agregado");
    setForm(f => ({
      ...f,
      detalle: [...f.detalle, {
        repuesto_id:  prod.id,
        nombre:       prod.nombre,
        tipo:         prod.tipo || "—",
        cantidad:     parseInt(item.cantidad),
        precio_unit:  parseFloat(item.precio_unit || prod.precio || 0),
      }]
    }));
    setItem({ repuesto_id:"", cantidad:"1", precio_unit:"" });
  };

  const quitarItem = (id) => setForm(f => ({ ...f, detalle: f.detalle.filter(d => d.repuesto_id !== id) }));

  const updateItem = (id, campo, valor) => {
    setForm(f => ({ ...f, detalle: f.detalle.map(d => d.repuesto_id === id ? { ...d, [campo]: valor } : d) }));
  };

  const guardar = async () => {
    if (!form.fecha_compra)       return showMsg("error", "La fecha de compra es obligatoria");
    if (form.detalle.length === 0) return showMsg("error", "Agrega al menos un producto");
    setBusy(true);
    try {
      await api.post("/compras", form);
      onGuardado();
      onClose();
    } catch (e) {
      showMsg("error", e.response?.data?.message || "Error al registrar");
    } finally { setBusy(false); }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>

      {/* Datos generales */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
        <div>
          <label style={S.lbl}>Proveedor</label>
          <select style={S.inp} value={form.proveedor_id} onChange={e => setForm(f => ({ ...f, proveedor_id: e.target.value }))}>
            <option value="">Sin proveedor</option>
            {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
        <div>
          <label style={S.lbl}>N° Factura</label>
          <input style={S.inp} value={form.nro_factura} onChange={e => setForm(f => ({ ...f, nro_factura: e.target.value }))} placeholder="Ej: FAC-0001" />
        </div>
        <div>
          <label style={S.lbl}>Fecha de compra *</label>
          <input type="date" style={S.inp} value={form.fecha_compra} onChange={e => setForm(f => ({ ...f, fecha_compra: e.target.value }))} />
        </div>
        <div>
          <label style={S.lbl}>Observaciones</label>
          <input style={S.inp} value={form.observaciones} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} placeholder="Notas adicionales..." />
        </div>
      </div>

      {/* Agregar producto */}
      <div style={{ background:"var(--bg-surface2)", border:"1px solid var(--border)", borderRadius:"12px", padding:"1rem" }}>
        <p style={{ fontWeight:700, color:"var(--text-primary)", fontSize:"14px", margin:"0 0 12px" }}>🔩 Agregar productos</p>
        <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", alignItems:"flex-end" }}>
          <div style={{ flex:2, minWidth:"180px" }}>
            <label style={S.lbl}>Producto *</label>
            <select
              style={S.inp}
              value={item.repuesto_id}
              onChange={e => {
                const p = productos.find(x => String(x.id) === e.target.value);
                setItem(i => ({ ...i, repuesto_id: e.target.value, precio_unit: p?.precio || "" }));
              }}
            >
              <option value="">Seleccionar...</option>
              {productos.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nombre} {p.codigo ? `(${p.codigo})` : ""} — Stock: {p.stock}
                </option>
              ))}
            </select>
          </div>
          <div style={{ minWidth:"90px" }}>
            <label style={S.lbl}>Cantidad *</label>
            <input type="number" min={1} style={S.inp} value={item.cantidad} onChange={e => setItem(i => ({ ...i, cantidad: e.target.value }))} />
          </div>
          <div style={{ minWidth:"120px" }}>
            <label style={S.lbl}>Precio unit. (Bs)</label>
            <input type="number" min={0} step="0.01" style={S.inp} value={item.precio_unit} onChange={e => setItem(i => ({ ...i, precio_unit: e.target.value }))} placeholder="0.00" />
          </div>
          <div style={{ display:"flex", alignItems:"flex-end" }}>
            <button
              onClick={agregarItem}
              style={{ ...btn("var(--accent)", "#fff"), padding:"10px 16px" }}
            >
              + Agregar
            </button>
          </div>
        </div>

        {/* Lista de productos agregados */}
        {form.detalle.length > 0 && (
          <div style={{ marginTop:"14px", border:"1px solid var(--border)", borderRadius:"10px", overflow:"hidden" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"13px" }}>
              <thead>
                <tr style={{ background:"var(--bg-surface)", borderBottom:"1px solid var(--border)" }}>
                  {["Producto","Tipo","Cant.","P. Unit. (Bs)","Subtotal",""].map(h => (
                    <th key={h} style={{ padding:"9px 12px", textAlign:"left", color:"var(--text-secondary)", fontWeight:600, fontSize:"11px", textTransform:"uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {form.detalle.map(d => (
                  <tr key={d.repuesto_id} style={{ borderBottom:"1px solid var(--border)" }}>
                    <td style={{ padding:"9px 12px", fontWeight:600, color:"var(--text-primary)" }}>{d.nombre}</td>
                    <td style={{ padding:"9px 12px", color:"var(--text-secondary)" }}>{d.tipo}</td>
                    <td style={{ padding:"9px 12px" }}>
                      <input
                        type="number" min={1}
                        value={d.cantidad}
                        onChange={e => updateItem(d.repuesto_id, "cantidad", parseInt(e.target.value) || 1)}
                        style={{ ...S.inp, width:"70px", padding:"5px 8px" }}
                      />
                    </td>
                    <td style={{ padding:"9px 12px" }}>
                      <input
                        type="number" min={0} step="0.01"
                        value={d.precio_unit}
                        onChange={e => updateItem(d.repuesto_id, "precio_unit", parseFloat(e.target.value) || 0)}
                        style={{ ...S.inp, width:"100px", padding:"5px 8px" }}
                      />
                    </td>
                    <td style={{ padding:"9px 12px", fontWeight:700, color:"var(--accent-text)" }}>
                      {fmtBs(d.cantidad * d.precio_unit)}
                    </td>
                    <td style={{ padding:"9px 12px" }}>
                      <button
                        onClick={() => quitarItem(d.repuesto_id)}
                        style={{ background:"rgba(239,68,68,0.12)", border:"1px solid #ef4444", color:"#ef4444", borderRadius:"6px", padding:"4px 10px", cursor:"pointer", fontSize:"13px" }}
                      >✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Total */}
            <div style={{ padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", borderTop:"2px solid var(--border)", background:"var(--bg-surface)" }}>
              <span style={{ fontWeight:700, color:"var(--text-secondary)", fontSize:"13px", textTransform:"uppercase" }}>Total estimado</span>
              <span style={{ fontWeight:700, color:"var(--accent-text)", fontSize:"22px" }}>{fmtBs(total)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Botones */}
      <div style={{ display:"flex", gap:"12px", justifyContent:"flex-end" }}>
        <button style={{ ...btn("var(--bg-surface2)", "var(--text-secondary)", "1px solid var(--border)") }} onClick={onClose}>
          Cancelar
        </button>
        <button
          style={{ ...btn("var(--accent)", "#fff"), opacity: busy ? 0.6 : 1 }}
          disabled={busy}
          onClick={guardar}
        >
          {busy ? "Registrando..." : "✅ Registrar compra"}
        </button>
      </div>
    </div>
  );
}

// ── FORMULARIO PROVEEDOR ───────────────────────────────────────────────────
function FormProveedor({ inicial, onClose, onSuccess, showMsg }) {
  const [form, setForm] = useState(inicial || { nombre:"", contacto:"", telefono:"", email:"", direccion:"" });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const guardar = async () => {
    if (!form.nombre.trim()) return showMsg("error", "Nombre requerido");
    setBusy(true);
    try {
      if (form.id) await api.put(`/compras/proveedores/${form.id}`, form);
      else         await api.post("/compras/proveedores", form);
      onSuccess("✅ Proveedor guardado correctamente");
      onClose();
    } catch { showMsg("error", "Error al guardar"); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
      <div>
        <label style={S.lbl}>Nombre *</label>
        <input style={S.inp} value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Nombre del proveedor" autoFocus />
      </div>
      <div>
        <label style={S.lbl}>Persona de contacto</label>
        <input style={S.inp} value={form.contacto || ""} onChange={e => set("contacto", e.target.value)} placeholder="Nombre del contacto" />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
        <div>
          <label style={S.lbl}>Teléfono</label>
          <input style={S.inp} value={form.telefono || ""} onChange={e => set("telefono", e.target.value)} placeholder="+591 7XXXXXXX" />
        </div>
        <div>
          <label style={S.lbl}>Email</label>
          <input type="email" style={S.inp} value={form.email || ""} onChange={e => set("email", e.target.value)} placeholder="proveedor@email.com" />
        </div>
      </div>
      <div>
        <label style={S.lbl}>Dirección</label>
        <textarea rows={2} style={{ ...S.inp, resize:"vertical" }} value={form.direccion || ""} onChange={e => set("direccion", e.target.value)} placeholder="Dirección del proveedor..." />
      </div>
      <div style={{ display:"flex", gap:"12px", justifyContent:"flex-end" }}>
        <button style={{ ...btn("var(--bg-surface2)", "var(--text-secondary)", "1px solid var(--border)") }} onClick={onClose}>Cancelar</button>
        <button style={{ ...btn("var(--accent)", "#fff"), opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={guardar}>
          {busy ? "Guardando..." : form.id ? "✅ Actualizar proveedor" : "✅ Crear proveedor"}
        </button>
      </div>
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ───────────────────────────────────────────────────
export default function Compras() {
  const [tab,          setTab]          = useState("compras");
  const [compras,      setCompras]      = useState([]);
  const [proveedores,  setProveedores]  = useState([]);
  const [productos,    setProductos]    = useState([]);
  const [resumen,      setResumen]      = useState({});
  const [loading,      setLoading]      = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [msg,          setMsg]          = useState({ type:"", text:"" });
  const [confirm,      setConfirm]      = useState(null);

  const [modalNueva,   setModalNueva]   = useState(false);
  const [modalDetalle, setModalDetalle] = useState(null);
  const [modalProv,    setModalProv]    = useState(null);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type:"", text:"" }), 5000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = filtroEstado ? `?estado=${filtroEstado}` : "";
      const [c, p, prod, r] = await Promise.all([
        api.get(`/compras${params}`),
        api.get("/compras/proveedores"),
        api.get("/inventario"),
        api.get("/compras/resumen"),
      ]);
      setCompras(c.data      || []);
      setProveedores(p.data  || []);
      setProductos(prod.data || []);
      setResumen(r.data      || {});
    } catch {
      showMsg("error", "Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  }, [filtroEstado]);

  useEffect(() => { load(); }, [load]);

  const cambiarEstadoCompra = async (id, estado) => {
    try {
      await api.put(`/compras/${id}/estado`, { estado });
      showMsg("success", `✅ Compra marcada como ${estado}`);
      load();
    } catch (e) {
      showMsg("error", e.response?.data?.message || "Error");
    }
  };

  const eliminarCompra = async (id) => {
    try {
      await api.delete(`/compras/${id}`);
      showMsg("success", "Compra eliminada");
      load();
    } catch (e) {
      showMsg("error", e.response?.data?.message || "Error");
    }
  };

  const eliminarProveedor = async (id) => {
    try {
      await api.delete(`/compras/proveedores/${id}`);
      showMsg("success", "Proveedor desactivado");
      load();
    } catch {
      showMsg("error", "Error");
    }
  };

  const verDetalle = async (id) => {
    try {
      const res = await api.get(`/compras/${id}`);
      setModalDetalle(res.data);
    } catch {
      showMsg("error", "Error al cargar el detalle");
    }
  };

  const TABS = [
    { key:"compras",     label:"🛒 Compras" },
    { key:"proveedores", label:"🏢 Proveedores" },
  ];

  const FILTROS = [
    { k:"",          l:"Todos",    c: null },
    { k:"PENDIENTE", l:"⏳ Pendiente", c: "#f59e0b" },
    { k:"RECIBIDA",  l:"✅ Recibida",  c: "#22c55e" },
    { k:"CANCELADA", l:"❌ Cancelada", c: "#ef4444" },
  ];

  return (
    <AdminLayout>

      {/* ── HEADER ── */}
      <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:"12px", marginBottom:"1.75rem" }}>
        <div>
          <h2 style={{ fontWeight:700, margin:0, color:"var(--text-primary)", fontSize:"24px" }}>🛒 Compras</h2>
          <p style={{ color:"var(--text-secondary)", margin:"4px 0 0", fontSize:"14px" }}>Gestión de compras y proveedores</p>
        </div>
        <div style={{ display:"flex", gap:"10px" }}>
          <button style={{ ...btn("var(--bg-surface2)", "var(--text-secondary)", "1px solid var(--border)") }} onClick={load}>
            🔄 Actualizar
          </button>
          <button style={btn("var(--accent)", "#fff")} onClick={() => setModalNueva(true)}>
            + Nueva Compra
          </button>
        </div>
      </div>

      {/* ── MENSAJE ── */}
      {msg.text && (
        <div style={{ background: msg.type === "success" ? "var(--success-bg)" : "var(--danger-bg)", border:`1px solid ${msg.type==="success"?"var(--success)":"var(--danger)"}`, color: msg.type==="success" ? "var(--success)" : "var(--danger)", borderRadius:"10px", padding:"12px 16px", marginBottom:"1.25rem", fontSize:"14px", fontWeight:500 }}>
          {msg.text}
        </div>
      )}

      {/* ── STATS ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:"14px", marginBottom:"1.75rem" }}>
        <StatCard label="Total compras"   value={resumen.total || 0}             color="var(--accent-text)" icon="🛒" sub="Registradas" />
        <StatCard label="Pendientes"      value={resumen.pendientes || 0}         color="#f59e0b"           icon="⏳" sub="Por recibir" />
        <StatCard label="Recibidas"       value={resumen.recibidas || 0}          color="#22c55e"           icon="✅" sub="Stock actualizado" />
        <StatCard label="Canceladas"      value={resumen.canceladas || 0}         color="#ef4444"           icon="❌" sub="Sin efecto" />
        <StatCard label="Total invertido" value={fmtBs(resumen.total_invertido)}  color="var(--accent-text)" icon="💰" sub="En compras recibidas" />
      </div>

      {/* ── TABS ── */}
      <div style={{ display:"flex", gap:"6px", marginBottom:"1.25rem" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding:"9px 18px", borderRadius:"10px", border: tab===t.key ? "none" : "1px solid var(--border)", background: tab===t.key ? "var(--accent)" : "var(--bg-surface)", color: tab===t.key ? "#fff" : "var(--text-secondary)", fontWeight:600, fontSize:"13px", cursor:"pointer", fontFamily:"inherit" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ════ TAB COMPRAS ════ */}
      {tab === "compras" && (
        <div>
          {/* Filtros estado */}
          <div style={{ display:"flex", gap:"6px", marginBottom:"1rem", flexWrap:"wrap", alignItems:"center" }}>
            {FILTROS.map(f => {
              const active = filtroEstado === f.k;
              return (
                <button key={f.k} onClick={() => setFiltroEstado(f.k)} style={{ padding:"7px 16px", borderRadius:"8px", border: active ? "none" : "1px solid var(--border)", background: active ? (f.c || "var(--accent)") : "var(--bg-surface)", color: active ? (f.k === "PENDIENTE" ? "#000" : "#fff") : "var(--text-secondary)", fontWeight:600, fontSize:"12px", cursor:"pointer", fontFamily:"inherit" }}>
                  {f.l}
                </button>
              );
            })}
            <span style={{ color:"var(--text-muted)", fontSize:"13px", marginLeft:"auto" }}>
              {compras.length} compra{compras.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div style={S.surface}>
            {loading ? (
              <div style={{ padding:"4rem", textAlign:"center", color:"var(--text-secondary)" }}>
                <div style={{ fontSize:"36px", marginBottom:"10px" }}>⏳</div>
                Cargando compras...
              </div>
            ) : (
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"13px" }}>
                  <thead>
                    <tr style={{ background:"var(--bg-surface2)", borderBottom:"2px solid var(--border)" }}>
                      {["#","Proveedor","N° Factura","Fecha compra","Productos","Total","Estado","Acciones"].map(h => (
                        <th key={h} style={{ padding:"11px 14px", textAlign:"left", color:"var(--text-secondary)", fontWeight:600, fontSize:"11px", textTransform:"uppercase", letterSpacing:"0.5px", whiteSpace:"nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {compras.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding:"4rem", textAlign:"center", color:"var(--text-secondary)" }}>
                          <div style={{ fontSize:"48px", marginBottom:"12px" }}>🛒</div>
                          <p style={{ margin:0, fontWeight:600 }}>Sin compras registradas</p>
                          <p style={{ margin:"4px 0 0", fontSize:"13px" }}>Registra la primera compra con el botón de arriba</p>
                        </td>
                      </tr>
                    ) : compras.map(c => (
                      <tr key={c.id} style={{ borderBottom:"1px solid var(--border)" }}>
                        <td style={{ padding:"12px 14px", color:"var(--text-muted)", fontSize:"12px" }}>#{c.id}</td>
                        <td style={{ padding:"12px 14px" }}>
                          {c.proveedor_nombre
                            ? <span style={{ fontWeight:600, color:"var(--text-primary)" }}>{c.proveedor_nombre}</span>
                            : <span style={{ color:"var(--text-muted)", fontStyle:"italic" }}>Sin proveedor</span>}
                        </td>
                        <td style={{ padding:"12px 14px" }}>
                          {c.nro_factura
                            ? <span style={{ background:"var(--accent-light)", color:"var(--accent-text)", borderRadius:"6px", padding:"2px 8px", fontSize:"12px", fontWeight:600 }}>{c.nro_factura}</span>
                            : <span style={{ color:"var(--text-muted)" }}>—</span>}
                        </td>
                        <td style={{ padding:"12px 14px", color:"var(--text-secondary)", whiteSpace:"nowrap" }}>{fmtFecha(c.fecha_compra)}</td>
                        <td style={{ padding:"12px 14px", textAlign:"center" }}>
                          <span style={{ background:"var(--bg-surface2)", border:"1px solid var(--border)", borderRadius:"6px", padding:"2px 8px", fontSize:"12px", fontWeight:600, color:"var(--text-primary)" }}>
                            {c.num_items || 0}
                          </span>
                        </td>
                        <td style={{ padding:"12px 14px", fontWeight:700, color:"var(--accent-text)", fontSize:"15px" }}>{fmtBs(c.total)}</td>
                        <td style={{ padding:"12px 14px" }}><PillEstado estado={c.estado} /></td>
                        <td style={{ padding:"12px 14px" }}>
                          <div style={{ display:"flex", gap:"6px" }}>
                            <button
                              onClick={() => verDetalle(c.id)}
                              style={{ background:"var(--accent-light)", border:"1px solid var(--accent)", color:"var(--accent-text)", borderRadius:"8px", padding:"5px 12px", cursor:"pointer", fontSize:"12px", fontWeight:600 }}
                            >
                              👁 Ver
                            </button>
                            {c.estado === "PENDIENTE" && (
                              <>
                                <button
                                  onClick={() => setConfirm({
                                    titulo: `Marcar compra #${c.id} como RECIBIDA`,
                                    desc:   "El stock de todos los productos se actualizará automáticamente.",
                                    color:  "#22c55e",
                                    label:  "✅ Recibir compra",
                                    action: () => cambiarEstadoCompra(c.id, "RECIBIDA"),
                                  })}
                                  style={{ background:"rgba(34,197,94,0.12)", border:"1px solid #22c55e", color:"#22c55e", borderRadius:"8px", padding:"5px 10px", cursor:"pointer", fontSize:"13px" }}
                                  title="Marcar como recibida"
                                >✅</button>
                                <button
                                  onClick={() => setConfirm({
                                    titulo: `Eliminar compra #${c.id}`,
                                    desc:   "La compra será eliminada. El stock no se modifica.",
                                    color:  "#ef4444",
                                    label:  "🗑️ Eliminar",
                                    action: () => eliminarCompra(c.id),
                                  })}
                                  style={{ background:"rgba(239,68,68,0.12)", border:"1px solid #ef4444", color:"#ef4444", borderRadius:"8px", padding:"5px 10px", cursor:"pointer", fontSize:"13px" }}
                                  title="Eliminar"
                                >🗑️</button>
                              </>
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

      {/* ════ TAB PROVEEDORES ════ */}
      {tab === "proveedores" && (
        <div>
          <div style={{ marginBottom:"1rem" }}>
            <button style={btn("var(--accent)", "#fff")} onClick={() => setModalProv("nuevo")}>
              + Nuevo Proveedor
            </button>
          </div>

          <div style={S.surface}>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"13px" }}>
                <thead>
                  <tr style={{ background:"var(--bg-surface2)", borderBottom:"2px solid var(--border)" }}>
                    {["#","Nombre","Contacto","Teléfono","Email","Estado","Acciones"].map(h => (
                      <th key={h} style={{ padding:"11px 14px", textAlign:"left", color:"var(--text-secondary)", fontWeight:600, fontSize:"11px", textTransform:"uppercase", letterSpacing:"0.5px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {proveedores.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding:"4rem", textAlign:"center", color:"var(--text-secondary)" }}>
                        <div style={{ fontSize:"48px", marginBottom:"12px" }}>🏢</div>
                        <p style={{ margin:0, fontWeight:600 }}>Sin proveedores registrados</p>
                      </td>
                    </tr>
                  ) : proveedores.map(p => (
                    <tr key={p.id} style={{ borderBottom:"1px solid var(--border)" }}>
                      <td style={{ padding:"12px 14px", color:"var(--text-muted)", fontSize:"12px" }}>#{p.id}</td>
                      <td style={{ padding:"12px 14px", fontWeight:700, color:"var(--text-primary)" }}>{p.nombre}</td>
                      <td style={{ padding:"12px 14px", color:"var(--text-secondary)" }}>{p.contacto || "—"}</td>
                      <td style={{ padding:"12px 14px", color:"var(--text-secondary)" }}>{p.telefono || "—"}</td>
                      <td style={{ padding:"12px 14px", color:"var(--accent-text)" }}>{p.email || "—"}</td>
                      <td style={{ padding:"12px 14px" }}>
                        <span style={{ background: p.estado ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)", color: p.estado ? "#22c55e" : "#ef4444", border:`1px solid ${p.estado?"#22c55e":"#ef4444"}`, borderRadius:"6px", padding:"2px 8px", fontSize:"11px", fontWeight:600 }}>
                          {p.estado ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td style={{ padding:"12px 14px" }}>
                        <div style={{ display:"flex", gap:"6px" }}>
                          <button
                            onClick={() => setModalProv(p)}
                            style={{ background:"var(--accent-light)", border:"1px solid var(--accent)", color:"var(--accent-text)", borderRadius:"8px", padding:"5px 12px", cursor:"pointer", fontSize:"12px", fontWeight:600 }}
                          >✏️ Editar</button>
                          <button
                            onClick={() => setConfirm({
                              titulo: `Desactivar proveedor "${p.nombre}"`,
                              desc:   "El proveedor quedará inactivo pero sus compras se conservarán.",
                              color:  "#ef4444",
                              label:  "🗑️ Desactivar",
                              action: () => eliminarProveedor(p.id),
                            })}
                            style={{ background:"rgba(239,68,68,0.12)", border:"1px solid #ef4444", color:"#ef4444", borderRadius:"8px", padding:"5px 10px", cursor:"pointer", fontSize:"12px", fontWeight:600 }}
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

      {/* ── MODALES ── */}
      {modalNueva && (
        <Modal title="Nueva Compra" subtitle="Registra una nueva orden de compra" onClose={() => setModalNueva(false)} width="840px">
          <FormNuevaCompra
            proveedores={proveedores}
            productos={productos}
            onClose={() => setModalNueva(false)}
            onGuardado={() => { load(); showMsg("success", "✅ Compra registrada correctamente"); }}
            showMsg={showMsg}
          />
        </Modal>
      )}

      {modalDetalle && (
        <Modal title={`Compra #${modalDetalle.id}`} subtitle={`${modalDetalle.proveedor_nombre || "Sin proveedor"} — ${fmtFecha(modalDetalle.fecha_compra)}`} onClose={() => setModalDetalle(null)} width="780px">
          <DetalleCompra
            compra={modalDetalle}
            onClose={() => setModalDetalle(null)}
            onEstado={cambiarEstadoCompra}
            showMsg={showMsg}
          />
        </Modal>
      )}

      {modalProv && (
        <Modal
          title={modalProv === "nuevo" ? "Nuevo Proveedor" : "Editar Proveedor"}
          subtitle={modalProv !== "nuevo" ? modalProv.nombre : "Completa los datos del proveedor"}
          onClose={() => setModalProv(null)}
        >
          <FormProveedor
            inicial={modalProv === "nuevo" ? null : modalProv}
            onClose={() => setModalProv(null)}
            onSuccess={(m) => { showMsg("success", m); load(); }}
            showMsg={showMsg}
          />
        </Modal>
      )}

      {/* Confirmación global sin window.confirm */}
      {confirm && (
        <ModalConfirm
          titulo={confirm.titulo}
          descripcion={confirm.desc}
          labelOk={confirm.label}
          colorOk={confirm.color}
          onConfirm={() => confirm.action()}
          onClose={() => setConfirm(null)}
        />
      )}

    </AdminLayout>
  );
}