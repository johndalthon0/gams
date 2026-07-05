const db = require('../config/database');

// =============================================
// LISTAR TODOS (Admin)
// =============================================
exports.getEquipos = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        e.*,
        t.nombre AS tipo,
        s.nombre AS sucursal
      FROM equipos e
      LEFT JOIN tipos_equipo t ON t.id = e.tipo_id
      LEFT JOIN sucursales  s ON s.id = e.sucursal_id
      ORDER BY e.id DESC
    `);
    res.json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error listar equipos' });
  }
};

// =============================================
// MIS EQUIPOS (usuario logueado)
// =============================================
exports.getMisEquipos = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const [rows] = await db.query(`
      SELECT
        e.*,
        t.nombre AS tipo,
        s.nombre AS sucursal,
        a.fecha_asignacion
      FROM asignaciones a
      JOIN equipos e      ON e.id = a.equipo_id
      LEFT JOIN tipos_equipo t ON t.id = e.tipo_id
      LEFT JOIN sucursales  s ON s.id = e.sucursal_id
      WHERE a.usuario_id = ?
        AND a.estado = 1
      ORDER BY a.fecha_asignacion DESC
    `, [usuarioId]);
    res.json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error obtener mis equipos' });
  }
};

// =============================================
// GET UNO
// =============================================
exports.getEquipo = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      'SELECT * FROM equipos WHERE id = ?', [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: 'Equipo no encontrado' });
    res.json(rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error obtener equipo' });
  }
};

// =============================================
// CREAR
// =============================================
exports.createEquipo = async (req, res) => {
  try {
    let {
      codigo, nombre, tipo_id, sucursal_id,
      numero_serie, tipo_adquisicion,
      caracteristicas, proveedor,
      fecha_adquisicion, observaciones
    } = req.body;

    if (!codigo || !nombre || !tipo_id)
      return res.status(400).json({ message: 'Completa los campos obligatorios' });

    codigo = codigo.trim();
    nombre = nombre.trim();

    const [existe] = await db.query(
      'SELECT id FROM equipos WHERE codigo = ?', [codigo]
    );
    if (existe.length > 0)
      return res.status(400).json({ message: 'El código ya existe' });

    await db.query(`
      INSERT INTO equipos
        (codigo, nombre, tipo_id, sucursal_id, numero_serie,
         tipo_adquisicion, caracteristicas, proveedor,
         fecha_adquisicion, observaciones, estado)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)
    `, [
      codigo, nombre, tipo_id,
      sucursal_id       || null,
      numero_serie      || null,
      tipo_adquisicion  || 'Propio',
      caracteristicas   || null,
      proveedor         || null,
      fecha_adquisicion || null,
      observaciones     || null,
      'DISPONIBLE'
    ]);

    res.json({ message: 'Equipo registrado' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error registrar equipo' });
  }
};

// =============================================
// EDITAR
// =============================================
exports.updateEquipo = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      codigo, nombre, tipo_id, sucursal_id,
      numero_serie, tipo_adquisicion,
      caracteristicas, proveedor,
      fecha_adquisicion, observaciones
    } = req.body;

    await db.query(`
      UPDATE equipos
      SET codigo=?, nombre=?, tipo_id=?, sucursal_id=?,
          numero_serie=?, tipo_adquisicion=?, caracteristicas=?,
          proveedor=?, fecha_adquisicion=?, observaciones=?
      WHERE id=?
    `, [
      codigo, nombre, tipo_id,
      sucursal_id       || null,
      numero_serie      || null,
      tipo_adquisicion  || null,
      caracteristicas   || null,
      proveedor         || null,
      fecha_adquisicion || null,
      observaciones     || null,
      id
    ]);

    res.json({ message: 'Equipo actualizado' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error actualizar equipo' });
  }
};

// =============================================
// DAR BAJA ← CORREGIDO: manda detalle a tabla bajas
// =============================================
exports.darBajaEquipo = async (req, res) => {
  try {
    const { id }                      = req.params;
    const { informe_baja, detalle }   = req.body;  // ✅ recibe detalle
    const usuario_id                  = req.user.id;

    if (!informe_baja)
      return res.status(400).json({ message: 'El motivo de baja es obligatorio' });

    const [eq] = await db.query(
      'SELECT estado FROM equipos WHERE id = ?', [id]
    );
    if (eq.length === 0)
      return res.status(404).json({ message: 'Equipo no encontrado' });
    if (eq[0].estado === 'BAJA')
      return res.status(400).json({ message: 'El equipo ya está dado de baja' });

    // ✅ Guardar en tabla bajas CON detalle
    await db.query(`
      INSERT INTO bajas (equipo_id, usuario_id, motivo, detalle, fecha_baja)
      VALUES (?, ?, ?, ?, NOW())
    `, [id, usuario_id, informe_baja, detalle || null]);

    // Actualizar equipo
    await db.query(`
      UPDATE equipos
      SET estado='BAJA', informe_baja=?, fecha_baja=NOW()
      WHERE id=?
    `, [informe_baja, id]);

    // Cerrar asignaciones activas
    await db.query(`
      UPDATE asignaciones
      SET estado=0, fecha_devolucion=NOW()
      WHERE equipo_id=? AND estado=1
    `, [id]);

    res.json({ message: 'Equipo dado de baja' });
  } catch (err) {
    console.log("ERROR darBajaEquipo:", err.message);
    res.status(500).json({ message: err.message });
  }
};