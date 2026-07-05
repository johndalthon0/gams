const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// =============================
// RUTAS API
// =============================
app.use('/api/auth',              require('./routes/auth.routes'));
app.use('/api/usuarios',          require('./routes/usuario.routes'));
app.use('/api/empleados',         require('./routes/empleado.routes'));
app.use('/api/equipos',           require('./routes/equipo.routes'));
app.use('/api/asignaciones',      require('./routes/asignacion.routes'));
app.use('/api/mantenimientos',    require('./routes/mantenimiento.routes'));
app.use('/api/catalogos',         require('./routes/catalogo.routes'));
app.use('/api/bajas',             require('./routes/baja.routes'));       // ✅ nueva
app.use('/api/repuestos-reporte', require('./routes/repuesto.routes'));   // ✅ nueva
app.use('/api/configuracion', require('./routes/configuracion.routes'));

// =============================
// RUTA TEST
// =============================
app.get('/', (req, res) => {
  res.json({ message: 'API GAMS funcionando 🚀' });
});

// =============================
// MANEJO DE ERRORES
// =============================
app.use((err, req, res, next) => {
  console.error("ERROR GLOBAL:", err);
  res.status(500).json({ message: "Error interno del servidor" });
});

module.exports = app;