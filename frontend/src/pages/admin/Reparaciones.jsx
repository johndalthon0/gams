import { useEffect, useState, useContext } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import api from "../../services/api";
import { ThemeContext } from "../../context/ThemeContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
const surface = {
  background: "var(--bg-surface)", border: "1px solid var(--border)",
  borderRadius: "16px", overflow: "hidden"
};

const Badge = ({ estado }) => {
  const map = {
    PENDIENTE: "badge-warning", EN_PROCESO: "badge-accent",
    FINALIZADO: "badge-success", RECHAZADO: "badge-danger", APROBADO: "badge-success"
  };
  return <span className={map[estado] || "badge-accent"}>{estado}</span>;
};

const Overlay = ({ children, onClose }) => (
  <div onClick={onClose} style={{
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
    zIndex: 9999, display: "flex", alignItems: "center",
    justifyContent: "center", padding: "1rem"
  }}>
    <div onClick={e => e.stopPropagation()}>{children}</div>
  </div>
);

const ModalBox = ({ children, width = "800px", onClose, title, subtitle, actions }) => (
  <Overlay onClose={onClose}>
    <div style={{
      background: "var(--bg-surface)", border: "1px solid var(--border)",
      borderRadius: "16px", width, maxWidth: "95vw", maxHeight: "90vh",
      overflow: "hidden", display: "flex", flexDirection: "column"
    }}>
      <div style={{
        background: "var(--accent)", padding: "1rem 1.25rem",
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <div>
          <h4 style={{ color: "#fff", fontWeight: 700, margin: 0 }}>{title}</h4>
          {subtitle && <small style={{ color: "rgba(255,255,255,0.75)" }}>{subtitle}</small>}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {actions}
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.15)", border: "none",
            color: "#fff", borderRadius: "8px", padding: "6px 12px",
            cursor: "pointer", fontFamily: "inherit"
          }}>✖</button>
        </div>
      </div>
      <div style={{ padding: "1.25rem", overflowY: "auto", flex: 1 }}>
        {children}
      </div>
    </div>
  </Overlay>
);

