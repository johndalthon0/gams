const db = require('../config/database');
const { registrarMovimiento } = require('./inventario.controller');

// ── PROVEEDORES ───────────────────────────────────────────────────────────────
exports.getProveedores = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM proveedores ORDER BY nombre ASC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createProveedor = async (req, res) => {
  try {
    const { nombre, contacto, telefono, email, direccion } = req.body;
    if (!nombre) return res.status(400).json({ message: 'Nombre requerido' });
    const [r] = await db.query(
      'INSERT INTO proveedores (nombre, contacto, telefono, email, direccion) VALUES (?,?,?,?,?)',
      [nombre, contacto || null, telefono || null, email || null, direccion || null]
    );
    res.json({ message: 'Proveedor creado', id: r.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, contacto, telefono, email, direccion, estado } = req.body;
    await db.query(
      'UPDATE proveedores SET nombre=?, contacto=?, telefono=?, email=?, direccion=?, estado=? WHERE id=?',
      [nombre, contacto || null, telefono || null, email || null, direccion || null, estado !== undefined ? estado : 1, id]
    );
    res.json({ message: 'Proveedor actualizado' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE proveedores SET estado=0 WHERE id=?', [id]);
    res.json({ message: 'Proveedor desactivado' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── COMPRAS ───────────────────────────────────────────────────────────────────
exports.getCompras = async (req, res) => {
  try {
    const { estado, proveedor_id } = req.query;
    let where = 'WHERE 1=1';
    const params = [];

    if (estado)       { where += ' AND c.estado=?';       params.push(estado); }
    if (proveedor_id) { where += ' AND c.proveedor_id=?'; params.push(proveedor_id); }

    const [rows] = await db.query(`
      SELECT
        c.*,
        p.nombre    AS proveedor_nombre,
        u.nombre    AS usuario_nombre,
        u.apellido  AS usuario_apellido,
        (SELECT COUNT(*) FROM compras_detalle cd WHERE cd.compra_id = c.id) AS num_items
      FROM compras c
      LEFT JOIN proveedores p ON p.id = c.proveedor_id
      LEFT JOIN usuarios    u ON u.id = c.usuario_id
      ${where}
      ORDER BY c.fecha_creacion DESC
    `, params);

    res.json(rows);
  } catch (err) {
    console.error('getCompras:', err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.getCompra = async (req, res) => {
  try {
    const { id } = req.params;

    const [[compra]] = await db.query(`
      SELECT
        c.*,
        p.nombre    AS proveedor_nombre,
        p.telefono  AS proveedor_telefono,
        p.email     AS proveedor_email,
        u.nombre    AS usuario_nombre,
        u.apellido  AS usuario_apellido
      FROM compras c
      LEFT JOIN proveedores p ON p.id = c.proveedor_id
      LEFT JOIN usuarios    u ON u.id = c.usuario_id
      WHERE c.id = ?
    `, [id]);

    if (!compra) return res.status(404).json({ message: 'Compra no encontrada' });

    const [detalle] = await db.query(`
      SELECT
        cd.*,
        r.nombre AS producto_nombre,
        r.codigo AS producto_codigo,
        r.tipo   AS producto_tipo,
        r.stock  AS stock_actual
      FROM compras_detalle cd
      JOIN repuestos r ON r.id = cd.repuesto_id
      WHERE cd.compra_id = ?
    `, [id]);

    res.json({ ...compra, detalle });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createCompra = async (req, res) => {
  try {
    const {
      proveedor_id, nro_factura, fecha_compra,
      observaciones, detalle,
    } = req.body;

    if (!fecha_compra)
      return res.status(400).json({ message: 'Fecha de compra requerida' });
    if (!Array.isArray(detalle) || detalle.length === 0)
      return res.status(400).json({ message: 'Agrega al menos un producto' });

    // Calcular total
    const total = detalle.reduce((acc, d) =>
      acc + (parseFloat(d.precio_unit) * parseInt(d.cantidad)), 0
    );

    const [r] = await db.query(
      `INSERT INTO compras
         (proveedor_id, nro_factura, fecha_compra, estado, total, observaciones, usuario_id)
       VALUES (?,?,?,'PENDIENTE',?,?,?)`,
      [proveedor_id || null, nro_factura || null, fecha_compra,
       total, observaciones || null, req.user?.id || null]
    );

    const compraId = r.insertId;

    // Insertar detalle
    for (const d of detalle) {
      if (!d.repuesto_id || !d.cantidad || d.cantidad <= 0) continue;
      const subtotal = parseFloat(d.precio_unit || 0) * parseInt(d.cantidad);
      await db.query(
        `INSERT INTO compras_detalle (compra_id, repuesto_id, cantidad, precio_unit, subtotal)
         VALUES (?,?,?,?,?)`,
        [compraId, d.repuesto_id, d.cantidad, d.precio_unit || 0, subtotal]
      );
    }

    res.json({ message: 'Compra registrada', id: compraId });
  } catch (err) {
    console.error('createCompra:', err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.updateEstadoCompra = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, fecha_recepcion } = req.body;

    if (!['PENDIENTE','RECIBIDA','CANCELADA'].includes(estado))
      return res.status(400).json({ message: 'Estado inválido' });

    const [[compra]] = await db.query('SELECT * FROM compras WHERE id=?', [id]);
    if (!compra) return res.status(404).json({ message: 'Compra no encontrada' });

    if (compra.estado === 'RECIBIDA')
      return res.status(400).json({ message: 'Esta compra ya fue recibida y no se puede modificar' });
    if (compra.estado === 'CANCELADA')
      return res.status(400).json({ message: 'Esta compra fue cancelada' });

    await db.query(
      'UPDATE compras SET estado=?, fecha_recepcion=? WHERE id=?',
      [estado, fecha_recepcion || null, id]
    );

    // Si RECIBIDA → aumentar stock de cada producto
    if (estado === 'RECIBIDA') {
      const [detalle] = await db.query(
        'SELECT * FROM compras_detalle WHERE compra_id=?', [id]
      );

      for (const d of detalle) {
        const [[rep]] = await db.query(
          'SELECT stock FROM repuestos WHERE id=?', [d.repuesto_id]
        );
        if (!rep) continue;

        const stock_antes   = rep.stock;
        const stock_despues = stock_antes + d.cantidad;

        await db.query(
          'UPDATE repuestos SET stock=? WHERE id=?',
          [stock_despues, d.repuesto_id]
        );

        // Actualizar precio de compra en el producto
        await db.query(
          'UPDATE repuestos SET precio=? WHERE id=?',
          [d.precio_unit, d.repuesto_id]
        );

        await registrarMovimiento(
          d.repuesto_id, 'ENTRADA', d.cantidad,
          stock_antes, stock_despues,
          `Compra #${id}${compra.nro_factura ? ' — ' + compra.nro_factura : ''}`,
          `COMPRA-${id}`,
          req.user?.id
        );
      }
    }

    res.json({ message: `Compra marcada como ${estado}` });
  } catch (err) {
    console.error('updateEstadoCompra:', err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteCompra = async (req, res) => {
  try {
    const { id } = req.params;
    const [[compra]] = await db.query('SELECT estado FROM compras WHERE id=?', [id]);
    if (!compra) return res.status(404).json({ message: 'No encontrada' });
    if (compra.estado === 'RECIBIDA')
      return res.status(400).json({ message: 'No se puede eliminar una compra recibida' });

    await db.query('DELETE FROM compras_detalle WHERE compra_id=?', [id]);
    await db.query('DELETE FROM compras WHERE id=?', [id]);
    res.json({ message: 'Compra eliminada' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getResumenCompras = async (req, res) => {
  try {
    const [[totales]] = await db.query(`
      SELECT
        COUNT(*)                                              AS total,
        SUM(CASE WHEN estado='PENDIENTE'  THEN 1 ELSE 0 END) AS pendientes,
        SUM(CASE WHEN estado='RECIBIDA'   THEN 1 ELSE 0 END) AS recibidas,
        SUM(CASE WHEN estado='CANCELADA'  THEN 1 ELSE 0 END) AS canceladas,
        COALESCE(SUM(CASE WHEN estado='RECIBIDA' THEN total ELSE 0 END),0) AS total_invertido
      FROM compras
    `);
    res.json(totales);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};