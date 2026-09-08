import { useEffect, useState } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import api from "../../services/api";
import { useDialog } from "../../context/DialogContext";
import { useIsNarrow } from "../../hooks/useIsNarrow";

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

const Overlay = ({ children, onClose }) => (
  <div onClick={onClose} style={{
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
    zIndex: 9999, display: "flex", alignItems: "center",
    justifyContent: "center", padding: "1rem"
  }}>
    <div onClick={e => e.stopPropagation()}>{children}</div>
  </div>
);

function Usuarios() {

  const { confirmar, avisar } = useDialog();
  const narrow = useIsNarrow();  // móvil: botones de acción solo con icono

  const [usuarios,    setUsuarios]    = useState([]);
  const [buscar,      setBuscar]      = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);

  // Modal editar
  const [modalEdit,  setModalEdit]  = useState(null);
  // Modal password
  const [modalPass,  setModalPass]  = useState(null);
  const [nuevaPass,  setNuevaPass]  = useState("");
  const [mostrarPass,setMostrarPass] = useState(false);

  const emptyForm = {
    nombre: "", apellido: "", email: "",
    password: "", telefono: ""
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { getData(); }, []);

  const getData = async () => {
    try {
      const res = await api.get("/usuarios");
      setUsuarios(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log(err);
    }
  };

  const crear = async () => {
    if (!form.nombre || !form.email || !form.password)
      return avisar("Nombre, email y contraseña son obligatorios.");
    try {
      await api.post("/usuarios", form);
      setForm(emptyForm);
      setMostrarForm(false);
      getData();
    } catch (err) {
      avisar(err.response?.data?.message || "No se pudo crear el usuario.", "Error al crear usuario");
    }
  };

  const guardarEdicion = async () => {
    if (!modalEdit.nombre || !modalEdit.email)
      return avisar("Nombre y email son obligatorios.");
    try {
      await api.put(`/usuarios/${modalEdit.id}`, modalEdit);
      setModalEdit(null);
      getData();
    } catch (err) {
      avisar(err.response?.data?.message || "No se pudo actualizar el usuario.", "Error al actualizar");
    }
  };

  const cambiarPassword = async () => {
    if (!nuevaPass || nuevaPass.length < 6)
      return avisar("La contraseña debe tener al menos 6 caracteres.");
    try {
      await api.put(`/usuarios/password/${modalPass.id}`, { password: nuevaPass });
      setModalPass(null);
      setNuevaPass("");
      avisar(`La contraseña de ${modalPass.nombre} se actualizó correctamente.`, "Contraseña actualizada");
    } catch (err) {
      avisar(err.response?.data?.message || "No se pudo cambiar la contraseña.", "Error de contraseña");
    }
  };

  const toggleEstado = async (id, estado, nombre) => {
    const accion = estado === 1 ? "desactivar" : "activar";
    if (!(await confirmar(`${accion.charAt(0).toUpperCase() + accion.slice(1)} a ${nombre}?`, `${accion.charAt(0).toUpperCase() + accion.slice(1)} usuario`))) return;
    try {
      await api.put(`/usuarios/toggle/${id}`);
      getData();
    } catch (err) {
      avisar(err.response?.data?.message || "No se pudo cambiar el estado del usuario.", "Error");
    }
  };

  const eliminar = async (id, nombre) => {
    if (!(await confirmar(`Eliminar permanentemente a ${nombre}? Esta acción no se puede deshacer.`, "Eliminar usuario"))) return;
    try {
      await api.delete(`/usuarios/${id}`);
      getData();
    } catch (err) {
      avisar(err.response?.data?.message || "No se pudo eliminar el usuario.", "Error al eliminar");
    }
  };

  const filtrados = usuarios.filter(u => {
    const q = buscar.toLowerCase();
    return (
      (u.nombre   || "").toLowerCase().includes(q) ||
      (u.apellido || "").toLowerCase().includes(q) ||
      (u.email    || "").toLowerCase().includes(q) ||
      (u.cargo    || "").toLowerCase().includes(q) ||
      (u.area     || "").toLowerCase().includes(q)
    );
  });

  const activos   = usuarios.filter(u => u.estado === 1).length;
  const inactivos = usuarios.filter(u => u.estado === 0).length;

  return (
    <AdminLayout>

      {/* HEADER */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
          👤 Gestión de Usuarios
        </h2>
        <p style={{ color: "var(--text-secondary)", margin: "4px 0 0", fontSize: "14px" }}>
          GAM — Usuarios con rol PERSONAL (portal de solicitudes)
        </p>
      </div>

      {/* STATS */}
      <div className="users-toolbar" style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: "12px", marginBottom: "1.5rem"
      }}>
        {[
          { l: "Total",     v: usuarios.length, c: "var(--accent-text)" },
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
        <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
          {filtrados.length} resultado{filtrados.length !== 1 ? "s" : ""}
        </span>
        <button
          onClick={() => { setMostrarForm(!mostrarForm); setForm(emptyForm); }}
          style={{ ...btnP, marginLeft: "auto" }}
        >
          ➕ Nuevo Usuario
        </button>
      </div>

      {/* FORMULARIO NUEVO */}
      {mostrarForm && (
        <div className="users-form-card" style={{
          background: "var(--bg-surface)", border: "1px solid var(--border)",
          borderRadius: "16px", overflow: "hidden", marginBottom: "1.25rem"
        }}>
          <div style={{
            padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)",
            display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <h5 style={{ fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>
              ➕ Registrar Nuevo Usuario
            </h5>
            <button onClick={() => setMostrarForm(false)} style={{
              background: "none", border: "none",
              color: "var(--text-muted)", cursor: "pointer", fontSize: "18px"
            }}>✖</button>
          </div>

          <div style={{ padding: "1.25rem" }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "14px"
            }}>
              {[
                { label: "Nombre *",    name: "nombre",   type: "text",     placeholder: "Ej: Juan" },
                { label: "Apellido",    name: "apellido", type: "text",     placeholder: "Ej: Pérez" },
                { label: "Email *",     name: "email",    type: "email",    placeholder: "correo@gam.bo" },
                { label: "Contraseña *",name: "password", type: "password", placeholder: "Mínimo 6 caracteres" },
                { label: "Teléfono",    name: "telefono", type: "text",     placeholder: "Ej: 70000000" },
              ].map(f => (
                <div key={f.name}>
                  <label style={lbl}>{f.label}</label>
                  <input
                    type={f.type} placeholder={f.placeholder}
                    value={form[f.name]}
                    onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                    style={inp}
                  />
                </div>
              ))}
            </div>

            <div style={{
              background: "var(--accent-light)", border: "1px solid var(--accent)",
              borderRadius: "8px", padding: "8px 12px", marginTop: "14px",
              fontSize: "12px", color: "var(--accent-text)"
            }}>
              ℹ️ El usuario se creará con rol <strong>PERSONAL</strong> — podrá acceder al portal de solicitudes.
            </div>

            <div className="users-form-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "1.25rem" }}>
              <button onClick={() => setMostrarForm(false)} style={btnG()}>Cancelar</button>
              <button onClick={crear} style={btnP}>✅ Crear Usuario</button>
            </div>
          </div>
        </div>
      )}

      {/* TABLA */}
      <div className="users-table-card" style={{
        background: "var(--bg-surface)", border: "1px solid var(--border)",
        borderRadius: "16px", overflow: "hidden"
      }}>
        <div style={{
          padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <h5 style={{ fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>
            Lista de Usuarios
          </h5>
          <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
            {filtrados.length} usuario{filtrados.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="users-table-wrap" style={{ overflowX: "auto" }}>
          <table className="table-base">
            <thead>
              <tr>
                {["#","Nombre","Email","Teléfono","Área","Cargo","Sucursal","Estado","Acciones"].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
                    {buscar ? `Sin resultados para "${buscar}"` : "No hay usuarios registrados"}
                  </td>
                </tr>
              ) : filtrados.map(u => (
                <tr key={u.id} style={{ opacity: u.estado === 0 ? 0.55 : 1 }}>
                  <td style={{ color: "var(--text-muted)", fontSize: "12px" }}>#{u.id}</td>
                  <td>
                    <p style={{ margin: 0, color: "var(--text-primary)", fontWeight: 600 }}>
                      {u.nombre} {u.apellido || ""}
                    </p>
                  </td>
                  <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{u.email}</td>
                  <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{u.telefono || "—"}</td>
                  <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{u.area     || "—"}</td>
                  <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{u.cargo    || "—"}</td>
                  <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{u.sucursal || "—"}</td>
                  <td>
                    <span className={u.estado === 1 ? "badge-success" : "badge-danger"}>
                      {u.estado === 1 ? "✅ Activo" : "❌ Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div className="users-row-actions" style={{ display: "flex", gap: "6px", flexWrap: "nowrap", whiteSpace: "nowrap" }}>

                      {/* EDITAR */}
                      <button
                        onClick={() => setModalEdit({ ...u })}
                        title="Editar datos"
                        style={{
                          background: "var(--warning-bg)", border: "1px solid var(--warning)",
                          color: "var(--warning)", borderRadius: "8px",
                          padding: "5px 10px", cursor: "pointer", fontSize: "13px"
                        }}
                      >{narrow ? "✏" : "✏ Editar"}</button>

                      {/* CAMBIAR CONTRASEÑA */}
                      <button
                        onClick={() => { setModalPass(u); setNuevaPass(""); setMostrarPass(false); }}
                        title="Cambiar contraseña"
                        style={{
                          background: "var(--accent-light)", border: "1px solid var(--accent)",
                          color: "var(--accent-text)", borderRadius: "8px",
                          padding: "5px 10px", cursor: "pointer", fontSize: "13px"
                        }}
                      >{narrow ? "🔑" : "🔑 Contraseña"}</button>

                      {/* ACTIVAR / DESACTIVAR */}
                      <button
                        onClick={() => toggleEstado(u.id, u.estado, `${u.nombre} ${u.apellido || ""}`)}
                        title={u.estado === 1 ? "Desactivar usuario" : "Activar usuario"}
                        style={{
                          background: u.estado === 1 ? "var(--warning-bg)" : "var(--success-bg)",
                          border: `1px solid ${u.estado === 1 ? "var(--warning)" : "var(--success)"}`,
                          color: u.estado === 1 ? "var(--warning)" : "var(--success)",
                          borderRadius: "8px", padding: "5px 10px",
                          cursor: "pointer", fontSize: "13px", fontFamily: "inherit"
                        }}
                      >
                        {u.estado === 1
                          ? (narrow ? "⏸" : "⏸ Desactivar")
                          : (narrow ? "▶" : "▶ Activar")}
                      </button>

                      {/* ELIMINAR */}
                      <button
                        onClick={() => eliminar(u.id, `${u.nombre} ${u.apellido || ""}`)}
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

      {/* ══ MODAL EDITAR ══ */}
      {modalEdit && (
        <Overlay onClose={() => setModalEdit(null)}>
          <div className="users-modal users-edit-modal" style={{
            background: "var(--bg-surface)", border: "1px solid var(--border)",
            borderRadius: "16px", width: "520px", maxWidth: "95vw",
            overflow: "hidden"
          }}>
            <div style={{
              background: "var(--accent)", padding: "1rem 1.25rem",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <div>
                <h4 style={{ color: "#fff", fontWeight: 700, margin: 0 }}>✏ Editar Usuario</h4>
                <small style={{ color: "rgba(255,255,255,0.75)" }}>
                  #{modalEdit.id} — {modalEdit.nombre} {modalEdit.apellido || ""}
                </small>
              </div>
              <button onClick={() => setModalEdit(null)} style={{
                background: "rgba(255,255,255,0.15)", border: "none",
                color: "#fff", borderRadius: "8px", padding: "6px 12px",
                cursor: "pointer", fontFamily: "inherit"
              }}>✖</button>
            </div>

            <div style={{ padding: "1.25rem" }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "14px"
              }}>
                {[
                  { label: "Nombre *",  field: "nombre",   type: "text",  placeholder: "Nombre" },
                  { label: "Apellido",  field: "apellido", type: "text",  placeholder: "Apellido" },
                  { label: "Email *",   field: "email",    type: "email", placeholder: "correo@gam.bo" },
                  { label: "Teléfono", field: "telefono", type: "text",  placeholder: "70000000" },
                ].map(f => (
                  <div key={f.field}>
                    <label style={lbl}>{f.label}</label>
                    <input
                      type={f.type} placeholder={f.placeholder}
                      value={modalEdit[f.field] || ""}
                      onChange={e => setModalEdit({ ...modalEdit, [f.field]: e.target.value })}
                      style={inp}
                    />
                  </div>
                ))}
              </div>

              <div style={{
                background: "var(--bg-surface2)", border: "1px solid var(--border)",
                borderRadius: "8px", padding: "10px 14px", marginTop: "14px",
                fontSize: "12px", color: "var(--text-secondary)"
              }}>
                💡 Para cambiar la contraseña usa el botón <strong>🔑 Contraseña</strong> desde la tabla.
              </div>

              <div className="users-form-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "1.25rem" }}>
                <button onClick={() => setModalEdit(null)} style={btnG()}>Cancelar</button>
                <button onClick={guardarEdicion} style={btnP}>✅ Guardar Cambios</button>
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {/* ══ MODAL CAMBIAR CONTRASEÑA ══ */}
      {modalPass && (
        <Overlay onClose={() => { setModalPass(null); setNuevaPass(""); }}>
          <div className="users-modal users-password-modal" style={{
            background: "var(--bg-surface)", border: "1px solid var(--border)",
            borderRadius: "16px", width: "440px", maxWidth: "95vw", padding: "1.75rem"
          }}>
            <h4 style={{ fontWeight: 700, margin: "0 0 0.5rem", color: "var(--text-primary)" }}>
              🔑 Cambiar Contraseña
            </h4>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: "0 0 1.25rem" }}>
              Usuario: <strong style={{ color: "var(--text-primary)" }}>
                {modalPass.nombre} {modalPass.apellido || ""}
              </strong>
              <br />
              <span style={{ fontSize: "12px" }}>{modalPass.email}</span>
            </p>

            <div>
              <label style={lbl}>Nueva contraseña *</label>
              <div style={{ position: "relative" }}>
                <input
                  type={mostrarPass ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={nuevaPass}
                  onChange={e => setNuevaPass(e.target.value)}
                  style={{ ...inp, paddingRight: "48px" }}
                />
                <button
                  type="button"
                  onClick={() => setMostrarPass(!mostrarPass)}
                  style={{
                    position: "absolute", right: "12px", top: "50%",
                    transform: "translateY(-50%)",
                    background: "none", border: "none",
                    color: "var(--text-muted)", cursor: "pointer",
                    fontSize: "16px", padding: 0
                  }}
                >
                  {mostrarPass ? "🙈" : "👁"}
                </button>
              </div>

              {/* Indicador de fortaleza */}
              {nuevaPass.length > 0 && (
                <div style={{ marginTop: "8px" }}>
                  <div style={{
                    height: "4px", borderRadius: "2px",
                    background: "var(--border)",
                    overflow: "hidden"
                  }}>
                    <div style={{
                      height: "100%",
                      width: nuevaPass.length < 6 ? "33%" : nuevaPass.length < 10 ? "66%" : "100%",
                      background: nuevaPass.length < 6 ? "var(--danger)"
                               : nuevaPass.length < 10 ? "var(--warning)"
                               : "var(--success)",
                      transition: "all 0.3s"
                    }} />
                  </div>
                  <p style={{
                    fontSize: "11px", margin: "4px 0 0",
                    color: nuevaPass.length < 6 ? "var(--danger)"
                         : nuevaPass.length < 10 ? "var(--warning)"
                         : "var(--success)"
                  }}>
                    {nuevaPass.length < 6 ? "⚠️ Contraseña muy corta"
                     : nuevaPass.length < 10 ? "🟡 Contraseña regular"
                     : "✅ Contraseña segura"}
                  </p>
                </div>
              )}
            </div>

            <div className="users-form-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "1.25rem" }}>
              <button onClick={() => { setModalPass(null); setNuevaPass(""); }} style={btnG()}>
                Cancelar
              </button>
              <button
                onClick={cambiarPassword}
                disabled={nuevaPass.length < 6}
                style={{
                  ...btnP,
                  background: nuevaPass.length < 6 ? "var(--accent-light)" : "var(--accent)",
                  color: nuevaPass.length < 6 ? "var(--accent-text)" : "#fff",
                  cursor: nuevaPass.length < 6 ? "not-allowed" : "pointer"
                }}
              >
                🔑 Actualizar Contraseña
              </button>
            </div>
          </div>
        </Overlay>
      )}

    </AdminLayout>
  );
}

export default Usuarios;