function Reparaciones() {
  const { theme } = useContext(ThemeContext);

  const currentUser  = JSON.parse(localStorage.getItem("user") || "{}");
  const rol          = currentUser.rol;
  const nombreTecnico = `${currentUser.nombre || ""} ${currentUser.apellido || ""}`.trim();

  const [tab, setTab] = useState("solicitudes");
  const [solicitudes,    setSolicitudes]    = useState([]);
  const [mantenimientos, setMantenimientos] = useState([]);
  const [equipos,        setEquipos]        = useState([]);
  const [repuestosCat,   setRepuestosCat]   = useState([]);
  const [tecnicos,       setTecnicos]       = useState([]);
  const [reportes,       setReportes]       = useState([]);
  const [totales,        setTotales]        = useState({});

  const [modalNuevo,      setModalNuevo]      = useState(null);
  const [modalVer,        setModalVer]        = useState(null);
  const [modalFinalizar,  setModalFinalizar]  = useState(null);
  const [modalReasignar,  setModalReasignar]  = useState(null);

  const emptyForm = {
    solicitud_id: "", equipo_id: "", tipo: "CORRECTIVO",
    descripcion_problema: "", descripcion_solucion: "",
    tecnico: rol === "EMPLEADO" ? nombreTecnico : "",
    tecnico_usuario_id: rol === "EMPLEADO" ? currentUser.id : "",
    costo: "", estado: "EN_PROCESO", repuestos: []
  };

  const [form,           setForm]           = useState(emptyForm);
  const [finForm,        setFinForm]        = useState({ costo: "", descripcion_solucion: "" });
  const [repSel,         setRepSel]         = useState({ repuesto_id: "", cantidad: 1 });
  const [buscarEquipo,   setBuscarEquipo]   = useState("");
  const [reasignForm,    setReasignForm]    = useState({ tecnico: "", tecnico_usuario_id: "" });
  const [filtros,        setFiltros]        = useState({
    equipo: "", usuario: "", estado: "", fecha_ini: "", fecha_fin: ""
  });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [sol, man, eq, rep, tec] = await Promise.all([
        api.get("/mantenimientos/solicitudes"),
        api.get("/mantenimientos"),
        api.get("/mantenimientos/equipos"),
        api.get("/mantenimientos/repuestos"),
        api.get("/empleados/tecnicos")
      ]);
      setSolicitudes(Array.isArray(sol.data) ? sol.data : []);
      setMantenimientos(Array.isArray(man.data) ? man.data : []);
      setEquipos(Array.isArray(eq.data) ? eq.data : []);
      setRepuestosCat(Array.isArray(rep.data) ? rep.data : []);
      setTecnicos(Array.isArray(tec.data) ? tec.data : []);
    } catch (e) {
      console.log("loadAll:", e.response?.data?.message || e.message);
    }
  };

  const loadReportes = async () => {
    try {
      const params = new URLSearchParams();
      if (filtros.equipo)    params.append("equipo",    filtros.equipo);
      if (filtros.usuario)   params.append("usuario",   filtros.usuario);
      if (filtros.estado)    params.append("estado",    filtros.estado);
      if (filtros.fecha_ini) params.append("fecha_ini", filtros.fecha_ini);
      if (filtros.fecha_fin) params.append("fecha_fin", filtros.fecha_fin);
      const res = await api.get(`/mantenimientos/reportes?${params}`);
      setReportes(res.data.data || []);
      setTotales(res.data.totales || {});
    } catch (e) { console.log("reportes:", e.message); }
  };

  useEffect(() => {
    if (tab === "reportes") loadReportes();
  }, [tab]);

  const totalRep = (reps = []) =>
    reps.reduce((a, r) => a + r.cantidad * (r.precio_unitario || r.precio || 0), 0);

  const fmt   = (d) => d ? new Date(d).toLocaleDateString("es-BO") : "—";
  const fmtBs = (n) => n ? `Bs ${Number(n).toFixed(2)}` : "—";

  const puedeFinalizarMant = (m) => {
    if (rol === "ADMIN") return true;
    if (!m.tecnico_usuario_id) return true;
    return m.tecnico_usuario_id === currentUser.id;
  };

  const abrirNuevo = (sol = null) => {
    setBuscarEquipo("");
    setForm({
      ...emptyForm,
      tecnico:              rol === "EMPLEADO" ? nombreTecnico : "",
      tecnico_usuario_id:   rol === "EMPLEADO" ? currentUser.id : "",
      solicitud_id:         sol?.id          || "",
      equipo_id:            sol?.equipo_id   || "",
      descripcion_problema: sol?.descripcion || ""
    });
    setRepSel({ repuesto_id: "", cantidad: 1 });
    setModalNuevo(sol || true);
  };

  // ✅ con debug
  const agregarRepuesto = () => {
    if (!repSel.repuesto_id) {
      alert("Selecciona un repuesto primero");
      return;
    }
    const cat = repuestosCat.find(r => String(r.id) === String(repSel.repuesto_id));
    if (!cat) {
      alert("Repuesto no encontrado en catálogo");
      return;
    }
    if (form.repuestos.find(r => String(r.repuesto_id) === String(repSel.repuesto_id))) {
      alert("Ya está agregado");
      return;
    }

    const nuevoRepuesto = {
      repuesto_id: cat.id,
      nombre: cat.nombre,
      precio: Number(cat.precio) || 0,
      cantidad: Number(repSel.cantidad) || 1
    };

    console.log("✅ Agregando repuesto:", nuevoRepuesto);

    setForm(f => {
      const nuevosRepuestos = [...f.repuestos, nuevoRepuesto];
      console.log("✅ Repuestos actualizados en form:", nuevosRepuestos);
      return { ...f, repuestos: nuevosRepuestos };
    });

    setRepSel({ repuesto_id: "", cantidad: 1 });
  };

  const quitarRepuesto = (id) =>
    setForm(f => ({ ...f, repuestos: f.repuestos.filter(r => r.repuesto_id !== id) }));

  // ✅ con debug y payload explícito
  const guardarMantenimiento = async () => {
    if (!form.equipo_id || !form.descripcion_problema) {
      alert("Equipo y descripción del problema son obligatorios");
      return;
    }

    const repuestosActuales = form.repuestos;
    console.log("📦 Repuestos a enviar:", repuestosActuales);

    const payload = {
      solicitud_id:         form.solicitud_id,
      equipo_id:            form.equipo_id,
      tipo:                 form.tipo,
      descripcion:          form.descripcion_problema,
      descripcion_problema: form.descripcion_problema,
      descripcion_solucion: form.descripcion_solucion,
      tecnico:              form.tecnico,
      tecnico_usuario_id:   form.tecnico_usuario_id,
      costo:                form.costo,
      estado:               form.estado,
      repuestos: repuestosActuales.map(r => ({
        repuesto_id: r.repuesto_id,
        cantidad:    r.cantidad,
        precio:      r.precio
      }))
    };

    console.log("📨 PAYLOAD COMPLETO A ENVIAR:", JSON.stringify(payload, null, 2));

    try {
      const res = await api.post("/mantenimientos", payload);
      console.log("✅ Respuesta del servidor:", res.data);
      setModalNuevo(null);
      setForm(emptyForm);
      loadAll();
    } catch (e) {
      console.log("❌ Error al guardar:", e.response?.data || e.message);
      alert(e.response?.data?.message || "Error");
    }
  };

  const verDetalle = async (id) => {
    try {
      const res = await api.get(`/mantenimientos/${id}`);
      setModalVer(res.data);
    } catch (e) {
      alert("Error: " + (e.response?.data?.message || e.message));
    }
  };

  const finalizar = async () => {
    try {
      await api.put(`/mantenimientos/finalizar/${modalFinalizar}`, finForm);
      setModalFinalizar(null);
      setFinForm({ costo: "", descripcion_solucion: "" });
      loadAll();
    } catch (e) {
      alert(e.response?.data?.message || "Error");
    }
  };

  const reasignar = async () => {
    if (!reasignForm.tecnico_usuario_id)
      return alert("Selecciona un técnico");
    try {
      await api.put(`/mantenimientos/reasignar/${modalReasignar}`, reasignForm);
      setModalReasignar(null);
      setReasignForm({ tecnico: "", tecnico_usuario_id: "" });
      loadAll();
    } catch (e) {
      alert(e.response?.data?.message || "Error");
    }
  };

  const generarPDF = (m) => {
    const doc = new jsPDF();
    doc.setFillColor(108, 99, 255);
    doc.rect(0, 0, 210, 42, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold"); doc.setFontSize(11);
    doc.text("GOBIERNO AUTÓNOMO MUNICIPAL", 105, 13, { align: "center" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(8);
    doc.text("Sistema de Registro de Equipos de Computación - Mantenimiento Preventivo", 105, 21, { align: "center" });
    doc.setFont("helvetica", "bold"); doc.setFontSize(13);
    doc.text("INFORME TÉCNICO DE MANTENIMIENTO", 105, 33, { align: "center" });
    doc.setTextColor(30, 30, 30);
    let y = 52;

    const sec = (t) => {
      doc.setFillColor(240, 242, 248);
      doc.rect(14, y - 5, 182, 8, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(9);
      doc.text(t, 16, y); y += 10;
    };
    const par = (label, val, label2 = "", val2 = "") => {
      doc.setFont("helvetica", "bold"); doc.setFontSize(8.5);
      doc.text(label, 16, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(val || "—"), 55, y);
      if (label2) {
        doc.setFont("helvetica", "bold"); doc.text(label2, 110, y);
        doc.setFont("helvetica", "normal"); doc.text(String(val2 || "—"), 150, y);
      }
      y += 7;
    };
    const bloque = (titulo, texto) => {
      sec(titulo);
      doc.setFont("helvetica", "normal"); doc.setFontSize(8.5);
      const lines = doc.splitTextToSize(texto || "—", 178);
      doc.text(lines, 16, y); y += lines.length * 5.5 + 6;
    };

    sec("INFORMACIÓN DEL EQUIPO");
    par("Código:",   m.equipo_codigo, "Equipo/Modelo:", m.equipo_nombre);
    par("Tipo:",     m.equipo_tipo,   "N° Serie:",      m.numero_serie || "—");
    par("Sucursal:", m.sucursal,      "Área:",          m.area);
    par("Personal:", `${m.usuario_nombre || ""} ${m.usuario_apellido || ""}`.trim(), "Cargo:", m.cargo);
    y += 4;

    sec("DATOS DEL MANTENIMIENTO");
    par("Tipo mant.:", m.tipo,          "Estado:",  m.estado);
    par("Técnico:",    m.tecnico || "—","Costo:",   fmtBs(m.costo));
    par("Inicio:",     fmt(m.fecha_inicio), "Fin:", m.fecha_fin ? fmt(m.fecha_fin) : "En proceso");
    y += 4;

    bloque("DESCRIPCIÓN DEL PROBLEMA REPORTADO", m.descripcion_problema || m.descripcion);
    bloque("SOLUCIÓN / TRABAJO REALIZADO", m.descripcion_solucion);

    if (m.repuestos && m.repuestos.length > 0) {
      sec("REPUESTOS UTILIZADOS");
      const totalCosto = m.repuestos.reduce((a, r) => a + r.cantidad * (r.precio_unitario || 0), 0);
      const totalQty   = m.repuestos.reduce((a, r) => a + r.cantidad, 0);
      autoTable(doc, {
        startY: y,
        head: [["Repuesto","Tipo","Cant.","Precio Unit. (Bs)","Subtotal (Bs)"]],
        body: [
          ...m.repuestos.map(r => [
            r.nombre, r.tipo || "—", r.cantidad,
            `Bs ${Number(r.precio_unitario || 0).toFixed(2)}`,
            `Bs ${(r.cantidad * (r.precio_unitario || 0)).toFixed(2)}`
          ]),
          [
            { content: `TOTAL: ${totalQty} unidades`, colSpan: 3, styles: { fontStyle: "bold" } },
            { content: "TOTAL COSTO:", styles: { fontStyle: "bold" } },
            { content: `Bs ${totalCosto.toFixed(2)}`, styles: { fontStyle: "bold", textColor: [22, 163, 74] } }
          ]
        ],
        styles: { fontSize: 8 },
        headStyles: { fillColor: [108, 99, 255] }
      });
      y = doc.lastAutoTable.finalY + 12;
    }

    if (y > 245) { doc.addPage(); y = 20; }
    y += 8;
    doc.setLineDash([1, 1]);
    doc.line(16, y + 16, 88, y + 16);
    doc.line(122, y + 16, 194, y + 16);
    doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(80);
    doc.text("Técnico Responsable", 52, y + 22, { align: "center" });
    doc.text("Jefe de Sistemas / Vo.Bo.", 158, y + 22, { align: "center" });

    const pages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i); doc.setFontSize(7.5); doc.setTextColor(150);
      doc.text(`GAM - Sistema de Mantenimiento TI | Página ${i} de ${pages}`, 105, 290, { align: "center" });
    }
    doc.save(`informe-mant-${m.equipo_codigo || m.id}.pdf`);
  };

  const generarReporteGeneral = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFillColor(108, 99, 255);
    doc.rect(0, 0, 297, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    doc.text("GOBIERNO AUTÓNOMO MUNICIPAL — REPORTE DE MANTENIMIENTOS", 148, 12, { align: "center" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(8);
    doc.text(`Generado: ${new Date().toLocaleString("es-BO")} | Total: ${totales.registros || 0} registros`, 148, 21, { align: "center" });
    doc.setTextColor(30, 30, 30);

    autoTable(doc, {
      startY: 34,
      head: [["#","Equipo","Tipo eq.","Tipo mant.","Técnico","Personal","Área","Inicio","Fin","Estado","Rep.Qty","Rep.Costo","Costo"]],
      body: reportes.map(r => [
        r.id, `${r.equipo_codigo} — ${r.equipo_nombre}`,
        r.equipo_tipo || "—", r.tipo || "—", r.tecnico || "—",
        `${r.usuario_nombre || ""} ${r.usuario_apellido || ""}`.trim() || "—",
        r.area || "—", fmt(r.fecha_inicio),
        r.fecha_fin ? fmt(r.fecha_fin) : "En proceso",
        r.estado, r.total_repuestos_qty || 0,
        `Bs ${Number(r.total_repuestos_costo || 0).toFixed(2)}`, fmtBs(r.costo)
      ]),
      foot: [[
        { content: `TOTALES — ${totales.registros || 0} registros`, colSpan: 10, styles: { fontStyle: "bold" } },
        { content: String(totales.repuestos_qty || 0), styles: { fontStyle: "bold" } },
        { content: `Bs ${Number(totales.repuestos_costo || 0).toFixed(2)}`, styles: { fontStyle: "bold" } },
        { content: `Bs ${Number(totales.costo_total || 0).toFixed(2)}`, styles: { fontStyle: "bold" } }
      ]],
      styles: { fontSize: 7.5 },
      headStyles: { fillColor: [108, 99, 255] },
      footStyles: { fillColor: [240, 242, 248], textColor: [30, 30, 30] }
    });
    doc.save(`reporte-mantenimientos-${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const equiposFiltrados = equipos.filter(e => {
    const q = buscarEquipo.toLowerCase();
    return (
      e.codigo.toLowerCase().includes(q) ||
      e.nombre.toLowerCase().includes(q) ||
      (e.tipo || "").toLowerCase().includes(q)
    );
  });

  const tabs = [
    { key: "solicitudes",    label: "📋 Solicitudes",    count: solicitudes.filter(s => s.estado === "PENDIENTE").length },
    { key: "mantenimientos", label: "🔧 Mantenimientos", count: mantenimientos.length },
    { key: "reportes",       label: "📊 Reportes",       count: 0 },
  ];

  return (
    <AdminLayout>

      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
          🛠 Reparaciones y Mantenimiento
        </h2>
        <p style={{ color: "var(--text-secondary)", margin: "4px 0 0", fontSize: "14px" }}>
          GAM — Gestión de solicitudes, mantenimiento y reportes
          {rol === "EMPLEADO" && (
            <span style={{
              marginLeft: "10px", background: "var(--accent-light)",
              color: "var(--accent-text)", borderRadius: "6px",
              padding: "2px 10px", fontSize: "12px", fontWeight: 600
            }}>🔧 Técnico: {nombreTecnico}</span>
          )}
        </p>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "10px 20px", borderRadius: "10px",
            border: tab === t.key ? "none" : "1px solid var(--border)",
            background: tab === t.key ? "var(--accent)" : "var(--bg-surface)",
            color: tab === t.key ? "#fff" : "var(--text-secondary)",
            fontWeight: 600, fontSize: "14px", cursor: "pointer",
            fontFamily: "inherit", display: "flex", alignItems: "center", gap: "8px"
          }}>
            {t.label}
            {t.count > 0 && (
              <span style={{
                background: tab === t.key ? "rgba(255,255,255,0.25)" : "var(--accent-light)",
                color: tab === t.key ? "#fff" : "var(--accent-text)",
                borderRadius: "999px", padding: "1px 8px",
                fontSize: "12px", fontWeight: 700
              }}>{t.count}</span>
            )}
          </button>
        ))}
        {tab !== "reportes" && (
          <button onClick={() => abrirNuevo()} style={{ ...btnP, marginLeft: "auto" }}>
            ➕ Nuevo Mantenimiento
          </button>
        )}
      </div>

      {/* ══ SOLICITUDES ══ */}
      {tab === "solicitudes" && (
        <div style={surface}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h5 style={{ fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>Solicitudes de Mantenimiento</h5>
            <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
              {solicitudes.filter(s => s.estado === "PENDIENTE").length} pendientes
            </span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="table-base">
              <thead>
                <tr>
                  {["#","Usuario","Cargo","Área","Sucursal","Equipo","Descripción","Prioridad","Fecha","Estado","Acción"].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {solicitudes.length === 0 ? (
                  <tr><td colSpan={11} style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>Sin solicitudes</td></tr>
                ) : solicitudes.map(s => (
                  <tr key={s.id}>
                    <td style={{ color: "var(--text-muted)", fontSize: "12px" }}>#{s.id}</td>
                    <td>
                      <p style={{ margin: 0, color: "var(--text-primary)", fontWeight: 500 }}>{s.usuario_nombre} {s.usuario_apellido}</p>
                      <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "11px" }}>{s.usuario_email}</p>
                    </td>
                    <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{s.cargo    || "—"}</td>
                    <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{s.area     || "—"}</td>
                    <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{s.sucursal || "—"}</td>
                    <td>
                      <p style={{ margin: 0, color: "var(--accent-text)", fontWeight: 600, fontSize: "13px" }}>{s.equipo_codigo}</p>
                      <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "11px" }}>{s.equipo_nombre}</p>
                    </td>
                    <td style={{ color: "var(--text-secondary)", fontSize: "13px", maxWidth: "180px" }}>{s.descripcion}</td>
                    <td>
                      <span style={{
                        color: s.prioridad === "ALTA" ? "var(--danger)" : s.prioridad === "MEDIA" ? "var(--warning)" : "var(--success)",
                        fontWeight: 600, fontSize: "13px"
                      }}>
                        {s.prioridad === "ALTA" ? "🔴" : s.prioridad === "MEDIA" ? "🟡" : "🟢"} {s.prioridad}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: "12px", whiteSpace: "nowrap" }}>{fmt(s.fecha_solicitud)}</td>
                    <td><Badge estado={s.estado} /></td>
                    <td>
                      {s.estado === "PENDIENTE" && (
                        <button onClick={() => abrirNuevo(s)} style={{
                          background: "var(--success-bg)", border: "1px solid var(--success)",
                          color: "var(--success)", borderRadius: "8px", padding: "6px 12px",
                          fontSize: "13px", cursor: "pointer", fontWeight: 600,
                          fontFamily: "inherit", whiteSpace: "nowrap"
                        }}>✅ Atender</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══ MANTENIMIENTOS ══ */}
      {tab === "mantenimientos" && (
        <div style={surface}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
            <h5 style={{ fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>Registro de Mantenimientos</h5>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="table-base">
              <thead>
                <tr>
                  {["#","Equipo","Tipo","Técnico Asignado","Personal","Área","Inicio","Costo","Estado","Acciones"].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mantenimientos.length === 0 ? (
                  <tr><td colSpan={10} style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>Sin mantenimientos</td></tr>
                ) : mantenimientos.map(m => {
                  const puedeFinalizar = puedeFinalizarMant(m);
                  return (
                    <tr key={m.id} style={{
                      opacity: (!puedeFinalizar && m.estado === "EN_PROCESO") ? 0.6 : 1
                    }}>
                      <td style={{ color: "var(--text-muted)", fontSize: "12px" }}>#{m.id}</td>
                      <td>
                        <p style={{ margin: 0, color: "var(--accent-text)", fontWeight: 600, fontSize: "13px" }}>{m.equipo_codigo}</p>
                        <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "11px" }}>{m.equipo_nombre}</p>
                      </td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{m.tipo || "—"}</td>
                      <td>
                        <p style={{ margin: 0, color: "var(--text-primary)", fontWeight: 500, fontSize: "13px" }}>
                          {m.tecnico || "—"}
                        </p>
                        {rol === "EMPLEADO" && m.tecnico_usuario_id === currentUser.id && (
                          <span style={{
                            background: "var(--success-bg)", color: "var(--success)",
                            border: "1px solid var(--success)", borderRadius: "4px",
                            padding: "1px 6px", fontSize: "10px", fontWeight: 600
                          }}>✅ Tú</span>
                        )}
                      </td>
                      <td>
                        <p style={{ margin: 0, color: "var(--text-primary)", fontWeight: 500, fontSize: "13px" }}>
                          {m.usuario_nombre ? `${m.usuario_nombre} ${m.usuario_apellido}` : "—"}
                        </p>
                        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "11px" }}>{m.cargo || ""}</p>
                      </td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{m.area || "—"}</td>
                      <td style={{ color: "var(--text-muted)", fontSize: "12px", whiteSpace: "nowrap" }}>{fmt(m.fecha_inicio)}</td>
                      <td style={{ color: "var(--success)", fontWeight: 600, fontSize: "13px" }}>{fmtBs(m.costo)}</td>
                      <td><Badge estado={m.estado} /></td>
                      <td>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          <button onClick={() => verDetalle(m.id)} style={{
                            background: "var(--accent-light)", border: "1px solid var(--accent)",
                            color: "var(--accent-text)", borderRadius: "8px",
                            padding: "5px 10px", cursor: "pointer", fontSize: "13px"
                          }}>👁</button>

                          <button onClick={async () => {
                            try { const res = await api.get(`/mantenimientos/${m.id}`); generarPDF(res.data); }
                            catch (e) { alert("Error PDF"); }
                          }} style={{
                            background: "var(--danger-bg)", border: "1px solid var(--danger)",
                            color: "var(--danger)", borderRadius: "8px",
                            padding: "5px 10px", cursor: "pointer", fontSize: "13px"
                          }}>📄</button>

                          {m.estado === "EN_PROCESO" && puedeFinalizar && (
                            <button onClick={() => {
                              setModalFinalizar(m.id);
                              setFinForm({ costo: m.costo || "", descripcion_solucion: "" });
                            }} style={{
                              background: "var(--success-bg)", border: "1px solid var(--success)",
                              color: "var(--success)", borderRadius: "8px", padding: "5px 10px",
                              cursor: "pointer", fontSize: "13px", fontWeight: 600, fontFamily: "inherit"
                            }}>✅ Finalizar</button>
                          )}

                          {rol === "ADMIN" && m.estado === "EN_PROCESO" && (
                            <button onClick={() => {
                              setModalReasignar(m.id);
                              setReasignForm({ tecnico: m.tecnico || "", tecnico_usuario_id: m.tecnico_usuario_id || "" });
                            }} style={{
                              background: "var(--warning-bg)", border: "1px solid var(--warning)",
                              color: "var(--warning)", borderRadius: "8px", padding: "5px 10px",
                              cursor: "pointer", fontSize: "13px", fontFamily: "inherit"
                            }}>🔄 Reasignar</button>
                          )}

                          {m.estado === "EN_PROCESO" && !puedeFinalizar && (
                            <span style={{
                              color: "var(--text-muted)", fontSize: "11px",
                              display: "flex", alignItems: "center"
                            }}>🔒 No asignado</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══ REPORTES ══ */}
      {tab === "reportes" && (
        <div>
          <div style={{
            background: "var(--bg-surface)", border: "1px solid var(--border)",
            borderRadius: "16px", padding: "1.25rem", marginBottom: "1.25rem"
          }}>
            <h5 style={{ fontWeight: 600, margin: "0 0 1rem", color: "var(--text-primary)" }}>🔍 Filtros</h5>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
              <div>
                <label style={lbl}>Equipo</label>
                <input style={inp} placeholder="Código o nombre"
                  value={filtros.equipo} onChange={e => setFiltros(f => ({ ...f, equipo: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>Personal</label>
                <input style={inp} placeholder="Nombre"
                  value={filtros.usuario} onChange={e => setFiltros(f => ({ ...f, usuario: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>Estado</label>
                <select style={inp} value={filtros.estado} onChange={e => setFiltros(f => ({ ...f, estado: e.target.value }))}>
                  <option value="">Todos</option>
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="EN_PROCESO">En proceso</option>
                  <option value="FINALIZADO">Finalizado</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Desde</label>
                <input type="date" style={inp} value={filtros.fecha_ini}
                  onChange={e => setFiltros(f => ({ ...f, fecha_ini: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>Hasta</label>
                <input type="date" style={inp} value={filtros.fecha_fin}
                  onChange={e => setFiltros(f => ({ ...f, fecha_fin: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "1rem", flexWrap: "wrap" }}>
              <button onClick={loadReportes} style={btnP}>🔍 Buscar</button>
              <button onClick={() => {
                setFiltros({ equipo: "", usuario: "", estado: "", fecha_ini: "", fecha_fin: "" });
                setTimeout(loadReportes, 100);
              }} style={btnG()}>Limpiar</button>
              {reportes.length > 0 && (
                <button onClick={generarReporteGeneral} style={{
                  ...btnG("var(--danger)"), border: "1px solid var(--danger)", marginLeft: "auto"
                }}>📄 Exportar PDF</button>
              )}
            </div>
          </div>

          {reportes.length > 0 && (
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "12px", marginBottom: "1.25rem"
            }}>
              {[
                { l: "Registros",         v: totales.registros || 0,                                   c: "var(--accent-text)" },
                { l: "Repuestos (unid.)", v: totales.repuestos_qty || 0,                              c: "var(--warning)" },
                { l: "Costo repuestos",   v: `Bs ${Number(totales.repuestos_costo || 0).toFixed(2)}`, c: "var(--warning)" },
                { l: "Costo mant.",       v: `Bs ${Number(totales.costo_total || 0).toFixed(2)}`,      c: "var(--success)" },
                { l: "Total general",     v: `Bs ${Number(totales.costo_general || 0).toFixed(2)}`,   c: "var(--danger)" },
              ].map((s, i) => (
                <div key={i} style={{
                  background: "var(--bg-surface)", border: "1px solid var(--border)",
                  borderRadius: "12px", padding: "1rem", textAlign: "center"
                }}>
                  <p style={{ color: "var(--text-secondary)", fontSize: "12px", margin: "0 0 4px" }}>{s.l}</p>
                  <p style={{ color: s.c, fontSize: "18px", fontWeight: 700, margin: 0 }}>{s.v}</p>
                </div>
              ))}
            </div>
          )}

          <div style={surface}>
            <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
              <h5 style={{ fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>
                Historial
                {reportes.length > 0 && (
                  <span style={{ marginLeft: "10px", background: "var(--accent-light)", color: "var(--accent-text)", borderRadius: "6px", padding: "2px 10px", fontSize: "13px" }}>
                    {reportes.length} resultados
                  </span>
                )}
              </h5>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="table-base">
                <thead>
                  <tr>
                    {["#","Equipo","Tipo","Técnico","Personal","Área","Sucursal","Problema","Solución","Rep.","Costo Rep.","Costo","Inicio","Estado","PDF"].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportes.length === 0 ? (
                    <tr><td colSpan={15} style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
                      Usa los filtros y presiona Buscar
                    </td></tr>
                  ) : reportes.map(r => (
                    <tr key={r.id}>
                      <td style={{ color: "var(--text-muted)", fontSize: "12px" }}>#{r.id}</td>
                      <td>
                        <p style={{ margin: 0, color: "var(--accent-text)", fontWeight: 600, fontSize: "13px" }}>{r.equipo_codigo}</p>
                        <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "11px" }}>{r.equipo_nombre}</p>
                      </td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "12px" }}>{r.tipo || "—"}</td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "12px" }}>{r.tecnico || "—"}</td>
                      <td style={{ color: "var(--text-primary)", fontSize: "12px" }}>
                        {`${r.usuario_nombre || ""} ${r.usuario_apellido || ""}`.trim() || "—"}
                      </td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "12px" }}>{r.area || "—"}</td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "12px" }}>{r.sucursal || "—"}</td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "12px", maxWidth: "140px" }}>
                        {r.descripcion_problema || r.descripcion || "—"}
                      </td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "12px", maxWidth: "140px" }}>
                        {r.descripcion_solucion || "—"}
                      </td>
                      <td style={{ color: "var(--warning)", fontWeight: 600, fontSize: "12px", textAlign: "center" }}>
                        {r.total_repuestos_qty || 0}
                      </td>
                      <td style={{ color: "var(--warning)", fontWeight: 600, fontSize: "12px" }}>
                        {`Bs ${Number(r.total_repuestos_costo || 0).toFixed(2)}`}
                      </td>
                      <td style={{ color: "var(--success)", fontWeight: 600, fontSize: "12px" }}>{fmtBs(r.costo)}</td>
                      <td style={{ color: "var(--text-muted)", fontSize: "12px", whiteSpace: "nowrap" }}>{fmt(r.fecha_inicio)}</td>
                      <td><Badge estado={r.estado} /></td>
                      <td>
                        <button onClick={async () => {
                          try { const res = await api.get(`/mantenimientos/${r.id}`); generarPDF(res.data); }
                          catch (e) { alert("Error PDF"); }
                        }} style={{
                          background: "var(--danger-bg)", border: "1px solid var(--danger)",
                          color: "var(--danger)", borderRadius: "8px",
                          padding: "5px 10px", cursor: "pointer", fontSize: "12px"
                        }}>📄</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL NUEVO MANTENIMIENTO ══ */}
      {modalNuevo && (
        <ModalBox
          title="🔧 Registrar Mantenimiento"
          subtitle={modalNuevo?.equipo_nombre
            ? `Solicitud #${modalNuevo.id} — ${modalNuevo.equipo_codigo}`
            : "Nuevo mantenimiento manual"}
          onClose={() => setModalNuevo(null)}
          width="820px"
        >
          {modalNuevo?.usuario_nombre && (
            <div style={{
              background: "var(--bg-surface2)", border: "1px solid var(--border)",
              borderRadius: "12px", padding: "12px 16px", marginBottom: "1.25rem",
              display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px"
            }}>
              {[
                { l: "Personal",    v: `${modalNuevo.usuario_nombre} ${modalNuevo.usuario_apellido}` },
                { l: "Cargo",       v: modalNuevo.cargo        || "—" },
                { l: "Área",        v: modalNuevo.area         || "—" },
                { l: "Sucursal",    v: modalNuevo.sucursal     || "—" },
                { l: "Equipo",      v: `${modalNuevo.equipo_codigo} — ${modalNuevo.equipo_nombre}` },
                { l: "Tipo equipo", v: modalNuevo.equipo_tipo  || "—" },
              ].map(f => (
                <div key={f.l}>
                  <p style={{ color: "var(--text-muted)", fontSize: "11px", margin: "0 0 2px" }}>{f.l}</p>
                  <p style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 500, margin: 0 }}>{f.v}</p>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>

            {form.equipo_id ? (
              <div>
                <label style={lbl}>Equipo seleccionado</label>
                <div style={{
                  ...inp, display: "flex", alignItems: "center",
                  gap: "8px", opacity: 0.85
                }}>
                  <span style={{ color: "var(--accent-text)", fontWeight: 600 }}>
                    {modalNuevo?.equipo_codigo || equipos.find(e => e.id == form.equipo_id)?.codigo || "—"}
                  </span>
                  <span style={{ color: "var(--text-muted)" }}>—</span>
                  <span style={{ color: "var(--text-primary)" }}>
                    {modalNuevo?.equipo_nombre || equipos.find(e => e.id == form.equipo_id)?.nombre || "—"}
                  </span>
                  {rol === "ADMIN" && (
                    <button
                      onClick={() => { setForm(f => ({ ...f, equipo_id: "" })); setBuscarEquipo(""); }}
                      style={{
                        marginLeft: "auto", background: "var(--danger-bg)",
                        border: "1px solid var(--danger)", color: "var(--danger)",
                        borderRadius: "6px", padding: "2px 8px",
                        cursor: "pointer", fontSize: "11px", fontFamily: "inherit"
                      }}
                    >Cambiar</button>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={lbl}>Equipo * — busca por código, nombre o tipo</label>
                <input
                  style={{ ...inp, marginBottom: "8px" }}
                  placeholder="🔍 Escribe código o nombre..."
                  value={buscarEquipo}
                  onChange={e => setBuscarEquipo(e.target.value)}
                />
                <div style={{
                  border: "1px solid var(--border)", borderRadius: "10px",
                  maxHeight: "200px", overflowY: "auto", background: "var(--bg-surface2)"
                }}>
                  {equiposFiltrados.length === 0 ? (
                    <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                      {buscarEquipo ? `Sin resultados para "${buscarEquipo}"` : "Escribe para buscar equipos"}
                    </div>
                  ) : equiposFiltrados.map(e => (
                    <div
                      key={e.id}
                      onClick={() => { setForm(f => ({ ...f, equipo_id: e.id })); setBuscarEquipo(""); }}
                      style={{
                        padding: "10px 14px", borderBottom: "1px solid var(--border)",
                        cursor: "pointer", display: "flex",
                        justifyContent: "space-between", alignItems: "center",
                        transition: "background 0.15s"
                      }}
                      onMouseEnter={ev => ev.currentTarget.style.background = "var(--hover)"}
                      onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}
                    >
                      <div>
                        <span style={{ color: "var(--accent-text)", fontWeight: 700, fontSize: "13px", marginRight: "10px" }}>
                          {e.codigo}
                        </span>
                        <span style={{ color: "var(--text-primary)", fontSize: "13px" }}>{e.nombre}</span>
                        {e.tipo && (
                          <span style={{ color: "var(--text-muted)", fontSize: "12px", marginLeft: "8px" }}>· {e.tipo}</span>
                        )}
                      </div>
                      <span style={{
                        fontSize: "11px", fontWeight: 600,
                        color: e.estado === "DISPONIBLE" ? "var(--success)" : e.estado === "ASIGNADO" ? "var(--warning)" : "var(--danger)",
                        background: e.estado === "DISPONIBLE" ? "var(--success-bg)" : e.estado === "ASIGNADO" ? "var(--warning-bg)" : "var(--danger-bg)",
                        border: `1px solid ${e.estado === "DISPONIBLE" ? "var(--success)" : e.estado === "ASIGNADO" ? "var(--warning)" : "var(--danger)"}`,
                        borderRadius: "6px", padding: "2px 8px"
                      }}>{e.estado}</span>
                    </div>
                  ))}
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: "11px", margin: "6px 0 0" }}>
                  {equipos.length} equipos — haz clic para seleccionar
                </p>
              </div>
            )}

            <div>
              <label style={lbl}>Tipo de mantenimiento</label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} style={inp}>
                <option value="CORRECTIVO">Correctivo</option>
                <option value="PREVENTIVO">Preventivo</option>
              </select>
            </div>

            <div>
              <label style={lbl}>Técnico responsable</label>
              {rol === "EMPLEADO" ? (
                <>
                  <input style={{ ...inp, opacity: 0.75, cursor: "not-allowed" }} value={form.tecnico} disabled />
                  <p style={{ color: "var(--success)", fontSize: "11px", margin: "4px 0 0" }}>✅ Asignado a tu usuario</p>
                </>
              ) : (
                <>
                  <select
                    value={form.tecnico_usuario_id}
                    onChange={e => {
                      const tec = tecnicos.find(t => t.id == e.target.value);
                      setForm(f => ({
                        ...f,
                        tecnico_usuario_id: e.target.value,
                        tecnico: tec ? `${tec.nombre} ${tec.apellido || ""}`.trim() : ""
                      }));
                    }}
                    style={inp}
                  >
                    <option value="">Seleccionar técnico...</option>
                    {tecnicos.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.nombre} {t.apellido || ""}{t.cargo ? ` — ${t.cargo}` : ""}
                      </option>
                    ))}
                  </select>
                  {tecnicos.length === 0 && (
                    <p style={{ color: "var(--warning)", fontSize: "11px", margin: "4px 0 0" }}>
                      ⚠️ No hay técnicos. Crea empleados con rol EMPLEADO.
                    </p>
                  )}
                </>
              )}
            </div>

            <div>
              <label style={lbl}>Estado inicial</label>
              <select value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))} style={inp}>
                <option value="EN_PROCESO">En proceso</option>
                <option value="FINALIZADO">Finalizado</option>
              </select>
            </div>

            <div>
              <label style={lbl}>Costo estimado (Bs)</label>
              <input type="number" min={0} step="0.01" style={inp} placeholder="0.00"
                value={form.costo} onChange={e => setForm(f => ({ ...f, costo: e.target.value }))} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={lbl}>📋 Descripción del problema reportado *</label>
              <textarea rows={3} value={form.descripcion_problema}
                onChange={e => setForm(f => ({ ...f, descripcion_problema: e.target.value }))}
                style={{ ...inp, resize: "vertical" }}
                placeholder="Describe el problema reportado..." />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={lbl}>🔧 Solución / Trabajo realizado</label>
              <textarea rows={3} value={form.descripcion_solucion}
                onChange={e => setForm(f => ({ ...f, descripcion_solucion: e.target.value }))}
                style={{ ...inp, resize: "vertical" }}
                placeholder="Describe la solución aplicada..." />
            </div>
          </div>

          {/* REPUESTOS */}
          <div style={{
            marginTop: "1.25rem", background: "var(--bg-surface2)",
            border: "1px solid var(--border)", borderRadius: "12px", padding: "1rem"
          }}>
            <h6 style={{ color: "var(--text-primary)", fontWeight: 600, margin: "0 0 12px" }}>
              🔩 Repuestos Utilizados {form.repuestos.length > 0 && `(${form.repuestos.length})`}
            </h6>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
              <select value={repSel.repuesto_id}
                onChange={e => setRepSel(r => ({ ...r, repuesto_id: e.target.value }))}
                style={{ ...inp, flex: "2", minWidth: "180px" }}>
                <option value="">Seleccionar repuesto...</option>
                {repuestosCat.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.nombre} — Stock: {r.stock} — Bs {Number(r.precio || 0).toFixed(2)}
                  </option>
                ))}
              </select>
              <input type="number" min={1} value={repSel.cantidad}
                onChange={e => setRepSel(r => ({ ...r, cantidad: e.target.value }))}
                style={{ ...inp, flex: "0 0 80px" }} placeholder="Cant." />
              <button type="button" onClick={agregarRepuesto} style={btnP}>+ Agregar</button>
            </div>

            {form.repuestos.length > 0 && (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Repuesto","Cantidad","Precio Unit.","Subtotal",""].map(h => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {form.repuestos.map(r => (
                    <tr key={r.repuesto_id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "8px 10px", color: "var(--text-primary)" }}>{r.nombre}</td>
                      <td style={{ padding: "8px 10px", color: "var(--text-secondary)" }}>{r.cantidad}</td>
                      <td style={{ padding: "8px 10px", color: "var(--text-secondary)" }}>Bs {Number(r.precio).toFixed(2)}</td>
                      <td style={{ padding: "8px 10px", color: "var(--accent-text)", fontWeight: 600 }}>
                        Bs {(r.cantidad * r.precio).toFixed(2)}
                      </td>
                      <td style={{ padding: "8px 10px" }}>
                        <button type="button" onClick={() => quitarRepuesto(r.repuesto_id)} style={{
                          background: "var(--danger-bg)", border: "1px solid var(--danger)",
                          color: "var(--danger)", borderRadius: "6px",
                          padding: "3px 8px", cursor: "pointer", fontSize: "12px"
                        }}>✕</button>
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={3} style={{ padding: "10px", textAlign: "right", color: "var(--text-secondary)", fontWeight: 600 }}>TOTAL:</td>
                    <td style={{ padding: "10px", color: "var(--success)", fontWeight: 700, fontSize: "15px" }}>
                      Bs {totalRep(form.repuestos).toFixed(2)}
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            )}

            {form.repuestos.length === 0 && (
              <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: "8px 0 0", textAlign: "center" }}>
                No has agregado repuestos. Selecciona uno arriba y presiona "+ Agregar".
              </p>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "1.25rem" }}>
            <button onClick={() => setModalNuevo(null)} style={btnG()}>Cancelar</button>
            <button onClick={guardarMantenimiento} style={btnP}>✅ Guardar Mantenimiento</button>
          </div>
        </ModalBox>
      )}

      {/* ══ MODAL VER DETALLE ══ */}
      {modalVer && (
        <ModalBox
          title={`🔍 Detalle #${modalVer.id}`}
          subtitle={`${modalVer.equipo_codigo} — ${modalVer.equipo_nombre}`}
          onClose={() => setModalVer(null)}
          width="780px"
          actions={
            <button onClick={() => generarPDF(modalVer)} style={{
              background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff", borderRadius: "8px", padding: "6px 14px",
              cursor: "pointer", fontFamily: "inherit", fontSize: "13px"
            }}>📄 PDF</button>
          }
        >
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "10px", marginBottom: "1.25rem"
          }}>
            {[
              { l: "Equipo",      v: `${modalVer.equipo_codigo} — ${modalVer.equipo_nombre}` },
              { l: "Tipo equipo", v: modalVer.equipo_tipo    || "—" },
              { l: "N° Serie",    v: modalVer.numero_serie   || "—" },
              { l: "Tipo mant.",  v: modalVer.tipo           || "—" },
              { l: "Técnico",     v: modalVer.tecnico        || "—" },
              { l: "Personal",    v: `${modalVer.usuario_nombre || ""} ${modalVer.usuario_apellido || ""}`.trim() || "—" },
              { l: "Cargo",       v: modalVer.cargo          || "—" },
              { l: "Área",        v: modalVer.area           || "—" },
              { l: "Sucursal",    v: modalVer.sucursal       || "—" },
              { l: "Inicio",      v: fmt(modalVer.fecha_inicio) },
              { l: "Fin",         v: modalVer.fecha_fin ? fmt(modalVer.fecha_fin) : "En proceso" },
              { l: "Costo",       v: fmtBs(modalVer.costo) },
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

          <div style={{ marginBottom: "12px" }}><Badge estado={modalVer.estado} /></div>

          {[
            { l: "📋 Descripción del problema reportado", v: modalVer.descripcion_problema || modalVer.descripcion },
            { l: "🔧 Solución / Trabajo realizado",       v: modalVer.descripcion_solucion },
          ].map(f => (
            <div key={f.l} style={{ marginBottom: "14px" }}>
              <p style={{ color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 6px" }}>
                {f.l}
              </p>
              <div style={{
                background: "var(--bg-surface2)", border: "1px solid var(--border)",
                borderRadius: "10px", padding: "12px 14px",
                color: "var(--text-primary)", fontSize: "14px", lineHeight: 1.6
              }}>
                {f.v || "—"}
              </div>
            </div>
          ))}

          {modalVer.repuestos?.length > 0 ? (
            <div>
              <p style={{ color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 8px" }}>
                🔩 Repuestos utilizados
              </p>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "var(--table-header)", borderBottom: "1px solid var(--border)" }}>
                    {["Repuesto","Tipo","Cantidad","Precio Unit.","Subtotal"].map(h => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-secondary)", fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modalVer.repuestos.map(r => (
                    <tr key={r.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "10px 12px", color: "var(--text-primary)" }}>{r.nombre}</td>
                      <td style={{ padding: "10px 12px", color: "var(--text-secondary)" }}>{r.tipo || "—"}</td>
                      <td style={{ padding: "10px 12px", color: "var(--text-secondary)" }}>{r.cantidad}</td>
                      <td style={{ padding: "10px 12px", color: "var(--text-secondary)" }}>
                        Bs {Number(r.precio_unitario || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: "10px 12px", color: "var(--success)", fontWeight: 600 }}>
                        Bs {(r.cantidad * (r.precio_unitario || 0)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: "var(--bg-surface2)" }}>
                    <td colSpan={4} style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "var(--text-primary)" }}>
                      TOTAL REPUESTOS:
                    </td>
                    <td style={{ padding: "10px 12px", color: "var(--success)", fontWeight: 700, fontSize: "15px" }}>
                      Bs {totalRep(modalVer.repuestos).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: "var(--text-muted)", fontSize: "13px", textAlign: "center", padding: "1rem 0" }}>
              No se registraron repuestos en este mantenimiento.
            </p>
          )}
        </ModalBox>
      )}

      {/* ══ MODAL FINALIZAR ══ */}
      {modalFinalizar && (
        <Overlay onClose={() => setModalFinalizar(null)}>
          <div style={{
            background: "var(--bg-surface)", border: "1px solid var(--border)",
            borderRadius: "16px", width: "500px", maxWidth: "95vw", padding: "1.75rem"
          }}>
            <h4 style={{ fontWeight: 700, margin: "0 0 1.25rem", color: "var(--text-primary)" }}>
              ✅ Finalizar Mantenimiento
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={lbl}>Solución / Trabajo realizado *</label>
                <textarea rows={4} value={finForm.descripcion_solucion}
                  onChange={e => setFinForm(f => ({ ...f, descripcion_solucion: e.target.value }))}
                  style={{ ...inp, resize: "vertical" }}
                  placeholder="Describe detalladamente la solución aplicada..." />
              </div>
              <div>
                <label style={lbl}>Costo final (Bs)</label>
                <input type="number" min={0} step="0.01" value={finForm.costo}
                  onChange={e => setFinForm(f => ({ ...f, costo: e.target.value }))}
                  style={inp} placeholder="0.00" />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "1.25rem" }}>
              <button onClick={() => setModalFinalizar(null)} style={btnG()}>Cancelar</button>
              <button onClick={finalizar} style={btnP}>✅ Confirmar Finalización</button>
            </div>
          </div>
        </Overlay>
      )}

      {/* ══ MODAL REASIGNAR TÉCNICO ══ */}
      {modalReasignar && (
        <Overlay onClose={() => setModalReasignar(null)}>
          <div style={{
            background: "var(--bg-surface)", border: "1px solid var(--border)",
            borderRadius: "16px", width: "440px", maxWidth: "95vw", padding: "1.75rem"
          }}>
            <h4 style={{ fontWeight: 700, margin: "0 0 0.5rem", color: "var(--text-primary)" }}>
              🔄 Reasignar Técnico
            </h4>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: "0 0 1.25rem" }}>
              Mantenimiento #{modalReasignar} — Técnico actual: <strong style={{ color: "var(--text-primary)" }}>{reasignForm.tecnico || "Sin asignar"}</strong>
            </p>

            <div>
              <label style={lbl}>Nuevo técnico responsable</label>
              <select
                value={reasignForm.tecnico_usuario_id}
                onChange={e => {
                  const tec = tecnicos.find(t => t.id == e.target.value);
                  setReasignForm({
                    tecnico_usuario_id: e.target.value,
                    tecnico: tec ? `${tec.nombre} ${tec.apellido || ""}`.trim() : ""
                  });
                }}
                style={{ ...inp, marginBottom: "6px" }}
              >
                <option value="">Sin asignar</option>
                {tecnicos.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nombre} {t.apellido || ""}{t.cargo ? ` — ${t.cargo}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "1.25rem" }}>
              <button onClick={() => setModalReasignar(null)} style={btnG()}>Cancelar</button>
              <button onClick={reasignar} style={{
                ...btnP, background: "var(--warning)",
              }}>🔄 Confirmar Reasignación</button>
            </div>
          </div>
        </Overlay>
      )}

    </AdminLayout>
  );
}

export default Reparaciones;