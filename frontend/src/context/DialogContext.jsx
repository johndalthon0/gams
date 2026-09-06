import { createContext, useCallback, useContext, useEffect, useState } from "react";

const DialogContext = createContext(null);

function Dialog({ dialog, onResolve }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onResolve(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onResolve]);

  const isConfirm = dialog.kind === "confirm";
  return (
    <div
      role="presentation"
      onClick={() => onResolve(false)}
      style={{
        position: "fixed", inset: 0, zIndex: 100000,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem", background: "rgba(2, 6, 23, 0.72)",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="global-dialog-title"
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "min(440px, 100%)", background: "var(--bg-surface)",
          border: "1px solid var(--border)", borderRadius: "16px",
          boxShadow: "0 24px 70px rgba(0,0,0,0.4)", padding: "1.5rem",
        }}
      >
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "12px", flexShrink: 0,
            display: "grid", placeItems: "center", background: isConfirm ? "var(--accent-light)" : "var(--danger-bg)",
            color: isConfirm ? "var(--accent-text)" : "var(--danger)", fontSize: "20px", fontWeight: 700,
          }} aria-hidden="true">
            {isConfirm ? "?" : "!"}
          </div>
          <div>
            <h2 id="global-dialog-title" style={{ margin: 0, color: "var(--text-primary)", fontSize: "18px" }}>
              {dialog.title || (isConfirm ? "Confirmar acción" : "Aviso del sistema")}
            </h2>
            <p style={{ margin: "8px 0 0", color: "var(--text-secondary)", fontSize: "13px", lineHeight: 1.5 }}>
              {dialog.message}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "1.5rem" }}>
          {isConfirm && (
            <button type="button" onClick={() => onResolve(false)} style={{
              background: "var(--bg-surface2)", border: "1px solid var(--border)", color: "var(--text-secondary)",
              borderRadius: "8px", padding: "9px 16px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>
              Cancelar
            </button>
          )}
          <button type="button" autoFocus onClick={() => onResolve(true)} style={{
            background: isConfirm ? "var(--accent)" : "var(--danger)", border: "none", color: "#fff",
            borderRadius: "8px", padding: "9px 16px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          }}>
            {isConfirm ? "Confirmar" : "Entendido"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);

  const open = useCallback((kind, message, title) => new Promise((resolve) => {
    setDialog({ kind, message, title, resolve });
  }), []);

  const onResolve = useCallback((value) => {
    setDialog((current) => {
      if (current) current.resolve(value);
      return null;
    });
  }, []);

  const confirmar = useCallback((message, title = "Confirmar acción") => open("confirm", message, title), [open]);
  const avisar = useCallback((message, title = "Aviso del sistema") => open("alert", message, title), [open]);

  return (
    <DialogContext.Provider value={{ confirmar, avisar }}>
      {children}
      {dialog && <Dialog dialog={dialog} onResolve={onResolve} />}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) throw new Error("useDialog debe usarse dentro de DialogProvider");
  return context;
}
