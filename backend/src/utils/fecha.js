// El servidor (Render/DigitalOcean) corre en UTC, no en hora de Bolivia.
// Si se usa new Date().getHours() directo, "ahora" queda 4 horas adelantado
// (ej. 4:00 p.m. en Bolivia se guarda como 8:00 p.m.). Este helper arma el
// DATETIME con la hora real de America/La_Paz sin importar la zona del server.
const ZONA = 'America/La_Paz';

const partesFecha = (fecha) => {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(fecha);
  const get = (tipo) => partes.find((p) => p.type === tipo).value;
  return { y: get('year'), mo: get('month'), d: get('day'), h: get('hour'), mi: get('minute'), s: get('second') };
};

const ahoraMySQL = () => {
  const { y, mo, d, h, mi, s } = partesFecha(new Date());
  return `${y}-${mo}-${d} ${h === '24' ? '00' : h}:${mi}:${s}`;
};

module.exports = { ahoraMySQL, ZONA };
