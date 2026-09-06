import { useEffect, useState } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import api from "../../services/api";
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

function Repuestos() {

  const [tab,         setTab]         = useState("usados");
  const [masUsados,   setMasUsados]   = useState([]);
  const [porEquipo,   setPorEquipo]   = useState([]);
  const [stock,       setStock]       = useState([]);
  const [totales,     setTotales]     = useState({});
  const [loading,     setLoading]     = useState(true);
  const [buscarEq,    setBuscarEq]    = useState("");
  const [buscarStock, setBuscarStock] = useState("");

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [u, e, s, t] = await Promise.all([
        api.get("/repuestos-reporte/mas-usados"),
        api.get("/repuestos-reporte/por-equipo"),
        api.get("/repuestos-reporte/stock"),
        api.get("/repuestos-reporte/totales")
      ]);
      setMasUsados(Array.isArray(u.data) ? u.data : []);
      setPorEquipo(Array.isArray(e.data) ? e.data : []);
      setStock(Array.isArray(s.data) ? s.data : []);
      setTotales(t.data || {});
    } catch (err) {
      console.log("ERROR loadAll repuestos:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const fmt   = (d) => d ? new Date(d).toLocaleDateString("es-BO") : "—";
  const fmtBs = (n) => `Bs ${Number(n || 0).toFixed(2)}`;

  const eqFiltrados = porEquipo.filter(r => {
    const q = buscarEq.toLowerCase();
    return (
      (r.equipo_codigo     || "").toLowerCase().includes(q) ||
      (r.equipo_nombre     || "").toLowerCase().includes(q) ||
      (r.repuesto          || "").toLowerCase().includes(q) ||
      (r.tecnico           || "").toLowerCase().includes(q) ||
      (r.personal_nombre   || "").toLowerCase().includes(q) ||
      (r.personal_apellido || "").toLowerCase().includes(q)
    );
  });

  const stockFiltrado = stock.filter(r => {
    const q = buscarStock.toLowerCase();
    return (
      (r.nombre || "").toLowerCase().includes(q) ||
      (r.tipo   || "").toLowerCase().includes(q)
    );
  });

  // ✅ totales con Number() para evitar NaN
  const totalStockUnidades  = stockFiltrado.reduce((a, r) => a + Number(r.stock || 0), 0);
  const totalStockValor     = stockFiltrado.reduce((a, r) => a + Number(r.valor_inventario || 0), 0);
  const totalStockUsado     = stockFiltrado.reduce((a, r) => a + Number(r.total_usado || 0), 0);

  const pdfMasUsados = () => {
    const sistema = getSistemaConfig();
    const doc = new jsPDF({ orientation: "landscape" });
    addSistemaLogo(doc, sistema, 8, 5, 18);
    doc.setFillColor(108, 99, 255); doc.rect(0, 0, 297, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    doc.text(`${sistema.nombre_institucion} — REPORTE DE REPUESTOS`, 148, 12, { align: "center" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(8);
    doc.text(`Generado: ${new Date().toLocaleString("es-BO")}`, 148, 21, { align: "center" });
    doc.setTextColor(30, 30, 30);
    autoTable(doc, {
      startY: 34,
      head: [["Repuesto","Tipo","Unid. usadas","En mant.","Stock actual","Precio unit.","Costo total"]],
      body: masUsados.map(r => [
        r.repuesto, r.tipo_repuesto || "—",
        r.total_usado, r.en_mantenimientos,
        r.stock_actual, fmtBs(r.precio_unitario),
        fmtBs(r.costo_total)
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [108, 99, 255] }
    });
    doc.save(`repuestos-usados-${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const pdfPorEquipo = () => {
    const sistema = getSistemaConfig();
    const doc = new jsPDF({ orientation: "landscape" });
    addSistemaLogo(doc, sistema, 8, 5, 18);
    doc.setFillColor(108, 99, 255); doc.rect(0, 0, 297, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    doc.text(`${sistema.nombre_institucion} — REPUESTOS POR EQUIPO`, 148, 12, { align: "center" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(8);
    doc.text(`Generado: ${new Date().toLocaleString("es-BO")}`, 148, 21, { align: "center" });
    doc.setTextColor(30, 30, 30);
    autoTable(doc, {
      startY: 34,
      head: [["Equipo","Tipo","Repuesto","Cant.","Costo","Personal","Cargo","Área","Técnico","Último uso"]],
      body: eqFiltrados.map(r => [
        `${r.equipo_codigo} — ${r.equipo_nombre}`,
        r.equipo_tipo || "—", r.repuesto,
        r.cantidad_usada, fmtBs(r.costo),
        `${r.personal_nombre || ""} ${r.personal_apellido || ""}`.trim() || "—",
        r.personal_cargo || "—",
        r.personal_area  || "—",
        r.tecnico        || "—",
        r.ultimo_uso ? fmt(r.ultimo_uso) : "—"
      ]),
      styles: { fontSize: 7.5 },
      headStyles: { fillColor: [108, 99, 255] }
    });
    doc.save(`repuestos-por-equipo-${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const tabs = [
    { key: "usados",  label: "📊 Más usados",     count: masUsados.filter(r => Number(r.total_usado) > 0).length },
    { key: "equipo",  label: "💻 Por equipo",      count: porEquipo.length },
    { key: "stock",   label: "📦 Stock actual",    count: stock.length },
  ];

  return (
    <AdminLayout>

      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>🔩 Reporte de Repuestos</h2>
        <p style={{ color: "var(--text-secondary)", margin: "4px 0 0", fontSize: "14px" }}>
          GAM — Control de repuestos utilizados en mantenimientos y stock disponible
        </p>
      </div>

      {/* STATS */}
      {!loading && (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "12px", marginBottom: "1.5rem"
        }}>
          {[
            { l: "Unidades usadas",     v: totales.total_unidades_usadas        || 0,  c: "var(--accent-text)" },
            { l: "Costo total usado",   v: fmtBs(totales.costo_total_repuestos),        c: "var(--warning)" },
            { l: "Tipos en stock",      v: totales.total_tipos                  || 0,  c: "var(--success)" },
            { l: "Unid. en stock",      v: totales.total_unidades_stock         || 0,  c: "var(--success)" },
            { l: "Valor inventario",    v: fmtBs(totales.valor_total_inventario),       c: "var(--accent-text)" },
            { l: "Mant. con repuestos", v: totales.mantenimientos_con_repuestos  || 0, c: "var(--danger)" },
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
        <button onClick={loadAll} style={{
          marginLeft: "auto",
          background: "var(--bg-surface2)", border: "1px solid var(--border)",
          color: "var(--text-secondary)", borderRadius: "10px",
          padding: "10px 14px", cursor: "pointer", fontFamily: "inherit", fontSize: "13px"
        }}>🔄 Actualizar</button>
      </div>

      {loading ? (
        <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-secondary)" }}>
          Cargando repuestos...
        </div>
      ) : (
        <>
          {/* ══ MÁS USADOS ══ */}
          {tab === "usados" && (
            <div style={surface}>
              <div style={{
                padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)",
                display: "flex", justifyContent: "space-between", alignItems: "center"
              }}>
                <div>
                  <h5 style={{ fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>
                    📊 Repuestos más utilizados en mantenimientos
                  </h5>
                  <p style={{ color: "var(--text-secondary)", fontSize: "12px", margin: "4px 0 0" }}>
                    Todos los repuestos del catálogo — ordenados por uso
                  </p>
                </div>
                {masUsados.filter(r => Number(r.total_usado) > 0).length > 0 && (
                  <button onClick={pdfMasUsados} style={{
                    background: "var(--danger-bg)", border: "1px solid var(--danger)",
                    color: "var(--danger)", borderRadius: "8px",
                    padding: "8px 16px", cursor: "pointer",
                    fontSize: "13px", fontWeight: 600, fontFamily: "inherit"
                  }}>📄 Exportar PDF</button>
                )}
              </div>

              <div style={{ overflowX: "auto" }}>
                <table className="table-base">
                  <thead>
                    <tr>
                      {["#","Repuesto","Tipo","Unid. usadas","En mant.","Stock actual","Precio unit.","Costo total"].map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {masUsados.length === 0 ? (
                      <tr><td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
                        Sin repuestos en catálogo
                      </td></tr>
                    ) : masUsados.map((r, i) => (
                      <tr key={r.id}>
                        <td style={{ color: "var(--text-muted)", fontSize: "12px" }}>{i + 1}</td>
                        <td style={{ color: "var(--text-primary)", fontWeight: 600 }}>{r.repuesto}</td>
                        <td style={{ color: "var(--text-secondary)" }}>{r.tipo_repuesto || "—"}</td>
                        <td>
                          {Number(r.total_usado) > 0 ? (
                            <span style={{
                              background: "var(--accent-light)", color: "var(--accent-text)",
                              border: "1px solid var(--accent)", borderRadius: "6px",
                              padding: "3px 10px", fontSize: "13px", fontWeight: 700
                            }}>{r.total_usado} unid.</span>
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>Sin uso aún</span>
                          )}
                        </td>
                        <td style={{ color: "var(--text-secondary)", textAlign: "center" }}>
                          {r.en_mantenimientos || 0}
                        </td>
                        <td>
                          <span style={{
                            color: Number(r.stock_actual) > 5 ? "var(--success)"
                                 : Number(r.stock_actual) > 0 ? "var(--warning)"
                                 : "var(--danger)",
                            fontWeight: 700, fontSize: "15px"
                          }}>{r.stock_actual}</span>
                          {Number(r.stock_actual) === 0 && (
                            <span style={{
                              marginLeft: "6px", fontSize: "10px",
                              color: "var(--danger)", fontWeight: 600
                            }}>AGOTADO</span>
                          )}
                        </td>
                        <td style={{ color: "var(--text-secondary)" }}>{fmtBs(r.precio_unitario)}</td>
                        <td style={{ color: "var(--success)", fontWeight: 600 }}>
                          {fmtBs(r.costo_total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══ POR EQUIPO ══ */}
          {tab === "equipo" && (
            <div style={surface}>
              <div style={{
                padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)",
                display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center"
              }}>
                <div>
                  <h5 style={{ fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>
                    💻 Repuestos utilizados por equipo
                  </h5>
                  <p style={{ color: "var(--text-secondary)", fontSize: "12px", margin: "4px 0 0" }}>
                    Qué repuesto se usó, en qué equipo, quién lo usa y el técnico responsable
                  </p>
                </div>
                <div style={{ marginLeft: "auto", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <input style={{ ...inp, width: "260px" }}
                    placeholder="🔍 Equipo, repuesto, personal o técnico..."
                    value={buscarEq}
                    onChange={e => setBuscarEq(e.target.value)}
                  />
                  {eqFiltrados.length > 0 && (
                    <button onClick={pdfPorEquipo} style={{
                      background: "var(--danger-bg)", border: "1px solid var(--danger)",
                      color: "var(--danger)", borderRadius: "8px",
                      padding: "10px 14px", cursor: "pointer",
                      fontSize: "13px", fontWeight: 600, fontFamily: "inherit",
                      whiteSpace: "nowrap"
                    }}>📄 PDF</button>
                  )}
                </div>
              </div>

              {eqFiltrados.length === 0 ? (
                <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-secondary)" }}>
                  <div style={{ fontSize: "48px", marginBottom: "12px" }}>💻</div>
                  <p style={{ margin: 0, fontSize: "14px" }}>
                    {buscarEq
                      ? `Sin resultados para "${buscarEq}"`
                      : "Aún no se han registrado repuestos en mantenimientos.\nRegistra un mantenimiento con repuestos en Reparaciones."}
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="table-base">
                    <thead>
                      <tr>
                        {["Equipo","Tipo","Personal asignado","Cargo","Área","Repuesto","Cant.","Costo","Técnico","Estado mant.","Último uso"].map(h => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {eqFiltrados.map((r, i) => (
                        <tr key={i}>
                          <td>
                            <p style={{ margin: 0, color: "var(--accent-text)", fontWeight: 700, fontSize: "13px" }}>
                              {r.equipo_codigo}
                            </p>
                            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "12px" }}>
                              {r.equipo_nombre}
                            </p>
                          </td>
                          <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{r.equipo_tipo || "—"}</td>
                          <td>
                            {r.personal_nombre ? (
                              <>
                                <p style={{ margin: 0, color: "var(--text-primary)", fontWeight: 500, fontSize: "13px" }}>
                                  {r.personal_nombre} {r.personal_apellido || ""}
                                </p>
                                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "11px" }}>
                                  {r.personal_sucursal || ""}
                                </p>
                              </>
                            ) : (
                              <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>Sin asignar</span>
                            )}
                          </td>
                          <td style={{ color: "var(--text-secondary)", fontSize: "12px" }}>{r.personal_cargo || "—"}</td>
                          <td style={{ color: "var(--text-secondary)", fontSize: "12px" }}>{r.personal_area  || "—"}</td>
                          <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>{r.repuesto}</td>
                          <td>
                            <span style={{
                              background: "var(--accent-light)", color: "var(--accent-text)",
                              border: "1px solid var(--accent)", borderRadius: "6px",
                              padding: "2px 8px", fontSize: "12px", fontWeight: 700
                            }}>{r.cantidad_usada}</span>
                          </td>
                          <td style={{ color: "var(--success)", fontWeight: 600 }}>{fmtBs(r.costo)}</td>
                          <td style={{ color: "var(--text-secondary)", fontSize: "12px" }}>{r.tecnico || "—"}</td>
                          <td>
                            <span style={{
                              fontSize: "11px", fontWeight: 600,
                              color: r.mant_estado === "FINALIZADO" ? "var(--success)"
                                   : r.mant_estado === "EN_PROCESO"  ? "var(--accent-text)"
                                   : "var(--warning)",
                              background: r.mant_estado === "FINALIZADO" ? "var(--success-bg)"
                                         : r.mant_estado === "EN_PROCESO" ? "var(--accent-light)"
                                         : "var(--warning-bg)",
                              border: `1px solid ${
                                r.mant_estado === "FINALIZADO" ? "var(--success)"
                                : r.mant_estado === "EN_PROCESO" ? "var(--accent)"
                                : "var(--warning)"
                              }`,
                              borderRadius: "6px", padding: "2px 8px"
                            }}>{r.mant_estado || "—"}</span>
                          </td>
                          <td style={{ color: "var(--text-muted)", fontSize: "12px", whiteSpace: "nowrap" }}>
                            {r.ultimo_uso ? fmt(r.ultimo_uso) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ══ STOCK ACTUAL ══ */}
          {tab === "stock" && (
            <div style={surface}>
              <div style={{
                padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)",
                display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center"
              }}>
                <div>
                  <h5 style={{ fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>
                    📦 Stock actual de repuestos
                  </h5>
                  <p style={{ color: "var(--text-secondary)", fontSize: "12px", margin: "4px 0 0" }}>
                    Inventario en tiempo real — gestiona precios y stock desde Catálogos
                  </p>
                </div>
                <input style={{ ...inp, width: "250px", marginLeft: "auto" }}
                  placeholder="🔍 Nombre o tipo..."
                  value={buscarStock}
                  onChange={e => setBuscarStock(e.target.value)}
                />
              </div>

              {stockFiltrado.length === 0 ? (
                <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-secondary)" }}>
                  <div style={{ fontSize: "48px", marginBottom: "12px" }}>📦</div>
                  <p style={{ margin: 0, fontSize: "14px" }}>
                    {buscarStock ? `Sin resultados para "${buscarStock}"` : "No hay repuestos en catálogos"}
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="table-base">
                    <thead>
                      <tr>
                        {["Repuesto","Tipo","Stock","Estado","Precio unit.","Valor inventario","Total usado","Activo"].map(h => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stockFiltrado.map((r, i) => (
                        <tr key={r.id}>
                          <td style={{ color: "var(--text-primary)", fontWeight: 600 }}>{r.nombre}</td>
                          <td style={{ color: "var(--text-secondary)" }}>{r.tipo || "—"}</td>
                          <td>
                            <span style={{
                              fontSize: "18px", fontWeight: 700,
                              color: Number(r.stock) > 5 ? "var(--success)"
                                   : Number(r.stock) > 0 ? "var(--warning)"
                                   : "var(--danger)"
                            }}>{r.stock}</span>
                          </td>
                          <td>
                            <span style={{
                              fontSize: "11px", fontWeight: 600,
                              color: Number(r.stock) > 5 ? "var(--success)"
                                   : Number(r.stock) > 0 ? "var(--warning)"
                                   : "var(--danger)",
                              background: Number(r.stock) > 5 ? "var(--success-bg)"
                                         : Number(r.stock) > 0 ? "var(--warning-bg)"
                                         : "var(--danger-bg)",
                              border: `1px solid ${
                                Number(r.stock) > 5 ? "var(--success)"
                                : Number(r.stock) > 0 ? "var(--warning)"
                                : "var(--danger)"
                              }`,
                              borderRadius: "6px", padding: "2px 8px"
                            }}>
                              {Number(r.stock) > 5 ? "✅ Suficiente"
                               : Number(r.stock) > 0 ? "⚠️ Bajo"
                               : "❌ Agotado"}
                            </span>
                          </td>
                          <td style={{ color: "var(--text-secondary)" }}>{fmtBs(r.precio)}</td>
                          <td style={{ color: "var(--success)", fontWeight: 600 }}>
                            {fmtBs(Number(r.stock) * Number(r.precio))}
                          </td>
                          <td>
                            {Number(r.total_usado) > 0 ? (
                              <span style={{
                                background: "var(--accent-light)", color: "var(--accent-text)",
                                border: "1px solid var(--accent)", borderRadius: "6px",
                                padding: "1px 8px", fontSize: "12px", fontWeight: 700
                              }}>{r.total_usado}</span>
                            ) : (
                              <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>0</span>
                            )}
                          </td>
                          <td>
                            <span style={{
                              fontSize: "11px", fontWeight: 600,
                              color: r.estado === 1 ? "var(--success)" : "var(--danger)",
                              background: r.estado === 1 ? "var(--success-bg)" : "var(--danger-bg)",
                              border: `1px solid ${r.estado === 1 ? "var(--success)" : "var(--danger)"}`,
                              borderRadius: "6px", padding: "2px 8px"
                            }}>
                              {r.estado === 1 ? "✅ Activo" : "❌ Inactivo"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: "var(--bg-surface2)", borderTop: "2px solid var(--border)" }}>
                        <td colSpan={2} style={{ padding: "12px 14px", fontWeight: 700, color: "var(--text-primary)" }}>
                          TOTALES
                        </td>
                        <td style={{ padding: "12px 14px", fontWeight: 700, color: "var(--success)", fontSize: "15px" }}>
                          {totalStockUnidades}
                        </td>
                        <td></td>
                        <td></td>
                        <td style={{ padding: "12px 14px", fontWeight: 700, color: "var(--success)" }}>
                          {fmtBs(totalStockValor)}
                        </td>
                        <td style={{ padding: "12px 14px", fontWeight: 700, color: "var(--accent-text)" }}>
                          {totalStockUsado}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}

export default Repuestos;