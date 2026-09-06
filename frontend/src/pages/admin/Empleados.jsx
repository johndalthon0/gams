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

function Empleados() {

  const { confirmar, avisar } = useDialog();

  const [empleados,  setEmpleados]  = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [cargos,     setCargos]     = useState([]);
  const [areas,      setAreas]      = useState([]);
  const [roles,      setRoles]      = useState([]);
  const [mostrarForm,setMostrarForm]= useState(false);
  const [buscar,     setBuscar]     = useState("");

  const emptyForm = {
    nombre: "", apellido: "", email: "", password: "",
    telefono: "", sucursal_id: "", cargo_id: "",
    area_id: "", rol_id: ""
  };
  const [form, setForm] = useState(emptyForm);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { getData(); }, []);

  const getData = async () => {
    try {
      const [e, s, c, a, r] = await Promise.all([
        api.get("/empleados"),
        api.get("/empleados/sucursales"),
        api.get("/empleados/cargos"),
        api.get("/empleados/areas"),
        api.get("/empleados/roles")
      ]);
      setEmpleados(Array.isArray(e.data) ? e.data : []);
      setSucursales(s.data);
      setCargos(c.data);
      setAreas(a.data);
      setRoles(r.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const crear = async () => {
    if (!form.nombre || !form.email || !form.password || !form.rol_id)
      return avisar("Nombre, email, password y rol son obligatorios.");
    setGuardando(true);
    try {
      await api.post("/empleados", form);
      setForm(emptyForm);
      setMostrarForm(false);
      getData();
    } catch (err) {
      avisar(err.response?.data?.message || "No se pudo crear el empleado.", "Error al crear empleado");
    } finally {
      setGuardando(false);
    }
  };

  const toggleEstado = async (id, estadoActual, nombre) => {
    const accion = estadoActual === 1 ? "desactivar" : "activar";
    if (!(await confirmar(`${accion.charAt(0).toUpperCase() + accion.slice(1)} a ${nombre}?`, `${accion.charAt(0).toUpperCase() + accion.slice(1)} empleado`))) return;
    try {
      await api.put(`/empleados/toggle/${id}`);
      getData();
    } catch (err) {
      avisar(err.response?.data?.message || "No se pudo cambiar el estado del empleado.", "Error");
    }
  };

  const eliminar = async (id, nombre) => {
    if (!(await confirmar(`Eliminar permanentemente a ${nombre}? Esta acción no se puede deshacer.`, "Eliminar empleado"))) return;
    try {
      await api.delete(`/empleados/${id}`);
      getData();
    } catch (err) {
      avisar(err.response?.data?.message || "No se pudo eliminar el empleado.", "Error al eliminar");
    }
  };

  // Filtro de búsqueda
  const filtrados = empleados.filter(e => {
    const q = buscar.toLowerCase();
    return (
      (e.nombre    || "").toLowerCase().includes(q) ||
      (e.apellido  || "").toLowerCase().includes(q) ||
      (e.email     || "").toLowerCase().includes(q) ||
      (e.cargo     || "").toLowerCase().includes(q) ||
      (e.sucursal  || "").toLowerCase().includes(q) ||
      (e.rol       || "").toLowerCase().includes(q)
    );
  });

  const activos   = empleados.filter(e => e.emp_estado === 1).length;
  const inactivos = empleados.filter(e => e.emp_estado === 0).length;

  return (
    <AdminLayout>

      {/* HEADER */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
          👨‍💼 Gestión de Empleados
        </h2>
        <p style={{ color: "var(--text-secondary)", margin: "4px 0 0", fontSize: "14px" }}>
          Administración de usuarios del sistema — GAM
        </p>
      </div>

      {/* STATS */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: "12px", marginBottom: "1.5rem"
      }}>
        {[
          { l: "Total",     v: empleados.length, c: "var(--accent-text)" },
          { l: "Activos",   v: activos,          c: "var(--success)" },
          { l: "Inactivos", v: inactivos,         c: "var(--danger)" },
        ].map((s, i) => (
          <div key={i} style={{
            background: "var(--bg-surface)", border: "1px solid var(--border)",
            borderRadius: "12px", padding: "1rem", textAlign: "center"
          }}>
            <p style={{ color: "var(--text-secondary)", fontSize: "12px", margin: "0 0 4px" }}>{s.l}</p>
            <p style={{ color: s.c, fontSize: "24px", fontWeight: 700, margin: 0 }}>{s.v}</p>
          </div>
        ))}
      </div>

      {/* BARRA ACCIONES */}
      <div style={{
        display: "flex", gap: "12px", marginBottom: "1.25rem",
        flexWrap: "wrap", alignItems: "center"
      }}>
        <input
          style={{ ...inp, maxWidth: "300px" }}
          placeholder="🔍 Buscar por nombre, email, cargo..."
          value={buscar}
          onChange={e => setBuscar(e.target.value)}
        />
        <button
          onClick={() => { setMostrarForm(!mostrarForm); setForm(emptyForm); }}
          style={{
            background: "var(--accent)", color: "#fff", border: "none",
            borderRadius: "10px", padding: "10px 18px", fontSize: "14px",
            fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            marginLeft: "auto"
          }}
        >
          ➕ Nuevo Empleado
        </button>
      </div>

      {/* FORMULARIO */}
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
              ➕ Registrar Nuevo Empleado
            </h5>
            <button onClick={() => setMostrarForm(false)} style={{
              background: "var(--bg-surface2)", border: "1px solid var(--border)",
              color: "var(--text-secondary)", borderRadius: "8px",
              padding: "5px 12px", cursor: "pointer", fontFamily: "inherit"
            }}>✖</button>
          </div>

          <div style={{ padding: "1.25rem" }}>

            {/* INFO ACCESO */}
            <div style={{
              background: "var(--accent-light)", border: "1px solid var(--accent)",
              borderRadius: "10px", padding: "10px 14px", marginBottom: "1.25rem",
              fontSize: "13px", color: "var(--accent-text)"
            }}>
              ℹ️ <strong>Restricciones de acceso:</strong> Rol <strong>ADMIN</strong> accede al panel administrativo completo.
              Rol <strong>EMPLEADO</strong> accede como técnico (no tiene portal web propio por ahora).
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "14px"
            }}>
              <div>
                <label style={lbl}>Nombre *</label>
                <input name="nombre" style={inp} placeholder="Ej: Juan"
                  value={form.nombre} onChange={handleChange} />
              </div>
              <div>
                <label style={lbl}>Apellido</label>
                <input name="apellido" style={inp} placeholder="Ej: Pérez"
                  value={form.apellido} onChange={handleChange} />
              </div>
              <div>
                <label style={lbl}>Email *</label>
                <input name="email" type="email" style={inp} placeholder="correo@gam.bo"
                  value={form.email} onChange={handleChange} />
              </div>
              <div>
                <label style={lbl}>Contraseña *</label>
                <input name="password" type="password" style={inp} placeholder="Mínimo 6 caracteres"
                  value={form.password} onChange={handleChange} />
              </div>
              <div>
                <label style={lbl}>Teléfono</label>
                <input name="telefono" style={inp} placeholder="Ej: 70000000"
                  value={form.telefono} onChange={handleChange} />
              </div>

              {/* ROL — con descripción */}
              <div>
                <label style={lbl}>Rol del sistema *</label>
                <select name="rol_id" style={inp} value={form.rol_id} onChange={handleChange}>
                  <option value="">Seleccionar rol...</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.nombre}</option>
                  ))}
                </select>
                {form.rol_id && (
                  <p style={{ color: "var(--text-muted)", fontSize: "11px", margin: "4px 0 0" }}>
                    {roles.find(r => r.id == form.rol_id)?.nombre === "ADMIN"
                      ? "✅ Acceso completo al panel administrativo"
                      : "🔧 Técnico — aparece en selector de mantenimientos"}
                  </p>
                )}
              </div>

              <div>
                <label style={lbl}>Área</label>
                <select name="area_id" style={inp} value={form.area_id} onChange={handleChange}>
                  <option value="">Seleccionar área...</option>
                  {areas.map(a => (
                    <option key={a.id} value={a.id}>{a.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl}>Cargo</label>
                <select name="cargo_id" style={inp} value={form.cargo_id} onChange={handleChange}>
                  <option value="">Seleccionar cargo...</option>
                  {cargos.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl}>Sucursal</label>
                <select name="sucursal_id" style={inp} value={form.sucursal_id} onChange={handleChange}>
                  <option value="">Seleccionar sucursal...</option>
                  {sucursales.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "1.25rem" }}>
              <button onClick={() => setMostrarForm(false)} style={{
                background: "var(--bg-surface2)", border: "1px solid var(--border)",
                color: "var(--text-secondary)", borderRadius: "10px",
                padding: "10px 18px", cursor: "pointer", fontFamily: "inherit"
              }}>Cancelar</button>
              <button onClick={crear} disabled={guardando} style={{
                background: guardando ? "var(--accent-light)" : "var(--accent)",
                color: guardando ? "var(--accent-text)" : "#fff",
                border: "none", borderRadius: "10px",
                padding: "10px 18px", fontSize: "14px",
                fontWeight: 600, cursor: guardando ? "not-allowed" : "pointer",
                fontFamily: "inherit"
              }}>
                {guardando ? "Guardando..." : "✅ Crear Empleado"}
              </button>
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
            Lista de Empleados
          </h5>
          <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
            {filtrados.length} resultado{filtrados.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="table-base">
            <thead>
              <tr>
                {["#","Nombre","Email","Área","Cargo","Sucursal","Rol","Estado","Acciones"].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
                    {buscar ? "Sin resultados para la búsqueda" : "No hay empleados registrados"}
                  </td>
                </tr>
              ) : filtrados.map(e => (
                <tr key={e.id} style={{ opacity: e.emp_estado === 0 ? 0.55 : 1 }}>
                  <td style={{ color: "var(--text-muted)", fontSize: "12px" }}>#{e.id}</td>
                  <td>
                    <p style={{ margin: 0, color: "var(--text-primary)", fontWeight: 600 }}>
                      {e.nombre} {e.apellido || ""}
                    </p>
                  </td>
                  <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{e.email}</td>
                  <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{e.area     || "—"}</td>
                  <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{e.cargo    || "—"}</td>
                  <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{e.sucursal || "—"}</td>
                  <td>
                    <span className={e.rol === "ADMIN" ? "badge-accent" : "badge-warning"}>
                      {e.rol === "ADMIN" ? "🔑 ADMIN" : "🔧 EMPLEADO"}
                    </span>
                  </td>
                  <td>
                    <span className={e.emp_estado === 1 ? "badge-success" : "badge-danger"}>
                      {e.emp_estado === 1 ? "✅ Activo" : "❌ Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {/* ACTIVAR / DESACTIVAR */}
                      <button
                        onClick={() => toggleEstado(e.id, e.emp_estado, `${e.nombre} ${e.apellido || ""}`)}
                        title={e.emp_estado === 1 ? "Desactivar" : "Activar"}
                        style={{
                          background: e.emp_estado === 1 ? "var(--warning-bg)" : "var(--success-bg)",
                          border: `1px solid ${e.emp_estado === 1 ? "var(--warning)" : "var(--success)"}`,
                          color: e.emp_estado === 1 ? "var(--warning)" : "var(--success)",
                          borderRadius: "8px", padding: "5px 10px",
                          cursor: "pointer", fontSize: "13px", fontFamily: "inherit"
                        }}
                      >
                        {e.emp_estado === 1 ? "⏸ Desactivar" : "▶ Activar"}
                      </button>

                      {/* ELIMINAR */}
                      <button
                        onClick={() => eliminar(e.id, `${e.nombre} ${e.apellido || ""}`)}
                        title="Eliminar permanentemente"
                        style={{
                          background: "var(--danger-bg)", border: "1px solid var(--danger)",
                          color: "var(--danger)", borderRadius: "8px",
                          padding: "5px 10px", cursor: "pointer", fontSize: "13px"
                        }}
                      >🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </AdminLayout>
  );
}

export default Empleados;