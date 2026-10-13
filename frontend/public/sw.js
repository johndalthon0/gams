const CACHE_NAME = "gams-ti-v3";

const STATIC = [
  "/",
  "/index.html",
  "/icon-192.png",
  "/icon-512.png"
];

// ================================
// INSTALACIÓN
// ================================
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC);
    })
  );

  self.skipWaiting();
});

// ================================
// ACTIVACIÓN
// ================================
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );

  self.clients.claim();
});

// ================================
// PETICIONES
// ================================
self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (!request || request.method !== "GET") return;

  try {
    const url = new URL(request.url);
    const isHttp = url.protocol === "http:" || url.protocol === "https:";
    const isApi = url.origin === self.location.origin && url.pathname.startsWith("/api/");

    if (!isHttp || isApi) return;
  } catch {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(request, responseClone).catch(() => undefined);
            })
            .catch(() => undefined);
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// ================================
// RECIBIR PUSH
// ================================
self.addEventListener("push", (event) => {

  let data = {
    titulo: "GAMS TI",
    cuerpo: "Tienes una nueva notificación",
    icono: "/icon-192.png",
    badge: "/icon-192.png",
    url: "/",
    tag: "gams-notif",
  };

  if (event.data) {
    try {
      Object.assign(data, event.data.json());
    } catch {
      data.cuerpo = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.titulo, {

      body: data.cuerpo,

      icon: data.icono,

      badge: data.badge,

      tag: data.tag,

      renotify: true,

      requireInteraction: false,

      vibrate: [200, 100, 200],

      data: {
        url: data.url
      },

      actions: [
        {
          action: "abrir",
          title: "Ver ahora"
        },
        {
          action: "cerrar",
          title: "Cerrar"
        }
      ]

    })
  );
});

// ================================
// RE-SUSCRIPCIÓN AUTOMÁTICA
// ================================
// El navegador puede invalidar/rotar una suscripción push en segundo plano
// (expiración del token del push service, limpieza parcial de datos, etc.)
// y dispara este evento para que la app se vuelva a suscribir. Puede pasar
// sin ninguna pestaña abierta, así que el SW tiene que poder hacerlo solo:
// lee la clave VAPID + token guardados en IndexedDB (ver usePush.js) y
// manda la nueva suscripción al backend sin depender de la página.

function urlBase64ToUint8Array(base64) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function leerConfigPush() {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open("gams-push", 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains("config")) {
          req.result.createObjectStore("config");
        }
      };
      req.onsuccess = () => {
        const db = req.result;
        try {
          const tx = db.transaction("config", "readonly");
          const get = tx.objectStore("config").get("main");
          get.onsuccess = () => { resolve(get.result || null); db.close(); };
          get.onerror = () => { resolve(null); db.close(); };
        } catch {
          resolve(null);
          db.close();
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      const cfg = await leerConfigPush();
      if (!cfg?.vapidPublicKey || !cfg?.apiBaseUrl || !cfg?.token) return;

      try {
        const nuevaSub = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(cfg.vapidPublicKey),
        });

        await fetch(`${cfg.apiBaseUrl}/push/suscribir`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${cfg.token}`,
          },
          body: JSON.stringify(nuevaSub.toJSON()),
        });
      } catch (e) {
        // Sin acceso a la pestaña no hay mucho más que hacer (ej. token
        // vencido); el usuario tendrá que reactivar manualmente la próxima
        // vez que abra la app.
      }
    })()
  );
});

// ================================
// CLICK EN NOTIFICACIÓN
// ================================
self.addEventListener("notificationclick", (event) => {

  event.notification.close();

  // Si pulsa "Cerrar", no hacer nada
  if (event.action === "cerrar") {
    return;
  }

  const url = event.notification.data?.url || "/";

  event.waitUntil(

    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true
      })

      .then((clientList) => {

        // Si la aplicación ya está abierta
        for (const client of clientList) {

          if (
            client.url.includes(self.location.origin) &&
            "focus" in client
          ) {

            client.focus();

            client.navigate(url);

            return;
          }
        }

        // Si la aplicación no está abierta
        if (clients.openWindow) {
          return clients.openWindow(url);
        }

      })
  );
});