const webpush = require('web-push');
const db      = require('../config/database');

// Configurar VAPID — si las claves no son válidas, el push queda deshabilitado
// pero el servidor NO se cae.
let PUSH_HABILITADO = false;
try {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      process.env.VAPID_EMAIL || 'mailto:admin@gams.gob.bo',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    PUSH_HABILITADO = true;
  } else {
    console.warn('⚠️  Push deshabilitado: faltan VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY en .env');
  }
} catch (e) {
  console.warn('⚠️  Push deshabilitado: claves VAPID inválidas —', e.message);
}

// Asegurar la tabla de suscripciones (el proyecto no tiene sistema de migraciones)
db.query(`
  CREATE TABLE IF NOT EXISTS push_suscripciones (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id          INT NOT NULL,
    endpoint            VARCHAR(500) NOT NULL,
    p256dh              VARCHAR(255) NOT NULL,
    auth                VARCHAR(255) NOT NULL,
    activa              TINYINT(1) DEFAULT 1,
    fecha_creacion      DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_usuario_endpoint (usuario_id, endpoint(191)),
    KEY idx_usuario (usuario_id)
  )
`).catch(e => console.error('push_suscripciones:', e.message));

// ── Guardar suscripción ───────────────────────────────────────
exports.suscribir = async (req, res) => {
  try {
    const usuario_id = req.user.id;
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys?.auth || !keys?.p256dh)
      return res.status(400).json({ message: 'Suscripción inválida' });

    const [[exist]] = await db.query(
      'SELECT id FROM push_suscripciones WHERE usuario_id=? AND endpoint=?',
      [usuario_id, endpoint]
    );

    if (exist) {
      await db.query(
        `UPDATE push_suscripciones
         SET p256dh=?, auth=?, activa=1, fecha_actualizacion=NOW()
         WHERE id=?`,
        [keys.p256dh, keys.auth, exist.id]
      );
    } else {
      await db.query(
        `INSERT INTO push_suscripciones
           (usuario_id, endpoint, p256dh, auth, activa)
         VALUES (?,?,?,?,1)`,
        [usuario_id, endpoint, keys.p256dh, keys.auth]
      );
    }

    res.json({ message: 'Suscripción guardada' });
  } catch (err) {
    console.error('suscribir:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// ── Eliminar suscripción ──────────────────────────────────────
exports.desuscribir = async (req, res) => {
  try {
    await db.query(
      'UPDATE push_suscripciones SET activa=0 WHERE usuario_id=?',
      [req.user.id]
    );
    res.json({ message: 'Desuscrito' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Test push ─────────────────────────────────────────────────
exports.testPush = async (req, res) => {
  try {
    const enviado = await enviarPushUsuario(req.user.id, {
      titulo: '🔔 GAMS TI — Prueba',
      cuerpo: 'Las notificaciones push están funcionando correctamente.',
      icono:  '/icon-192.png',
      url:    '/',
    });
    res.json({ message: 'Push de prueba enviado', enviado });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── ENVIAR PUSH A UN USUARIO ──────────────────────────────────
const enviarPushUsuario = async (usuario_id, payload) => {
  if (!PUSH_HABILITADO) return 0;
  try {
    const [subs] = await db.query(
      'SELECT * FROM push_suscripciones WHERE usuario_id=? AND activa=1',
      [usuario_id]
    );

    let enviados = 0;
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({
            titulo: payload.titulo || 'GAMS TI',
            cuerpo: payload.cuerpo || '',
            icono:  payload.icono  || '/icon-192.png',
            badge:  payload.badge  || '/icon-192.png',
            url:    payload.url    || '/',
            tag:    payload.tag    || 'gams-notif',
          }),
          { TTL: 86400 }
        );
        enviados++;
      } catch (e) {
        // Endpoint expirado → desactivar
        if (e.statusCode === 410 || e.statusCode === 404) {
          await db.query(
            'UPDATE push_suscripciones SET activa=0 WHERE id=?',
            [sub.id]
          );
        }
        console.error(`Push sub ${sub.id}:`, e.statusCode, e.body);
      }
    }
    return enviados;
  } catch (err) {
    console.error('enviarPushUsuario:', err.message);
    return 0;
  }
};

// ── ENVIAR PUSH A MÚLTIPLES ───────────────────────────────────
const enviarPushMultiple = async (usuario_ids, payload) => {
  for (const uid of usuario_ids) {
    await enviarPushUsuario(uid, payload);
  }
};

// ── ESTADO DE LA SUSCRIPCIÓN DEL USUARIO ──────────────────────
exports.estado = async (req, res) => {
  try {
    const [[row]] = await db.query(
      'SELECT COUNT(*) AS n FROM push_suscripciones WHERE usuario_id=? AND activa=1',
      [req.user.id]
    );
    res.json({ activo: row.n > 0, dispositivos: row.n });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── BROADCAST (solo ADMIN) ────────────────────────────────────
// Envía una notificación push + registro en `notificaciones` a un grupo de usuarios.
exports.broadcast = async (req, res) => {
  try {
    const { titulo, cuerpo, url, destino } = req.body;
    if (!titulo || !cuerpo)
      return res.status(400).json({ message: 'Título y mensaje son obligatorios' });

    // destino: 'TODOS' | 'ADMIN' | 'EMPLEADO' | 'PERSONAL'
    let sql = `SELECT DISTINCT u.id FROM usuarios u`;
    const params = [];
    if (destino && destino !== 'TODOS') {
      sql += ` JOIN usuario_roles ur ON ur.usuario_id = u.id
               JOIN roles r ON r.id = ur.rol_id
               WHERE u.estado = 1 AND r.nombre = ?`;
      params.push(destino);
    } else {
      sql += ` WHERE u.estado = 1`;
    }
    const [usuarios] = await db.query(sql, params);
    const ids = usuarios.map(u => u.id);

    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    const fecha = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
                  `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    for (const uid of ids) {
      try {
        await db.query(
          `INSERT INTO notificaciones
             (usuario_id, tipo, titulo, mensaje, leida, datos_json, respondida, respuesta, fecha)
           VALUES (?,?,?,?,0,?,1,'PENDIENTE',?)`,
          [uid, 'ALERTA', titulo.substring(0, 255), cuerpo.substring(0, 2000),
           JSON.stringify({ url: url || '/' }), fecha]
        );
      } catch (e) { console.error('broadcast notif:', e.message); }
    }

    await enviarPushMultiple(ids, {
      titulo, cuerpo, url: url || '/', icono: '/icon-192.png', tag: `broadcast-${Date.now()}`,
    });

    res.json({ message: `Notificación enviada a ${ids.length} usuario(s)`, destinatarios: ids.length });
  } catch (err) {
    console.error('broadcast:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// Exportar funciones utilitarias
exports.enviarPushUsuario  = enviarPushUsuario;
exports.enviarPushMultiple = enviarPushMultiple;