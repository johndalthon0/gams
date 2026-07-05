import { useEffect, useState } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import api from "../../services/api";

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
  borderRadius: "10px", padding: "10px 20px", fontSize: "14px",
  fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
};
const btnG = (c = "var(--text-secondary)") => ({
  background: "var(--bg-surface2)", border: "1px solid var(--border)",
  color: c, borderRadius: "10px", padding: "10px 20px",
  fontSize: "14px", cursor: "pointer", fontFamily: "inherit"
});

const SISTEMA_KEY = "gam_sistema_config";

function Configuracion() {

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const [perfil, setPerfil]               = useState({ nombre: "", apellido: "", email: "", telefono: "" });
  const [perfilOriginal, setPerfilOriginal] = useState({});
  const [loadingPerfil, setLoadingPerfil]  = useState(false);

  const [passForm, setPassForm] = useState({
    passwordActual: "", passwordNueva: "", passwordConfirm: ""
  });
  const [mostrarPass, setMostrarPass] = useState({
    actual: false, nueva: false, confirm: false
  });
  const [loadingPass, setLoadingPass] = useState(false);

  const [sistema, setSistema] = useState({
    nombre_institucion: "Gobierno Autónomo Municipal",
    nombre_sistema:     "Sistema de Registro de Equipos de Computación",
    responsable:        "",
    cargo_responsable:  "Jefe de Sistemas TI",
    direccion:          "",
    telefono_inst:      "",
    logo_texto:         "GAM"
  });

  const [tab, setTab] = useState("perfil");
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => { loadPerfil(); loadSistema(); }, []);

  const loadPerfil = async () => {
    try {
      const res = await api.get("/configuracion/perfil");
      setPerfil(res.data);
      setPerfilOriginal(res.data);
    } catch (err) { console.log(err); }
  };

  const loadSistema = () => {
    const saved = localStorage.getItem(SISTEMA_KEY);
    if (saved) { try { setSistema(JSON.parse(saved)); } catch {} }
  };

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 4000);
  };

  const guardarPerfil = async () => {
    if (!perfil.nombre || !perfil.email)
      return showMsg("error", "Nombre y email son obligatorios");
    setLoadingPerfil(true);
    try {
      await api.put("/configuracion/perfil", perfil);
      const userLocal = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({
        ...userLocal, nombre: perfil.nombre,
        apellido: perfil.apellido, email: perfil.email
      }));
      setPerfilOriginal({ ...perfil });
      showMsg("success", "✅ Perfil actualizado correctamente");
    } catch (err) {
      showMsg("error", err.response?.data?.message || "Error al actualizar");
    } finally { setLoadingPerfil(false); }
  };

  const cambiarPassword = async () => {
    if (!passForm.passwordActual)
      return showMsg("error", "Ingresa tu contraseña actual");
    if (passForm.passwordNueva.length < 6)
      return showMsg("error", "La nueva contraseña debe tener al menos 6 caracteres");
    if (passForm.passwordNueva !== passForm.passwordConfirm)
      return showMsg("error", "Las contraseñas no coinciden");
    setLoadingPass(true);
    try {
      await api.put("/configuracion/password", {
        passwordNueva: passForm.passwordNueva
      });
      setPassForm({ passwordActual: "", passwordNueva: "", passwordConfirm: "" });
      showMsg("success", "✅ Contraseña cambiada correctamente");
    } catch (err) {
      showMsg("error", err.response?.data?.message || "Error al cambiar contraseña");
    } finally { setLoadingPass(false); }
  };

  const guardarSistema = () => {
    localStorage.setItem(SISTEMA_KEY, JSON.stringify(sistema));
    showMsg("success", "✅ Configuración del sistema guardada");
  };

  const resetSistema = () => {
    localStorage.removeItem(SISTEMA_KEY);
    setSistema({
      nombre_institucion: "Gobierno Autónomo Municipal",
      nombre_sistema:     "Sistema de Registro de Equipos de Computación",
      responsable:        "", cargo_responsable: "Jefe de Sistemas TI",
      direccion:          "", telefono_inst:     "", logo_texto: "GAM"
    });
    showMsg("success", "Configuración restablecida");
  };

  const perfilCambiado = JSON.stringify(perfil) !== JSON.stringify(perfilOriginal);

  const fPass = (() => {
    const p = passForm.passwordNueva;
    if (!p) return { nivel: 0, texto: "", color: "" };
    if (p.length < 6)  return { nivel: 1, texto: "Muy corta",  color: "var(--danger)" };
    if (p.length < 10) return { nivel: 2, texto: "Regular",    color: "var(--warning)" };
    return { nivel: 3, texto: "Segura", color: "var(--success)" };
  })();

  const tabs = [
    { key: "perfil",   label: "👤 Mi Perfil",          icon: "👤" },
    { key: "password", label: "🔑 Contraseña",          icon: "🔑" },
    { key: "sistema",  label: "⚙️ Config. del Sistema", icon: "⚙️" },
  ];

  return (
    <AdminLayout>

      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
          ⚙️ Configuración
        </h2>
        <p style={{ color: "var(--text-secondary)", margin: "4px 0 0", fontSize: "14px" }}>
          GAM — Ajustes del sistema y perfil del administrador
        </p>
      </div>

      {/* MENSAJE */}
      {msg.text && (
        <div style={{
          background: msg.type === "success" ? "var(--success-bg)" : "var(--danger-bg)",
          border: `1px solid ${msg.type === "success" ? "var(--success)" : "var(--danger)"}`,
          color: msg.type === "success" ? "var(--success)" : "var(--danger)",
          borderRadius: "10px", padding: "12px 16px",
          marginBottom: "1.25rem", fontSize: "14px", fontWeight: 500
        }}>{msg.text}</div>
      )}

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "flex-start" }}>

        {/* SIDEBAR */}
        <div style={{
          background: "var(--bg-surface)", border: "1px solid var(--border)",
          borderRadius: "16px", padding: "0.5rem",
          minWidth: "220px", flexShrink: 0
        }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: "10px",
              padding: "12px 14px", borderRadius: "10px", border: "none",
              background: tab === t.key ? "var(--accent)" : "transparent",
              color: tab === t.key ? "#fff" : "var(--text-secondary)",
              fontWeight: tab === t.key ? 600 : 400, fontSize: "14px",
              cursor: "pointer", fontFamily: "inherit",
              marginBottom: "2px", textAlign: "left"
            }}>
              <span style={{ fontSize: "16px" }}>{t.icon}</span>
              {t.label}
            </button>
          ))}

          <div style={{ marginTop: "12px", padding: "12px", borderTop: "1px solid var(--border)" }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "50%",
              background: "linear-gradient(135deg,#6c63ff,#a78bfa)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "20px", fontWeight: 700, color: "#fff", margin: "0 auto 8px"
            }}>
              {(perfil.nombre || currentUser.nombre || "A").charAt(0).toUpperCase()}
            </div>
            <p style={{ textAlign: "center", margin: 0, color: "var(--text-primary)", fontWeight: 600, fontSize: "14px" }}>
              {perfil.nombre || currentUser.nombre} {perfil.apellido || ""}
            </p>
            <p style={{ textAlign: "center", margin: "2px 0 0", color: "var(--text-muted)", fontSize: "12px" }}>
              {perfil.email || currentUser.email}
            </p>
            <p style={{ textAlign: "center", margin: "6px 0 0" }}>
              <span style={{
                background: "var(--accent-light)", color: "var(--accent-text)",
                border: "1px solid var(--accent)", borderRadius: "6px",
                padding: "2px 10px", fontSize: "11px", fontWeight: 600
              }}>🔑 ADMIN</span>
            </p>
          </div>
        </div>

        {/* CONTENIDO */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* ══ PERFIL ══ */}
          {tab === "perfil" && (
            <div style={{
              background: "var(--bg-surface)", border: "1px solid var(--border)",
              borderRadius: "16px", overflow: "hidden"
            }}>
              <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
                <h5 style={{ fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>
                  👤 Información Personal
                </h5>
                <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: "4px 0 0" }}>
                  Datos del administrador responsable del sistema
                </p>
              </div>
              <div style={{ padding: "1.25rem" }}>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "16px"
                }}>
                  {[
                    { label: "Nombre *",   field: "nombre",   type: "text",  ph: "Nombre" },
                    { label: "Apellido",   field: "apellido", type: "text",  ph: "Apellido" },
                    { label: "Email *",    field: "email",    type: "email", ph: "correo@gam.bo" },
                    { label: "Teléfono",   field: "telefono", type: "text",  ph: "70000000" },
                  ].map(f => (
                    <div key={f.field}>
                      <label style={lbl}>{f.label}</label>
                      <input type={f.type} style={inp} placeholder={f.ph}
                        value={perfil[f.field] || ""}
                        onChange={e => setPerfil({ ...perfil, [f.field]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>

                {perfilCambiado && (
                  <div style={{
                    background: "var(--warning-bg)", border: "1px solid var(--warning)",
                    borderRadius: "8px", padding: "8px 14px", marginTop: "14px",
                    fontSize: "12px", color: "var(--warning)"
                  }}>⚠️ Tienes cambios sin guardar</div>
                )}

                <div style={{ display: "flex", gap: "10px", marginTop: "1.25rem", justifyContent: "flex-end" }}>
                  <button onClick={() => setPerfil({ ...perfilOriginal })} style={btnG()}>
                    Descartar
                  </button>
                  <button onClick={guardarPerfil}
                    disabled={loadingPerfil || !perfilCambiado}
                    style={{
                      ...btnP,
                      opacity: (!perfilCambiado || loadingPerfil) ? 0.5 : 1,
                      cursor: (!perfilCambiado || loadingPerfil) ? "not-allowed" : "pointer"
                    }}>
                    {loadingPerfil ? "Guardando..." : "✅ Guardar Perfil"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══ CONTRASEÑA ══ */}
          {tab === "password" && (
            <div style={{
              background: "var(--bg-surface)", border: "1px solid var(--border)",
              borderRadius: "16px", overflow: "hidden"
            }}>
              <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
                <h5 style={{ fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>
                  🔑 Cambiar Contraseña
                </h5>
                <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: "4px 0 0" }}>
                  Actualiza tu contraseña de acceso al panel administrativo
                </p>
              </div>
              <div style={{ padding: "1.25rem", maxWidth: "460px" }}>

                {[
                  { label: "Contraseña actual *", field: "passwordActual", key: "actual",  ph: "Tu contraseña actual" },
                  { label: "Nueva contraseña *",  field: "passwordNueva",  key: "nueva",   ph: "Mínimo 6 caracteres" },
                  { label: "Confirmar nueva *",   field: "passwordConfirm",key: "confirm", ph: "Repite la nueva contraseña" },
                ].map((f, i) => (
                  <div key={f.field} style={{ marginBottom: "16px" }}>
                    <label style={lbl}>{f.label}</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={mostrarPass[f.key] ? "text" : "password"}
                        style={{
                          ...inp, paddingRight: "48px",
                          borderColor:
                            f.field === "passwordConfirm" &&
                            passForm.passwordConfirm &&
                            passForm.passwordNueva !== passForm.passwordConfirm
                              ? "var(--danger)" : "var(--border)"
                        }}
                        placeholder={f.ph}
                        value={passForm[f.field]}
                        onChange={e => setPassForm({ ...passForm, [f.field]: e.target.value })}
                      />
                      <button type="button"
                        onClick={() => setMostrarPass(p => ({ ...p, [f.key]: !p[f.key] }))}
                        style={{
                          position: "absolute", right: "12px", top: "50%",
                          transform: "translateY(-50%)",
                          background: "none", border: "none",
                          color: "var(--text-muted)", cursor: "pointer", fontSize: "16px"
                        }}>{mostrarPass[f.key] ? "🙈" : "👁"}</button>
                    </div>

                    {/* Barra fortaleza */}
                    {f.field === "passwordNueva" && passForm.passwordNueva && (
                      <div style={{ marginTop: "8px" }}>
                        <div style={{ height: "4px", borderRadius: "2px", background: "var(--border)", overflow: "hidden" }}>
                          <div style={{
                            height: "100%", borderRadius: "2px",
                            width: fPass.nivel === 1 ? "33%" : fPass.nivel === 2 ? "66%" : "100%",
                            background: fPass.color, transition: "all 0.3s"
                          }} />
                        </div>
                        <p style={{ fontSize: "11px", margin: "4px 0 0", color: fPass.color }}>
                          {fPass.nivel === 1 ? "⚠️" : fPass.nivel === 2 ? "🟡" : "✅"} Contraseña {fPass.texto}
                        </p>
                      </div>
                    )}

                    {/* Coincidencia */}
                    {f.field === "passwordConfirm" && passForm.passwordConfirm && (
                      <p style={{
                        fontSize: "11px", margin: "4px 0 0",
                        color: passForm.passwordNueva === passForm.passwordConfirm
                          ? "var(--success)" : "var(--danger)"
                      }}>
                        {passForm.passwordNueva === passForm.passwordConfirm
                          ? "✅ Las contraseñas coinciden"
                          : "❌ Las contraseñas no coinciden"}
                      </p>
                    )}
                  </div>
                ))}

                <button onClick={cambiarPassword}
                  disabled={
                    loadingPass || !passForm.passwordActual ||
                    passForm.passwordNueva.length < 6 ||
                    passForm.passwordNueva !== passForm.passwordConfirm
                  }
                  style={{
                    ...btnP,
                    opacity: (
                      loadingPass || !passForm.passwordActual ||
                      passForm.passwordNueva.length < 6 ||
                      passForm.passwordNueva !== passForm.passwordConfirm
                    ) ? 0.5 : 1,
                    cursor: (
                      loadingPass || !passForm.passwordActual ||
                      passForm.passwordNueva.length < 6 ||
                      passForm.passwordNueva !== passForm.passwordConfirm
                    ) ? "not-allowed" : "pointer"
                  }}>
                  {loadingPass ? "Cambiando..." : "🔑 Cambiar Contraseña"}
                </button>
              </div>
            </div>
          )}

          {/* ══ SISTEMA ══ */}
          {tab === "sistema" && (
            <div style={{
              background: "var(--bg-surface)", border: "1px solid var(--border)",
              borderRadius: "16px", overflow: "hidden"
            }}>
              <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
                <h5 style={{ fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>
                  ⚙️ Configuración del Sistema
                </h5>
                <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: "4px 0 0" }}>
                  Datos institucionales que aparecen en los encabezados de los PDFs
                </p>
              </div>
              <div style={{ padding: "1.25rem" }}>

                {/* Preview */}
                <div style={{
                  background: "linear-gradient(135deg, #6c63ff, #a78bfa)",
                  borderRadius: "12px", padding: "1.25rem",
                  marginBottom: "1.5rem", display: "flex",
                  alignItems: "center", gap: "16px"
                }}>
                  <div style={{
                    width: "56px", height: "56px", borderRadius: "12px",
                    background: "rgba(255,255,255,0.2)", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "18px", fontWeight: 700, color: "#fff"
                  }}>
                    {sistema.logo_texto || "GAM"}
                  </div>
                  <div>
                    <p style={{ color: "#fff", fontWeight: 700, fontSize: "15px", margin: 0 }}>
                      {sistema.nombre_institucion}
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px", margin: "2px 0 0" }}>
                      {sistema.nombre_sistema}
                    </p>
                    {sistema.responsable && (
                      <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "11px", margin: "2px 0 0" }}>
                        Resp: {sistema.responsable} — {sistema.cargo_responsable}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "16px", marginBottom: "1.25rem"
                }}>
                  {[
                    { label: "Nombre de la institución", field: "nombre_institucion", ph: "Gobierno Autónomo Municipal" },
                    { label: "Nombre del sistema",       field: "nombre_sistema",     ph: "Sistema de Registro..." },
                    { label: "Nombre del responsable TI",field: "responsable",        ph: "Ing. Juan Pérez" },
                    { label: "Cargo del responsable",    field: "cargo_responsable",  ph: "Jefe de Sistemas TI" },
                    { label: "Dirección institucional",  field: "direccion",          ph: "Av. Principal s/n" },
                    { label: "Teléfono institucional",   field: "telefono_inst",      ph: "(04) 123-4567" },
                    { label: "Siglas / Logo texto",      field: "logo_texto",         ph: "GAM", max: 5 },
                  ].map(f => (
                    <div key={f.field}>
                      <label style={lbl}>{f.label}</label>
                      <input style={inp} placeholder={f.ph}
                        maxLength={f.max || 255}
                        value={sistema[f.field] || ""}
                        onChange={e => setSistema({ ...sistema, [f.field]: e.target.value })}
                      />
                      {f.max && (
                        <p style={{ color: "var(--text-muted)", fontSize: "11px", margin: "4px 0 0" }}>
                          Máximo {f.max} caracteres — aparece en el logo del sistema
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{
                  background: "var(--accent-light)", border: "1px solid var(--accent)",
                  borderRadius: "8px", padding: "10px 14px",
                  fontSize: "12px", color: "var(--accent-text)", marginBottom: "1.25rem"
                }}>
                  ℹ️ Esta configuración se guarda en este navegador. Se usa en los encabezados de todos los PDFs del sistema.
                </div>

                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button onClick={resetSistema} style={btnG("var(--danger)")}>
                    🔄 Restablecer
                  </button>
                  <button onClick={guardarSistema} style={btnP}>
                    ✅ Guardar Configuración
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

    </AdminLayout>
  );
}

export default Configuracion;