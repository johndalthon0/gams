const db = require('../config/database');

// =============================================
// SUCURSALES
// =============================================
exports.getSucursales = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM sucursales ORDER BY id DESC');
  res.json(rows);
};

exports.createSucursal = async (req, res) => {
  const { nombre, direccion } = req.body;
  await db.query('INSERT INTO sucursales(nombre,direccion) VALUES(?,?)', [nombre, direccion]);
  res.json({ message: 'Sucursal creada' });
};

exports.updateSucursal = async (req, res) => {
  const { id } = req.params;
  const { nombre, direccion } = req.body;
  await db.query('UPDATE sucursales SET nombre=?, direccion=? WHERE id=?', [nombre, direccion, id]);
  res.json({ message: 'Sucursal actualizada' });
};

exports.deleteSucursal = async (req, res) => {
  const { id } = req.params;
  await db.query('DELETE FROM sucursales WHERE id=?', [id]);
  res.json({ message: 'Sucursal eliminada' });
};

// =============================================
// AREAS
// =============================================
exports.getAreas = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM areas ORDER BY id DESC');
  res.json(rows);
};

exports.createArea = async (req, res) => {
  const { nombre } = req.body;
  await db.query('INSERT INTO areas(nombre) VALUES(?)', [nombre]);
  res.json({ message: 'Área creada' });
};

exports.updateArea = async (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;
  await db.query('UPDATE areas SET nombre=? WHERE id=?', [nombre, id]);
  res.json({ message: 'Área actualizada' });
};

exports.deleteArea = async (req, res) => {
  const { id } = req.params;
  await db.query('DELETE FROM areas WHERE id=?', [id]);
  res.json({ message: 'Área eliminada' });
};

// =============================================
// CARGOS
// =============================================
exports.getCargos = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM cargos ORDER BY id DESC');
  res.json(rows);
};

exports.createCargo = async (req, res) => {
  const { nombre } = req.body;
  await db.query('INSERT INTO cargos(nombre) VALUES(?)', [nombre]);
  res.json({ message: 'Cargo creado' });
};

exports.updateCargo = async (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;
  await db.query('UPDATE cargos SET nombre=? WHERE id=?', [nombre, id]);
  res.json({ message: 'Cargo actualizado' });
};

exports.deleteCargo = async (req, res) => {
  const { id } = req.params;
  await db.query('DELETE FROM cargos WHERE id=?', [id]);
  res.json({ message: 'Cargo eliminado' });
};

// =============================================
// TIPOS EQUIPO
// =============================================
exports.getTipos = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM tipos_equipo ORDER BY id DESC');
  res.json(rows);
};

exports.createTipo = async (req, res) => {
  const { nombre } = req.body;
  await db.query('INSERT INTO tipos_equipo(nombre) VALUES(?)', [nombre]);
  res.json({ message: 'Tipo creado' });
};

exports.updateTipo = async (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;
  await db.query('UPDATE tipos_equipo SET nombre=? WHERE id=?', [nombre, id]);
  res.json({ message: 'Tipo actualizado' });
};

exports.deleteTipo = async (req, res) => {
  const { id } = req.params;
  await db.query('DELETE FROM tipos_equipo WHERE id=?', [id]);
  res.json({ message: 'Tipo eliminado' });
};

// =============================================
// LUGARES
// =============================================
exports.getLugares = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM lugares ORDER BY id DESC');
  res.json(rows);
};

exports.createLugar = async (req, res) => {
  const { nombre } = req.body;
  await db.query('INSERT INTO lugares(nombre) VALUES(?)', [nombre]);
  res.json({ message: 'Lugar creado' });
};

exports.updateLugar = async (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;
  await db.query('UPDATE lugares SET nombre=? WHERE id=?', [nombre, id]);
  res.json({ message: 'Lugar actualizado' });
};

exports.deleteLugar = async (req, res) => {
  const { id } = req.params;
  await db.query('DELETE FROM lugares WHERE id=?', [id]);
  res.json({ message: 'Lugar eliminado' });
};

// =============================================
// REPUESTOS
// =============================================
exports.getRepuestos = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM repuestos ORDER BY id DESC');
  res.json(rows);
};

exports.createRepuesto = async (req, res) => {
  const { nombre, tipo, stock } = req.body;
  await db.query('INSERT INTO repuestos(nombre,tipo,stock) VALUES(?,?,?)', [nombre, tipo, stock]);
  res.json({ message: 'Repuesto creado' });
};

exports.updateRepuesto = async (req, res) => {
  const { id } = req.params;
  const { nombre, tipo, stock } = req.body;
  await db.query('UPDATE repuestos SET nombre=?, tipo=?, stock=? WHERE id=?', [nombre, tipo, stock, id]);
  res.json({ message: 'Repuesto actualizado' });
};

exports.deleteRepuesto = async (req, res) => {
  const { id } = req.params;
  await db.query('DELETE FROM repuestos WHERE id=?', [id]);
  res.json({ message: 'Repuesto eliminado' });
};
// =============================================
// REPUESTOS — agregar precio
// =============================================
exports.createRepuesto = async (req, res) => {
  const { nombre, tipo, stock, precio } = req.body;  // ✅ agregar precio
  await db.query(
    'INSERT INTO repuestos(nombre,tipo,stock,precio) VALUES(?,?,?,?)',
    [nombre, tipo, stock || 0, precio || 0]
  );
  res.json({ message: 'Repuesto creado' });
};

exports.updateRepuesto = async (req, res) => {
  const { id } = req.params;
  const { nombre, tipo, stock, precio } = req.body;  // ✅ agregar precio
  await db.query(
    'UPDATE repuestos SET nombre=?, tipo=?, stock=?, precio=? WHERE id=?',
    [nombre, tipo, stock, precio || 0, id]
  );
  res.json({ message: 'Repuesto actualizado' });
};