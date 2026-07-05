const db     = require('../config/database');
const bcrypt = require('bcryptjs');

// =============================
// LISTAR USUARIOS (PERSONAL)
// =============================
exports.getUsuarios = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        u.id, u.nombre, u.apellido, u.email,
        u.telefono, u.estado,
        ar.nombre AS area,
        c.nombre  AS cargo,
        s.nombre  AS sucursal
      FROM usuarios u
      JOIN usuario_roles ur ON ur.usuario_id = u.id
      JOIN roles r          ON r.id = ur.rol_id
      LEFT JOIN areas      ar ON ar.id = u.area_id
      LEFT JOIN cargos     c  ON c.id  = u.cargo_id
      LEFT JOIN sucursales s  ON s.id  = u.sucursal_id
      WHERE r.nombre = 'PERSONAL'
      ORDER BY u.id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.log("ERROR getUsuarios:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// =============================
// CREAR USUARIO
// =============================
exports.createUsuario = async (req, res) => {
  try {
    const { nombre, apellido, email, password, telefono } = req.body;

    if (!nombre || !email || !password)
      return res.status(400).json({ message: 'Nombre, email y contraseña son obligatorios' });

    const [existe] = await db.query(
      'SELECT id FROM usuarios WHERE email = ?', [email]
    );
    if (existe.length > 0)
      return res.status(400).json({ message: 'El email ya está registrado' });

    const hash = bcrypt.hashSync(password, 10);

    const [result] = await db.query(`
      INSERT INTO usuarios (nombre, apellido, email, password, telefono, estado)
      VALUES (?, ?, ?, ?, ?, 1)
    `, [nombre, apellido || null, email, hash, telefono || null]);

    const usuarioId = result.insertId;

    const [rol] = await db.query(
      "SELECT id FROM roles WHERE nombre = 'PERSONAL'"
    );
    await db.query(
      'INSERT INTO usuario_roles (usuario_id, rol_id) VALUES (?, ?)',
      [usuarioId, rol[0].id]
    );

    res.json({ message: 'Usuario creado correctamente' });
  } catch (err) {
    console.log("ERROR createUsuario:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// =============================
// ACTUALIZAR DATOS
// =============================
exports.updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, email, telefono } = req.body;

    if (!nombre || !email)
      return res.status(400).json({ message: 'Nombre y email son obligatorios' });

    // Verificar email duplicado en otro usuario
    const [existe] = await db.query(
      'SELECT id FROM usuarios WHERE email = ? AND id != ?', [email, id]
    );
    if (existe.length > 0)
      return res.status(400).json({ message: 'El email ya está en uso por otro usuario' });

    await db.query(`
      UPDATE usuarios
      SET nombre=?, apellido=?, email=?, telefono=?
      WHERE id=?
    `, [nombre, apellido || null, email, telefono || null, id]);

    res.json({ message: 'Usuario actualizado' });
  } catch (err) {
    console.log("ERROR updateUsuario:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// =============================
// CAMBIAR CONTRASEÑA
// =============================
exports.cambiarPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6)
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });

    const hash = bcrypt.hashSync(password, 10);

    await db.query(
      'UPDATE usuarios SET password = ? WHERE id = ?',
      [hash, id]
    );

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.log("ERROR cambiarPassword:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// =============================
// ACTIVAR / DESACTIVAR
// =============================
exports.toggleEstado = async (req, res) => {
  try {
    const { id } = req.params;

    const [u] = await db.query(
      'SELECT estado FROM usuarios WHERE id = ?', [id]
    );
    if (u.length === 0)
      return res.status(404).json({ message: 'Usuario no encontrado' });

    const nuevoEstado = u[0].estado === 1 ? 0 : 1;

    await db.query(
      'UPDATE usuarios SET estado = ? WHERE id = ?',
      [nuevoEstado, id]
    );

    res.json({
      message: nuevoEstado === 1 ? 'Usuario activado' : 'Usuario desactivado',
      estado: nuevoEstado
    });
  } catch (err) {
    console.log("ERROR toggleEstado:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// =============================
// ELIMINAR
// =============================
exports.deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM usuario_roles WHERE usuario_id = ?', [id]);
    await db.query('DELETE FROM usuarios WHERE id = ?', [id]);
    res.json({ message: 'Usuario eliminado' });
  } catch (err) {
    console.log("ERROR deleteUsuario:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// =============================
// GET PERFIL DEL ADMIN LOGUEADO
// =============================
exports.getMiPerfil = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.nombre, u.apellido, u.email, u.telefono, u.estado
      FROM usuarios u
      WHERE u.id = ?
    `, [req.user.id]);
    if (rows.length === 0)
      return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.log("ERROR getMiPerfil:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// =============================
// ACTUALIZAR MI PERFIL
// =============================
exports.updateMiPerfil = async (req, res) => {
  try {
    const { nombre, apellido, email, telefono } = req.body;
    if (!nombre || !email)
      return res.status(400).json({ message: 'Nombre y email son obligatorios' });

    const [existe] = await db.query(
      'SELECT id FROM usuarios WHERE email = ? AND id != ?',
      [email, req.user.id]
    );
    if (existe.length > 0)
      return res.status(400).json({ message: 'El email ya está en uso' });

    await db.query(`
      UPDATE usuarios SET nombre=?, apellido=?, email=?, telefono=? WHERE id=?
    `, [nombre, apellido || null, email, telefono || null, req.user.id]);

    res.json({ message: 'Perfil actualizado' });
  } catch (err) {
    console.log("ERROR updateMiPerfil:", err.message);
    res.status(500).json({ message: err.message });
  }
};
