const db     = require('../config/database');
const bcrypt = require('bcryptjs');

// =============================
// GET MI PERFIL
// =============================
exports.getMiPerfil = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, nombre, apellido, email, telefono, estado
      FROM usuarios WHERE id = ?
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
      return res.status(400).json({ message: 'El email ya está en uso por otro usuario' });

    await db.query(`
      UPDATE usuarios SET nombre=?, apellido=?, email=?, telefono=? WHERE id=?
    `, [nombre, apellido || null, email, telefono || null, req.user.id]);

    res.json({ message: 'Perfil actualizado correctamente' });
  } catch (err) {
    console.log("ERROR updateMiPerfil:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// =============================
// CAMBIAR MI CONTRASEÑA
// =============================
exports.cambiarMiPassword = async (req, res) => {
  try {
    const { passwordNueva } = req.body;
    if (!passwordNueva || passwordNueva.length < 6)
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });

    const hash = bcrypt.hashSync(passwordNueva, 10);
    await db.query(
      'UPDATE usuarios SET password = ? WHERE id = ?',
      [hash, req.user.id]
    );
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.log("ERROR cambiarMiPassword:", err.message);
    res.status(500).json({ message: err.message });
  }
};