const db = require('../config/database');

// ── utilidad: registrar movimiento ────────────────────────────────────────────
const registrarMovimiento = async (repuesto_id, tipo, cantidad, stock_antes, stock_despues, motivo, referencia, usuario_id) => {
  await db.query(
    `INSERT INTO inventario_movimientos
       (repuesto_id, tipo, cantidad, stock_antes, stock_despues, motivo, referencia, usuario_id)
     VALUES (?,?,?,?,?,?,?,?)`,
    [repuesto_id, tipo, cantidad, stock_antes, stock_despues, motivo || null, referencia || null, usuario_id || null]
  );
};

// ── CATEGORÍAS ────────────────────────────────────────────────────────────────
exports.getCategorias = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM inventario_categorias ORDER BY nombre ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createCategoria = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    if (!nombre) return res.status(400).json({ message: 'Nombre requerido' });
    const [r] = await db.query(
      'INSERT INTO inventario_categorias (nombre, descripcion) VALUES (?,?)',
      [nombre, descripcion || null]
    );
    res.json({ message: 'Categoría creada', id: r.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;
    await db.query(
      'UPDATE inventario_categorias SET nombre=?, descripcion=? WHERE id=?',
      [nombre, descripcion || null, id]
    );
    res.json({ message: 'Categoría actualizada' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM inventario_categorias WHERE id=?', [id]);
    res.json({ message: 'Categoría eliminada' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── PRODUCTOS / REPUESTOS ─────────────────────────────────────────────────────
exports.getProductos = async (req, res) => {
  try {
    const { buscar, categoria, alerta } = req.query;
    let where = 'WHERE 1=1';
    const params = [];

    if (buscar) {
      where += ' AND (r.nombre LIKE ? OR r.codigo LIKE ? OR r.tipo LIKE ?)';
      params.push(`%${buscar}%`, `%${buscar}%`, `%${buscar}%`);
    }
    if (categoria) { where += ' AND r.categoria_id=?'; params.push(categoria); }
    if (alerta === '1') { where += ' AND r.stock <= r.stock_minimo'; }

    const [rows] = await db.query(`
      SELECT
        r.*,
        c.nombre AS categoria_nombre,
        (r.stock <= r.stock_minimo) AS alerta_stock
      FROM repuestos r
      LEFT JOIN inventario_categorias c ON c.id = r.categoria_id
      ${where}
      ORDER BY r.nombre ASC
    `, params);

    res.json(rows);
  } catch (err) {
    console.error('getProductos:', err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.getProducto = async (req, res) => {
  try {
    const [[row]] = await db.query(`
      SELECT r.*, c.nombre AS categoria_nombre
      FROM repuestos r
      LEFT JOIN inventario_categorias c ON c.id = r.categoria_id
      WHERE r.id = ?
    `, [req.params.id]);
    if (!row) return res.status(404).json({ message: 'No encontrado' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createProducto = async (req, res) => {
  try {
    const { nombre, tipo, codigo, descripcion, precio, stock, stock_minimo, unidad, categoria_id } = req.body;
    if (!nombre) return res.status(400).json({ message: 'Nombre requerido' });

    const [r] = await db.query(
      `INSERT INTO repuestos
         (nombre, tipo, codigo, descripcion, precio, stock, stock_minimo, unidad, categoria_id, estado)
       VALUES (?,?,?,?,?,?,?,?,?,1)`,
      [nombre, tipo || null, codigo || null, descripcion || null,
       precio || 0, stock || 0, stock_minimo || 5, unidad || 'unidad', categoria_id || null]
    );

    // Registrar entrada inicial si hay stock
    if (parseInt(stock) > 0) {
      await registrarMovimiento(
        r.insertId, 'ENTRADA', parseInt(stock), 0, parseInt(stock),
        'Stock inicial', 'CREACION', req.user?.id
      );
    }

    res.json({ message: 'Producto creado', id: r.insertId });
  } catch (err) {
    console.error('createProducto:', err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.updateProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, tipo, codigo, descripcion, precio, stock_minimo, unidad, categoria_id, estado } = req.body;

    await db.query(
      `UPDATE repuestos SET
         nombre=?, tipo=?, codigo=?, descripcion=?, precio=?,
         stock_minimo=?, unidad=?, categoria_id=?, estado=?
       WHERE id=?`,
      [nombre, tipo || null, codigo || null, descripcion || null, precio || 0,
       stock_minimo || 5, unidad || 'unidad', categoria_id || null,
       estado !== undefined ? estado : 1, id]
    );
    res.json({ message: 'Producto actualizado' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteProducto = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE repuestos SET estado=0 WHERE id=?', [id]);
    res.json({ message: 'Producto desactivado' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── MOVIMIENTOS ───────────────────────────────────────────────────────────────
exports.getMovimientos = async (req, res) => {
  try {
    const { repuesto_id, tipo, limit = 100 } = req.query;
    let where = 'WHERE 1=1';
    const params = [];

    if (repuesto_id) { where += ' AND m.repuesto_id=?'; params.push(repuesto_id); }
    if (tipo)        { where += ' AND m.tipo=?';        params.push(tipo); }

    params.push(parseInt(limit));

    const [rows] = await db.query(`
      SELECT
        m.*,
        r.nombre AS producto_nombre,
        r.codigo AS producto_codigo,
        u.nombre AS usuario_nombre,
        u.apellido AS usuario_apellido
      FROM inventario_movimientos m
      JOIN repuestos r ON r.id = m.repuesto_id
      LEFT JOIN usuarios u ON u.id = m.usuario_id
      ${where}
      ORDER BY m.fecha DESC
      LIMIT ?
    `, params);

    res.json(rows);
  } catch (err) {
    console.error('getMovimientos:', err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.registrarEntrada = async (req, res) => {
  try {
    const { repuesto_id, cantidad, motivo } = req.body;
    if (!repuesto_id || !cantidad || cantidad <= 0)
      return res.status(400).json({ message: 'repuesto_id y cantidad > 0 son requeridos' });

    const [[rep]] = await db.query('SELECT stock FROM repuestos WHERE id=?', [repuesto_id]);
    if (!rep) return res.status(404).json({ message: 'Producto no encontrado' });

    const stock_antes   = rep.stock;
    const stock_despues = stock_antes + parseInt(cantidad);

    await db.query('UPDATE repuestos SET stock=? WHERE id=?', [stock_despues, repuesto_id]);
    await registrarMovimiento(
      repuesto_id, 'ENTRADA', parseInt(cantidad),
      stock_antes, stock_despues,
      motivo || 'Entrada manual', 'MANUAL', req.user?.id
    );

    res.json({ message: 'Entrada registrada', stock_nuevo: stock_despues });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.registrarSalida = async (req, res) => {
  try {
    const { repuesto_id, cantidad, motivo } = req.body;
    if (!repuesto_id || !cantidad || cantidad <= 0)
      return res.status(400).json({ message: 'repuesto_id y cantidad > 0 son requeridos' });

    const [[rep]] = await db.query('SELECT stock FROM repuestos WHERE id=?', [repuesto_id]);
    if (!rep) return res.status(404).json({ message: 'Producto no encontrado' });
    if (rep.stock < cantidad)
      return res.status(400).json({ message: `Stock insuficiente. Disponible: ${rep.stock}` });

    const stock_antes   = rep.stock;
    const stock_despues = stock_antes - parseInt(cantidad);

    await db.query('UPDATE repuestos SET stock=? WHERE id=?', [stock_despues, repuesto_id]);
    await registrarMovimiento(
      repuesto_id, 'SALIDA', parseInt(cantidad),
      stock_antes, stock_despues,
      motivo || 'Salida manual', 'MANUAL', req.user?.id
    );

    res.json({ message: 'Salida registrada', stock_nuevo: stock_despues });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.registrarAjuste = async (req, res) => {
  try {
    const { repuesto_id, stock_nuevo, motivo } = req.body;
    if (!repuesto_id || stock_nuevo === undefined || stock_nuevo < 0)
      return res.status(400).json({ message: 'repuesto_id y stock_nuevo >= 0 son requeridos' });

    const [[rep]] = await db.query('SELECT stock FROM repuestos WHERE id=?', [repuesto_id]);
    if (!rep) return res.status(404).json({ message: 'Producto no encontrado' });

    const stock_antes   = rep.stock;
    const diff          = parseInt(stock_nuevo) - stock_antes;

    await db.query('UPDATE repuestos SET stock=? WHERE id=?', [parseInt(stock_nuevo), repuesto_id]);
    await registrarMovimiento(
      repuesto_id, 'AJUSTE', Math.abs(diff),
      stock_antes, parseInt(stock_nuevo),
      motivo || 'Ajuste de inventario', 'AJUSTE', req.user?.id
    );

    res.json({ message: 'Ajuste registrado', stock_nuevo });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getResumen = async (req, res) => {
  try {
    const [[totales]] = await db.query(`
      SELECT
        COUNT(*)                                    AS total_productos,
        SUM(stock)                                  AS stock_total,
        SUM(stock * COALESCE(precio,0))             AS valor_total,
        SUM(CASE WHEN stock <= stock_minimo THEN 1 ELSE 0 END) AS alertas
      FROM repuestos WHERE estado=1
    `);

    const [alertas] = await db.query(`
      SELECT id, nombre, codigo, stock, stock_minimo
      FROM repuestos
      WHERE stock <= stock_minimo AND estado=1
      ORDER BY stock ASC
    `);

    res.json({ ...totales, productos_alerta: alertas });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Exportar registrarMovimiento para usarla en compras
exports.registrarMovimiento = registrarMovimiento;