const db = require('../config/database');

exports.getBajas = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        b.id,
        b.motivo,
        b.detalle,
        b.fecha_baja,
        e.id            AS equipo_id,
        e.codigo        AS equipo_codigo,
        e.nombre        AS equipo_nombre,
        e.numero_serie,
        e.caracteristicas,
        e.tipo_adquisicion,
        e.proveedor,
        e.fecha_adquisicion,
        COALESCE(t.nombre, 'Sin tipo') AS equipo_tipo,
        COALESCE(s.nombre, '—')        AS sucursal,
        u.nombre        AS usuario_nombre,
        u.apellido      AS usuario_apellido,
        u.email         AS usuario_email,
        COALESCE(c.nombre,  '—') AS cargo,
        COALESCE(ar.nombre, '—') AS area
      FROM bajas b
      JOIN equipos e ON e.id = b.equipo_id
      LEFT JOIN tipos_equipo t  ON t.id  = e.tipo_id
      LEFT JOIN sucursales   s  ON s.id  = e.sucursal_id
      LEFT JOIN usuarios     u  ON u.id  = b.usuario_id
      LEFT JOIN cargos       c  ON c.id  = u.cargo_id
      LEFT JOIN areas        ar ON ar.id = u.area_id
      ORDER BY b.id DESC
    `);
    console.log("getBajas rows:", rows.length);
    res.json(rows);
  } catch (err) {
    console.log("ERROR getBajas:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.getBaja = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(`
      SELECT
        b.*,
        e.codigo        AS equipo_codigo,
        e.nombre        AS equipo_nombre,
        e.numero_serie,
        e.caracteristicas,
        e.tipo_adquisicion,
        e.proveedor,
        e.fecha_adquisicion,
        COALESCE(t.nombre, 'Sin tipo') AS equipo_tipo,
        COALESCE(s.nombre, '—')        AS sucursal,
        u.nombre        AS usuario_nombre,
        u.apellido      AS usuario_apellido,
        u.email         AS usuario_email,
        COALESCE(c.nombre,  '—') AS cargo,
        COALESCE(ar.nombre, '—') AS area
      FROM bajas b
      JOIN equipos e ON e.id = b.equipo_id
      LEFT JOIN tipos_equipo t  ON t.id  = e.tipo_id
      LEFT JOIN sucursales   s  ON s.id  = e.sucursal_id
      LEFT JOIN usuarios     u  ON u.id  = b.usuario_id
      LEFT JOIN cargos       c  ON c.id  = u.cargo_id
      LEFT JOIN areas        ar ON ar.id = u.area_id
      WHERE b.id = ?
    `, [id]);
    if (rows.length === 0)
      return res.status(404).json({ message: 'No encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.log("ERROR getBaja:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.getEstadisticas = async (req, res) => {
  try {
    const [[totales]] = await db.query(`
      SELECT
        COUNT(*)                    AS total_bajas,
        COUNT(DISTINCT b.equipo_id) AS equipos_baja,
        MIN(b.fecha_baja)           AS primera_baja,
        MAX(b.fecha_baja)           AS ultima_baja
      FROM bajas b
    `);
    const [porTipo] = await db.query(`
      SELECT COALESCE(t.nombre,'Sin tipo') AS tipo, COUNT(*) AS cantidad
      FROM bajas b
      JOIN equipos e ON e.id = b.equipo_id
      LEFT JOIN tipos_equipo t ON t.id = e.tipo_id
      GROUP BY t.nombre ORDER BY cantidad DESC
    `);
    const [porMotivo] = await db.query(`
      SELECT COALESCE(motivo,'Sin motivo') AS motivo, COUNT(*) AS cantidad
      FROM bajas GROUP BY motivo ORDER BY cantidad DESC
    `);
    res.json({ totales, porTipo, porMotivo });
  } catch (err) {
    console.log("ERROR getEstadisticas:", err.message);
    res.status(500).json({ message: err.message });
  }
};
// ================================================
// CREAR BAJA (llamada desde routes)
// ================================================
exports.createBaja = async (req, res) => {
  try {
    const usuario_id = req.user.id;
    const { equipo_id, motivo, detalle } = req.body;

    if (!equipo_id || !motivo)
      return res.status(400).json({ message: 'Equipo y motivo son obligatorios' });

    const [eq] = await db.query(
      'SELECT id, estado FROM equipos WHERE id = ?', [equipo_id]
    );
    if (eq.length === 0)
      return res.status(404).json({ message: 'Equipo no encontrado' });
    if (eq[0].estado === 'BAJA')
      return res.status(400).json({ message: 'El equipo ya está dado de baja' });

    await db.query(`
      INSERT INTO bajas (equipo_id, usuario_id, motivo, detalle, fecha_baja)
      VALUES (?, ?, ?, ?, NOW())
    `, [equipo_id, usuario_id, motivo, detalle || null]);

    await db.query(`
      UPDATE equipos SET estado='BAJA', informe_baja=?, fecha_baja=NOW()
      WHERE id=?
    `, [motivo, equipo_id]);

    await db.query(`
      UPDATE asignaciones SET estado=0, fecha_devolucion=NOW()
      WHERE equipo_id=? AND estado=1
    `, [equipo_id]);

    res.json({ message: 'Equipo dado de baja correctamente' });
  } catch (err) {
    console.log("ERROR createBaja:", err.message);
    res.status(500).json({ message: err.message });
  }
};