import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

function urlBase64ToUint8Array(base64) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

// estado: cargando | no-soportado | denegado | activo | inactivo
export function usePush() {
  const [estado, setEstado] = useState("cargando");
  const [clavePub, setClavePub] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    api.get("/push/clave-publica")
      .then((r) => setClavePub(r.data.publicKey || null))
      .catch(() => {});
  }, []);

  const detectar = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setEstado("no-soportado");
      return;
    }
    if (Notification.permission === "denied") {
      setEstado("denegado");
      return;
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setEstado(sub ? "activo" : "inactivo");
    } catch {
      setEstado("inactivo");
    }
  }, []);

  useEffect(() => { detectar(); }, [detectar]);

  const activar = useCallback(async () => {
    if (!clavePub) return false;
    setOcupado(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setEstado("denegado"); return false; }

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(clavePub),
        });
      }
      await api.post("/push/suscribir", sub.toJSON());
      setEstado("activo");
      return true;
    } catch (err) {
      console.error("Push activar:", err);
      setEstado("inactivo");
      return false;
    } finally {
      setOcupado(false);
    }
  }, [clavePub]);

  const desactivar = useCallback(async () => {
    setOcupado(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      await api.delete("/push/desuscribir");
      setEstado("inactivo");
    } catch (err) {
      console.error("Push desactivar:", err);
    } finally {
      setOcupado(false);
    }
  }, []);

  const probar = useCallback(async () => {
    try { await api.post("/push/test"); } catch (err) { console.error("Push test:", err); }
  }, []);

  return { estado, ocupado, activar, desactivar, probar };
}
