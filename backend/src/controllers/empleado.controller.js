const db = require('../config/database');
const bcrypt = require('bcryptjs');

// =============================
// LISTAR EMPLEADOS
// =============================
exports.getEmpleados = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        e.id,
        e.estado          AS emp_estado,
        u.id              AS usuario_id,
        u.nombre,
        u.apellido,
        u.email,
        u.telefono,
        u.estado          AS usr_estado,
        s.nombre          AS sucursal,
        c.nombre          AS cargo,
        ar.nombre         AS area,
        r.nombre          AS rol
      FROM empleados e
      JOIN usuarios      u  ON u.id  = e.usuario_id
      LEFT JOIN sucursales s  ON s.id  = u.sucursal_id
      LEFT JOIN cargos     c  ON c.id  = u.cargo_id
      LEFT JOIN areas      ar ON ar.id = u.area_id
      LEFT JOIN usuario_roles ur ON ur.usuario_id = u.id
      LEFT JOIN roles      r  ON r.id  = ur.rol_id
      ORDER BY e.id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.log("ERROR getEmpleados:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// =============================
// SOLO TÉCNICOS (rol EMPLEADO)
// =============================
exports.getTecnicos = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        u.id,
        u.nombre,
        u.apellido,
        c.nombre AS cargo,
        s.nombre AS sucursal
      FROM usuarios u
      JOIN usuario_roles ur ON ur.usuario_id = u.id
      JOIN roles r          ON r.id = ur.rol_id
      LEFT JOIN cargos    c ON c.id = u.cargo_id
      LEFT JOIN sucursales s ON s.id = u.sucursal_id
      WHERE r.nombre = 'EMPLEADO'
        AND u.estado = 1
      ORDER BY u.nombre
    `);
    res.json(rows);
  } catch (err) {
    console.log("ERROR getTecnicos:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// =============================
// CREAR EMPLEADO
// =============================
exports.createEmpleado = async (req, res) => {
  try {
    const {
      nombre, apellido, email, password,
      telefono, sucursal_id, cargo_id,
      area_id, rol_id
    } = req.body;

    if (!nombre || !email || !password || !rol_id)
      return res.status(400).json({ message: 'Campos obligatorios: nombre, email, password, rol' });

    // Verificar email duplicado
    const [existe] = await db.query(
      'SELECT id FROM usuarios WHERE email = ?', [email]
    );
    if (existe.length > 0)
      return res.status(400).json({ message: 'El email ya está registrado' });

    const hash = bcrypt.hashSync(password, 10);

    const [result] = await db.query(`
      INSERT INTO usuarios
        (nombre, apellido, email, password, telefono,
         sucursal_id, cargo_id, area_id, estado)
      VALUES (?,?,?,?,?,?,?,?,1)
    `, [
      nombre, apellido || null, email, hash,
      telefono || null,
      sucursal_id || null,
      cargo_id    || null,
      area_id     || null
    ]);

    const usuarioId = result.insertId;

    await db.query(
      'INSERT INTO usuario_roles (usuario_id, rol_id) VALUES (?,?)',
      [usuarioId, rol_id]
    );

    await db.query(
      'INSERT INTO empleados (usuario_id, estado) VALUES (?,1)',
      [usuarioId]
    );

    res.json({ message: 'Empleado creado correctamente' });
  } catch (err) {
    console.log("ERROR createEmpleado:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// =============================
// ACTIVAR / DESACTIVAR
// =============================
exports.toggleEstado = async (req, res) => {
  try {
    const { id } = req.params;  // id de empleados

    const [emp] = await db.query(
      'SELECT usuario_id, estado FROM empleados WHERE id = ?', [id]
    );
    if (emp.length === 0)
      return res.status(404).json({ message: 'Empleado no encontrado' });

    const nuevoEstado = emp[0].estado === 1 ? 0 : 1;
    const usuarioId  = emp[0].usuario_id;

    // Actualizar en empleados y usuarios
    await db.query(
      'UPDATE empleados SET estado = ? WHERE id = ?',
      [nuevoEstado, id]
    );
    await db.query(
      'UPDATE usuarios SET estado = ? WHERE id = ?',
      [nuevoEstado, usuarioId]
    );

    res.json({
      message: nuevoEstado === 1 ? 'Empleado activado' : 'Empleado desactivado',
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
exports.deleteEmpleado = async (req, res) => {
  try {
    const { id } = req.params;

    const [emp] = await db.query(
      'SELECT usuario_id FROM empleados WHERE id = ?', [id]
    );
    if (emp.length === 0)
      return res.status(404).json({ message: 'No encontrado' });

    const usuarioId = emp[0].usuario_id;

    await db.query('DELETE FROM empleados WHERE id = ?', [id]);
    await db.query('DELETE FROM usuario_roles WHERE usuario_id = ?', [usuarioId]);
    await db.query('DELETE FROM usuarios WHERE id = ?', [usuarioId]);

    res.json({ message: 'Empleado eliminado' });
  } catch (err) {
    console.log("ERROR deleteEmpleado:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// =============================
// COMBOS
// =============================
exports.getSucursales = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM sucursales ORDER BY nombre');
  res.json(rows);
};

exports.getCargos = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM cargos ORDER BY nombre');
  res.json(rows);
};

exports.getAreas = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM areas ORDER BY nombre');
  res.json(rows);
};

exports.getRoles = async (req, res) => {
  const [rows] = await db.query(`
    SELECT * FROM roles
    WHERE nombre IN ('ADMIN','EMPLEADO')
    ORDER BY nombre
  `);
  res.json(rows);
};