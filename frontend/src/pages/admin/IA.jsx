import { useEffect, useState, useCallback } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import api from "../../services/api";
import { useDialog } from "../../context/DialogContext";

// ─────────────────────────────────────────────
// ESTILOS BASE
// ─────────────────────────────────────────────
const S = {
  surface: {
    background: "var(--bg-surface)",
    border: "1px solid var(--border)",
    borderRadius: "16px",
    overflow: "hidden",
  },
  inp: {
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
  btn: {
    borderRadius: "8px",
    padding: "8px 16px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    border: "none",
  },
};

// ─────────────────────────────────────────────
// UTILIDADES
// ─────────────────────────────────────────────
const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("es-BO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
const fmtFull = (d) => {
  if (!d) return "—";
  const value = new Date(d);
  if (Number.isNaN(value.getTime())) return "—";
  return value.toLocaleString("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
const fmtBs = (n) => `Bs ${Number(n || 0).toFixed(2)}`;
const fmtPct = (n) => `${Number(n || 0).toFixed(1)}%`;

const COLOR_NIVEL = {
  CRÍTICO: { color: "#ef4444", bg: "#fef2f2", border: "#ef4444" },
  ALTO: { color: "#f59e0b", bg: "#fffbeb", border: "#f59e0b" },
  MEDIO: { color: "#3b82f6", bg: "#eff6ff", border: "#3b82f6" },
  BAJO: { color: "#22c55e", bg: "#f0fdf4", border: "#22c55e" },
};
const crNivel = (n) =>
  COLOR_NIVEL[n] || {
    color: "var(--text-muted)",
    bg: "var(--bg-surface2)",
    border: "var(--border)",
  };

const ICONO_TIPO = {
  IA_RIESGO: "⚠️",
  ASIGNACION: "🔧",
  MANT_FINALIZADO: "✅",
  SOLICITUD_MANT: "🛠️",
  ORDEN_TRABAJO: "📋",
  RESP_PERSONAL: "💬",
};

// ─────────────────────────────────────────────
// COMPONENTES PEQUEÑOS
// ─────────────────────────────────────────────
function Pill({ nivel }) {
  const cr = crNivel(nivel);
  return (
    <span
      style={{
        background: cr.bg,
        color: cr.color,
        border: `1px solid ${cr.border}`,
        borderRadius: "6px",
        padding: "2px 10px",
        fontSize: "11px",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {nivel}
    </span>
  );
}

function Barra({ valor }) {
  const v = Number(valor) || 0;
  const c = v >= 70 ? "#ef4444" : v >= 40 ? "#f59e0b" : "#22c55e";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div
        style={{
          flex: 1,
          height: "6px",
          background: "var(--border)",
          borderRadius: "3px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.min(v, 100)}%`,
            height: "100%",
            background: c,
            borderRadius: "3px",
            transition: "width 0.5s",
          }}
        />
      </div>
      <span
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: c,
          minWidth: "42px",
        }}
      >
        {fmtPct(v)}
      </span>
    </div>
  );
}

function StatCard({ label, value, color, icon }) {
  const hex = color && color.startsWith("#") ? color : null;
  const active = hex && Number(value) > 0;
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(160deg, var(--bg-surface), var(--bg-surface2))",
        border: `1px solid ${active ? hex + "40" : "var(--border)"}`,
        borderRadius: "14px",
        padding: "1rem 1.1rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: active
          ? `0 0 16px -10px ${hex}, inset 0 1px 0 rgba(255,255,255,0.03)`
          : "inset 0 1px 0 rgba(255,255,255,0.03)",
        transition: "box-shadow .2s, border-color .2s",
      }}
    >
      <span
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "3px",
          background: hex || "var(--accent)",
          opacity: active ? 0.75 : 0.25,
        }}
      />
      <div>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "11px",
            margin: "0 0 4px",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {label}
        </p>
        <p
          style={{
            color: color || "var(--text-primary)",
            fontSize: "22px",
            fontWeight: 700,
            margin: 0,
          }}
        >
          {value}
        </p>
      </div>
      <span
        style={{
          width: "38px",
          height: "38px",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: active ? `${hex}1f` : "var(--bg-surface2)",
          border: `1px solid ${active ? hex + "55" : "var(--border)"}`,
          color: hex || "var(--text-secondary)",
          fontSize: "18px",
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
    </div>
  );
}

