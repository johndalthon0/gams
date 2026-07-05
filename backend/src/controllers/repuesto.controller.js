const db = require('../config/database');

exports.getMasUsados = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        r.id,
        r.nombre                                           AS repuesto,
        r.tipo                                             AS tipo_repuesto,
        r.stock                                            AS stock_actual,
        r.precio                                           AS precio_unitario,
        COALESCE(SUM(mr.cantidad), 0)                      AS total_usado,
        COUNT(DISTINCT mr.mantenimiento_id)                AS en_mantenimientos,
        COALESCE(SUM(mr.cantidad * mr.precio_unitario), 0) AS costo_total
      FROM repuestos r
      LEFT JOIN mantenimiento_repuestos mr ON mr.repuesto_id = r.id
      GROUP BY r.id, r.nombre, r.tipo, r.stock, r.precio
      ORDER BY total_usado DESC
    `);
    res.json(rows);
  } catch (err) {
    console.log("ERROR getMasUsados:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// ✅ CORREGIDO: incluye usuario/personal asignado al equipo
exports.getPorEquipo = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        e.codigo                                           AS equipo_codigo,
        e.nombre                                           AS equipo_nombre,
        COALESCE(tp.nombre, 'Sin tipo')                    AS equipo_tipo,
        r.nombre                                           AS repuesto,
        r.tipo                                             AS tipo_repuesto,
        SUM(mr.cantidad)                                   AS cantidad_usada,
        SUM(mr.cantidad * mr.precio_unitario)              AS costo,
        COUNT(DISTINCT m.id)                               AS en_mantenimientos,
        MAX(m.fecha_inicio)                                AS ultimo_uso,
        m.tecnico                                          AS tecnico,
        m.estado                                           AS mant_estado,
        u.nombre                                           AS personal_nombre,
        u.apellido                                         AS personal_apellido,
        COALESCE(c.nombre,  '—')                           AS personal_cargo,
        COALESCE(ar.nombre, '—')                           AS personal_area,
        COALESCE(s.nombre,  '—')                           AS personal_sucursal
      FROM mantenimiento_repuestos mr
      JOIN mantenimientos   m   ON m.id   = mr.mantenimiento_id
      JOIN equipos          e   ON e.id   = m.equipo_id
      JOIN repuestos        r   ON r.id   = mr.repuesto_id
      LEFT JOIN tipos_equipo tp ON tp.id  = e.tipo_id
      LEFT JOIN asignaciones a  ON a.equipo_id = e.id AND a.estado = 1
      LEFT JOIN usuarios    u   ON u.id   = a.usuario_id
      LEFT JOIN cargos      c   ON c.id   = u.cargo_id
      LEFT JOIN areas       ar  ON ar.id  = u.area_id
      LEFT JOIN sucursales  s   ON s.id   = u.sucursal_id
      GROUP BY
        e.id, e.codigo, e.nombre, tp.nombre,
        r.id, r.nombre, r.tipo,
        m.tecnico, m.estado,
        u.nombre, u.apellido, c.nombre, ar.nombre, s.nombre
      ORDER BY e.codigo, cantidad_usada DESC
    `);
    res.json(rows);
  } catch (err) {
    console.log("ERROR getPorEquipo:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.getStock = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        r.id, r.nombre, r.tipo, r.stock, r.precio, r.estado,
        COALESCE(SUM(mr.cantidad), 0) AS total_usado,
        (r.stock * r.precio)          AS valor_inventario
      FROM repuestos r
      LEFT JOIN mantenimiento_repuestos mr ON mr.repuesto_id = r.id
      GROUP BY r.id, r.nombre, r.tipo, r.stock, r.precio, r.estado
      ORDER BY r.nombre
    `);
    res.json(rows);
  } catch (err) {
    console.log("ERROR getStock:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.getTotales = async (req, res) => {
  try {
    const [[totales]] = await db.query(`
      SELECT
        COALESCE(SUM(mr.cantidad), 0)                      AS total_unidades_usadas,
        COALESCE(SUM(mr.cantidad * mr.precio_unitario), 0) AS costo_total_repuestos,
        COUNT(DISTINCT mr.repuesto_id)                     AS tipos_usados,
        COUNT(DISTINCT mr.mantenimiento_id)                AS mantenimientos_con_repuestos
      FROM mantenimiento_repuestos mr
    `);
    const [[stockTotales]] = await db.query(`
      SELECT
        COUNT(*)            AS total_tipos,
        SUM(stock)          AS total_unidades_stock,
        SUM(stock * precio) AS valor_total_inventario
      FROM repuestos
    `);
    res.json({ ...totales, ...stockTotales });
  } catch (err) {
    console.log("ERROR getTotales:", err.message);
    res.status(500).json({ message: err.message });
  }
};