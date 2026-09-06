const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');

// =============================================
// REGISTER
// =============================================
exports.register = async (req, res) => {
  try {
    const nombre = String(req.body.nombre || '').trim();
    const apellido = String(req.body.apellido || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const telefono = req.body.telefono || null;

    if (!nombre || !apellido || !email || !password)
      return res.status(400).json({ message: 'Nombre, apellido, email y password son requeridos' });

    // Verificar duplicado
    const [existe] = await db.query(
      'SELECT id FROM usuarios WHERE email = ?', [email]
    );
    if (existe.length > 0)
      return res.status(400).json({ message: 'Email ya registrado' });

    const hashed = bcrypt.hashSync(password, 10);

    const [result] = await db.query(
      `INSERT INTO usuarios (nombre, apellido, email, password, telefono, estado)
       VALUES (?,?,?,?,?,1)`,
      [nombre, apellido, email, hashed, telefono || null]
    );

    const usuarioId = result.insertId;

    const [rolRows] = await db.query(
      "SELECT id FROM roles WHERE nombre = 'PERSONAL' LIMIT 1"
    );

    if (rolRows.length === 0)
      return res.status(500).json({ message: 'Rol PERSONAL no existe en BD' });

    await db.query(
      'INSERT INTO usuario_roles (usuario_id, rol_id) VALUES (?,?)',
      [usuarioId, rolRows[0].id]
    );

    res.json({ message: 'Usuario registrado' });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error al registrar usuario' });
  }
};

// =============================================
// LOGIN
// =============================================
exports.login = async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password)
      return res.status(400).json({ message: 'Email y password requeridos' });

    const [rows] = await db.query(`
      SELECT
        u.id,
        u.nombre,
        u.apellido,
        u.email,
        u.password,
        u.telefono,
        r.nombre AS rol
      FROM usuarios u
      JOIN usuario_roles ur ON ur.usuario_id = u.id
      JOIN roles r          ON r.id = ur.rol_id
      WHERE u.email = ?
        AND u.estado = 1
      LIMIT 1
    `, [email]);

    if (rows.length === 0)
      return res.status(404).json({ message: 'Usuario no encontrado' });

    const userRow = rows[0];

    if (!userRow.password) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const valid = bcrypt.compareSync(password, userRow.password);
    if (!valid)
      return res.status(401).json({ message: 'Password incorrecto' });

    const { password: _, ...user } = userRow;
    const token = generateToken(user);

    res.json({ token, user });

  } catch (error) {
    console.error('LOGIN_ERROR:', error);
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
};

// =============================================
// PERFIL
// =============================================
exports.getPerfil = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        u.id,
        u.nombre,
        u.apellido,
        u.email,
        u.telefono,
        r.nombre AS rol
      FROM usuarios u
      JOIN usuario_roles ur ON ur.usuario_id = u.id
      JOIN roles r          ON r.id = ur.rol_id
      WHERE u.id = ?
      LIMIT 1
    `, [req.user.id]);

    if (rows.length === 0)
      return res.status(404).json({ message: 'Usuario no encontrado' });

    res.json(rows[0]);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error al obtener perfil' });
  }
};