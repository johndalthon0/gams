const axiosLib = require('axios');
const push     = require('./push.controller');
const IA_URL   = (process.env.IA_URL || 'http://127.0.0.1:5000').replace(/\/+$/, '');

// Cliente hacia el servicio de IA con reintentos: en Render free el servicio
// se duerme y tarda ~50-60s en arrancar (mientras devuelve 502/503/504).
const IA_MAX_RETRY = 9;
const axios = axiosLib.create({ timeout: 120000 });
axios.interceptors.response.use(null, async (error) => {
  const cfg = error.config;
  if (!cfg) return Promise.reject(error);
  const status = error.response?.status;
  const reintentable =
    [502, 503, 504].includes(status) ||
    ['ECONNABORTED', 'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT'].includes(error.code);
  cfg.__retry = cfg.__retry || 0;
  if (reintentable && cfg.__retry < IA_MAX_RETRY) {
    cfg.__retry += 1;
    await new Promise((r) => setTimeout(r, Math.min(8000, 3000 * cfg.__retry)));
    return axios(cfg);
  }
  return Promise.reject(error);
});

const handle = (err, res) => {
  const status = err.response?.status;
  if (err.code === 'ECONNREFUSED' || [502, 503, 504].includes(status) ||
      ['ECONNABORTED', 'ECONNRESET', 'ETIMEDOUT'].includes(err.code))
    return res.status(503).json({
      message: 'El servicio de IA está iniciándose. Espera unos segundos y vuelve a intentar.'
    });
  const msg = err.response?.data?.detail || err.response?.data?.message || err.message;
  return res.status(500).json({ message: msg });
};
// ── predicción ──────────────────────────────────────────────────────────────
exports.getEquiposRiesgo = async (req, res) => {
  try {
    // Solo persistimos predicciones/órdenes/notificaciones en un refresh
    // explícito (botón "Actualizar" o tras entrenar), no en cada carga.
    const refrescar = req.query.refrescar === 'true';
    const { data } = await axios.get(
      `${IA_URL}/ia/equipos-riesgo?guardar=${refrescar}&refrescar=${refrescar}`
    );
    for (const event of data.push_events || []) {
      await push.enviarPushUsuario(event.usuario_id, {
        titulo: event.titulo,
        cuerpo: event.cuerpo,
        url: event.url,
        tag: event.tag,
        icono: '/icon-192.png',
      });
    }
    delete data.push_events;
    res.json(data);
  } catch (err) { handle(err, res); }
};
// ── estadísticas ────────────────────────────────────────────────────────────
exports.getEstadisticas = async (req, res) => {
  try {
    const { data } = await axios.get(`${IA_URL}/ia/estadisticas`);
    res.json(data);
  } catch (err) { handle(err, res); }
};

// ── historial de predicciones ───────────────────────────────────────────────
exports.getHistorial = async (req, res) => {
  try {
    const params = new URLSearchParams();
    if (req.query.equipo_id) params.append('equipo_id', req.query.equipo_id);
    if (req.query.limit)     params.append('limit',     req.query.limit);
    const { data } = await axios.get(`${IA_URL}/ia/historial?${params}`);
    res.json(data);
  } catch (err) { handle(err, res); }
};

// ── entrenamiento ───────────────────────────────────────────────────────────
exports.entrenar = async (req, res) => {
  try {
    const { data } = await axios.post(`${IA_URL}/ia/entrenar?forzar=true`);
    res.json(data);
  } catch (err) { handle(err, res); }
};

exports.getEstadoEntrenamiento = async (req, res) => {
  try {
    const { data } = await axios.get(`${IA_URL}/ia/estado`);
    res.json(data);
  } catch (err) { handle(err, res); }
};

// ── versiones del modelo ────────────────────────────────────────────────────
exports.getVersiones = async (req, res) => {
  try {
    const { data } = await axios.get(`${IA_URL}/ia/versiones`);
    res.json(data);
  } catch (err) { handle(err, res); }
};

// ── órdenes automáticas ─────────────────────────────────────────────────────
exports.getOrdenes = async (req, res) => {
  try {
    const qs = req.query.estado ? `?estado=${req.query.estado}` : '';
    const { data } = await axios.get(`${IA_URL}/ia/ordenes${qs}`);
    res.json(data);
  } catch (err) { handle(err, res); }
};

exports.accionarOrden = async (req, res) => {
  try {
    const { data } = await axios.put(`${IA_URL}/ia/ordenes/accion`, req.body);
    res.json(data);
  } catch (err) { handle(err, res); }
};

// ── notificaciones ──────────────────────────────────────────────────────────
exports.getNotificaciones = async (req, res) => {
  try {
    const uid    = req.user.id;
    const limit  = req.query.limit || 30;
    const { data } = await axios.get(`${IA_URL}/ia/notificaciones/${uid}?limit=${limit}`);
    res.json(data);
  } catch (err) { handle(err, res); }
};

exports.marcarLeida = async (req, res) => {
  try {
    const { data } = await axios.put(`${IA_URL}/ia/notificaciones/${req.params.id}/leer`);
    res.json(data);
  } catch (err) { handle(err, res); }
};

exports.leerTodas = async (req, res) => {
  try {
    const { data } = await axios.put(
      `${IA_URL}/ia/notificaciones/leer-todas/${req.user.id}`
    );
    res.json(data);
  } catch (err) { handle(err, res); }
};


exports.getMisOrdenes = async (req, res) => {
  try {
    const uid = req.user.id;
    const { data } = await axios.get(`${IA_URL}/ia/ordenes/mis-ordenes/${uid}`);
    res.json(data);
  } catch (err) { handle(err, res); }
};

exports.accionOrdenTrabajo = async (req, res) => {
  try {
    const { data } = await axios.put(`${IA_URL}/ia/ordenes/trabajo/accion`, req.body);
    res.json(data);
  } catch (err) { handle(err, res); }
};

exports.agregarRepuestoOrden = async (req, res) => {
  try {
    const { data } = await axios.post(`${IA_URL}/ia/ordenes/trabajo/repuesto`, req.body);
    res.json(data);
  } catch (err) { handle(err, res); }
};

exports.getPanelAdmin = async (req, res) => {
  try {
    const { data } = await axios.get(`${IA_URL}/ia/ordenes/panel-admin`);
    res.json(data);
  } catch (err) { handle(err, res); }
};
// ── responder notificación ─────────────────────────────────────────────────
exports.responderNotificacion = async (req, res) => {
  try {
    const { data } = await axios.put(`${IA_URL}/ia/notificaciones/responder`, {
      ...req.body,
      usuario_id: req.user.id
    });
    res.json(data);
  } catch (err) { handle(err, res); }
};
