import { useEffect, useState, useContext } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import api from "../../services/api";
import {
  ResponsiveContainer, PieChart, Pie, Cell,
  Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import { ThemeContext } from "../../context/ThemeContext";

function Dashboard() {

  const { theme } = useContext(ThemeContext);
  const [equipos, setEquipos] = useState([]);
  const [stats,   setStats]   = useState({
    total: 0, asignados: 0, disponibles: 0, mantenimiento: 0, baja: 0
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res  = await api.get("/equipos");
      const data = res.data;
      setEquipos(data);
      setStats({
        total:         data.length,
        asignados:     data.filter(e => e.estado === "ASIGNADO").length,
        disponibles:   data.filter(e => e.estado === "DISPONIBLE").length,
        mantenimiento: data.filter(e => e.estado === "MANTENIMIENTO").length,
        baja:          data.filter(e => e.estado === "BAJA").length
      });
    } catch (error) {
      console.log(error);
    }
  };

  const pieData = [
    { name: "Disponibles",   value: stats.disponibles },
    { name: "Asignados",     value: stats.asignados },
    { name: "Mantenimiento", value: stats.mantenimiento },
    { name: "Baja",          value: stats.baja },
  ].filter(d => d.value > 0);

  const COLORS = ["#22c55e", "#f59e0b", "#6c63ff", "#ef4444"];

  const tipoData = [];
  equipos.forEach(e => {
    const existe = tipoData.find(x => x.tipo === e.tipo);
    if (existe) existe.cantidad++;
    else tipoData.push({ tipo: e.tipo || "Sin tipo", cantidad: 1 });
  });

  const chartText = theme === "dark" ? "#8b92b8" : "#6b7280";
  const gridColor = theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

  const badgeClass = (estado) => {
    if (estado === "DISPONIBLE")    return "badge-success";
    if (estado === "ASIGNADO")      return "badge-warning";
    if (estado === "MANTENIMIENTO") return "badge-accent";
    return "badge-danger";
  };

  const statCards = [
    { label: "Total Equipos",     value: stats.total,         icon: "💻", color: "var(--accent-text)", bg: "var(--accent-light)" },
    { label: "Equipos Asignados", value: stats.asignados,     icon: "👨‍💼", color: "var(--warning)",    bg: "var(--warning-bg)" },
    { label: "Disponibles",       value: stats.disponibles,   icon: "📦", color: "var(--success)",     bg: "var(--success-bg)" },
    { label: "Mantenimiento",     value: stats.mantenimiento, icon: "🔧", color: "var(--accent-text)", bg: "var(--accent-light)" },
    { label: "Equipos Baja",      value: stats.baja,          icon: "🗑", color: "var(--danger)",      bg: "var(--danger-bg)" },
  ];

  return (
    <AdminLayout>

      <div style={{ marginBottom: "1.75rem" }}>
        <h2 style={{ fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
          Dashboard
        </h2>
        <p style={{ color: "var(--text-secondary)", margin: "4px 0 0", fontSize: "14px" }}>
          Panel general del Inventario TI — GAM
        </p>
      </div>

      {/* STAT CARDS */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "16px", marginBottom: "1.75rem"
      }}>
        {statCards.map((s, i) => (
          <div key={i} style={{
            background: "var(--bg-surface)", border: "1px solid var(--border)",
            borderRadius: "16px", padding: "1.25rem",
            display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <div>
              <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: "0 0 6px" }}>
                {s.label}
              </p>
              <p style={{ color: s.color, fontSize: "28px", fontWeight: 700, margin: 0 }}>
                {s.value}
              </p>
            </div>
            <div style={{
              width: "48px", height: "48px", background: s.bg,
              borderRadius: "12px", display: "flex",
              alignItems: "center", justifyContent: "center", fontSize: "22px"
            }}>{s.icon}</div>
          </div>
        ))}
      </div>

      {/* GRAFICAS */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "16px", marginBottom: "1.75rem"
      }}>
        <div style={{
          background: "var(--bg-surface)", border: "1px solid var(--border)",
          borderRadius: "16px", padding: "1.25rem"
        }}>
          <h5 style={{ fontWeight: 600, margin: "0 0 1rem", color: "var(--text-primary)" }}>
            Estado Equipos
          </h5>
          <div style={{ width: "100%", height: "300px" }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} dataKey="value" outerRadius={100}
                  label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{
                  background: "var(--bg-surface2)", border: "1px solid var(--border)",
                  borderRadius: "8px", color: "var(--text-primary)"
                }} />
                <Legend wrapperStyle={{ color: "var(--text-secondary)", fontSize: "13px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{
            background: "var(--bg-surface)", border: "1px solid var(--border)",
          borderRadius: "16px", padding: "1.25rem"
        }}>
          <h5 style={{ fontWeight: 600, margin: "0 0 1rem", color: "var(--text-primary)" }}>
            Equipos por Tipo
          </h5>
          <div style={{ width: "100%", height: "300px" }}>
            <ResponsiveContainer>
              <BarChart data={tipoData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="tipo"
                  tick={{ fill: chartText, fontSize: 12 }}
                  axisLine={{ stroke: gridColor }} />
                <YAxis tick={{ fill: chartText, fontSize: 12 }}
                  axisLine={{ stroke: gridColor }} />
                <Tooltip contentStyle={{
                  background: "var(--bg-surface2)", border: "1px solid var(--border)",
                  borderRadius: "8px", color: "var(--text-primary)"
                }} />
                <Bar dataKey="cantidad" fill="var(--accent)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* TABLA */}
      <div style={{
        background: "var(--bg-surface)", border: "1px solid var(--border)",
        borderRadius: "16px", overflow: "hidden"
      }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
          <h5 style={{ fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>
            Últimos Equipos Registrados
          </h5>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="table-base">
            <thead>
              <tr>
                {["Código","Equipo","Tipo","Sucursal","Estado"].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {equipos.slice(0, 5).map(e => (
                <tr key={e.id}>
                  <td style={{ color: "var(--accent-text)", fontWeight: 600 }}>{e.codigo}</td>
                  <td style={{ color: "var(--text-primary)" }}>{e.nombre}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{e.tipo}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{e.sucursal || "—"}</td>
                  <td><span className={badgeClass(e.estado)}>{e.estado}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </AdminLayout>
  );
}

export default Dashboard;