function FlowStep({ number, title, subtitle }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: "170px",
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "14px 16px",
        display: "flex",
        gap: "12px",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "28px",
          height: "28px",
          borderRadius: "8px",
          background: "var(--accent-light)",
          color: "var(--accent-text)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: "12px",
        }}
      >
        {number}
      </div>
      <div>
        <div
          style={{
            color: "var(--text-primary)",
            fontWeight: 700,
            fontSize: "13px",
          }}
        >
          {title}
        </div>
        <div style={{ color: "var(--text-secondary)", fontSize: "11px" }}>
          {subtitle}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, right }) {
  return (
    <div
      style={{
        padding: "1rem 1.25rem",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <h5 style={{ fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>
        {title}
      </h5>
      {right && <div>{right}</div>}
    </div>
  );
}

function EmptyState({ icon, title, desc }) {
  return (
    <div
      style={{
        padding: "4rem",
        textAlign: "center",
        color: "var(--text-secondary)",
      }}
    >
      <div style={{ fontSize: "48px", marginBottom: "12px" }}>{icon}</div>
      <h3 style={{ color: "var(--text-primary)", marginBottom: "8px" }}>
        {title}
      </h3>
      {desc && <p style={{ margin: 0 }}>{desc}</p>}
    </div>
  );
}

function Overlay({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function ModalShell({
  width = "640px",
  onClose,
  headerBg,
  headerContent,
  children,
}) {
  return (
    <Overlay onClose={onClose}>
      <div className="app-modal-shell"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          width,
          maxWidth: "95vw",
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="app-modal-header"
          style={{
            background: headerBg || "var(--accent)",
            padding: "1rem 1.25rem",
          }}
        >
          {headerContent}
        </div>
        <div style={{ padding: "1.25rem", overflowY: "auto", flex: 1 }}>
          {children}
        </div>
      </div>
    </Overlay>
  );
}

function ConfirmarEntrenamiento({ onClose, onConfirm, busy }) {
  return (
    <Overlay onClose={busy ? undefined : onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmar-entrenamiento-titulo"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          width: "440px",
          maxWidth: "95vw",
          padding: "1.5rem",
          boxShadow: "0 24px 70px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
          <span
            aria-hidden="true"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              display: "grid",
              placeItems: "center",
              background: "var(--accent-light)",
              color: "var(--accent-text)",
              fontSize: "20px",
              flexShrink: 0,
            }}
          >
            IA
          </span>
          <div>
            <h3
              id="confirmar-entrenamiento-titulo"
              style={{ margin: 0, color: "var(--text-primary)", fontSize: "18px" }}
            >
              Reentrenar modelos IA
            </h3>
            <p style={{ margin: "8px 0 0", color: "var(--text-secondary)", fontSize: "13px", lineHeight: 1.5 }}>
              Se utilizarán los datos actuales de mantenimiento para generar una nueva versión del modelo.
            </p>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "1.5rem" }}>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            style={{ ...S.btn, background: "var(--bg-surface2)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            style={{ ...S.btn, background: "var(--accent)", color: "#fff", opacity: busy ? 0.7 : 1 }}
          >
            {busy ? "Entrenando..." : "Reentrenar"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ─────────────────────────────────────────────
// MODAL: ANÁLISIS IA
// ─────────────────────────────────────────────
function ModalAnalisis({ equipo, onClose }) {
  const cr = crNivel(equipo.nivel_riesgo);
  return (
    <ModalShell
      onClose={onClose}
      headerBg="var(--bg-surface)"
      headerContent={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div className="ia-modal-heading"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "4px",
              }}
            >
              <span className="ia-modal-icon" style={{ fontSize: "20px" }}>⌕</span>
              <h4
                style={{
                  margin: 0,
                  color: "var(--text-primary)",
                  fontWeight: 700,
                }}
              >
                Análisis IA — {equipo.equipo_codigo}
              </h4>
              <Pill nivel={equipo.nivel_riesgo} />
            </div>
            <p
              style={{
                margin: 0,
                color: "var(--text-secondary)",
                fontSize: "13px",
              }}
            >
              {equipo.equipo_nombre} · {fmtPct(equipo.probabilidad_falla)} prob.
              · {equipo.dias_estimados}d estimados
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              ...S.btn,
              background: "var(--bg-surface2)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              width: "40px",
              height: "40px",
              padding: 0,
              fontSize: "18px",
            }}
          >
            ✖
          </button>
        </div>
      }
    >
      {/* Barra probabilidad */}
      <div
        style={{
          background: "var(--bg-surface2)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "1.25rem",
          marginBottom: "1.25rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "8px",
          }}
        >
          <span
            style={{
              color: "var(--text-secondary)",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            Probabilidad de falla
          </span>
          <span style={{ color: cr.color, fontWeight: 700, fontSize: "22px" }}>
            {fmtPct(equipo.probabilidad_falla)}
          </span>
        </div>
        <div
          style={{
            height: "12px",
            background: "var(--border)",
            borderRadius: "6px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${equipo.probabilidad_falla}%`,
              height: "100%",
              background: cr.color,
              borderRadius: "6px",
              transition: "width 1s",
            }}
          />
        </div>
        {equipo.anomalia_detectada && (
          <div
            style={{
              marginTop: "10px",
              padding: "8px 12px",
              background: "var(--danger-bg)",
              border: "1px solid var(--danger)",
              borderRadius: "8px",
              color: "var(--danger)",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            ⚠️ Isolation Forest detectó comportamiento anómalo en este equipo
          </div>
        )}
      </div>

      {/* Factores SHAP */}
      {equipo.explicacion?.factores?.length > 0 && (
        <div style={{ marginBottom: "1.25rem" }}>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "12px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              margin: "0 0 10px",
            }}
          >
            Factores analizados
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {equipo.explicacion.factores.map((f, i) => {
              const ic =
                f.impacto === "alto"
                  ? "#ef4444"
                  : f.impacto === "medio"
                    ? "#f59e0b"
                    : "#22c55e";
              const ib =
                f.impacto === "alto"
                  ? "rgba(239,68,68,0.14)"
                  : f.impacto === "medio"
                    ? "rgba(245,158,11,0.14)"
                    : "rgba(34,197,94,0.14)";
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 14px",
                    background: "var(--bg-surface2)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    borderLeft: `3px solid ${ic}`,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        margin: 0,
                        color: "var(--text-secondary)",
                        fontSize: "12px",
                      }}
                    >
                      {f.label}
                    </p>
                    <p
                      style={{
                        margin: "2px 0 0",
                        color: "var(--text-primary)",
                        fontWeight: 600,
                        fontSize: "14px",
                      }}
                    >
                      {f.valor}
                    </p>
                  </div>
                  <span
                    style={{
                      background: ib,
                      color: ic,
                      border: `1px solid ${ic}`,
                      borderRadius: "6px",
                      padding: "2px 10px",
                      fontSize: "11px",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {f.impacto === "alto"
                      ? "🔴 Alto"
                      : f.impacto === "medio"
                        ? "🟡 Medio"
                        : "🟢 Bajo"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Conclusión */}
      {equipo.explicacion?.conclusion && (
        <div
          style={{
            background: "var(--bg-surface2)",
            border: `1px solid ${cr.border}`,
            borderLeft: `4px solid ${cr.border}`,
            borderRadius: "12px",
            padding: "1rem 1.25rem",
          }}
        >
          <p
            style={{
              color: "var(--text-primary)",
              fontSize: "12px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              margin: "0 0 8px",
            }}
          >
            Conclusión del modelo
          </p>
          <p
            style={{
              color: "var(--text-primary)",
              fontSize: "14px",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {equipo.explicacion.conclusion}
          </p>
        </div>
      )}
    </ModalShell>
  );
}

// ─────────────────────────────────────────────
// MODAL: GESTIÓN DE ORDEN (técnico)
// ─────────────────────────────────────────────
function FormFinalizar({ ordenId, onDone }) {
  const { avisar } = useDialog();
  const [obs, setObs] = useState("");
  const [costo, setCosto] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await api.put("/ia/ordenes/trabajo/accion", {
        orden_id: ordenId,
        accion: "FINALIZAR",
        observaciones: obs,
        costo_final: parseFloat(costo) || 0,
      });
      onDone();
    } catch (e) {
      await avisar(e.response?.data?.message || "No se pudo finalizar la orden.", "Error al finalizar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        background: "var(--bg-surface2)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "1rem",
        marginTop: "1rem",
      }}
    >
      <p
        style={{
          color: "var(--text-secondary)",
          fontSize: "12px",
          fontWeight: 600,
          textTransform: "uppercase",
          margin: "0 0 10px",
        }}
      >
        ✅ Registrar finalización
      </p>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <div style={{ flex: 2, minWidth: "180px" }}>
          <label
            style={{
              display: "block",
              fontSize: "11px",
              color: "var(--text-secondary)",
              marginBottom: "4px",
            }}
          >
            Trabajo realizado
          </label>
          <input
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            placeholder="Describe la solución..."
            style={{ ...S.inp, width: "100%" }}
          />
        </div>
        <div style={{ minWidth: "120px" }}>
          <label
            style={{
              display: "block",
              fontSize: "11px",
              color: "var(--text-secondary)",
              marginBottom: "4px",
            }}
          >
            Costo final (Bs)
          </label>
          <input
            type="number"
            value={costo}
            onChange={(e) => setCosto(e.target.value)}
            placeholder="0.00"
            style={{ ...S.inp, width: "100%" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button
            onClick={submit}
            disabled={busy}
            style={{
              ...S.btn,
              background: "var(--success-bg)",
              border: "1px solid var(--success)",
              color: "var(--success)",
              opacity: busy ? 0.6 : 1,
            }}
          >
            {busy ? "Guardando..." : "✅ Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FormRepuesto({ ordenId, repuestos, onDone }) {
  const { avisar } = useDialog();
  const [repId, setRepId] = useState("");
  const [cant, setCant] = useState(1);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!repId) return avisar("Selecciona un repuesto.");
    const rep = repuestos.find((r) => String(r.id) === String(repId));
    if (!rep) return;
    setBusy(true);
    try {
      await api.post("/ia/ordenes/trabajo/repuesto", {
        orden_id: ordenId,
        repuesto_id: parseInt(repId),
        cantidad: cant,
        precio_unit: parseFloat(rep.precio || 0),
      });
      setRepId("");
      setCant(1);
      onDone();
    } catch (e) {
      await avisar(e.response?.data?.message || "No se pudo agregar el repuesto.", "Error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
        alignItems: "flex-end",
      }}
    >
      <div style={{ flex: 2, minWidth: "180px" }}>
        <label
          style={{
            display: "block",
            fontSize: "11px",
            color: "var(--text-secondary)",
            marginBottom: "4px",
          }}
        >
          Repuesto
        </label>
        <select
          value={repId}
          onChange={(e) => setRepId(e.target.value)}
          style={{ ...S.inp, width: "100%" }}
        >
          <option value="">Seleccionar...</option>
          {repuestos.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre} — Stock: {r.stock} — Bs{" "}
              {Number(r.precio || 0).toFixed(2)}
            </option>
          ))}
        </select>
      </div>
      <div style={{ minWidth: "80px" }}>
        <label
          style={{
            display: "block",
            fontSize: "11px",
            color: "var(--text-secondary)",
            marginBottom: "4px",
          }}
        >
          Cant.
        </label>
        <input
          type="number"
          min={1}
          value={cant}
          onChange={(e) => setCant(parseInt(e.target.value) || 1)}
          style={{ ...S.inp, width: "100%" }}
        />
      </div>
      <button
        onClick={submit}
        disabled={busy}
        style={{
          ...S.btn,
          background: busy ? "var(--bg-surface2)" : "var(--accent)",
          color: busy ? "var(--text-muted)" : "#fff",
          opacity: busy ? 0.6 : 1,
        }}
      >
        + Agregar
      </button>
    </div>
  );
}

function ModalOrden({ orden, repuestos, onClose, onRefresh }) {
  const { avisar } = useDialog();
  const [mostrarFin, setMostrarFin] = useState(false);
  const [busy, setBusy] = useState(false);

  const accion = async (tipo) => {
    setBusy(true);
    try {
      await api.put("/ia/ordenes/trabajo/accion", {
        orden_id: orden.id,
        accion: tipo,
      });
      onRefresh();
      onClose();
    } catch (e) {
      await avisar(e.response?.data?.message || "No se pudo ejecutar la acción.", "Error");
    } finally {
      setBusy(false);
    }
  };

  const EC =
    {
      PROGRAMADO: {
        c: "var(--accent-text)",
        bg: "var(--accent-light)",
        b: "var(--accent)",
      },
      EN_PROCESO: { c: "#f59e0b", bg: "#fffbeb", b: "#f59e0b" },
      PAUSADO: {
        c: "var(--text-muted)",
        bg: "var(--bg-surface2)",
        b: "var(--border)",
      },
      FINALIZADO: { c: "#22c55e", bg: "#f0fdf4", b: "#22c55e" },
    }[orden.estado] || {};

  const campos = [
    { l: "Equipo", v: `${orden.equipo_codigo} — ${orden.equipo_nombre}` },
    { l: "Tipo", v: orden.equipo_tipo || "—" },
    { l: "Sucursal", v: orden.sucursal || "—" },
    {
      l: "Responsable",
      v: orden.responsable_nombre
        ? `${orden.responsable_nombre} ${orden.responsable_apellido || ""}`
        : "—",
    },
    { l: "Programado", v: fmt(orden.fecha_programada) },
    { l: "Riesgo IA", v: orden.nivel_riesgo || "—" },
  ];

  return (
    <ModalShell
      onClose={onClose}
      headerContent={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h4 style={{ color: "#fff", fontWeight: 700, margin: 0 }}>
              🔧 Orden #{orden.id}
            </h4>
            <small style={{ color: "rgba(255,255,255,0.8)" }}>
              {orden.equipo_codigo} — {orden.equipo_nombre}
            </small>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                background: EC.bg,
                color: EC.c,
                border: `1px solid ${EC.b}`,
                borderRadius: "6px",
                padding: "3px 10px",
                fontSize: "11px",
                fontWeight: 700,
              }}
            >
              {orden.estado}
            </span>
            <button
              onClick={onClose}
              style={{
                ...S.btn,
                background: "rgba(255,255,255,0.15)",
                color: "#fff",
              }}
            >
              ✖
            </button>
          </div>
        </div>
      }
    >
      {/* Info equipo */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
          gap: "10px",
          marginBottom: "1.25rem",
        }}
      >
        {campos.map((f) => (
          <div
            key={f.l}
            style={{
              background: "var(--bg-surface2)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              padding: "10px 12px",
            }}
          >
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "11px",
                margin: "0 0 3px",
              }}
            >
              {f.l}
            </p>
            <p
              style={{
                color: "var(--text-primary)",
                fontWeight: 500,
                fontSize: "13px",
                margin: 0,
              }}
            >
              {f.v}
            </p>
          </div>
        ))}
      </div>

      {/* Problema */}
      {orden.descripcion_problema && (
        <div style={{ marginBottom: "1rem" }}>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "12px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              margin: "0 0 6px",
            }}
          >
            Problema reportado
          </p>
          <div
            style={{
              background: "var(--bg-surface2)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              padding: "12px 14px",
              color: "var(--text-primary)",
              fontSize: "14px",
              lineHeight: 1.6,
            }}
          >
            {orden.descripcion_problema}
          </div>
        </div>
      )}

      {/* Motivo IA */}
      {orden.motivo_ia && (
        <div style={{ marginBottom: "1rem" }}>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "12px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              margin: "0 0 6px",
            }}
          >
            Motivo IA
          </p>
          <div
            style={{
              background: "var(--warning-bg)",
              border: "1px solid var(--warning)",
              borderRadius: "10px",
              padding: "12px 14px",
              color: "var(--text-primary)",
              fontSize: "13px",
              lineHeight: 1.6,
            }}
          >
            {orden.motivo_ia}
          </div>
        </div>
      )}

      {/* Acciones */}
      {orden.estado !== "FINALIZADO" && (
        <div style={{ marginBottom: "1rem" }}>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "12px",
              fontWeight: 600,
              textTransform: "uppercase",
              margin: "0 0 8px",
            }}
          >
            Acciones
          </p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {orden.estado === "PROGRAMADO" && (
              <button
                onClick={() => accion("INICIAR")}
                disabled={busy}
                style={{ ...S.btn, background: "var(--accent)", color: "#fff" }}
              >
                ▶ Iniciar mantenimiento
              </button>
            )}
            {orden.estado === "EN_PROCESO" && (
              <button
                onClick={() => accion("PAUSAR")}
                disabled={busy}
                style={{
                  ...S.btn,
                  background: "var(--warning-bg)",
                  border: "1px solid var(--warning)",
                  color: "var(--warning)",
                }}
              >
                ⏸ Pausar
              </button>
            )}
            {orden.estado === "PAUSADO" && (
              <button
                onClick={() => accion("INICIAR")}
                disabled={busy}
                style={{ ...S.btn, background: "var(--accent)", color: "#fff" }}
              >
                ▶ Reanudar
              </button>
            )}
            {["EN_PROCESO", "PAUSADO"].includes(orden.estado) && (
              <button
                onClick={() => setMostrarFin(!mostrarFin)}
                style={{
                  ...S.btn,
                  background: "var(--success-bg)",
                  border: "1px solid var(--success)",
                  color: "var(--success)",
                }}
              >
                ✅ Finalizar
              </button>
            )}
          </div>
          {mostrarFin && (
            <FormFinalizar
              ordenId={orden.id}
              onDone={() => {
                onRefresh();
                onClose();
              }}
            />
          )}
        </div>
      )}

      {/* Agregar repuesto */}
      {orden.estado === "EN_PROCESO" && (
        <div
          style={{
            background: "var(--bg-surface2)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "1rem",
            marginBottom: "1rem",
          }}
        >
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "12px",
              fontWeight: 600,
              textTransform: "uppercase",
              margin: "0 0 10px",
            }}
          >
            🔩 Agregar repuesto
          </p>
          <FormRepuesto
            ordenId={orden.id}
            repuestos={repuestos}
            onDone={onRefresh}
          />
        </div>
      )}

      {/* Repuestos usados */}
      {orden.repuestos?.length > 0 && (
        <div>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "12px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              margin: "0 0 8px",
            }}
          >
            Repuestos utilizados
          </p>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "13px",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Repuesto", "Tipo", "Cant.", "P.Unit.", "Subtotal"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: "8px 10px",
                        textAlign: "left",
                        color: "var(--text-secondary)",
                        fontWeight: 500,
                      }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {orden.repuestos.map((r, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td
                    style={{
                      padding: "8px 10px",
                      color: "var(--text-primary)",
                      fontWeight: 500,
                    }}
                  >
                    {r.nombre}
                  </td>
                  <td
                    style={{
                      padding: "8px 10px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {r.tipo || "—"}
                  </td>
                  <td
                    style={{
                      padding: "8px 10px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {r.cantidad}
                  </td>
                  <td
                    style={{
                      padding: "8px 10px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Bs {Number(r.precio_unit).toFixed(2)}
                  </td>
                  <td
                    style={{
                      padding: "8px 10px",
                      color: "var(--success)",
                      fontWeight: 600,
                    }}
                  >
                    Bs {(r.cantidad * r.precio_unit).toFixed(2)}
                  </td>
                </tr>
              ))}
              <tr style={{ background: "var(--bg-surface2)" }}>
                <td
                  colSpan={4}
                  style={{
                    padding: "10px",
                    textAlign: "right",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  TOTAL:
                </td>
                <td
                  style={{
                    padding: "10px",
                    color: "var(--success)",
                    fontWeight: 700,
                    fontSize: "15px",
                  }}
                >
                  Bs{" "}
                  {orden.repuestos
                    .reduce((a, r) => a + r.cantidad * r.precio_unit, 0)
                    .toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </ModalShell>
  );
}

// ─────────────────────────────────────────────
// TARJETA DE NOTIFICACIÓN (con respuesta)
// ─────────────────────────────────────────────
function NotificacionCard({ notif, onLeer, onResponder }) {
  const [abierto, setAbierto] = useState(false);
  const [busy, setBusy] = useState(false);

  const requiereRespuesta =
    notif.tipo === "SOLICITUD_MANT" && notif.respondida === 0;

  const responder = async (r) => {
    setBusy(true);
    try {
      await onResponder(notif.id, r);
    } finally {
      setBusy(false);
      setAbierto(false);
    }
  };

  const datos = notif.datos_json || {};
  const icon = ICONO_TIPO[notif.tipo] || "🔔";

  const borderColor = notif.leida
    ? "var(--border)"
    : notif.tipo === "SOLICITUD_MANT"
      ? "#f59e0b"
      : notif.tipo === "IA_RIESGO"
        ? "var(--danger)"
        : notif.tipo === "RESP_PERSONAL"
          ? "var(--success)"
          : "var(--accent)";

  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: `1px solid ${borderColor}`,
        borderRadius: "14px",
        overflow: "hidden",
        opacity: notif.leida && !requiereRespuesta ? 0.7 : 1,
        transition: "all 0.2s",
      }}
    >
      {/* Fila principal */}
      <div
        style={{
          padding: "1rem 1.25rem",
          display: "flex",
          gap: "14px",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            width: "44px",
            height: "44px",
            flexShrink: 0,
            borderRadius: "12px",
            background: notif.leida
              ? "var(--bg-surface2)"
              : notif.tipo === "SOLICITUD_MANT"
                ? "#fffbeb"
                : "var(--accent-light)",
            border: `1px solid ${borderColor}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
          }}
        >
          {icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: "0 0 4px",
              fontWeight: notif.leida ? 400 : 700,
              color: "var(--text-primary)",
              fontSize: "14px",
            }}
          >
            {notif.titulo}
          </p>
          <p
            style={{
              margin: "0 0 6px",
              color: "var(--text-secondary)",
              fontSize: "13px",
              lineHeight: 1.6,
            }}
          >
            {notif.mensaje}
          </p>
          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>
              {fmtFull(notif.fecha)}
            </span>
            {datos.fecha_programada && (
              <span
                style={{
                  background: "var(--accent-light)",
                  color: "var(--accent-text)",
                  borderRadius: "6px",
                  padding: "1px 8px",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                📅 {datos.fecha_programada}
              </span>
            )}
            {notif.respondida === 1 &&
              notif.respuesta &&
              notif.respuesta !== "PENDIENTE" && (
                <span
                  style={{
                    background:
                      notif.respuesta === "APROBADA"
                        ? "var(--success-bg)"
                        : "var(--danger-bg)",
                    color:
                      notif.respuesta === "APROBADA"
                        ? "var(--success)"
                        : "var(--danger)",
                    border: `1px solid ${notif.respuesta === "APROBADA" ? "var(--success)" : "var(--danger)"}`,
                    borderRadius: "6px",
                    padding: "1px 8px",
                    fontSize: "11px",
                    fontWeight: 600,
                  }}
                >
                  {notif.respuesta === "APROBADA"
                    ? "✅ Aprobaste"
                    : "❌ Rechazaste"}
                </span>
              )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            flexShrink: 0,
          }}
        >
          {!notif.leida && (
            <button
              onClick={() => onLeer(notif.id)}
              style={{
                ...S.btn,
                background: "var(--accent-light)",
                border: "1px solid var(--accent)",
                color: "var(--accent-text)",
                fontSize: "11px",
                padding: "4px 10px",
              }}
            >
              ✓ Leído
            </button>
          )}
          {requiereRespuesta && (
            <button
              onClick={() => setAbierto(!abierto)}
              style={{
                ...S.btn,
                background: "#f59e0b",
                color: "#fff",
                fontSize: "11px",
                padding: "4px 10px",
              }}
            >
              {abierto ? "▲ Cerrar" : "↩ Responder"}
            </button>
          )}
        </div>
      </div>

      {/* Panel de respuesta */}
      {requiereRespuesta && abierto && (
        <div
          style={{
            borderTop: "1px solid #f59e0b",
            padding: "1rem 1.25rem",
            background: "#fffbeb",
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              color: "#92400e",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            🛠️ ¿El equipo{" "}
            <strong>{datos.cod || datos.equipo_codigo || ""}</strong> estará
            disponible el <strong>{datos.fecha_programada || "—"}</strong>?
          </p>
          <p
            style={{
              margin: "0 0 12px",
              color: "#78350f",
              fontSize: "12px",
              lineHeight: 1.6,
            }}
          >
            • <strong>Aprobar</strong>: confirma disponibilidad del equipo.
            Guarda tu información antes de la fecha.
            <br />• <strong>Rechazar</strong>: solicita al administrador
            reprogramar el mantenimiento.
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => responder("APROBADA")}
              disabled={busy}
              style={{
                ...S.btn,
                background: "#22c55e",
                color: "#fff",
                flex: 1,
                opacity: busy ? 0.6 : 1,
              }}
            >
              {busy ? "Enviando..." : "✅ Aprobar — Estaré listo"}
            </button>
            <button
              onClick={() => responder("RECHAZADA")}
              disabled={busy}
              style={{
                ...S.btn,
                background: "var(--danger-bg)",
                border: "1px solid var(--danger)",
                color: "var(--danger)",
                flex: 1,
                opacity: busy ? 0.6 : 1,
              }}
            >
              {busy ? "Enviando..." : "❌ Rechazar — Reprogramar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────
function IA() {
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const esAdmin = currentUser.rol === "ADMIN";

  // Estado
  const [tab, setTab] = useState("dashboard");
  const [equipos, setEquipos] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [misOrdenes, setMisOrdenes] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);
  const [estadisticas, setEstadisticas] = useState({});
  const [panelAdmin, setPanelAdmin] = useState({});
  const [resumen, setResumen] = useState({});
  const [repuestosCat, setRepuestosCat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entrenando, setEntrenando] = useState(false);
  const [error, setError] = useState("");
  const [buscar, setBuscar] = useState("");
  const [modalAnalisis, setModalAnalisis] = useState(null);
  const [modalOrden, setModalOrden] = useState(null);
  const [confirmarEntrenamiento, setConfirmarEntrenamiento] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 5000);
  };

  const loadAll = useCallback(async (force = false) => {
    setLoading(true);
    setError("");
    const ok = (r) => r.status === "fulfilled";
    const val = (r) => r.value?.data;

    // ── Fase 1: lo esencial para "Vista general" — desbloquea la UI ──
    try {
      const base = await Promise.allSettled([
        api.get("/ia/equipos-riesgo" + (force ? "?refrescar=true" : "")),
        api.get("/ia/estadisticas"),
        api.get("/ia/ordenes"),
      ]);

      if (!base.some(ok)) {
        const firstErr = base[0]?.reason;
        setError(
          firstErr?.response?.data?.message ||
            firstErr?.message ||
            "No se pudo conectar con el servicio de IA",
        );
        return;
      }

      if (ok(base[0])) {
        const d = val(base[0]);
        setEquipos(d.equipos || []);
        setResumen({
          total: d.total || 0,
          criticos: d.criticos || 0,
          alto_riesgo: d.alto_riesgo || 0,
          medio_riesgo: d.medio_riesgo || 0,
          bajo_riesgo: d.bajo_riesgo || 0,
          anomalias: d.anomalias || 0,
          version: d.modelo_version || "—",
          modelo: d.modelo || "—",
        });
      }
      if (ok(base[1])) setEstadisticas(val(base[1]) || {});
      if (ok(base[2])) {
        const ordenesUnicas = new Map();
        (val(base[2])?.ordenes || [])
          .sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
          .forEach((orden) => {
            if (!ordenesUnicas.has(orden.equipo_id))
              ordenesUnicas.set(orden.equipo_id, orden);
          });
        setOrdenes(Array.from(ordenesUnicas.values()));
      }
    } catch (e) {
      setError(
        e.response?.data?.message ||
          e.message ||
          "No se pudo conectar con el servicio de IA",
      );
      return;
    } finally {
      setLoading(false);
    }

    // ── Fase 2: el resto, en segundo plano (no bloquea la vista) ──
    const extra = [
      api.get("/ia/historial"),
      api.get("/ia/notificaciones"),
      api.get("/ia/mis-ordenes"),
      api.get("/catalogos/repuestos"),
    ];
    if (esAdmin) extra.push(api.get("/ia/panel-admin"));
    const r2 = await Promise.allSettled(extra);
    if (ok(r2[0])) setHistorial(val(r2[0])?.historial || []);
    if (ok(r2[1])) setNotificaciones(val(r2[1])?.notificaciones || []);
    if (ok(r2[2])) setMisOrdenes(val(r2[2])?.ordenes || []);
    if (ok(r2[3])) setRepuestosCat(val(r2[3]) || []);
    if (esAdmin && r2[4] && ok(r2[4])) setPanelAdmin(val(r2[4]) || {});
  }, [esAdmin]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Acciones
  const entrenar = async () => {
    setEntrenando(true);
    try {
      const res = await api.post("/ia/entrenar");
      const est = res.data.resultado || res.data;
      showMsg(
        "success",
        est.estado === "sintetico"
          ? "Modelo creado con datos sintéticos — mejorará con más historial"
          : `Modelo ${est.modelo || ""} entrenado — ${est.version || ""}`,
      );
      await loadAll(true);
    } catch (e) {
      showMsg("error", e.response?.data?.message || "Error al entrenar");
    } finally {
      setEntrenando(false);
      setConfirmarEntrenamiento(false);
    }
  };

  const accionOrden = async (id, accion) => {
    try {
      const res = await api.put("/ia/ordenes/accion", {
        orden_id: id,
        accion,
        usuario_id: currentUser.id,
      });
      showMsg(
        "success",
        `✅ ${res.data.message || `Orden ${accion.toLowerCase()}`}`,
      );
      await loadAll();
    } catch (e) {
      showMsg("error", e.response?.data?.message || "Error");
    }
  };

  const marcarLeida = async (id) => {
    try {
      await api.put(`/ia/notificaciones/${id}/leer`);
      setNotificaciones((n) =>
        n.map((x) => (x.id === id ? { ...x, leida: 1 } : x)),
      );
    } catch {}
  };

  const marcarTodasLeidas = async () => {
    try {
      await api.put("/ia/notificaciones/leer-todas");
      setNotificaciones((n) => n.map((x) => ({ ...x, leida: 1 })));
    } catch {}
  };

  const responderNotificacion = async (notifId, respuesta) => {
    try {
      await api.put("/ia/notificaciones/responder", {
        notif_id: notifId,
        respuesta,
        usuario_id: currentUser.id,
      });
      showMsg(
        "success",
        respuesta === "APROBADA"
          ? "✅ Confirmaste disponibilidad — el admin fue notificado"
          : "❌ Solicitud de reprogramación enviada al administrador",
      );
      await loadAll();
    } catch (e) {
      showMsg("error", e.response?.data?.message || "Error al responder");
    }
  };

  // Contadores
  const noLeidas = notificaciones.filter((n) => !n.leida).length;
  const pendRespuesta = notificaciones.filter(
    (n) => n.tipo === "SOLICITUD_MANT" && !n.respondida,
  ).length;
  const ordPendientes = ordenes.filter((o) => o.estado === "PENDIENTE").length;
  const misActivas = misOrdenes.filter((o) => o.estado !== "FINALIZADO").length;

  const equiposFiltrados = equipos.filter((e) => {
    const q = buscar.toLowerCase();
    return (
      (e.equipo_codigo || "").toLowerCase().includes(q) ||
      (e.equipo_nombre || "").toLowerCase().includes(q) ||
      (e.nivel_riesgo || "").toLowerCase().includes(q)
    );
  });

  const tabs = [
    { key: "dashboard", label: "Vista general", badge: 0 },
    {
      key: "riesgo",
      label: "Equipos",
      badge: (resumen.criticos || 0) + (resumen.alto_riesgo || 0),
    },
    { key: "ordenes", label: "Órdenes", badge: ordPendientes },
    // "Mis órdenes" es la cola personal del técnico: solo para no-admins.
    ...(!esAdmin ? [{ key: "mis-ordenes", label: "Mis órdenes", badge: misActivas }] : []),
    { key: "historial", label: "Historial", badge: 0 },
    { key: "notif", label: "Notificaciones", badge: noLeidas + pendRespuesta },
    ...(esAdmin ? [{ key: "panel", label: "Panel", badge: 0 }] : []),
  ];

  const flujoReparaciones = [
    { title: "Detectar", subtitle: "Riesgo + anomalias" },
    { title: "Priorizar", subtitle: "Orden y técnico" },
    { title: "Reparar", subtitle: "Cerrar con costo y control" },
  ];

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <AdminLayout>
      {/* HEADER */}
      <div
        className="ia-hero"
        style={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "1.5rem",
          padding: "1.1rem 1.25rem",
          borderRadius: "16px",
          border: "1px solid var(--border)",
          background:
            "linear-gradient(135deg, var(--bg-surface), var(--bg-surface2))",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="ia-dot" />
            <span
              style={{
                color: "var(--text-secondary)",
                fontSize: "10.5px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              IA predictiva · en línea
            </span>
          </div>
          <h2
            style={{
              fontWeight: 700,
              margin: "6px 0 0",
              fontSize: "22px",
              color: "var(--text-primary)",
            }}
          >
            Centro de mantenimiento predictivo
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              margin: "6px 0 0",
              fontSize: "13px",
            }}
          >
            Monitor de riesgo, programación de mantenimientos y seguimiento
            operativo
            {resumen.version && resumen.version !== "—" && (
              <span
                style={{
                  marginLeft: "10px",
                  background: "var(--bg-surface2)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: "999px",
                  padding: "2px 10px",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                {resumen.version} · {resumen.modelo}
              </span>
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
          <button
            onClick={() => loadAll(true)}
            disabled={loading}
            style={{
              ...S.btn,
              background: "var(--bg-surface2)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              opacity: loading ? 0.6 : 1,
            }}
          >
            Actualizar
          </button>
          {esAdmin && (
            <button
              onClick={() => setConfirmarEntrenamiento(true)}
              disabled={entrenando || loading}
              style={{
                ...S.btn,
                background: entrenando ? "var(--bg-surface2)" : "var(--accent)",
                color: entrenando ? "var(--text-muted)" : "#fff",
                padding: "10px 20px",
                opacity: entrenando ? 0.7 : 1,
              }}
            >
              {entrenando ? "Entrenando..." : "Reentrenar IA"}
            </button>
          )}
        </div>
      </div>

      {/* MENSAJE */}
      {msg.text && (
        <div
          style={{
            background:
              msg.type === "success" ? "var(--success-bg)" : "var(--danger-bg)",
            border: `1px solid ${msg.type === "success" ? "var(--success)" : "var(--danger)"}`,
            color: msg.type === "success" ? "var(--success)" : "var(--danger)",
            borderRadius: "10px",
            padding: "12px 16px",
            marginBottom: "1.25rem",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          {msg.text}
        </div>
      )}

      {/* ERROR CONEXIÓN */}
      {error && (
        <div
          style={{
            background: "var(--danger-bg)",
            border: "1px solid var(--danger)",
            borderRadius: "12px",
            padding: "1.25rem",
            marginBottom: "1.25rem",
          }}
        >
          <p
            style={{
              color: "var(--danger)",
              fontWeight: 700,
              margin: "0 0 6px",
            }}
          >
            ⚠️ Servicio de IA no disponible
          </p>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "13px",
              margin: "0 0 8px",
            }}
          >
            {error}
          </p>
          <code
            style={{
              background: "var(--bg-surface2)",
              color: "var(--accent-text)",
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "12px",
            }}
          >
            cd python_ia && python main.py
          </code>
        </div>
      )}

      {/* STATS */}
      {!loading && !error && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
              gap: "12px",
              marginBottom: "1.25rem",
            }}
          >
            <StatCard
              label="Equipos"
              value={resumen.total || 0}
              color="var(--accent-text)"
              icon="◫"
            />
            <StatCard
              label="Críticos"
              value={resumen.criticos || 0}
              color="#ef4444"
              icon="•"
            />
            <StatCard
              label="Alto riesgo"
              value={resumen.alto_riesgo || 0}
              color="#f59e0b"
              icon="•"
            />
            <StatCard
              label="Medio riesgo"
              value={resumen.medio_riesgo || 0}
              color="#3b82f6"
              icon="•"
            />
            <StatCard
              label="Anomalías"
              value={resumen.anomalias || 0}
              color="#ef4444"
              icon="!"
            />
            <StatCard
              label="Órdenes"
              value={ordPendientes}
              color="#f59e0b"
              icon="▣"
            />
          </div>

          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              padding: "16px",
              marginBottom: "1.25rem",
            }}
          >
            <div
              style={{
                color: "var(--text-secondary)",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: "12px",
              }}
            >
              Flujo de reparaciones
            </div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {flujoReparaciones.map((step, index) => (
                <FlowStep
                  key={step.title}
                  number={index + 1}
                  title={step.title}
                  subtitle={step.subtitle}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* TABS */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          marginBottom: "1.25rem",
          flexWrap: "wrap",
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "9px 16px",
              borderRadius: "10px",
              border:
                tab === t.key
                  ? "1px solid transparent"
                  : "1px solid var(--border)",
              background: tab === t.key ? "var(--accent)" : "var(--bg-surface)",
              color: tab === t.key ? "#fff" : "var(--text-secondary)",
              boxShadow: "none",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "box-shadow .2s, background .2s",
            }}
          >
            {t.label}
            {t.badge > 0 && (
              <span
                style={{
                  background:
                    tab === t.key
                      ? "rgba(255,255,255,0.25)"
                      : "var(--danger-bg)",
                  color: tab === t.key ? "#fff" : "var(--danger)",
                  borderRadius: "999px",
                  padding: "0 7px",
                  fontSize: "11px",
                  fontWeight: 700,
                }}
              >
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* CONTENIDO */}
      {loading ? (
        <div
          style={{
            padding: "5rem",
            textAlign: "center",
            color: "var(--text-secondary)",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🤖</div>
          <p style={{ fontSize: "16px", fontWeight: 500 }}>
            Analizando equipos con IA...
          </p>
        </div>
      ) : error ? null : (
        <>
          {/* ════════════ DASHBOARD ════════════ */}
          {tab === "dashboard" && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {/* Fila cards */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
                  gap: "16px",
                }}
              >
                {/* Alertas */}
                <div style={S.surface}>
                  <SectionHeader title="🚨 Alertas críticas" />
                  <div style={{ padding: "1rem" }}>
                    {equipos
                      .filter((e) =>
                        ["CRÍTICO", "ALTO"].includes(e.nivel_riesgo),
                      )
                      .slice(0, 5)
                      .map((e, i, arr) => (
                        <div
                          key={i}
                          onClick={() => setModalAnalisis(e)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "10px 0",
                            borderBottom:
                              i < arr.length - 1
                                ? "1px solid var(--border)"
                                : "none",
                            cursor: "pointer",
                          }}
                        >
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "8px",
                              background: "var(--danger-bg)",
                              border: "1px solid var(--danger)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "16px",
                              flexShrink: 0,
                            }}
                          >
                            {e.anomalia_detectada ? "⚠️" : "🔴"}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                margin: 0,
                                color: "var(--accent-text)",
                                fontWeight: 700,
                                fontSize: "13px",
                              }}
                            >
                              {e.equipo_codigo}
                            </p>
                            <p
                              style={{
                                margin: 0,
                                color: "var(--text-secondary)",
                                fontSize: "11px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {e.equipo_nombre}
                            </p>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <p
                              style={{
                                margin: 0,
                                color: "#ef4444",
                                fontWeight: 700,
                                fontSize: "14px",
                              }}
                            >
                              {fmtPct(e.probabilidad_falla)}
                            </p>
                            <p
                              style={{
                                margin: 0,
                                color: "var(--text-muted)",
                                fontSize: "10px",
                              }}
                            >
                              {e.dias_estimados}d
                            </p>
                          </div>
                        </div>
                      ))}
                    {equipos.filter((e) =>
                      ["CRÍTICO", "ALTO"].includes(e.nivel_riesgo),
                    ).length === 0 && (
                      <div
                        style={{
                          padding: "1.5rem",
                          textAlign: "center",
                          color: "var(--text-secondary)",
                        }}
                      >
                        <div style={{ fontSize: "28px", marginBottom: "8px" }}>
                          ✅
                        </div>
                        <p style={{ margin: 0, fontSize: "13px" }}>
                          Sin alertas críticas
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Modelo */}
                <div style={S.surface}>
                  <SectionHeader title="🧠 Estado del modelo" />
                  <div style={{ padding: "1rem" }}>
                    {[
                      { l: "Versión", v: resumen.version },
                      { l: "Modelo", v: resumen.modelo },
                      {
                        l: "Último entrenamiento",
                        v: estadisticas.versiones?.[0]?.fecha
                          ? fmt(estadisticas.versiones[0].fecha)
                          : "—",
                      },
                      {
                        l: "Accuracy",
                        v: estadisticas.versiones?.[0]?.accuracy
                          ? `${(estadisticas.versiones[0].accuracy * 100).toFixed(1)}%`
                          : "—",
                      },
                      {
                        l: "F1 Score",
                        v: estadisticas.versiones?.[0]?.f1
                          ? String(estadisticas.versiones[0].f1)
                          : "—",
                      },
                      {
                        l: "ROC-AUC",
                        v: estadisticas.versiones?.[0]?.roc_auc
                          ? String(estadisticas.versiones[0].roc_auc)
                          : "—",
                      },
                    ].map((s, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "8px 0",
                          borderBottom:
                            i < 5 ? "1px solid var(--border)" : "none",
                        }}
                      >
                        <span
                          style={{
                            color: "var(--text-secondary)",
                            fontSize: "13px",
                          }}
                        >
                          {s.l}
                        </span>
                        <span
                          style={{
                            color: "var(--text-primary)",
                            fontWeight: 600,
                            fontSize: "13px",
                          }}
                        >
                          {s.v || "—"}
                        </span>
                      </div>
                    ))}
                    {esAdmin && (
                      <button
                        onClick={entrenar}
                        disabled={entrenando}
                        style={{
                          width: "100%",
                          marginTop: "12px",
                          ...S.btn,
                          background: "var(--accent)",
                          color: "#fff",
                          padding: "8px",
                          opacity: entrenando ? 0.6 : 1,
                        }}
                      >
                        🧠 Reentrenar
                      </button>
                    )}
                  </div>
                </div>

                {/* Distribución */}
                <div style={S.surface}>
                  <SectionHeader title="📊 Distribución de riesgo" />
                  <div style={{ padding: "1rem" }}>
                    {[
                      { l: "🔴 CRÍTICO", v: resumen.criticos, c: "#ef4444" },
                      { l: "🟠 ALTO", v: resumen.alto_riesgo, c: "#f59e0b" },
                      { l: "🟡 MEDIO", v: resumen.medio_riesgo, c: "#3b82f6" },
                      { l: "🟢 BAJO", v: resumen.bajo_riesgo, c: "#22c55e" },
                    ].map((s, i) => {
                      const pct = Math.round(
                        ((s.v || 0) / (resumen.total || 1)) * 100,
                      );
                      return (
                        <div key={i} style={{ marginBottom: "14px" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: "4px",
                            }}
                          >
                            <span
                              style={{
                                color: "var(--text-secondary)",
                                fontSize: "13px",
                              }}
                            >
                              {s.l}
                            </span>
                            <span
                              style={{
                                color: "var(--text-primary)",
                                fontWeight: 600,
                                fontSize: "13px",
                              }}
                            >
                              {s.v || 0} ({pct}%)
                            </span>
                          </div>
                          <div
                            style={{
                              height: "10px",
                              background: "var(--border)",
                              borderRadius: "5px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${pct}%`,
                                height: "100%",
                                background: s.c,
                                borderRadius: "5px",
                                transition: "width 0.8s",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    <div
                      style={{
                        marginTop: "12px",
                        padding: "10px 14px",
                        background: "var(--danger-bg)",
                        border: "1px solid var(--danger)",
                        borderRadius: "10px",
                      }}
                    >
                      <p
                        style={{
                          color: "var(--danger)",
                          fontWeight: 700,
                          margin: "0 0 2px",
                          fontSize: "12px",
                        }}
                      >
                        ⚠️ ANOMALÍAS
                      </p>
                      <p
                        style={{
                          color: "var(--text-primary)",
                          margin: 0,
                          fontSize: "24px",
                          fontWeight: 700,
                        }}
                      >
                        {resumen.anomalias || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Próximos mantenimientos */}
              <div style={S.surface}>
                <SectionHeader title="⏰ Próximos mantenimientos (60 días)" />
                <div style={{ overflowX: "auto" }}>
                  <table className="table-base">
                    <thead>
                      <tr>
                        {[
                          "Equipo",
                          "Tipo",
                          "Días",
                          "Probabilidad",
                          "Riesgo",
                          "Recomendación",
                        ].map((h) => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {equipos
                        .filter((e) => e.dias_estimados <= 60)
                        .slice(0, 8)
                        .map((e, i) => (
                          <tr
                            key={i}
                            style={{ cursor: "pointer" }}
                            onClick={() => setModalAnalisis(e)}
                          >
                            <td>
                              <p
                                style={{
                                  margin: 0,
                                  color: "var(--accent-text)",
                                  fontWeight: 700,
                                  fontSize: "13px",
                                }}
                              >
                                {e.equipo_codigo}
                              </p>
                              <p
                                style={{
                                  margin: 0,
                                  color: "var(--text-secondary)",
                                  fontSize: "11px",
                                }}
                              >
                                {e.equipo_nombre}
                              </p>
                            </td>
                            <td
                              style={{
                                color: "var(--text-secondary)",
                                fontSize: "12px",
                              }}
                            >
                              {e.equipo_tipo || "—"}
                            </td>
                            <td>
                              <span
                                style={{
                                  color:
                                    e.dias_estimados <= 14
                                      ? "#ef4444"
                                      : e.dias_estimados <= 30
                                        ? "#f59e0b"
                                        : "var(--success)",
                                  fontWeight: 700,
                                }}
                              >
                                {e.dias_estimados}d
                              </span>
                            </td>
                            <td style={{ minWidth: "130px" }}>
                              <Barra valor={e.probabilidad_falla} />
                            </td>
                            <td>
                              <Pill nivel={e.nivel_riesgo} />
                            </td>
                            <td
                              style={{
                                color: "var(--text-secondary)",
                                fontSize: "12px",
                                maxWidth: "180px",
                              }}
                            >
                              {e.explicacion?.conclusion?.substring(0, 80) ||
                                "—"}
                              …
                            </td>
                          </tr>
                        ))}
                      {equipos.filter((e) => e.dias_estimados <= 60).length ===
                        0 && (
                        <tr>
                          <td
                            colSpan={6}
                            style={{
                              textAlign: "center",
                              padding: "2rem",
                              color: "var(--text-secondary)",
                            }}
                          >
                            ✅ Sin mantenimientos urgentes en 60 días
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Predicciones recientes */}
              <div style={S.surface}>
                <SectionHeader title="🕐 Predicciones recientes" />
                <div style={{ overflowX: "auto" }}>
                  <table className="table-base">
                    <thead>
                      <tr>
                        {[
                          "Fecha",
                          "Equipo",
                          "Probabilidad",
                          "Nivel",
                          "Días",
                          "Anomalía",
                          "Versión",
                        ].map((h) => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(estadisticas.predicciones_recientes || []).map(
                        (h, i) => (
                          <tr key={i}>
                            <td
                              style={{
                                color: "var(--text-muted)",
                                fontSize: "12px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {fmtFull(h.fecha_prediccion)}
                            </td>
                            <td>
                              <p
                                style={{
                                  margin: 0,
                                  color: "var(--accent-text)",
                                  fontWeight: 700,
                                  fontSize: "13px",
                                }}
                              >
                                {h.equipo_codigo}
                              </p>
                              <p
                                style={{
                                  margin: 0,
                                  color: "var(--text-secondary)",
                                  fontSize: "11px",
                                }}
                              >
                                {h.equipo_nombre}
                              </p>
                            </td>
                            <td style={{ minWidth: "120px" }}>
                              <Barra valor={parseFloat(h.probabilidad_falla)} />
                            </td>
                            <td>
                              <Pill nivel={h.nivel_riesgo} />
                            </td>
                            <td
                              style={{
                                color: "var(--text-secondary)",
                                fontSize: "13px",
                              }}
                            >
                              {h.dias_estimados}d
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {h.anomalia_detectada ? (
                                <span style={{ color: "#ef4444" }}>⚠️</span>
                              ) : (
                                <span style={{ color: "var(--text-muted)" }}>
                                  —
                                </span>
                              )}
                            </td>
                            <td>
                              <span
                                style={{
                                  background: "var(--accent-light)",
                                  color: "var(--accent-text)",
                                  borderRadius: "6px",
                                  padding: "1px 7px",
                                  fontSize: "11px",
                                }}
                              >
                                {h.modelo_version || "—"}
                              </span>
                            </td>
                          </tr>
                        ),
                      )}
                      {!estadisticas.predicciones_recientes?.length && (
                        <tr>
                          <td
                            colSpan={7}
                            style={{
                              textAlign: "center",
                              padding: "2rem",
                              color: "var(--text-secondary)",
                            }}
                          >
                            Sin predicciones aún
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ════════════ EQUIPOS EN RIESGO ════════════ */}
          {tab === "riesgo" && (
            <div style={S.surface}>
              <SectionHeader
                title="🎯 Todos los equipos — ordenados por riesgo"
                right={
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                    }}
                  >
                    <input
                      style={{ ...S.inp, width: "240px" }}
                      placeholder="🔍 Buscar..."
                      value={buscar}
                      onChange={(e) => setBuscar(e.target.value)}
                    />
                    <span
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "13px",
                      }}
                    >
                      {equiposFiltrados.length}
                    </span>
                  </div>
                }
              />
              <div style={{ overflowX: "auto" }}>
                <table className="table-base">
                  <thead>
                    <tr>
                      {[
                        "Equipo",
                        "Tipo",
                        "Probabilidad",
                        "Días",
                        "Riesgo",
                        "Anomalía",
                        "Mant.",
                        "Correctivos",
                        "Costo prom.",
                        "Análisis",
                      ].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {equiposFiltrados.length === 0 ? (
                      <tr>
                        <td
                          colSpan={10}
                          style={{
                            textAlign: "center",
                            padding: "3rem",
                            color: "var(--text-secondary)",
                          }}
                        >
                          Sin datos
                        </td>
                      </tr>
                    ) : (
                      equiposFiltrados.map((e, i) => (
                        <tr key={i}>
                          <td>
                            <p
                              style={{
                                margin: 0,
                                color: "var(--accent-text)",
                                fontWeight: 700,
                                fontSize: "13px",
                              }}
                            >
                              {e.equipo_codigo}
                            </p>
                            <p
                              style={{
                                margin: 0,
                                color: "var(--text-secondary)",
                                fontSize: "11px",
                              }}
                            >
                              {e.equipo_nombre}
                            </p>
                          </td>
                          <td
                            style={{
                              color: "var(--text-secondary)",
                              fontSize: "12px",
                            }}
                          >
                            {e.equipo_tipo || "—"}
                          </td>
                          <td style={{ minWidth: "130px" }}>
                            <Barra valor={e.probabilidad_falla} />
                          </td>
                          <td>
                            <span
                              style={{
                                color:
                                  e.dias_estimados <= 14
                                    ? "#ef4444"
                                    : e.dias_estimados <= 30
                                      ? "#f59e0b"
                                      : "var(--text-secondary)",
                                fontWeight: 700,
                              }}
                            >
                              {e.dias_estimados}d
                            </span>
                          </td>
                          <td>
                            <Pill nivel={e.nivel_riesgo} />
                          </td>
                          <td style={{ textAlign: "center" }}>
                            {e.anomalia_detectada ? (
                              <span
                                style={{
                                  background: "#fef2f2",
                                  color: "#ef4444",
                                  border: "1px solid #ef4444",
                                  borderRadius: "6px",
                                  padding: "2px 8px",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                }}
                              >
                                ⚠️ Sí
                              </span>
                            ) : (
                              <span
                                style={{
                                  color: "var(--text-muted)",
                                  fontSize: "12px",
                                }}
                              >
                                —
                              </span>
                            )}
                          </td>
                          <td
                            style={{
                              color: "var(--text-secondary)",
                              textAlign: "center",
                            }}
                          >
                            {e.total_mantenimientos}
                          </td>
                          <td
                            style={{
                              color: "var(--text-secondary)",
                              textAlign: "center",
                            }}
                          >
                            {e.total_correctivos}
                          </td>
                          <td
                            style={{ color: "var(--success)", fontWeight: 600 }}
                          >
                            {fmtBs(e.costo_promedio)}
                          </td>
                          <td>
                            <button
                              onClick={() => setModalAnalisis(e)}
                              style={{
                                ...S.btn,
                                background: "var(--accent-light)",
                                border: "1px solid var(--accent)",
                                color: "var(--accent-text)",
                                fontSize: "12px",
                              }}
                            >
                              🔍 Ver
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════════════ ÓRDENES IA ════════════ */}
          {tab === "ordenes" && (
            <div>
              <div
                style={{
                  background: "var(--accent-light)",
                  border: "1px solid var(--accent)",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  marginBottom: "1.25rem",
                  fontSize: "13px",
                  color: "var(--accent-text)",
                }}
              >
                ℹ️ La IA genera órdenes automáticamente cuando detecta
                probabilidad ≥ 70% o anomalías importantes.
              </div>
              {ordenes.length === 0 ? (
                <div style={{ ...S.surface }}>
                  <EmptyState
                    icon="📋"
                    title="Sin órdenes"
                    desc="La IA generará órdenes cuando detecte equipos en riesgo alto."
                  />
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {ordenes.map((o, i) => {
                    const cr = crNivel(o.nivel_riesgo);
                    const EC =
                      {
                        PENDIENTE: {
                          c: "#f59e0b",
                          bg: "#fffbeb",
                          b: "#f59e0b",
                        },
                        APROBADA: { c: "#22c55e", bg: "#f0fdf4", b: "#22c55e" },
                        RECHAZADA: {
                          c: "#ef4444",
                          bg: "#fef2f2",
                          b: "#ef4444",
                        },
                        EJECUTADA: {
                          c: "var(--accent-text)",
                          bg: "var(--accent-light)",
                          b: "var(--accent)",
                        },
                      }[o.estado] || {};
                    return (
                      <div
                        key={i}
                        style={{
                          background: "var(--bg-surface)",
                          border: `1px solid ${cr.border}`,
                          borderRadius: "14px",
                          overflow: "hidden",
                          borderLeft: `4px solid ${cr.border}`,
                        }}
                      >
                        <div
                          style={{
                            padding: "1rem 1.25rem",
                            display: "flex",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "10px",
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                            }}
                          >
                            <span
                              style={{
                                background: cr.bg,
                                color: cr.color,
                                border: `1px solid ${cr.border}`,
                                borderRadius: "8px",
                                padding: "4px 12px",
                                fontSize: "12px",
                                fontWeight: 700,
                              }}
                            >
                              {o.nivel_riesgo} {o.probabilidad}%
                            </span>
                            <div>
                              <p
                                style={{
                                  margin: 0,
                                  color: "var(--accent-text)",
                                  fontWeight: 700,
                                  fontSize: "14px",
                                }}
                              >
                                {o.equipo_codigo} — {o.equipo_nombre}
                              </p>
                              <p
                                style={{
                                  margin: "2px 0 0",
                                  color: "var(--text-muted)",
                                  fontSize: "12px",
                                }}
                              >
                                {o.equipo_tipo || "—"} ·{" "}
                                {fmtFull(o.fecha_generada)}
                              </p>
                            </div>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                            }}
                          >
                            <div style={{ textAlign: "right" }}>
                              <p
                                style={{
                                  margin: 0,
                                  color: "var(--text-secondary)",
                                  fontSize: "11px",
                                }}
                              >
                                Fecha sugerida
                              </p>
                              <p
                                style={{
                                  margin: 0,
                                  color: "var(--text-primary)",
                                  fontWeight: 700,
                                }}
                              >
                                {fmt(o.fecha_sugerida)}
                              </p>
                            </div>
                            <span
                              style={{
                                background: EC.bg,
                                color: EC.c,
                                border: `1px solid ${EC.b}`,
                                borderRadius: "6px",
                                padding: "3px 10px",
                                fontSize: "11px",
                                fontWeight: 700,
                              }}
                            >
                              {o.estado}
                            </span>
                          </div>
                        </div>
                        {o.motivo && (
                          <div
                            style={{
                              padding: "0 1.25rem 1rem",
                              borderTop: "1px solid var(--border)",
                              paddingTop: "12px",
                            }}
                          >
                            <p
                              style={{
                                color: "var(--text-secondary)",
                                fontSize: "12px",
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                margin: "0 0 6px",
                              }}
                            >
                              Motivo
                            </p>
                            <p
                              style={{
                                color: "var(--text-primary)",
                                fontSize: "13px",
                                margin: "0 0 12px",
                                lineHeight: 1.6,
                              }}
                            >
                              {o.motivo}
                            </p>

                            {o.estado === "PENDIENTE" && esAdmin && (
                              <div
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: "10px",
                                  alignItems: "center",
                                  marginBottom: "10px",
                                }}
                              >
                                <div
                                  style={{
                                    flex: 1,
                                    minWidth: "220px",
                                    background: "rgba(124,108,255,0.08)",
                                    border: "1px solid var(--accent)",
                                    borderRadius: "10px",
                                    padding: "10px 12px",
                                    color: "var(--text-primary)",
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: "11px",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.6px",
                                      color: "var(--accent-text)",
                                      fontWeight: 700,
                                      marginBottom: "4px",
                                    }}
                                  >
                                    Acción requerida
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "13px",
                                      fontWeight: 600,
                                    }}
                                  >
                                    Aprobar, rechazar o ir a Reparaciones para
                                    programar el mantenimiento.
                                  </div>
                                </div>
                              </div>
                            )}

                            {o.estado === "PENDIENTE" && esAdmin && (
                              <div
                                style={{
                                  display: "flex",
                                  gap: "8px",
                                  flexWrap: "wrap",
                                }}
                              >
                                <button
                                  onClick={() => accionOrden(o.id, "APROBADA")}
                                  style={{
                                    ...S.btn,
                                    background: "var(--success-bg)",
                                    border: "1px solid var(--success)",
                                    color: "var(--success)",
                                    fontWeight: 700,
                                    padding: "10px 16px",
                                  }}
                                >
                                  ✅ Aprobar
                                </button>
                                <button
                                  onClick={() => accionOrden(o.id, "RECHAZADA")}
                                  style={{
                                    ...S.btn,
                                    background: "var(--danger-bg)",
                                    border: "1px solid var(--danger)",
                                    color: "var(--danger)",
                                    fontWeight: 700,
                                    padding: "10px 16px",
                                  }}
                                >
                                  ❌ Rechazar
                                </button>
                                <a
                                  href="/admin/reparaciones"
                                  style={{
                                    ...S.btn,
                                    background: "var(--bg-surface2)",
                                    border: "1px solid var(--border)",
                                    color: "var(--text-primary)",
                                    textDecoration: "none",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: 700,
                                    padding: "10px 16px",
                                  }}
                                >
                                  🛠️ Ir a Reparaciones
                                </a>
                              </div>
                            )}

                            {o.estado === "APROBADA" && (
                              <div
                                style={{
                                  display: "flex",
                                  gap: "8px",
                                  flexWrap: "wrap",
                                  marginTop: "8px",
                                }}
                              >
                                <a
                                  href="/admin/reparaciones"
                                  style={{
                                    ...S.btn,
                                    background: "var(--accent-light)",
                                    border: "1px solid var(--accent)",
                                    color: "var(--accent-text)",
                                    textDecoration: "none",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: 700,
                                    padding: "10px 16px",
                                  }}
                                >
                                  🛠️ Ver mantenimiento
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ════════════ MIS ÓRDENES ════════════ */}
          {tab === "mis-ordenes" && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {misOrdenes.length === 0 ? (
                <div style={{ ...S.surface }}>
                  <EmptyState
                    icon="🔧"
                    title="Sin órdenes asignadas"
                    desc="Las órdenes asignadas a ti aparecerán aquí."
                  />
                </div>
              ) : (
                misOrdenes.map((o, i) => {
                  const EC =
                    {
                      PROGRAMADO: {
                        c: "var(--accent-text)",
                        bg: "var(--accent-light)",
                        b: "var(--accent)",
                      },
                      EN_PROCESO: { c: "#f59e0b", bg: "#fffbeb", b: "#f59e0b" },
                      PAUSADO: {
                        c: "var(--text-muted)",
                        bg: "var(--bg-surface2)",
                        b: "var(--border)",
                      },
                      FINALIZADO: { c: "#22c55e", bg: "#f0fdf4", b: "#22c55e" },
                    }[o.estado] || {};
                  return (
                    <div
                      key={i}
                      style={{
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "14px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          padding: "1rem 1.25rem",
                          display: "flex",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: "10px",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <p
                            style={{
                              margin: 0,
                              color: "var(--accent-text)",
                              fontWeight: 700,
                              fontSize: "15px",
                            }}
                          >
                            {o.equipo_codigo} — {o.equipo_nombre}
                          </p>
                          <p
                            style={{
                              margin: "2px 0 0",
                              color: "var(--text-secondary)",
                              fontSize: "12px",
                            }}
                          >
                            {o.equipo_tipo || "—"} · {o.sucursal || "—"} ·
                            Programado: {fmt(o.fecha_programada)}
                          </p>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <span
                            style={{
                              background: EC.bg,
                              color: EC.c,
                              border: `1px solid ${EC.b}`,
                              borderRadius: "6px",
                              padding: "3px 10px",
                              fontSize: "11px",
                              fontWeight: 700,
                            }}
                          >
                            {o.estado}
                          </span>
                          {o.estado !== "FINALIZADO" && (
                            <button
                              onClick={() => setModalOrden(o)}
                              style={{
                                ...S.btn,
                                background: "var(--accent-light)",
                                border: "1px solid var(--accent)",
                                color: "var(--accent-text)",
                              }}
                            >
                              🔍 Gestionar
                            </button>
                          )}
                        </div>
                      </div>
                      {o.descripcion_problema && (
                        <div
                          style={{
                            padding: "0 1.25rem 1rem",
                            borderTop: "1px solid var(--border)",
                            paddingTop: "10px",
                          }}
                        >
                          <p
                            style={{
                              color: "var(--text-secondary)",
                              fontSize: "12px",
                              fontWeight: 600,
                              margin: "0 0 4px",
                            }}
                          >
                            PROBLEMA
                          </p>
                          <p
                            style={{
                              color: "var(--text-primary)",
                              fontSize: "13px",
                              margin: 0,
                              lineHeight: 1.5,
                            }}
                          >
                            {o.descripcion_problema}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ════════════ HISTORIAL ════════════ */}
          {tab === "historial" && (
            <div style={S.surface}>
              <SectionHeader
                title="🕐 Historial de predicciones"
                right={
                  <span
                    style={{ color: "var(--text-secondary)", fontSize: "13px" }}
                  >
                    {historial.length} registros
                  </span>
                }
              />
              <div style={{ overflowX: "auto" }}>
                <table className="table-base">
                  <thead>
                    <tr>
                      {[
                        "Fecha",
                        "Equipo",
                        "Probabilidad",
                        "Nivel",
                        "Días",
                        "Anomalía",
                        "Versión",
                      ].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historial.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          style={{
                            textAlign: "center",
                            padding: "3rem",
                            color: "var(--text-secondary)",
                          }}
                        >
                          Sin historial — ejecuta el análisis para generar
                          predicciones
                        </td>
                      </tr>
                    ) : (
                      historial.map((h, i) => (
                        <tr key={i}>
                          <td
                            style={{
                              color: "var(--text-muted)",
                              fontSize: "12px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {fmtFull(h.fecha_prediccion)}
                          </td>
                          <td>
                            <p
                              style={{
                                margin: 0,
                                color: "var(--accent-text)",
                                fontWeight: 700,
                                fontSize: "13px",
                              }}
                            >
                              {h.equipo_codigo}
                            </p>
                            <p
                              style={{
                                margin: 0,
                                color: "var(--text-secondary)",
                                fontSize: "11px",
                              }}
                            >
                              {h.equipo_nombre}
                            </p>
                          </td>
                          <td style={{ minWidth: "130px" }}>
                            <Barra valor={parseFloat(h.probabilidad_falla)} />
                          </td>
                          <td>
                            <Pill nivel={h.nivel_riesgo} />
                          </td>
                          <td
                            style={{
                              color: "var(--text-secondary)",
                              fontSize: "13px",
                            }}
                          >
                            {h.dias_estimados}d
                          </td>
                          <td style={{ textAlign: "center" }}>
                            {h.anomalia_detectada ? (
                              <span
                                style={{ color: "#ef4444", fontWeight: 700 }}
                              >
                                ⚠️
                              </span>
                            ) : (
                              <span
                                style={{
                                  color: "var(--text-muted)",
                                  fontSize: "12px",
                                }}
                              >
                                —
                              </span>
                            )}
                          </td>
                          <td>
                            <span
                              style={{
                                background: "var(--accent-light)",
                                color: "var(--accent-text)",
                                borderRadius: "6px",
                                padding: "1px 7px",
                                fontSize: "11px",
                              }}
                            >
                              {h.modelo_version || "—"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════════════ NOTIFICACIONES ════════════ */}
          {tab === "notif" && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <div>
                  <p
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "13px",
                      margin: 0,
                    }}
                  >
                    {noLeidas} no leída{noLeidas !== 1 ? "s" : ""} de{" "}
                    {notificaciones.length}
                    {pendRespuesta > 0 && (
                      <span
                        style={{
                          marginLeft: "10px",
                          background: "#fffbeb",
                          color: "#92400e",
                          border: "1px solid #f59e0b",
                          borderRadius: "6px",
                          padding: "1px 8px",
                          fontSize: "11px",
                          fontWeight: 600,
                        }}
                      >
                        🛠️ {pendRespuesta} requiere
                        {pendRespuesta !== 1 ? "n" : ""} respuesta
                      </span>
                    )}
                  </p>
                </div>
                {noLeidas > 0 && (
                  <button
                    onClick={marcarTodasLeidas}
                    style={{
                      ...S.btn,
                      background: "var(--bg-surface2)",
                      border: "1px solid var(--border)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    ✅ Marcar todas leídas
                  </button>
                )}
              </div>

              {notificaciones.length === 0 ? (
                <div style={{ ...S.surface }}>
                  <EmptyState
                    icon="🔔"
                    title="Sin notificaciones"
                    desc="Las notificaciones aparecen cuando la IA detecta equipos en riesgo."
                  />
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {notificaciones.map((n, i) => (
                    <NotificacionCard
                      key={i}
                      notif={n}
                      onLeer={marcarLeida}
                      onResponder={responderNotificacion}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════════════ PANEL ADMIN ════════════ */}
          {tab === "panel" && esAdmin && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
                  gap: "12px",
                }}
              >
                <StatCard
                  label="Programadas"
                  value={panelAdmin.ordenes_trabajo?.programadas || 0}
                  color="var(--accent-text)"
                  icon="📅"
                />
                <StatCard
                  label="En proceso"
                  value={panelAdmin.ordenes_trabajo?.en_proceso || 0}
                  color="#f59e0b"
                  icon="⚙️"
                />
                <StatCard
                  label="Finalizadas"
                  value={panelAdmin.ordenes_trabajo?.finalizadas || 0}
                  color="#22c55e"
                  icon="✅"
                />
                <StatCard
                  label="Téc. libres"
                  value={panelAdmin.tecnicos_disponibles || 0}
                  color="#22c55e"
                  icon="👨‍💻"
                />
                <StatCard
                  label="Téc. ocupados"
                  value={panelAdmin.tecnicos_ocupados || 0}
                  color="#f59e0b"
                  icon="🔧"
                />
                <StatCard
                  label="Tiempo prom."
                  value={`${panelAdmin.tiempo_promedio_reparacion || 0}d`}
                  color="var(--accent-text)"
                  icon="⏱️"
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
                  gap: "16px",
                }}
              >
                {/* Precisión */}
                <div style={S.surface}>
                  <SectionHeader title="🎯 Precisión histórica" />
                  <div style={{ padding: "1rem" }}>
                    <div style={{ textAlign: "center", marginBottom: "1rem" }}>
                      <p
                        style={{
                          color: "var(--text-secondary)",
                          fontSize: "12px",
                          margin: "0 0 4px",
                        }}
                      >
                        Predicciones correctas
                      </p>
                      <p
                        style={{
                          color: "var(--accent-text)",
                          fontSize: "36px",
                          fontWeight: 700,
                          margin: 0,
                        }}
                      >
                        {panelAdmin.precision_ia?.precision_pct || 0}%
                      </p>
                      <p
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "12px",
                          margin: "4px 0 0",
                        }}
                      >
                        {panelAdmin.precision_ia?.correctas || 0} de{" "}
                        {panelAdmin.precision_ia?.total || 0}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <div
                        style={{
                          flex: 1,
                          background: "var(--success-bg)",
                          border: "1px solid var(--success)",
                          borderRadius: "10px",
                          padding: "10px",
                          textAlign: "center",
                        }}
                      >
                        <p
                          style={{
                            color: "var(--success)",
                            fontWeight: 700,
                            fontSize: "20px",
                            margin: 0,
                          }}
                        >
                          {panelAdmin.recomendaciones?.aceptadas || 0}
                        </p>
                        <p
                          style={{
                            color: "var(--text-secondary)",
                            fontSize: "11px",
                            margin: "4px 0 0",
                          }}
                        >
                          Aceptadas
                        </p>
                      </div>
                      <div
                        style={{
                          flex: 1,
                          background: "var(--danger-bg)",
                          border: "1px solid var(--danger)",
                          borderRadius: "10px",
                          padding: "10px",
                          textAlign: "center",
                        }}
                      >
                        <p
                          style={{
                            color: "var(--danger)",
                            fontWeight: 700,
                            fontSize: "20px",
                            margin: 0,
                          }}
                        >
                          {panelAdmin.recomendaciones?.rechazadas || 0}
                        </p>
                        <p
                          style={{
                            color: "var(--text-secondary)",
                            fontSize: "11px",
                            margin: "4px 0 0",
                          }}
                        >
                          Rechazadas
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Técnicos */}
                <div style={S.surface}>
                  <SectionHeader title="👨‍💻 Técnicos" />
                  <div style={{ overflowX: "auto" }}>
                    <table className="table-base">
                      <thead>
                        <tr>
                          {["Técnico", "Activas", "Estado"].map((h) => (
                            <th key={h}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(panelAdmin.tecnicos || []).map((t, i) => (
                          <tr key={i}>
                            <td
                              style={{
                                color: "var(--text-primary)",
                                fontWeight: 500,
                              }}
                            >
                              {t.nombre} {t.apellido || ""}
                            </td>
                            <td
                              style={{
                                textAlign: "center",
                                color:
                                  t.ordenes_activas > 0
                                    ? "#f59e0b"
                                    : "var(--text-secondary)",
                                fontWeight: 700,
                              }}
                            >
                              {t.ordenes_activas}
                            </td>
                            <td>
                              <span
                                style={{
                                  background:
                                    t.ordenes_activas === 0
                                      ? "var(--success-bg)"
                                      : "var(--warning-bg)",
                                  color:
                                    t.ordenes_activas === 0
                                      ? "var(--success)"
                                      : "var(--warning)",
                                  border: `1px solid ${t.ordenes_activas === 0 ? "var(--success)" : "var(--warning)"}`,
                                  borderRadius: "6px",
                                  padding: "2px 8px",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                }}
                              >
                                {t.ordenes_activas === 0
                                  ? "Disponible"
                                  : "Ocupado"}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {!panelAdmin.tecnicos?.length && (
                          <tr>
                            <td
                              colSpan={3}
                              style={{
                                textAlign: "center",
                                padding: "2rem",
                                color: "var(--text-secondary)",
                              }}
                            >
                              Sin técnicos
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Versiones */}
                <div style={S.surface}>
                  <SectionHeader title="📈 Precisión por versión" />
                  <div style={{ overflowX: "auto" }}>
                    <table className="table-base">
                      <thead>
                        <tr>
                          {[
                            "Versión",
                            "Modelo",
                            "Accuracy",
                            "F1",
                            "Prec. real",
                          ].map((h) => (
                            <th key={h}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(panelAdmin.precision_por_version || []).map(
                          (v, i) => (
                            <tr key={i}>
                              <td>
                                <span
                                  style={{
                                    background: "var(--accent-light)",
                                    color: "var(--accent-text)",
                                    borderRadius: "6px",
                                    padding: "1px 7px",
                                    fontSize: "11px",
                                  }}
                                >
                                  {v.version}
                                </span>
                              </td>
                              <td
                                style={{
                                  color: "var(--text-secondary)",
                                  fontSize: "12px",
                                }}
                              >
                                {v.modelo_ganador || "—"}
                              </td>
                              <td
                                style={{
                                  color: "var(--success)",
                                  fontWeight: 600,
                                }}
                              >
                                {v.accuracy
                                  ? `${(v.accuracy * 100).toFixed(1)}%`
                                  : "—"}
                              </td>
                              <td
                                style={{
                                  color: "var(--accent-text)",
                                  fontWeight: 600,
                                }}
                              >
                                {v.f1 || "—"}
                              </td>
                              <td
                                style={{
                                  color: "var(--text-primary)",
                                  fontWeight: 600,
                                }}
                              >
                                {v.precision_real
                                  ? `${v.precision_real}%`
                                  : "—"}
                              </td>
                            </tr>
                          ),
                        )}
                        {!panelAdmin.precision_por_version?.length && (
                          <tr>
                            <td
                              colSpan={5}
                              style={{
                                textAlign: "center",
                                padding: "2rem",
                                color: "var(--text-secondary)",
                              }}
                            >
                              Sin datos
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODALES */}
      {modalAnalisis && (
        <ModalAnalisis
          equipo={modalAnalisis}
          onClose={() => setModalAnalisis(null)}
        />
      )}
      {modalOrden && (
        <ModalOrden
          orden={modalOrden}
          repuestos={repuestosCat}
          onClose={() => setModalOrden(null)}
          onRefresh={() => loadAll()}
        />
      )}
      {confirmarEntrenamiento && (
        <ConfirmarEntrenamiento
          onClose={() => setConfirmarEntrenamiento(false)}
          onConfirm={entrenar}
          busy={entrenando}
        />
      )}
    </AdminLayout>
  );
}

export default IA;
