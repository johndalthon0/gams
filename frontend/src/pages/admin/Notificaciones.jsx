import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { FiBell, FiCheck, FiRefreshCw, FiSend, FiInbox, FiUsers } from "react-icons/fi";
import AdminLayout from "../../components/layout/AdminLayout";
import api from "../../services/api";
import { getTipo, fmtRelativo } from "../../utils/notificaciones";
import { useIsNarrow } from "../../hooks/useIsNarrow";

const card = {
  background: "var(--bg-surface)",
  border: "1px solid var(--border)",
  borderRadius: "16px",
};

// ── Tarjeta notificación ──────────────────────────────────────
function TarjetaNotif({ notif, onLeer }) {
  const cfg = getTipo(notif.tipo);

  return (
    <div
      onClick={() => !notif.leida && onLeer(notif.id)}
      style={{
        display: "flex", gap: "14px", padding: "14px 16px", borderRadius: "14px",
        border: `1px solid ${notif.leida ? "var(--border)" : cfg.color}`,
        background: notif.leida ? "var(--bg-surface)" : cfg.bg,
        cursor: notif.leida ? "default" : "pointer",
        transition: "all 0.2s", position: "relative", marginBottom: "10px",
      }}
    >
      {!notif.leida && (
        <div style={{
          position: "absolute", top: "12px", right: "12px",
          width: "10px", height: "10px", borderRadius: "50%",
          background: cfg.color, boxShadow: `0 0 6px ${cfg.color}`,
        }} />
      )}
      <div style={{
        width: "44px", height: "44px", borderRadius: "12px", background: cfg.bg,
        border: `1px solid ${cfg.color}`, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: "20px", flexShrink: 0,
      }}>
        {cfg.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "4px", marginBottom: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <p style={{ margin: 0, color: "var(--text-primary)", fontWeight: notif.leida ? 500 : 700, fontSize: "14px" }}>
              {notif.titulo}
            </p>
            <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}`, borderRadius: "6px", padding: "1px 8px", fontSize: "10px", fontWeight: 600 }}>
              {cfg.label}
            </span>
          </div>
          <span style={{ color: "var(--text-muted)", fontSize: "11px", whiteSpace: "nowrap" }}>
            {fmtRelativo(notif.fecha)}
          </span>
        </div>
        <p style={{ margin: 0, color: notif.leida ? "var(--text-secondary)" : "var(--text-primary)", fontSize: "13px", lineHeight: 1.5 }}>
          {notif.mensaje}
        </p>
        {!notif.leida && (
          <p style={{ margin: "6px 0 0", color: cfg.color, fontSize: "11px", fontWeight: 600 }}>
            Toca para marcar como leída
          </p>
        )}
      </div>
    </div>
  );
}

// ── Tab: Bandeja ────────────────────────────────────────────────
function Bandeja() {
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro,  setFiltro]  = useState("TODAS");
  const [msg,     setMsg]     = useState("");

  const showMsg = (text) => { setMsg(text); setTimeout(() => setMsg(""), 4000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/mantenimientos/notificaciones");
      setNotifs(Array.isArray(res.data) ? res.data : []);
    } catch {
      showMsg("Error al cargar notificaciones");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const leer = async (id) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, leida: 1 } : n));
    try { await api.put(`/mantenimientos/notificaciones/${id}/leer`); } catch {}
  };

  const leerTodas = async () => {
    setNotifs(prev => prev.map(n => ({ ...n, leida: 1 })));
    try {
      await api.put("/mantenimientos/notificaciones/leer-todas");
      showMsg("✅ Todas marcadas como leídas");
    } catch { showMsg("Error al marcar"); }
  };

  const narrow = useIsNarrow();

  const FILTROS = [
    { k: "TODAS",     l: "Todas" },
    { k: "NO_LEIDAS", l: "No leídas" },
    { k: "SOLICITUD", l: "Solicitudes" },
    { k: "IA_RIESGO", l: "IA" },
    { k: "ALERTA",    l: "Alertas" },
  ];

  const filtradas = notifs.filter(n => {
    if (filtro === "TODAS")     return true;
    if (filtro === "NO_LEIDAS") return !n.leida;
    return n.tipo === filtro;
  });

  const noLeidas = notifs.filter(n => !n.leida).length;

  const stats = [
    { label: "Total",     value: notifs.length,           color: "var(--accent-text)",              icon: "🔔" },
    { label: "No leídas", value: noLeidas,                 color: noLeidas > 0 ? "#ef4444" : "#22c55e", icon: "📬" },
    { label: "Leídas",    value: notifs.length - noLeidas, color: "#22c55e",                          icon: "✅" },
    { label: "Este mes",  value: notifs.filter(n => { const d = new Date(n.fecha); const hoy = new Date(); return d.getMonth() === hoy.getMonth() && d.getFullYear() === hoy.getFullYear(); }).length, color: "var(--accent-text)", icon: "📅" },
  ];

  return (
    <div>
      {msg && (
        <div style={{ background: "var(--success-bg)", border: "1px solid var(--success)", color: "var(--success)", borderRadius: "10px", padding: "10px 16px", marginBottom: "1.25rem", fontSize: "13px", fontWeight: 500 }}>
          {msg}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: "12px", marginBottom: "1.5rem" }}>
        {stats.map((s, i) => (
          <div key={i} style={{ ...card, padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ color: "var(--text-secondary)", fontSize: "11px", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</p>
              <p style={{ color: s.color, fontSize: "22px", fontWeight: 700, margin: 0 }}>{s.value}</p>
            </div>
            <span style={{ fontSize: "20px" }}>{s.icon}</span>
          </div>
        ))}
      </div>

      <div style={{
        display: "flex", gap: "10px", alignItems: "center", marginBottom: "1.25rem",
        flexWrap: "wrap", flexDirection: narrow ? "column" : "row",
      }}>
        {narrow ? (
          <select
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            style={{
              width: "100%", background: "var(--bg-surface)", border: "1px solid var(--border)",
              borderRadius: "10px", padding: "10px 12px", color: "var(--text-primary)",
              fontSize: "13px", fontWeight: 600, fontFamily: "inherit",
            }}
          >
            {FILTROS.map(f => (
              <option key={f.k} value={f.k}>
                {f.l}{f.k === "NO_LEIDAS" && noLeidas > 0 ? ` (${noLeidas})` : ""}
              </option>
            ))}
          </select>
        ) : (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {FILTROS.map(f => (
              <button key={f.k} onClick={() => setFiltro(f.k)} style={{ padding: "7px 14px", borderRadius: "8px", border: filtro === f.k ? "none" : "1px solid var(--border)", background: filtro === f.k ? "var(--accent)" : "var(--bg-surface)", color: filtro === f.k ? "#fff" : "var(--text-secondary)", fontWeight: 600, fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}>
                {f.l}
                {f.k === "NO_LEIDAS" && noLeidas > 0 && (
                  <span style={{ marginLeft: "6px", background: filtro === f.k ? "rgba(255,255,255,0.25)" : "#ef4444", color: "#fff", borderRadius: "999px", padding: "1px 6px", fontSize: "10px" }}>
                    {noLeidas}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: "8px", width: narrow ? "100%" : "auto", marginLeft: narrow ? 0 : "auto" }}>
          <button onClick={load} title="Actualizar" style={{ ...iconBtn(), ...(narrow ? { flex: "0 0 auto" } : {}) }}>
            <FiRefreshCw size={14} />
          </button>
          {noLeidas > 0 && (
            <button onClick={leerTodas} style={{ ...iconBtn(), display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "8px 14px", flex: narrow ? 1 : "0 0 auto" }}>
              <FiCheck size={14} /> Marcar todas leídas
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-secondary)" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔔</div>
          <p>Cargando notificaciones...</p>
        </div>
      ) : filtradas.length === 0 ? (
        <div style={{ ...card, padding: "4rem", textAlign: "center", color: "var(--text-secondary)" }}>
          <div style={{ fontSize: "56px", marginBottom: "14px" }}>📭</div>
          <h3 style={{ color: "var(--text-primary)", marginBottom: "8px" }}>
            {filtro === "NO_LEIDAS" ? "Todo al día 🎉" : "Sin notificaciones"}
          </h3>
          <p style={{ margin: 0, fontSize: "14px" }}>
            {filtro === "NO_LEIDAS" ? "No tienes notificaciones pendientes de leer" : "No hay notificaciones en esta categoría"}
          </p>
        </div>
      ) : (
        <div>
          {filtradas.map(n => <TarjetaNotif key={n.id} notif={n} onLeer={leer} />)}
        </div>
      )}
    </div>
  );
}

// ── Tab: Enviar aviso (admin) ──────────────────────────────────
const DESTINOS = [
  { v: "TODOS",    l: "Todo el personal",     icon: "🌐" },
  { v: "PERSONAL", l: "Solo personal",        icon: "👤" },
  { v: "EMPLEADO", l: "Solo técnicos",        icon: "🛠️" },
  { v: "ADMIN",    l: "Solo administradores", icon: "🔑" },
];

function EnviarAviso() {
  const [titulo, setTitulo] = useState("");
  const [cuerpo, setCuerpo] = useState("");
  const [destino, setDestino] = useState("TODOS");
  const [envio, setEnvio] = useState({ estado: "", texto: "" });
  const [busy, setBusy] = useState(false);

  const inp = {
    width: "100%", background: "var(--bg-surface2)", border: "1px solid var(--border)",
    borderRadius: "10px", padding: "10px 14px", color: "var(--text-primary)", fontSize: "14px",
    outline: "none", fontFamily: "inherit", boxSizing: "border-box",
  };

  const enviar = async () => {
    if (!titulo.trim() || !cuerpo.trim()) {
      setEnvio({ estado: "error", texto: "Completa título y mensaje" });
      return;
    }
    setBusy(true);
    setEnvio({ estado: "", texto: "" });
    try {
      const r = await api.post("/push/broadcast", { titulo, cuerpo, destino, url: "/personal/notificaciones" });
      setEnvio({ estado: "ok", texto: r.data.message || "Aviso enviado correctamente" });
      setTitulo(""); setCuerpo("");
    } catch (e) {
      setEnvio({ estado: "error", texto: e.response?.data?.message || "Error al enviar" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", alignItems: "start" }}>
      <div style={{ ...card, padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.25rem" }}>
          <span style={{
            width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0,
            background: "var(--accent-light)", border: "1px solid var(--accent)",
            display: "grid", placeItems: "center", color: "var(--accent-text)",
          }}>
            <FiSend size={16} />
          </span>
          <div>
            <h3 style={{ margin: 0, fontSize: "15px", color: "var(--text-primary)" }}>Nuevo aviso</h3>
            <p style={{ margin: "1px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
              Se guarda como notificación y se envía por push a quien lo tenga activo
            </p>
          </div>
        </div>

        <label style={lbl}>Título *</label>
        <input style={{ ...inp, marginBottom: "14px" }} placeholder="Ej: Corte de energía programado"
          value={titulo} onChange={e => setTitulo(e.target.value)} maxLength={80} />

        <label style={lbl}>Mensaje *</label>
        <textarea rows={4} style={{ ...inp, resize: "vertical", marginBottom: "14px" }}
          placeholder="Escribe el contenido del aviso..."
          value={cuerpo} onChange={e => setCuerpo(e.target.value)} maxLength={300} />
        <p style={{ margin: "-10px 0 14px", fontSize: "11px", color: "var(--text-muted)", textAlign: "right" }}>
          {cuerpo.length}/300
        </p>

        <label style={lbl}>Destinatarios</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "8px", marginBottom: "1.25rem" }}>
          {DESTINOS.map(d => (
            <button key={d.v} onClick={() => setDestino(d.v)} style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "10px 12px", borderRadius: "10px", cursor: "pointer", fontFamily: "inherit",
              border: `1px solid ${destino === d.v ? "var(--accent)" : "var(--border)"}`,
              background: destino === d.v ? "var(--accent-light)" : "var(--bg-surface2)",
              color: destino === d.v ? "var(--accent-text)" : "var(--text-secondary)",
              fontWeight: destino === d.v ? 600 : 500, fontSize: "13px",
            }}>
              <span>{d.icon}</span> {d.l}
            </button>
          ))}
        </div>

        <button onClick={enviar} disabled={busy} style={{
          width: "100%", background: "var(--accent)", color: "#fff", border: "none",
          borderRadius: "10px", padding: "12px", fontSize: "14px", fontWeight: 700,
          cursor: busy ? "default" : "pointer", fontFamily: "inherit", opacity: busy ? 0.7 : 1,
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
        }}>
          <FiSend size={15} /> {busy ? "Enviando…" : "Enviar aviso"}
        </button>

        {envio.texto && (
          <p style={{
            margin: "12px 0 0", fontSize: "13px", fontWeight: 600, textAlign: "center",
            color: envio.estado === "ok" ? "#22c55e" : "#ef4444",
          }}>
            {envio.estado === "ok" ? "✅ " : "⚠️ "}{envio.texto}
          </p>
        )}
      </div>

      {/* Vista previa */}
      <div style={{ ...card, padding: "1.5rem" }}>
        <p style={{ margin: "0 0 12px", fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Vista previa
        </p>
        <div style={{
          display: "flex", gap: "12px", padding: "14px", borderRadius: "14px",
          border: "1px solid var(--accent)", background: "var(--accent-light)",
        }}>
          <span style={{
            width: "40px", height: "40px", borderRadius: "50%", flexShrink: 0,
            background: "var(--bg-surface)", border: "1px solid var(--accent)",
            display: "grid", placeItems: "center", fontSize: "18px",
          }}>📣</span>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
              {titulo.trim() || "Título del aviso"}
            </p>
            <p style={{ margin: "3px 0 0", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              {cuerpo.trim() || "Aquí se verá el mensaje que escribas..."}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "14px", color: "var(--text-muted)", fontSize: "12px" }}>
          <FiUsers size={14} />
          Llega a: <strong style={{ color: "var(--text-secondary)" }}>{DESTINOS.find(d => d.v === destino)?.l}</strong>
        </div>
      </div>
    </div>
  );
}

const lbl = { display: "block", color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600, marginBottom: "6px" };

const iconBtn = () => ({
  background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-secondary)",
  borderRadius: "8px", padding: "8px", cursor: "pointer", display: "flex", alignItems: "center", fontFamily: "inherit",
});

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────
export default function Notificaciones() {
  const [params, setParams] = useSearchParams();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const esAdmin = user.rol === "ADMIN";
  const tab = params.get("tab") === "enviar" && esAdmin ? "enviar" : "bandeja";

  const irA = (t) => setParams(t === "bandeja" ? {} : { tab: t });

  return (
    <AdminLayout>
      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: 0 }}>Panel Admin</p>
        <h1 style={{ fontSize: "24px", fontWeight: 700, margin: "4px 0 0", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "10px" }}>
          <FiBell size={22} /> Notificaciones
        </h1>
      </div>

      <div style={{ display: "flex", gap: "6px", marginBottom: "1.5rem", borderBottom: "1px solid var(--border)" }}>
        <button onClick={() => irA("bandeja")} style={tabStyle(tab === "bandeja")}>
          <FiInbox size={15} /> Bandeja
        </button>
        {esAdmin && (
          <button onClick={() => irA("enviar")} style={tabStyle(tab === "enviar")}>
            <FiSend size={15} /> Enviar aviso
          </button>
        )}
      </div>

      {tab === "bandeja" ? <Bandeja /> : <EnviarAviso />}
    </AdminLayout>
  );
}

const tabStyle = (active) => ({
  display: "flex", alignItems: "center", gap: "8px",
  padding: "10px 18px", marginBottom: "-1px",
  background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
  fontSize: "14px", fontWeight: 600,
  color: active ? "var(--accent-text)" : "var(--text-secondary)",
  borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent",
});
