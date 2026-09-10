require('dotenv').config();
const axios = require('axios');
const app = require('./src/app');
const { iniciarRecordatorios } = require('./src/services/notificacion.service');

const PORT = process.env.PORT || 3000;

// Mientras el backend está despierto, mantiene despierto al servicio de IA
// (Render free duerme a los 15 min). No resuelve el arranque en frío inicial,
// pero evita que se duerma mientras se usa la app.
const IA_URL = (process.env.IA_URL || '').replace(/\/+$/, '');
if (IA_URL && !IA_URL.includes('127.0.0.1') && !IA_URL.includes('localhost')) {
    const pingIA = () =>
        axios.get(`${IA_URL}/`, { timeout: 60000 }).catch(() => {});
    setInterval(pingIA, 10 * 60 * 1000);
    setTimeout(pingIA, 15 * 1000);
}

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
    iniciarRecordatorios();
});