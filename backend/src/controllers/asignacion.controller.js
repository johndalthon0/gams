const db = require('../config/database');

exports.getAsignaciones = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        a.id,
        a.estado,
        a.observaciones_devolucion,
        DATE_FORMAT(a.fecha_asignacion,  '%Y-%m-%d') AS fecha_asignacion,
        DATE_FORMAT(a.fecha_devolucion,  '%Y-%m-%d') AS fecha_devolucion,
        e.id     AS equipo_id,
        e.codigo AS equipo_codigo,
        e.nombre AS equipo,
        e.estado AS equipo_estado,
        u.id     AS usuario_id,
        u.nombre AS usuario,
        u.apellido,
        u.email,
        ar.nombre AS area,
        c.nombre  AS cargo,
        s.nombre  AS sucursal
      FROM asignaciones a
      JOIN equipos  e ON e.id = a.equipo_id
      JOIN usuarios u ON u.id = a.usuario_id
      LEFT JOIN areas      ar ON ar.id = u.area_id
      LEFT JOIN cargos     c  ON c.id  = u.cargo_id
      LEFT JOIN sucursales s  ON s.id  = u.sucursal_id
      ORDER BY a.id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.log("ERROR getAsignaciones:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.getUsuarios = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.nombre, u.apellido, u.email
      FROM usuarios u
      JOIN usuario_roles ur ON ur.usuario_id = u.id
      JOIN roles r ON r.id = ur.rol_id
      WHERE r.nombre = 'PERSONAL' AND u.estado = 1
      ORDER BY u.nombre
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getEquipos = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT e.id, e.codigo, e.nombre, t.nombre AS tipo
      FROM equipos e
      LEFT JOIN tipos_equipo t ON t.id = e.tipo_id
      WHERE e.estado = 'DISPONIBLE'
      ORDER BY e.codigo
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCatalogos = async (req, res) => {
  try {
    const [areas]      = await db.query("SELECT * FROM areas ORDER BY nombre");
    const [cargos]     = await db.query("SELECT * FROM cargos ORDER BY nombre");
    const [sucursales] = await db.query("SELECT * FROM sucursales ORDER BY nombre");
    res.json({ areas, cargos, sucursales });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createAsignacion = async (req, res) => {
  try {
    let { usuario_id, equipo_id, area_id, cargo_id, sucursal_id } = req.body;

    if (!usuario_id || !equipo_id)
      return res.status(400).json({ message: "Selecciona usuario y equipo" });

    usuario_id = Number(usuario_id);
    equipo_id  = Number(equipo_id);

    const [eq] = await db.query(
      "SELECT estado FROM equipos WHERE id = ?", [equipo_id]
    );
    if (!eq.length || eq[0].estado !== 'DISPONIBLE')
      return res.status(400).json({ message: "El equipo no está disponible" });

    // Actualizar área/cargo/sucursal del usuario
    await db.query(`
      UPDATE usuarios SET area_id=?, cargo_id=?, sucursal_id=? WHERE id=?
    `, [area_id || null, cargo_id || null, sucursal_id || null, usuario_id]);

    await db.query(`
      INSERT INTO asignaciones (usuario_id, equipo_id, fecha_asignacion, estado)
      VALUES (?, ?, NOW(), 1)
    `, [usuario_id, equipo_id]);

    await db.query(
      "UPDATE equipos SET estado='ASIGNADO' WHERE id=?", [equipo_id]
    );

    res.json({ message: "Asignación realizada correctamente" });
  } catch (err) {
    console.log("ERROR createAsignacion:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// ✅ DEVOLVER — con condición y observaciones
exports.devolver = async (req, res) => {
  try {
    const { id } = req.params;
    const { condicion, observaciones } = req.body;

    if (!condicion)
      return res.status(400).json({ message: "La condición de devolución es obligatoria" });

    const [a] = await db.query(
      "SELECT equipo_id, usuario_id FROM asignaciones WHERE id = ?", [id]
    );
    if (!a.length)
      return res.status(404).json({ message: "Asignación no encontrada" });

    // Guardar observaciones + condición en la asignación
    await db.query(`
      UPDATE asignaciones
      SET estado                   = 0,
          fecha_devolucion         = NOW(),
          observaciones_devolucion = ?
      WHERE id = ?
    `, [`[${condicion}] ${observaciones || ""}`.trim(), id]);

    await db.query(
      "UPDATE equipos SET estado='DISPONIBLE' WHERE id=?", [a[0].equipo_id]
    );

    res.json({ message: "Equipo devuelto correctamente" });
  } catch (err) {
    console.log("ERROR devolver:", err.message);
    res.status(500).json({ message: err.message });
  }
};