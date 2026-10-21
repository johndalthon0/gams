import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

function urlBase64ToUint8Array(base64) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

// El Service Worker no tiene acceso a localStorage, pero necesita la clave
// VAPID + token para poder re-suscribirse solo cuando el navegador invalida
// la suscripción en segundo plano (evento pushsubscriptionchange, puede
// dispararse sin ninguna pestaña abierta). Por eso guardamos esos datos en
// IndexedDB, que sí es accesible desde el SW.
function guardarConfigSW(vapidPublicKey) {
  const token = localStorage.getItem("token");
  if (!token || !vapidPublicKey || !("indexedDB" in window)) return;
  try {
    const req = indexedDB.open("gams-push", 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains("config")) {
        req.result.createObjectStore("config");
      }
    };
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction("config", "readwrite");
      tx.objectStore("config").put(
        { vapidPublicKey, apiBaseUrl: api.defaults.baseURL, token },
        "main"
      );
      tx.oncomplete = () => db.close();
      tx.onerror = () => db.close();
    };
  } catch {}
}

// estado: cargando | no-soportado | denegado | activo | inactivo
export function usePush() {
  const [estado, setEstado] = useState("cargando");
  const [clavePub, setClavePub] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    api.get("/push/clave-publica")
      .then((r) => {
        const pub = r.data.publicKey || null;
        setClavePub(pub);
        if (pub) guardarConfigSW(pub);
      })
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

  // La suscripción puede morir del lado del navegador/push service en
  // segundo plano sin avisar a la app. Revalidamos al volver a la pestaña
  // (no es 100% infalible, pero junto al listener del SW cubre la mayoría
  // de los casos sin esperar a que el usuario note que no le llegó nada).
  useEffect(() => {
    const onFocus = () => detectar();
    const onVisible = () => {
      if (document.visibilityState === "visible") detectar();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [detectar]);

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
      guardarConfigSW(clavePub);
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
      const endpoint = sub?.endpoint;
      if (sub) await sub.unsubscribe();
      await api.delete("/push/desuscribir", { data: { endpoint } });
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
