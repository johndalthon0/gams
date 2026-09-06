import { useEffect, useState, useContext } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import api from "../../services/api";
import { ThemeContext } from "../../context/ThemeContext";
import { useDialog } from "../../context/DialogContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addSistemaLogo, getSistemaConfig } from "../../utils/sistemaConfig";

const surface = {
  background: "var(--bg-surface)", border: "1px solid var(--border)",
  borderRadius: "16px", overflow: "hidden"
};
const inp = {
  width: "100%", background: "var(--bg-surface2)",
  border: "1px solid var(--border)", borderRadius: "10px",
  padding: "10px 14px", color: "var(--text-primary)",
  fontSize: "14px", outline: "none",
  fontFamily: "inherit", boxSizing: "border-box"
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

function Bajas() {
  const { theme } = useContext(ThemeContext);
  const { avisar } = useDialog();

  const [bajas,     setBajas]     = useState([]);
  const [stats,     setStats]     = useState({});
  const [porTipo,   setPorTipo]   = useState([]);
  const [porMotivo, setPorMotivo] = useState([]);
  const [buscar,    setBuscar]    = useState("");
  const [modalVer,  setModalVer]  = useState(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [b, e] = await Promise.all([
        api.get("/bajas"),
        api.get("/bajas/estadisticas")
      ]);
      console.log("bajas data:", b.data);
      setBajas(Array.isArray(b.data) ? b.data : []);
      setStats(e.data.totales   || {});
      setPorTipo(e.data.porTipo   || []);
      setPorMotivo(e.data.porMotivo || []);
    } catch (err) {
      console.log("ERROR loadAll:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const fmt     = (d) => d ? new Date(d).toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const fmtFull = (d) => d ? new Date(d).toLocaleString("es-BO") : "—";

  const filtradas = bajas.filter(b => {
    const q = buscar.toLowerCase();
    return (
      (b.equipo_codigo  || "").toLowerCase().includes(q) ||
      (b.equipo_nombre  || "").toLowerCase().includes(q) ||
      (b.equipo_tipo    || "").toLowerCase().includes(q) ||
      (b.sucursal       || "").toLowerCase().includes(q) ||
      (b.motivo         || "").toLowerCase().includes(q) ||
      (b.usuario_nombre || "").toLowerCase().includes(q)
    );
  });

  const generarPDFBaja = (b) => {
    const sistema = getSistemaConfig();
    const doc = new jsPDF();
    addSistemaLogo(doc, sistema, 8, 5, 18);
    doc.setFillColor(220, 38, 38); doc.rect(0, 0, 210, 42, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold"); doc.setFontSize(11);
    doc.text(sistema.nombre_institucion, 105, 13, { align: "center" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(8);
    doc.text(sistema.nombre_sistema, 105, 21, { align: "center" });
    doc.setFont("helvetica", "bold"); doc.setFontSize(13);
    doc.text("INFORME DE BAJA DE EQUIPO", 105, 33, { align: "center" });
    doc.setTextColor(30, 30, 30);
    let y = 52;

    const sec = (t) => {
      doc.setFillColor(240, 242, 248);
      doc.rect(14, y - 5, 182, 8, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(9);
      doc.text(t, 16, y); y += 10;
    };
    const par = (l, v, l2 = "", v2 = "") => {
      doc.setFont("helvetica", "bold"); doc.setFontSize(8.5);
      doc.text(l, 16, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(v || "—"), 55, y);
      if (l2) {
        doc.setFont("helvetica", "bold"); doc.text(l2, 110, y);
        doc.setFont("helvetica", "normal"); doc.text(String(v2 || "—"), 150, y);
      }
      y += 7;
    };

    sec("DATOS DEL EQUIPO");
    par("Código:",     b.equipo_codigo, "Equipo/Modelo:", b.equipo_nombre);
    par("Tipo:",       b.equipo_tipo,   "N° Serie:",      b.numero_serie || "—");
    par("Sucursal:",   b.sucursal,      "Área:",          b.area || "—");
    par("Adquisición:", b.tipo_adquisicion || "—", "Proveedor:", b.proveedor || "—");
    y += 4;

    sec("DATOS DE LA BAJA");
    par("N° Baja:",    String(b.id), "Fecha:", fmtFull(b.fecha_baja));
    par("Registrado por:", `${b.usuario_nombre || ""} ${b.usuario_apellido || ""}`.trim() || "—", "Cargo:", b.cargo || "—");
    y += 4;

    sec("MOTIVO DE BAJA");
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5);
    const ml = doc.splitTextToSize(b.motivo || "—", 178);
    doc.text(ml, 16, y); y += ml.length * 5.5 + 6;

    if (b.detalle) {
      sec("DETALLE ADICIONAL");
      const dl = doc.splitTextToSize(b.detalle, 178);
      doc.setFont("helvetica", "normal"); doc.setFontSize(8.5);
      doc.text(dl, 16, y); y += dl.length * 5.5 + 6;
    }

    if (y > 240) { doc.addPage(); y = 20; }
    y += 10;
    doc.setLineDash([1, 1]);
    doc.line(16, y + 16, 88, y + 16);
    doc.line(122, y + 16, 194, y + 16);
    doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(80);
    doc.text("Responsable de TI", 52, y + 22, { align: "center" });
    doc.text("Jefe de Sistemas / Vo.Bo.", 158, y + 22, { align: "center" });

    const pages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i); doc.setFontSize(7.5); doc.setTextColor(150);
      doc.text(`GAM — Sistema Inventario TI | Baja #${b.id} | Pág. ${i} de ${pages}`, 105, 290, { align: "center" });
    }
    doc.save(`baja-${b.equipo_codigo}-${b.id}.pdf`);
  };

  const pdfGeneral = () => {
    const sistema = getSistemaConfig();
    const doc = new jsPDF({ orientation: "landscape" });
    addSistemaLogo(doc, sistema, 8, 5, 18);
    doc.setFillColor(220, 38, 38); doc.rect(0, 0, 297, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    doc.text(`${sistema.nombre_institucion} — REPORTE DE BAJAS DE EQUIPOS`, 148, 12, { align: "center" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(8);
    doc.text(`Generado: ${new Date().toLocaleString("es-BO")} | Total: ${filtradas.length}`, 148, 21, { align: "center" });
    doc.setTextColor(30, 30, 30);
    autoTable(doc, {
      startY: 34,
      head: [["#","Código","Equipo","Tipo","N° Serie","Sucursal","Área","Registrado por","Motivo","Fecha"]],
      body: filtradas.map(b => [
        b.id, b.equipo_codigo, b.equipo_nombre,
        b.equipo_tipo || "—", b.numero_serie || "—",
        b.sucursal || "—", b.area || "—",
        `${b.usuario_nombre || ""} ${b.usuario_apellido || ""}`.trim() || "—",
        b.motivo || "—", fmtFull(b.fecha_baja)
      ]),
      styles: { fontSize: 7.5 },
      headStyles: { fillColor: [220, 38, 38] }
    });
    doc.save(`reporte-bajas-${new Date().toISOString().slice(0,10)}.pdf`);
  };

  return (
    <AdminLayout>

      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>🗑 Gestión de Bajas</h2>
        <p style={{ color: "var(--text-secondary)", margin: "4px 0 0", fontSize: "14px" }}>
          GAM — Registro y control de equipos dados de baja
        </p>
      </div>

      {/* STATS */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: "12px", marginBottom: "1.5rem"
      }}>
        {[
          { l: "Total bajas",     v: stats.total_bajas  || 0,        c: "var(--danger)",         icon: "🗑",  big: true },
          { l: "Equipos en baja", v: stats.equipos_baja || 0,        c: "var(--warning)",        icon: "💻", big: true },
          { l: "Primera baja",    v: fmt(stats.primera_baja),         c: "var(--text-secondary)", icon: "📅",  big: false },
          { l: "Última baja",     v: fmt(stats.ultima_baja),          c: "var(--accent-text)",    icon: "🕐",  big: false },
        ].map((s, i) => (
          <div key={i} style={{
            background: "var(--bg-surface)", border: "1px solid var(--border)",
            borderRadius: "14px", padding: "1rem",
            display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <div>
              <p style={{ color: "var(--text-secondary)", fontSize: "12px", margin: "0 0 4px" }}>{s.l}</p>
              <p style={{ color: s.c, fontSize: s.big ? "26px" : "13px", fontWeight: 700, margin: 0 }}>{s.v}</p>
            </div>
            <span style={{ fontSize: "22px" }}>{s.icon}</span>
          </div>
        ))}
      </div>

      {/* RESUMEN */}
      {(porTipo.length > 0 || porMotivo.length > 0) && (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "16px", marginBottom: "1.5rem"
        }}>
          {porTipo.length > 0 && (
            <div style={{
              background: "var(--bg-surface)", border: "1px solid var(--border)",
              borderRadius: "14px", padding: "1.25rem"
            }}>
              <h6 style={{ fontWeight: 600, margin: "0 0 12px", color: "var(--text-primary)" }}>
                📊 Por tipo de equipo
              </h6>
              {porTipo.map((t, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", padding: "8px 0",
                  borderBottom: i < porTipo.length - 1 ? "1px solid var(--border)" : "none"
                }}>
                  <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>💻 {t.tipo}</span>
                  <span style={{
                    color: "var(--danger)", fontWeight: 700,
                    background: "var(--danger-bg)", border: "1px solid var(--danger)",
                    borderRadius: "6px", padding: "1px 10px", fontSize: "12px"
                  }}>{t.cantidad}</span>
                </div>
              ))}
            </div>
          )}

          {porMotivo.length > 0 && (
            <div style={{
              background: "var(--bg-surface)", border: "1px solid var(--border)",
              borderRadius: "14px", padding: "1.25rem"
            }}>
              <h6 style={{ fontWeight: 600, margin: "0 0 12px", color: "var(--text-primary)" }}>
                📋 Por motivo de baja
              </h6>
              {porMotivo.map((m, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", padding: "8px 0",
                  borderBottom: i < porMotivo.length - 1 ? "1px solid var(--border)" : "none"
                }}>
                  <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{m.motivo}</span>
                  <span style={{
                    color: "var(--warning)", fontWeight: 700,
                    background: "var(--warning-bg)", border: "1px solid var(--warning)",
                    borderRadius: "6px", padding: "1px 10px", fontSize: "12px"
                  }}>{m.cantidad}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* BÚSQUEDA */}
      <div style={{
        display: "flex", gap: "12px", marginBottom: "1.25rem",
        flexWrap: "wrap", alignItems: "center"
      }}>
        <input
          style={{ ...inp, maxWidth: "350px" }}
          placeholder="🔍 Buscar por código, equipo, motivo, usuario..."
          value={buscar}
          onChange={e => setBuscar(e.target.value)}
        />
        <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
          {filtradas.length} registro{filtradas.length !== 1 ? "s" : ""}
        </span>
        {filtradas.length > 0 && (
          <button onClick={pdfGeneral} style={{
            marginLeft: "auto", background: "var(--danger-bg)",
            border: "1px solid var(--danger)", color: "var(--danger)",
            borderRadius: "10px", padding: "10px 18px",
            fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
          }}>📄 Exportar PDF</button>
        )}
      </div>

      {/* TABLA */}
      <div style={surface}>
        <div style={{
          padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <h5 style={{ fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>
            Historial de Bajas
          </h5>
          <span style={{
            background: "var(--danger-bg)", color: "var(--danger)",
            border: "1px solid var(--danger)", borderRadius: "6px",
            padding: "2px 10px", fontSize: "12px", fontWeight: 600
          }}>{bajas.length} total</span>
        </div>

        {loading ? (
          <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-secondary)" }}>
            Cargando...
          </div>
        ) : filtradas.length === 0 ? (
          <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-secondary)" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🗑</div>
            <h3 style={{ color: "var(--text-primary)", marginBottom: "8px" }}>
              {buscar ? "Sin resultados" : "No hay bajas registradas"}
            </h3>
            <p style={{ margin: 0, fontSize: "14px" }}>
              {buscar
                ? `No se encontró "${buscar}"`
                : "Las bajas se registran desde Equipos → botón 🗑 Baja"}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table-base">
              <thead>
                <tr>
                  {["#","Equipo","Tipo","N° Serie","Sucursal","Área","Registrado por","Motivo","Detalle","Fecha Baja",""].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtradas.map(b => (
                  <tr key={b.id}>
                    <td style={{ color: "var(--text-muted)", fontSize: "12px" }}>#{b.id}</td>
                    <td>
                      <p style={{ margin: 0, color: "var(--accent-text)", fontWeight: 700, fontSize: "13px" }}>
                        {b.equipo_codigo}
                      </p>
                      <p style={{ margin: 0, color: "var(--text-primary)", fontSize: "13px" }}>
                        {b.equipo_nombre}
                      </p>
                    </td>
                    <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{b.equipo_tipo || "—"}</td>
                    <td style={{ color: "var(--text-secondary)", fontSize: "12px" }}>{b.numero_serie || "—"}</td>
                    <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{b.sucursal || "—"}</td>
                    <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{b.area || "—"}</td>
                    <td>
                      <p style={{ margin: 0, color: "var(--text-primary)", fontSize: "13px", fontWeight: 500 }}>
                        {b.usuario_nombre ? `${b.usuario_nombre} ${b.usuario_apellido || ""}` : "—"}
                      </p>
                      <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "11px" }}>{b.cargo || ""}</p>
                    </td>
                    <td>
                      <span style={{
                        background: "var(--danger-bg)", color: "var(--danger)",
                        border: "1px solid var(--danger)", borderRadius: "6px",
                        padding: "2px 8px", fontSize: "12px", fontWeight: 600,
                        display: "inline-block", whiteSpace: "nowrap"
                      }}>{b.motivo || "—"}</span>
                    </td>
                    <td style={{
                      color: "var(--text-secondary)", fontSize: "12px",
                      maxWidth: "180px"
                    }}>
                      {b.detalle || "—"}
                    </td>
                    <td style={{ color: "var(--danger)", fontSize: "12px", whiteSpace: "nowrap", fontWeight: 500 }}>
                      {fmtFull(b.fecha_baja)}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button onClick={async () => {
                          try {
                            const res = await api.get(`/bajas/${b.id}`);
                            setModalVer(res.data);
                            } catch (e) { await avisar("No se pudo cargar el detalle de la baja.", "Error"); }
                        }} style={{
                          background: "var(--accent-light)", border: "1px solid var(--accent)",
                          color: "var(--accent-text)", borderRadius: "8px",
                          padding: "5px 10px", cursor: "pointer", fontSize: "13px"
                        }}>👁</button>
                        <button onClick={() => generarPDFBaja(b)} style={{
                          background: "var(--danger-bg)", border: "1px solid var(--danger)",
                          color: "var(--danger)", borderRadius: "8px",
                          padding: "5px 10px", cursor: "pointer", fontSize: "13px"
                        }}>📄</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL VER */}
      {modalVer && (
        <Overlay onClose={() => setModalVer(null)}>
          <div style={{
            background: "var(--bg-surface)", border: "1px solid var(--border)",
            borderRadius: "16px", width: "750px", maxWidth: "95vw",
            maxHeight: "90vh", overflow: "hidden",
            display: "flex", flexDirection: "column"
          }}>
            <div style={{
              background: "var(--danger)", padding: "1rem 1.25rem",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <div>
                <h4 style={{ color: "#fff", fontWeight: 700, margin: 0 }}>🗑 Baja #{modalVer.id}</h4>
                <small style={{ color: "rgba(255,255,255,0.8)" }}>
                  {modalVer.equipo_codigo} — {modalVer.equipo_nombre}
                </small>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => generarPDFBaja(modalVer)} style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "#fff", borderRadius: "8px", padding: "6px 14px",
                  cursor: "pointer", fontFamily: "inherit", fontSize: "13px"
                }}>📄 PDF</button>
                <button onClick={() => setModalVer(null)} style={{
                  background: "rgba(255,255,255,0.15)", border: "none",
                  color: "#fff", borderRadius: "8px", padding: "6px 12px",
                  cursor: "pointer", fontFamily: "inherit"
                }}>✖</button>
              </div>
            </div>

            <div style={{ padding: "1.25rem", overflowY: "auto", flex: 1 }}>
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "10px", marginBottom: "1.25rem"
              }}>
                {[
                  { l: "Código",         v: modalVer.equipo_codigo },
                  { l: "Equipo",         v: modalVer.equipo_nombre },
                  { l: "Tipo",           v: modalVer.equipo_tipo         || "—" },
                  { l: "N° Serie",       v: modalVer.numero_serie        || "—" },
                  { l: "Sucursal",       v: modalVer.sucursal            || "—" },
                  { l: "Área",           v: modalVer.area                || "—" },
                  { l: "Adquisición",    v: modalVer.tipo_adquisicion    || "—" },
                  { l: "Proveedor",      v: modalVer.proveedor           || "—" },
                  { l: "F. Adquisición", v: modalVer.fecha_adquisicion ? fmt(modalVer.fecha_adquisicion) : "—" },
                  { l: "Fecha Baja",     v: fmtFull(modalVer.fecha_baja) },
                  { l: "Registrado por", v: `${modalVer.usuario_nombre || ""} ${modalVer.usuario_apellido || ""}`.trim() || "—" },
                  { l: "Cargo",          v: modalVer.cargo               || "—" },
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

              <div style={{ marginBottom: "1rem" }}>
                <span style={{
                  background: "var(--danger-bg)", color: "var(--danger)",
                  border: "1px solid var(--danger)", borderRadius: "6px",
                  padding: "4px 12px", fontSize: "13px", fontWeight: 600
                }}>🗑 BAJA</span>
              </div>

              {[
                { l: "Motivo de baja",    v: modalVer.motivo,          danger: true },
                { l: "Detalle adicional", v: modalVer.detalle,         danger: false },
                { l: "Características",   v: modalVer.caracteristicas, danger: false },
              ].filter(f => f.v).map(f => (
                <div key={f.l} style={{ marginBottom: "14px" }}>
                  <p style={{
                    color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600,
                    textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 6px"
                  }}>{f.l}</p>
                  <div style={{
                    background: f.danger ? "var(--danger-bg)" : "var(--bg-surface2)",
                    border: `1px solid ${f.danger ? "var(--danger)" : "var(--border)"}`,
                    borderRadius: "10px", padding: "12px 14px",
                    color: "var(--text-primary)", fontSize: "14px", lineHeight: 1.6
                  }}>{f.v}</div>
                </div>
              ))}
            </div>
          </div>
        </Overlay>
      )}

    </AdminLayout>
  );
}

export default Bajas;