const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// ── RUTAS ────────────────────────────────────────────────────
app.use('/api/auth',           require('./routes/auth.routes'));
app.use('/api/usuarios',       require('./routes/usuario.routes'));
app.use('/api/empleados',      require('./routes/empleado.routes'));
app.use('/api/equipos',        require('./routes/equipo.routes'));
app.use('/api/asignaciones',   require('./routes/asignacion.routes'));
app.use('/api/mantenimientos', require('./routes/mantenimiento.routes'));
app.use('/api/catalogos',      require('./routes/catalogo.routes'));
app.use('/api/inventario',     require('./routes/inventario.routes'));
app.use('/api/compras',        require('./routes/compras.routes'));
app.use('/api/bajas',          require('./routes/baja.routes'));
app.use('/api/ia',             require('./routes/ia.routes'));

app.get('/', (req, res) => res.json({ message: 'API GAMS TI 🚀', version: '2.0' }));

app.use((err, req, res, next) => {
  console.error('ERROR:', err);
  res.status(500).json({ message: 'Error interno del servidor' });
});

module.exports = app;