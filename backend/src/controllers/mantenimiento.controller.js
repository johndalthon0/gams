const db = require('../config/database');

exports.getSolicitudes = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        sm.id, sm.descripcion, sm.prioridad, sm.estado,
        sm.fecha_solicitud, sm.equipo_id,
        u.nombre AS usuario_nombre, u.apellido AS usuario_apellido,
        u.email  AS usuario_email,
        e.codigo AS equipo_codigo, e.nombre AS equipo_nombre,
        t.nombre AS equipo_tipo,
        ar.nombre AS area, c.nombre AS cargo, s.nombre AS sucursal
      FROM solicitudes_mantenimiento sm
      JOIN usuarios u ON u.id = sm.usuario_id
      JOIN equipos  e ON e.id = sm.equipo_id
      LEFT JOIN tipos_equipo t  ON t.id  = e.tipo_id
      LEFT JOIN areas        ar ON ar.id = u.area_id
      LEFT JOIN cargos       c  ON c.id  = u.cargo_id
      LEFT JOIN sucursales   s  ON s.id  = u.sucursal_id
      ORDER BY sm.id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.log("ERROR getSolicitudes:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.getMisSolicitudes = async (req, res) => {
  try {
    const usuario_id = req.user.id;
    const [rows] = await db.query(`
      SELECT sm.id, sm.descripcion, sm.prioridad, sm.estado,
             sm.fecha_solicitud,
             e.codigo AS equipo_codigo, e.nombre AS equipo_nombre,
             t.nombre AS equipo_tipo
      FROM solicitudes_mantenimiento sm
      JOIN equipos e ON e.id = sm.equipo_id
      LEFT JOIN tipos_equipo t ON t.id = e.tipo_id
      WHERE sm.usuario_id = ?
      ORDER BY sm.id DESC
    `, [usuario_id]);
    res.json(rows);
  } catch (err) {
    console.log("ERROR getMisSolicitudes:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.createSolicitud = async (req, res) => {
  try {
    const usuario_id = req.user.id;
    const { equipo_id, descripcion, prioridad } = req.body;
    if (!equipo_id || !descripcion)
      return res.status(400).json({ message: 'Faltan datos' });
    await db.query(`
      INSERT INTO solicitudes_mantenimiento
        (usuario_id, equipo_id, descripcion, prioridad, estado)
      VALUES (?, ?, ?, ?, 'PENDIENTE')
    `, [usuario_id, equipo_id, descripcion, prioridad || 'MEDIA']);
    res.json({ message: 'Solicitud enviada' });
  } catch (err) {
    console.log("ERROR createSolicitud:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.getMantenimientos = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        m.id, m.tipo, m.descripcion, m.descripcion_problema,
        m.descripcion_solucion, m.tecnico, m.tecnico_usuario_id,
        m.fecha_inicio, m.fecha_fin, m.costo, m.estado, m.solicitud_id,
        e.codigo  AS equipo_codigo, e.nombre AS equipo_nombre,
        tp.nombre AS equipo_tipo,
        u.nombre  AS usuario_nombre, u.apellido AS usuario_apellido,
        ar.nombre AS area, c.nombre AS cargo, s.nombre AS sucursal
      FROM mantenimientos m
      JOIN equipos e ON e.id = m.equipo_id
      LEFT JOIN tipos_equipo tp ON tp.id = e.tipo_id
      LEFT JOIN asignaciones a  ON a.equipo_id = e.id AND a.estado = 1
      LEFT JOIN usuarios   u  ON u.id  = a.usuario_id
      LEFT JOIN areas      ar ON ar.id = u.area_id
      LEFT JOIN cargos     c  ON c.id  = u.cargo_id
      LEFT JOIN sucursales s  ON s.id  = u.sucursal_id
      ORDER BY m.id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.log("ERROR getMantenimientos:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.getMantenimiento = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(`
      SELECT m.*, e.codigo AS equipo_codigo, e.nombre AS equipo_nombre,
             e.numero_serie, tp.nombre AS equipo_tipo,
             u.nombre  AS usuario_nombre, u.apellido AS usuario_apellido,
             u.email   AS usuario_email,
             ar.nombre AS area, c.nombre AS cargo, s.nombre AS sucursal
      FROM mantenimientos m
      JOIN equipos e ON e.id = m.equipo_id
      LEFT JOIN tipos_equipo tp ON tp.id = e.tipo_id
      LEFT JOIN asignaciones a  ON a.equipo_id = e.id AND a.estado = 1
      LEFT JOIN usuarios   u  ON u.id  = a.usuario_id
      LEFT JOIN areas      ar ON ar.id = u.area_id
      LEFT JOIN cargos     c  ON c.id  = u.cargo_id
      LEFT JOIN sucursales s  ON s.id  = u.sucursal_id
      WHERE m.id = ?
    `, [id]);
    if (rows.length === 0)
      return res.status(404).json({ message: 'No encontrado' });

    const [repuestos] = await db.query(`
      SELECT mr.id, mr.cantidad, mr.precio_unitario, r.nombre, r.tipo
      FROM mantenimiento_repuestos mr
      JOIN repuestos r ON r.id = mr.repuesto_id
      WHERE mr.mantenimiento_id = ?
    `, [id]);

    res.json({ ...rows[0], repuestos });
  } catch (err) {
    console.log("ERROR getMantenimiento:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.createMantenimiento = async (req, res) => {
  try {
    console.log("===== BODY RECIBIDO =====");
    console.log(JSON.stringify(req.body, null, 2));
    console.log("==========================");

    const {
      solicitud_id, equipo_id, tipo,
      descripcion, descripcion_problema,
      descripcion_solucion, tecnico,
      tecnico_usuario_id, costo, estado, repuestos
    } = req.body;

    if (!equipo_id || !descripcion)
      return res.status(400).json({ message: 'Faltan datos' });

    const [result] = await db.query(`
      INSERT INTO mantenimientos
        (equipo_id, solicitud_id, tipo, descripcion,
         descripcion_problema, descripcion_solucion,
         tecnico, tecnico_usuario_id, fecha_inicio, costo, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)
    `, [
      equipo_id,
      solicitud_id         || null,
      tipo                 || 'CORRECTIVO',
      descripcion,
      descripcion_problema || null,
      descripcion_solucion || null,
      tecnico              || null,
      tecnico_usuario_id   || null,
      costo                || null,
      estado               || 'EN_PROCESO'
    ]);

    const mantenimientoId = result.insertId;
    console.log("Mantenimiento creado con ID:", mantenimientoId);

    if (Array.isArray(repuestos) && repuestos.length > 0) {
      console.log(`Procesando ${repuestos.length} repuestos...`);
      for (const r of repuestos) {
        console.log("Repuesto individual:", r);

        if (!r.repuesto_id || !r.cantidad) {
          console.log("Repuesto omitido por falta de repuesto_id o cantidad");
          continue;
        }

        let precio = Number(r.precio) || 0;
        if (precio === 0) {
          const [rep] = await db.query(
            'SELECT precio FROM repuestos WHERE id = ?', [r.repuesto_id]
          );
          if (rep.length > 0) precio = Number(rep[0].precio) || 0;
        }

        const [insertResult] = await db.query(`
          INSERT INTO mantenimiento_repuestos
            (mantenimiento_id, repuesto_id, cantidad, precio_unitario)
          VALUES (?, ?, ?, ?)
        `, [mantenimientoId, r.repuesto_id, r.cantidad, precio]);

        console.log("Insertado en mantenimiento_repuestos, ID:", insertResult.insertId);

        await db.query(
          'UPDATE repuestos SET stock = stock - ? WHERE id = ?',
          [r.cantidad, r.repuesto_id]
        );
      }
    } else {
      console.log("NO HAY REPUESTOS PARA PROCESAR. repuestos =", repuestos);
    }

    if (solicitud_id) {
      await db.query(
        "UPDATE solicitudes_mantenimiento SET estado='EN_PROCESO' WHERE id=?",
        [solicitud_id]
      );
    }

    await db.query(
      "UPDATE equipos SET estado='MANTENIMIENTO' WHERE id=?",
      [equipo_id]
    );

    res.json({ message: 'Mantenimiento registrado', id: mantenimientoId });
  } catch (err) {
    console.log("ERROR createMantenimiento:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.finalizarMantenimiento = async (req, res) => {
  try {
    const { id } = req.params;
    const { costo, descripcion_solucion } = req.body;
    const usuarioId  = req.user.id;
    const rolUsuario = req.user.rol;

    const [m] = await db.query(
      'SELECT equipo_id, solicitud_id, tecnico_usuario_id FROM mantenimientos WHERE id=?',
      [id]
    );
    if (m.length === 0)
      return res.status(404).json({ message: 'No encontrado' });

    if (
      rolUsuario !== 'ADMIN' &&
      m[0].tecnico_usuario_id !== null &&
      m[0].tecnico_usuario_id !== usuarioId
    ) {
      return res.status(403).json({
        message: 'No tienes permiso para finalizar este mantenimiento.'
      });
    }

    await db.query(`
      UPDATE mantenimientos
      SET estado='FINALIZADO', costo=?,
          descripcion_solucion=?, fecha_fin=NOW()
      WHERE id=?
    `, [costo || null, descripcion_solucion || null, id]);

    if (m[0].solicitud_id) {
      await db.query(
        "UPDATE solicitudes_mantenimiento SET estado='FINALIZADO' WHERE id=?",
        [m[0].solicitud_id]
      );
    }

    const [asig] = await db.query(
      'SELECT id FROM asignaciones WHERE equipo_id = ? AND estado = 1',
      [m[0].equipo_id]
    );
    const nuevoEstado = asig.length > 0 ? 'ASIGNADO' : 'DISPONIBLE';

    await db.query(
      'UPDATE equipos SET estado = ? WHERE id = ?',
      [nuevoEstado, m[0].equipo_id]
    );

    res.json({ message: 'Mantenimiento finalizado', estado_equipo: nuevoEstado });
  } catch (err) {
    console.log("ERROR finalizarMantenimiento:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.reasignarTecnico = async (req, res) => {
  try {
    const { id } = req.params;
    const { tecnico, tecnico_usuario_id } = req.body;
    await db.query(
      'UPDATE mantenimientos SET tecnico=?, tecnico_usuario_id=? WHERE id=?',
      [tecnico || null, tecnico_usuario_id || null, id]
    );
    res.json({ message: 'Técnico reasignado' });
  } catch (err) {
    console.log("ERROR reasignarTecnico:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.getRepuestos = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM repuestos WHERE stock > 0 ORDER BY nombre'
    );
    res.json(rows);
  } catch (err) {
    console.log("ERROR getRepuestos:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.getEquiposParaMantenimiento = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT e.id, e.codigo, e.nombre, e.estado, t.nombre AS tipo
      FROM equipos e
      LEFT JOIN tipos_equipo t ON t.id = e.tipo_id
      WHERE e.estado != 'BAJA'
      ORDER BY e.nombre
    `);
    res.json(rows);
  } catch (err) {
    console.log("ERROR getEquiposParaMantenimiento:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.getReportes = async (req, res) => {
  try {
    const { equipo, usuario, estado, fecha_ini, fecha_fin } = req.query;
    let where = "WHERE 1=1";
    const params = [];

    if (equipo)    { where += " AND (e.codigo LIKE ? OR e.nombre LIKE ?)"; params.push(`%${equipo}%`, `%${equipo}%`); }
    if (usuario)   { where += " AND (u.nombre LIKE ? OR u.apellido LIKE ?)"; params.push(`%${usuario}%`, `%${usuario}%`); }
    if (estado)    { where += " AND m.estado = ?"; params.push(estado); }
    if (fecha_ini) { where += " AND m.fecha_inicio >= ?"; params.push(fecha_ini); }
    if (fecha_fin) { where += " AND m.fecha_inicio <= ?"; params.push(fecha_fin); }

    const [rows] = await db.query(`
      SELECT m.id, m.tipo, m.descripcion, m.descripcion_problema,
             m.descripcion_solucion, m.tecnico, m.fecha_inicio, m.fecha_fin,
             m.costo, m.estado,
             e.codigo  AS equipo_codigo, e.nombre AS equipo_nombre,
             e.numero_serie, tp.nombre AS equipo_tipo,
             u.nombre  AS usuario_nombre, u.apellido AS usuario_apellido,
             ar.nombre AS area, c.nombre AS cargo, s.nombre AS sucursal,
             (SELECT COALESCE(SUM(mr.cantidad),0)
              FROM mantenimiento_repuestos mr WHERE mr.mantenimiento_id = m.id)
             AS total_repuestos_qty,
             (SELECT COALESCE(SUM(mr.cantidad * mr.precio_unitario),0)
              FROM mantenimiento_repuestos mr WHERE mr.mantenimiento_id = m.id)
             AS total_repuestos_costo
      FROM mantenimientos m
      JOIN equipos e ON e.id = m.equipo_id
      LEFT JOIN tipos_equipo tp ON tp.id = e.tipo_id
      LEFT JOIN asignaciones a  ON a.equipo_id = e.id AND a.estado = 1
      LEFT JOIN usuarios   u  ON u.id  = a.usuario_id
      LEFT JOIN areas      ar ON ar.id = u.area_id
      LEFT JOIN cargos     c  ON c.id  = u.cargo_id
      LEFT JOIN sucursales s  ON s.id  = u.sucursal_id
      ${where}
      ORDER BY m.id DESC
    `, params);

    const totalCosto    = rows.reduce((a, r) => a + Number(r.costo || 0), 0);
    const totalRepCosto = rows.reduce((a, r) => a + Number(r.total_repuestos_costo || 0), 0);
    const totalRepQty   = rows.reduce((a, r) => a + Number(r.total_repuestos_qty || 0), 0);

    res.json({
      data: rows,
      totales: {
        registros:       rows.length,
        costo_total:     totalCosto,
        repuestos_qty:   totalRepQty,
        repuestos_costo: totalRepCosto,
        costo_general:   totalCosto + totalRepCosto
      }
    });
  } catch (err) {
    console.log("ERROR getReportes:", err.message);
    res.status(500).json({ message: err.message });
  }
};