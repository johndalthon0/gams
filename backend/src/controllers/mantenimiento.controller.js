const db = require('../config/database');

const seg = (n, a) =>
  [n,a].filter(x=>x&&x!=='null'&&x!=='None'&&x!=='undefined').join(' ').trim()||'—';

const registrarHistorial = async (mant_id, usuario_id, accion, ant, nuevo, obs='') => {
  try {
    await db.query(
      `INSERT INTO mantenimiento_historial
         (mantenimiento_id,usuario_id,accion,estado_anterior,estado_nuevo,observacion)
       VALUES (?,?,?,?,?,?)`,
      [mant_id, usuario_id||null, accion, ant||null, nuevo||null, obs||null]
    );
  } catch(e){ console.error('historial:',e.message); }
};

const notificar = async (uid, tipo, titulo, mensaje, datos={}) => {
  try {
    await db.query(
      `INSERT INTO notificaciones
         (usuario_id,tipo,titulo,mensaje,leida,datos_json,respondida,respuesta)
       VALUES (?,?,?,?,0,?,1,'PENDIENTE')`,
      [uid, tipo, titulo.substring(0,255), mensaje.substring(0,2000), JSON.stringify(datos)]
    );
  } catch(e){ console.error('notif:',e.message); }
};

const getAdmins = async () => {
  try {
    const [r] = await db.query(
      `SELECT DISTINCT u.id FROM usuarios u
       JOIN usuario_roles ur ON ur.usuario_id=u.id
       JOIN roles r ON r.id=ur.rol_id
       WHERE r.nombre='ADMIN' AND u.estado=1`
    );
    return r.map(x=>x.id);
  } catch { return []; }
};

const descontarRepuesto = async (repuesto_id, cantidad, referencia, usuario_id) => {
  try {
    const [[rep]] = await db.query('SELECT stock,nombre FROM repuestos WHERE id=?',[repuesto_id]);
    if (!rep || rep.stock < cantidad)
      return { ok:false, message:`Stock insuficiente para "${rep?.nombre}". Disponible: ${rep?.stock||0}` };
    const sa = rep.stock, sd = sa - cantidad;
    await db.query('UPDATE repuestos SET stock=? WHERE id=?',[sd,repuesto_id]);
    await db.query(
      `INSERT INTO inventario_movimientos
         (repuesto_id,tipo,cantidad,stock_antes,stock_despues,motivo,referencia,usuario_id)
       VALUES (?,?,?,?,?,?,?,?)`,
      [repuesto_id,'SALIDA',cantidad,sa,sd,`Usado en ${referencia}`,referencia,usuario_id||null]
    );
    return { ok:true };
  } catch(e){ return { ok:false, message:e.message }; }
};

// ── MIS EQUIPOS ───────────────────────────────────────────────
exports.getMisEquipos = async (req,res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.equipo_id, e.codigo, e.nombre AS equipo,
             t.nombre AS tipo, e.estado AS estado_equipo,
             DATE_FORMAT(a.fecha_asignacion,'%Y-%m-%d') AS fecha_asignacion
      FROM asignaciones a
      JOIN equipos e ON e.id=a.equipo_id
      LEFT JOIN tipos_equipo t ON t.id=e.tipo_id
      WHERE a.usuario_id=? AND a.estado=1
    `,[req.user.id]);
    res.json(rows);
  } catch(err){ res.status(500).json({message:err.message}); }
};

// ── SOLICITUDES ───────────────────────────────────────────────
exports.getSolicitudes = async (req,res) => {
  try {
    const [rows] = await db.query(`
      SELECT sm.id, sm.descripcion, sm.prioridad, sm.estado,
             sm.fecha_solicitud, sm.equipo_id,
             u.id AS usuario_id, u.nombre AS usuario_nombre,
             u.apellido AS usuario_apellido, u.email AS usuario_email,
             e.codigo AS equipo_codigo, e.nombre AS equipo_nombre,
             t.nombre AS equipo_tipo,
             ar.nombre AS area, c.nombre AS cargo, s.nombre AS sucursal
      FROM solicitudes_mantenimiento sm
      JOIN usuarios u ON u.id=sm.usuario_id
      JOIN equipos  e ON e.id=sm.equipo_id
      LEFT JOIN tipos_equipo t  ON t.id=e.tipo_id
      LEFT JOIN areas        ar ON ar.id=u.area_id
      LEFT JOIN cargos       c  ON c.id=u.cargo_id
      LEFT JOIN sucursales   s  ON s.id=u.sucursal_id
      ORDER BY FIELD(sm.estado,'PENDIENTE','EN_PROCESO','FINALIZADO','RECHAZADO'), sm.id DESC
    `);
    res.json(rows);
  } catch(err){ res.status(500).json({message:err.message}); }
};

exports.getMisSolicitudes = async (req,res) => {
  try {
    const [rows] = await db.query(`
      SELECT sm.id, sm.descripcion, sm.prioridad, sm.estado,
             sm.fecha_solicitud, sm.equipo_id,
             e.codigo AS equipo_codigo, e.nombre AS equipo_nombre,
             t.nombre AS equipo_tipo
      FROM solicitudes_mantenimiento sm
      JOIN equipos e ON e.id=sm.equipo_id
      LEFT JOIN tipos_equipo t ON t.id=e.tipo_id
      WHERE sm.usuario_id=? ORDER BY sm.id DESC
    `,[req.user.id]);
    res.json(rows);
  } catch(err){ res.status(500).json({message:err.message}); }
};

exports.createSolicitud = async (req,res) => {
  try {
    const { equipo_id, descripcion, prioridad } = req.body;
    if (!equipo_id||!descripcion)
      return res.status(400).json({message:'Equipo y descripción son obligatorios'});
    const [[sol]] = await db.query(
      `SELECT id FROM solicitudes_mantenimiento
       WHERE equipo_id=? AND estado IN ('PENDIENTE','EN_PROCESO') LIMIT 1`,[equipo_id]
    );
    if (sol) return res.status(400).json({message:'Este equipo ya tiene una solicitud activa'});
    const [[mant]] = await db.query(
      `SELECT id FROM mantenimientos WHERE equipo_id=?
       AND estado IN ('PENDIENTE_CONFIRMACION','PROGRAMADO','EN_PROCESO','PAUSADO','REPROGRAMAR')
       LIMIT 1`,[equipo_id]
    );
    if (mant) return res.status(400).json({message:'El equipo ya tiene un mantenimiento activo'});
    await db.query(
      `INSERT INTO solicitudes_mantenimiento
         (usuario_id,equipo_id,descripcion,prioridad,estado,fecha_solicitud)
       VALUES (?,?,?,?,'PENDIENTE',NOW())`,
      [req.user.id,equipo_id,descripcion,prioridad||'MEDIA']
    );
    const admins = await getAdmins();
    const [[eq]] = await db.query('SELECT codigo,nombre FROM equipos WHERE id=?',[equipo_id]);
    for (const uid of admins) {
      await notificar(uid,'SOLICITUD',
        `📋 Nueva solicitud — ${eq?.codigo||''}`,
        `Solicitud de mantenimiento para ${eq?.codigo} — ${eq?.nombre}. Prioridad: ${prioridad||'MEDIA'}.`,
        {equipo_id:parseInt(equipo_id)}
      );
    }
    res.json({message:'Solicitud enviada correctamente'});
  } catch(err){ res.status(500).json({message:err.message}); }
};

exports.editarSolicitud = async (req,res) => {
  try {
    const {id} = req.params;
    const {descripcion,prioridad} = req.body;
    const [[sol]] = await db.query(
      'SELECT * FROM solicitudes_mantenimiento WHERE id=? AND usuario_id=?',[id,req.user.id]
    );
    if (!sol) return res.status(404).json({message:'No encontrada'});
    if (sol.estado!=='PENDIENTE')
      return res.status(400).json({message:`No se puede editar en estado ${sol.estado}`});
    await db.query(
      'UPDATE solicitudes_mantenimiento SET descripcion=?,prioridad=? WHERE id=?',
      [descripcion||sol.descripcion,prioridad||sol.prioridad,id]
    );
    res.json({message:'Solicitud actualizada'});
  } catch(err){ res.status(500).json({message:err.message}); }
};

exports.reenviarSolicitud = async (req,res) => {
  try {
    const {id} = req.params;
    const [[sol]] = await db.query(
      'SELECT * FROM solicitudes_mantenimiento WHERE id=? AND usuario_id=?',[id,req.user.id]
    );
    if (!sol) return res.status(404).json({message:'No encontrada'});
    if (sol.estado!=='RECHAZADO')
      return res.status(400).json({message:'Solo puedes reenviar solicitudes rechazadas'});
    await db.query("UPDATE solicitudes_mantenimiento SET estado='PENDIENTE' WHERE id=?",[id]);
    const admins = await getAdmins();
    const [[eq]] = await db.query('SELECT codigo,nombre FROM equipos WHERE id=?',[sol.equipo_id]);
    for (const uid of admins) {
      await notificar(uid,'SOLICITUD',`🔁 Solicitud reenviada — ${eq?.codigo||''}`,
        `Solicitud reenviada para ${eq?.codigo} — ${eq?.nombre}.`,{equipo_id:sol.equipo_id});
    }
    res.json({message:'Solicitud reenviada'});
  } catch(err){ res.status(500).json({message:err.message}); }
};

// ── MANTENIMIENTOS ────────────────────────────────────────────
exports.getMantenimientos = async (req,res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.id, m.equipo_id, m.solicitud_id,
             m.tipo, m.descripcion, m.descripcion_problema,
             m.descripcion_solucion, m.tecnico, m.tecnico_usuario_id,
             m.fecha_inicio, m.fecha_fin, m.fecha_programada,
             m.costo, m.estado,
             m.confirmado_por, m.fecha_confirmacion,
             m.motivo_reprogramar, m.fecha_sugerida_rep,
             e.codigo AS equipo_codigo, e.nombre AS equipo_nombre,
             tp.nombre AS equipo_tipo,
             u_tec.nombre   AS tecnico_nombre,
             u_tec.apellido AS tecnico_apellido,
             u_resp.id      AS responsable_id,
             u_resp.nombre  AS responsable_nombre,
             u_resp.apellido AS responsable_apellido,
             u_resp.email   AS responsable_email,
             ar.nombre AS area, c.nombre AS cargo, s.nombre AS sucursal,
             io.nivel_riesgo AS nivel_riesgo_ia,
             io.probabilidad AS probabilidad_ia,
             io.motivo       AS motivo_ia
      FROM mantenimientos m
      JOIN equipos e ON e.id=m.equipo_id
      LEFT JOIN tipos_equipo tp  ON tp.id=e.tipo_id
      LEFT JOIN usuarios u_tec   ON u_tec.id=m.tecnico_usuario_id
      LEFT JOIN asignaciones a   ON a.equipo_id=e.id AND a.estado=1
      LEFT JOIN usuarios u_resp  ON u_resp.id=a.usuario_id
      LEFT JOIN areas      ar    ON ar.id=u_resp.area_id
      LEFT JOIN cargos     c     ON c.id=u_resp.cargo_id
      LEFT JOIN sucursales s     ON s.id=u_resp.sucursal_id
      LEFT JOIN ia_ordenes_trabajo ot ON ot.mantenimiento_id=m.id
      LEFT JOIN ia_ordenes io ON io.id=ot.orden_ia_id
      ORDER BY
        FIELD(m.estado,'EN_PROCESO','PROGRAMADO','PENDIENTE_CONFIRMACION',
              'PAUSADO','REPROGRAMAR','PENDIENTE','FINALIZADO','RECHAZADO'),
        m.fecha_programada ASC, m.id DESC
    `);
    res.json(rows.map(r=>({
      ...r,
      tecnico_nombre_completo:     seg(r.tecnico_nombre,r.tecnico_apellido)||r.tecnico||'—',
      responsable_nombre_completo: seg(r.responsable_nombre,r.responsable_apellido),
    })));
  } catch(err){ res.status(500).json({message:err.message}); }
};

exports.getMantenimiento = async (req,res) => {
  try {
    const {id} = req.params;
    const [[m]] = await db.query(`
      SELECT m.*,
             e.codigo AS equipo_codigo, e.nombre AS equipo_nombre,
             tp.nombre AS equipo_tipo,
             u_tec.nombre   AS tecnico_nombre,
             u_tec.apellido AS tecnico_apellido,
             u_resp.nombre  AS usuario_nombre,
             u_resp.apellido AS usuario_apellido,
             u_resp.email   AS usuario_email,
             ar.nombre AS area, c.nombre AS cargo, s.nombre AS sucursal,
             io.nivel_riesgo AS nivel_riesgo_ia,
             io.probabilidad AS probabilidad_ia,
             io.motivo       AS motivo_ia
      FROM mantenimientos m
      JOIN equipos e ON e.id=m.equipo_id
      LEFT JOIN tipos_equipo tp  ON tp.id=e.tipo_id
      LEFT JOIN usuarios u_tec   ON u_tec.id=m.tecnico_usuario_id
      LEFT JOIN asignaciones a   ON a.equipo_id=e.id AND a.estado=1
      LEFT JOIN usuarios u_resp  ON u_resp.id=a.usuario_id
      LEFT JOIN areas      ar    ON ar.id=u_resp.area_id
      LEFT JOIN cargos     c     ON c.id=u_resp.cargo_id
      LEFT JOIN sucursales s     ON s.id=u_resp.sucursal_id
      LEFT JOIN ia_ordenes_trabajo ot ON ot.mantenimiento_id=m.id
      LEFT JOIN ia_ordenes io ON io.id=ot.orden_ia_id
      WHERE m.id=?
    `,[id]);
    if (!m) return res.status(404).json({message:'No encontrado'});
    const [repuestos] = await db.query(`
      SELECT mr.id, mr.cantidad, mr.precio_unitario, r.nombre, r.tipo, r.stock
      FROM mantenimiento_repuestos mr
      JOIN repuestos r ON r.id=mr.repuesto_id
      WHERE mr.mantenimiento_id=?
    `,[id]);
    res.json({
      ...m,
      tecnico_nombre_completo: seg(m.tecnico_nombre,m.tecnico_apellido)||m.tecnico||'—',
      repuestos,
    });
  } catch(err){ res.status(500).json({message:err.message}); }
};

exports.createMantenimiento = async (req,res) => {
  try {
    const {
      solicitud_id, equipo_id, tipo,
      descripcion, descripcion_problema, descripcion_solucion,
      tecnico, tecnico_usuario_id, costo,
      estado, fecha_programada, repuestos,
    } = req.body;

    if (!equipo_id)   return res.status(400).json({message:'El equipo es obligatorio'});
    if (!descripcion) return res.status(400).json({message:'La descripción es obligatoria'});

    // Validar stock
    if (Array.isArray(repuestos)&&repuestos.length>0) {
      for (const r of repuestos) {
        if (!r.repuesto_id||!r.cantidad) continue;
        const [[rep]] = await db.query('SELECT nombre,stock FROM repuestos WHERE id=?',[r.repuesto_id]);
        if (!rep) return res.status(400).json({message:`Repuesto #${r.repuesto_id} no encontrado`});
        if (rep.stock<r.cantidad)
          return res.status(400).json({message:`Stock insuficiente para "${rep.nombre}". Disponible: ${rep.stock}`});
      }
    }

    // Estado: si viene de solicitud → nunca PENDIENTE_CONFIRMACION
    const estadoFinal = solicitud_id
      ? (estado||'EN_PROCESO')
      : (estado||'EN_PROCESO');

    const [result] = await db.query(`
      INSERT INTO mantenimientos
        (equipo_id,solicitud_id,tipo,descripcion,
         descripcion_problema,descripcion_solucion,
         tecnico,tecnico_usuario_id,
         fecha_inicio,fecha_programada,costo,estado)
      VALUES (?,?,?,?,?,?,?,?,NOW(),?,?,?)
    `,[
      equipo_id,
      solicitud_id||null,
      tipo||'CORRECTIVO',
      descripcion,
      descripcion_problema||null,
      descripcion_solucion||null,
      tecnico||null,
      tecnico_usuario_id||null,
      fecha_programada||null,
      costo||null,
      estadoFinal,
    ]);

    const mantId = result.insertId;

    // Repuestos
    if (Array.isArray(repuestos)&&repuestos.length>0) {
      for (const r of repuestos) {
        if (!r.repuesto_id||!r.cantidad) continue;
        let precio = Number(r.precio)||0;
        if (!precio) {
          const [[rep]] = await db.query('SELECT precio FROM repuestos WHERE id=?',[r.repuesto_id]);
          if (rep) precio = Number(rep.precio)||0;
        }
        await db.query(
          `INSERT INTO mantenimiento_repuestos
             (mantenimiento_id,repuesto_id,cantidad,precio_unitario)
           VALUES (?,?,?,?)`,
          [mantId,r.repuesto_id,r.cantidad,precio]
        );
        await descontarRepuesto(r.repuesto_id,r.cantidad,`Mantenimiento #${mantId}`,req.user?.id);
      }
    }

    if (solicitud_id) {
      await db.query("UPDATE solicitudes_mantenimiento SET estado='EN_PROCESO' WHERE id=?",[solicitud_id]);
    }

    if (!['PENDIENTE_CONFIRMACION','PROGRAMADO'].includes(estadoFinal)) {
      await db.query("UPDATE equipos SET estado='MANTENIMIENTO' WHERE id=?",[equipo_id]);
    }

    await registrarHistorial(mantId,req.user?.id,'CREAR',null,estadoFinal,'Creación');

    // Notificar si es PENDIENTE_CONFIRMACION
    if (estadoFinal==='PENDIENTE_CONFIRMACION'&&fecha_programada) {
      const [[resp]] = await db.query(
        `SELECT u.id FROM asignaciones a JOIN usuarios u ON u.id=a.usuario_id
         WHERE a.equipo_id=? AND a.estado=1 LIMIT 1`,[equipo_id]
      );
      if (resp) {
        const [[eq]] = await db.query('SELECT codigo,nombre FROM equipos WHERE id=?',[equipo_id]);
        await db.query(
          `INSERT INTO notificaciones
             (usuario_id,tipo,titulo,mensaje,leida,datos_json,respondida,respuesta)
           VALUES (?,?,?,?,0,?,0,'PENDIENTE')`,
          [resp.id,'SOLICITUD_MANT',
           `🛠️ Mantenimiento programado — ${eq?.codigo||''}`,
           `Mantenimiento preventivo para tu equipo ${eq?.codigo} — ${eq?.nombre} el ${fecha_programada}.`,
           JSON.stringify({mantenimiento_id:mantId,equipo_id:parseInt(equipo_id),fecha_programada,cod:eq?.codigo,nom:eq?.nombre})]
        );
      }
    }

    res.json({message:'Mantenimiento registrado',id:mantId});
  } catch(err){
    console.error('createMantenimiento:',err.message);
    res.status(500).json({message:err.message});
  }
};

// ── ACCIONES DE ESTADO ────────────────────────────────────────
exports.confirmarDisponibilidad = async (req,res) => {
  try {
    const {id} = req.params;
    const [[m]] = await db.query(
      `SELECT m.*,e.codigo,e.nombre AS equipo_nombre
       FROM mantenimientos m JOIN equipos e ON e.id=m.equipo_id WHERE m.id=?`,[id]
    );
    if (!m) return res.status(404).json({message:'No encontrado'});
    await db.query(
      `UPDATE mantenimientos SET estado='PROGRAMADO',confirmado_por=?,fecha_confirmacion=NOW() WHERE id=?`,
      [req.user.id,id]
    );
    await registrarHistorial(id,req.user.id,'CONFIRMAR',m.estado,'PROGRAMADO','Responsable confirmó');
    if (m.tecnico_usuario_id) {
      await notificar(m.tecnico_usuario_id,'MANT_CONFIRMADO',
        `✅ Confirmado — ${m.codigo}`,
        `El responsable confirmó disponibilidad para ${m.codigo} el ${m.fecha_programada||'—'}.`,
        {mantenimiento_id:parseInt(id)}
      );
    }
    for (const uid of await getAdmins()) {
      await notificar(uid,'MANT_CONFIRMADO',`✅ Confirmado — ${m.codigo}`,
        `Responsable confirmó para ${m.fecha_programada||'—'}.`,{mantenimiento_id:parseInt(id)});
    }
    res.json({message:'Confirmado → PROGRAMADO'});
  } catch(err){ res.status(500).json({message:err.message}); }
};

exports.solicitarReprogramacion = async (req,res) => {
  try {
    const {id} = req.params;
    const {motivo,fecha_sugerida} = req.body;
    const [[m]] = await db.query(
      `SELECT m.*,e.codigo FROM mantenimientos m JOIN equipos e ON e.id=m.equipo_id WHERE m.id=?`,[id]
    );
    if (!m) return res.status(404).json({message:'No encontrado'});
    await db.query(
      `UPDATE mantenimientos SET estado='REPROGRAMAR',motivo_reprogramar=?,fecha_sugerida_rep=? WHERE id=?`,
      [motivo||null,fecha_sugerida||null,id]
    );
    await registrarHistorial(id,req.user.id,'SOLICITAR_REPROGRAMAR',m.estado,'REPROGRAMAR',`Motivo: ${motivo||'—'}`);
    for (const uid of await getAdmins()) {
      await notificar(uid,'REPROGRAMAR',`📅 Reprogramación — ${m.codigo}`,
        `Solicitud reprogramar ${m.codigo}. Motivo: ${motivo||'—'}. Sugerida: ${fecha_sugerida||'sin fecha'}.`,
        {mantenimiento_id:parseInt(id)});
    }
    res.json({message:'Solicitud enviada'});
  } catch(err){ res.status(500).json({message:err.message}); }
};

exports.reprogramarAdmin = async (req,res) => {
  try {
    const {id} = req.params;
    const {fecha_programada} = req.body;
    if (!fecha_programada) return res.status(400).json({message:'Fecha requerida'});
    const [[m]] = await db.query(
      `SELECT m.*,e.codigo,e.nombre AS equipo_nombre,e.id AS eq_id
       FROM mantenimientos m JOIN equipos e ON e.id=m.equipo_id WHERE m.id=?`,[id]
    );
    if (!m) return res.status(404).json({message:'No encontrado'});
    await db.query(
      `UPDATE mantenimientos SET estado='PENDIENTE_CONFIRMACION',fecha_programada=?,
       motivo_reprogramar=NULL,fecha_sugerida_rep=NULL WHERE id=?`,
      [fecha_programada,id]
    );
    await registrarHistorial(id,req.user?.id,'REPROGRAMAR',m.estado,'PENDIENTE_CONFIRMACION',`Nueva: ${fecha_programada}`);
    const [[resp]] = await db.query(
      `SELECT u.id FROM asignaciones a JOIN usuarios u ON u.id=a.usuario_id
       WHERE a.equipo_id=? AND a.estado=1 LIMIT 1`,[m.eq_id]
    );
    if (resp) {
      await db.query(
        `INSERT INTO notificaciones
           (usuario_id,tipo,titulo,mensaje,leida,datos_json,respondida,respuesta)
         VALUES (?,?,?,?,0,?,0,'PENDIENTE')`,
        [resp.id,'SOLICITUD_MANT',`🔄 Reprogramado — ${m.codigo}`,
         `Tu equipo ${m.codigo} reprogramado para ${fecha_programada}. Confirma disponibilidad.`,
         JSON.stringify({mantenimiento_id:parseInt(id),equipo_id:m.eq_id,fecha_programada,cod:m.codigo})]
      );
    }
    res.json({message:`Reprogramado para ${fecha_programada}`});
  } catch(err){ res.status(500).json({message:err.message}); }
};

exports.iniciarMantenimiento = async (req,res) => {
  try {
    const {id} = req.params;
    const [[m]] = await db.query(
      `SELECT m.*,e.codigo,e.nombre AS equipo_nombre
       FROM mantenimientos m JOIN equipos e ON e.id=m.equipo_id WHERE m.id=?`,[id]
    );
    if (!m) return res.status(404).json({message:'No encontrado'});
    if (!['PROGRAMADO','PAUSADO','PENDIENTE'].includes(m.estado))
      return res.status(400).json({message:`No se puede iniciar desde ${m.estado}`});
    await db.query("UPDATE mantenimientos SET estado='EN_PROCESO',fecha_inicio=NOW() WHERE id=?",[id]);
    await db.query("UPDATE equipos SET estado='MANTENIMIENTO' WHERE id=?",[m.equipo_id]);
    await registrarHistorial(id,req.user?.id,'INICIAR',m.estado,'EN_PROCESO');
    const [[resp]] = await db.query(
      `SELECT u.id FROM asignaciones a JOIN usuarios u ON u.id=a.usuario_id
       WHERE a.equipo_id=? AND a.estado=1 LIMIT 1`,[m.equipo_id]
    );
    if (resp) {
      await notificar(resp.id,'MANT_INICIADO',`⚙️ Iniciado — ${m.codigo}`,
        `El técnico inició el mantenimiento de tu equipo ${m.codigo}. No estará disponible durante el proceso.`,
        {mantenimiento_id:parseInt(id),equipo_id:m.equipo_id});
    }
    res.json({message:'Mantenimiento iniciado'});
  } catch(err){ res.status(500).json({message:err.message}); }
};

exports.pausarMantenimiento = async (req,res) => {
  try {
    const {id} = req.params;
    const {observacion} = req.body;
    await db.query("UPDATE mantenimientos SET estado='PAUSADO' WHERE id=?",[id]);
    await registrarHistorial(id,req.user?.id,'PAUSAR','EN_PROCESO','PAUSADO',observacion||'');
    res.json({message:'Pausado'});
  } catch(err){ res.status(500).json({message:err.message}); }
};

exports.finalizarMantenimiento = async (req,res) => {
  try {
    const {id} = req.params;
    const {costo,descripcion_solucion,repuestos} = req.body;
    const [[m]] = await db.query(
      `SELECT m.*,e.codigo,e.nombre AS equipo_nombre
       FROM mantenimientos m JOIN equipos e ON e.id=m.equipo_id WHERE m.id=?`,[id]
    );
    if (!m) return res.status(404).json({message:'No encontrado'});

    // Repuestos adicionales al finalizar
    if (Array.isArray(repuestos)&&repuestos.length>0) {
      for (const r of repuestos) {
        if (!r.repuesto_id||!r.cantidad) continue;
        const [[rep]] = await db.query('SELECT nombre,stock FROM repuestos WHERE id=?',[r.repuesto_id]);
        if (!rep) return res.status(400).json({message:`Repuesto #${r.repuesto_id} no encontrado`});
        if (rep.stock<r.cantidad)
          return res.status(400).json({message:`Stock insuficiente para "${rep.nombre}". Disponible: ${rep.stock}`});
      }
      for (const r of repuestos) {
        if (!r.repuesto_id||!r.cantidad) continue;
        let precio = Number(r.precio)||0;
        if (!precio){const [[rep]]=await db.query('SELECT precio FROM repuestos WHERE id=?',[r.repuesto_id]);if(rep)precio=Number(rep.precio)||0;}
        const [[exist]] = await db.query(
          'SELECT id FROM mantenimiento_repuestos WHERE mantenimiento_id=? AND repuesto_id=?',[id,r.repuesto_id]
        );
        if (exist) {
          await db.query(
            'UPDATE mantenimiento_repuestos SET cantidad=cantidad+?,precio_unitario=? WHERE mantenimiento_id=? AND repuesto_id=?',
            [r.cantidad,precio,id,r.repuesto_id]
          );
        } else {
          await db.query(
            `INSERT INTO mantenimiento_repuestos (mantenimiento_id,repuesto_id,cantidad,precio_unitario)
             VALUES (?,?,?,?)`,[id,r.repuesto_id,r.cantidad,precio]
          );
        }
        await descontarRepuesto(r.repuesto_id,r.cantidad,`Mantenimiento #${id}`,req.user?.id);
      }
    }

    await db.query(
      `UPDATE mantenimientos SET estado='FINALIZADO',fecha_fin=NOW(),descripcion_solucion=?,costo=? WHERE id=?`,
      [descripcion_solucion||null,costo||m.costo||0,id]
    );

    if (m.solicitud_id) {
      await db.query("UPDATE solicitudes_mantenimiento SET estado='FINALIZADO' WHERE id=?",[m.solicitud_id]);
    }

    const [[asig]] = await db.query(
      'SELECT id FROM asignaciones WHERE equipo_id=? AND estado=1 LIMIT 1',[m.equipo_id]
    );
    await db.query('UPDATE equipos SET estado=? WHERE id=?',[asig?'ASIGNADO':'DISPONIBLE',m.equipo_id]);

    await registrarHistorial(id,req.user?.id,'FINALIZAR',m.estado,'FINALIZADO',
      `Solución: ${descripcion_solucion||'—'}. Costo: ${costo||0}`);

    const [[resp]] = await db.query(
      `SELECT u.id FROM asignaciones a JOIN usuarios u ON u.id=a.usuario_id
       WHERE a.equipo_id=? AND a.estado=1 LIMIT 1`,[m.equipo_id]
    );
    if (resp) {
      await notificar(resp.id,'MANT_FINALIZADO',`✅ Finalizado — ${m.codigo}`,
        `El mantenimiento de tu equipo ${m.codigo} fue completado. ${descripcion_solucion?'Solución: '+descripcion_solucion:''}`,
        {mantenimiento_id:parseInt(id),equipo_id:m.equipo_id});
    }
    for (const uid of await getAdmins()) {
      await notificar(uid,'MANT_FINALIZADO',`✅ Finalizado — ${m.codigo}`,
        `Mantenimiento de ${m.codigo} completado. Costo: Bs ${costo||0}.`,
        {mantenimiento_id:parseInt(id)});
    }

    res.json({message:'Mantenimiento finalizado'});
  } catch(err){
    console.error('finalizar:',err.message);
    res.status(500).json({message:err.message});
  }
};

exports.reasignarTecnico = async (req,res) => {
  try {
    const {id} = req.params;
    const {tecnico,tecnico_usuario_id} = req.body;
    await db.query('UPDATE mantenimientos SET tecnico=?,tecnico_usuario_id=? WHERE id=?',
      [tecnico||null,tecnico_usuario_id||null,id]);
    res.json({message:'Técnico reasignado'});
  } catch(err){ res.status(500).json({message:err.message}); }
};

// ── HISTORIAL ─────────────────────────────────────────────────
exports.getHistorialMant = async (req,res) => {
  try {
    const [rows] = await db.query(
      `SELECT h.*,u.nombre,u.apellido FROM mantenimiento_historial h
       LEFT JOIN usuarios u ON u.id=h.usuario_id
       WHERE h.mantenimiento_id=? ORDER BY h.fecha ASC`,[req.params.id]
    );
    res.json(rows.map(r=>({...r,usuario_nombre:seg(r.nombre,r.apellido)})));
  } catch(err){ res.status(500).json({message:err.message}); }
};

// ── RECURSOS ──────────────────────────────────────────────────
exports.getRepuestos = async (req,res) => {
  try {
    const [rows] = await db.query('SELECT id,nombre,tipo,stock,precio FROM repuestos WHERE stock>0 ORDER BY nombre');
    res.json(rows);
  } catch(err){ res.status(500).json({message:err.message}); }
};

exports.getEquiposParaMantenimiento = async (req,res) => {
  try {
    const [rows] = await db.query(
      `SELECT e.id,e.codigo,e.nombre,e.estado,t.nombre AS tipo
       FROM equipos e LEFT JOIN tipos_equipo t ON t.id=e.tipo_id
       WHERE e.estado!='BAJA' ORDER BY e.nombre`
    );
    res.json(rows);
  } catch(err){ res.status(500).json({message:err.message}); }
};

exports.getReportes = async (req,res) => {
  try {
    const {equipo,usuario,estado,fecha_ini,fecha_fin} = req.query;
    let where='WHERE 1=1'; const params=[];
    if(equipo)    {where+=' AND (e.codigo LIKE ? OR e.nombre LIKE ?)';params.push(`%${equipo}%`,`%${equipo}%`);}
    if(usuario)   {where+=' AND (u_resp.nombre LIKE ? OR u_resp.apellido LIKE ?)';params.push(`%${usuario}%`,`%${usuario}%`);}
    if(estado)    {where+=' AND m.estado=?';params.push(estado);}
    if(fecha_ini) {where+=' AND m.fecha_inicio>=?';params.push(fecha_ini);}
    if(fecha_fin) {where+=' AND m.fecha_inicio<=?';params.push(fecha_fin);}
    const [rows] = await db.query(`
      SELECT m.id,m.tipo,m.descripcion,m.descripcion_problema,
             m.descripcion_solucion,m.tecnico,m.tecnico_usuario_id,
             m.fecha_inicio,m.fecha_fin,m.fecha_programada,m.costo,m.estado,
             e.codigo AS equipo_codigo,e.nombre AS equipo_nombre,
             tp.nombre AS equipo_tipo,
             u_tec.nombre   AS tecnico_nombre_u,
             u_tec.apellido AS tecnico_apellido_u,
             u_resp.nombre  AS usuario_nombre,
             u_resp.apellido AS usuario_apellido,
             ar.nombre AS area,c.nombre AS cargo,s.nombre AS sucursal,
             (SELECT COALESCE(SUM(mr.cantidad),0) FROM mantenimiento_repuestos mr WHERE mr.mantenimiento_id=m.id) AS total_repuestos_qty,
             (SELECT COALESCE(SUM(mr.cantidad*mr.precio_unitario),0) FROM mantenimiento_repuestos mr WHERE mr.mantenimiento_id=m.id) AS total_repuestos_costo
      FROM mantenimientos m
      JOIN equipos e ON e.id=m.equipo_id
      LEFT JOIN tipos_equipo tp ON tp.id=e.tipo_id
      LEFT JOIN usuarios u_tec  ON u_tec.id=m.tecnico_usuario_id
      LEFT JOIN asignaciones a  ON a.equipo_id=e.id AND a.estado=1
      LEFT JOIN usuarios u_resp ON u_resp.id=a.usuario_id
      LEFT JOIN areas      ar   ON ar.id=u_resp.area_id
      LEFT JOIN cargos     c    ON c.id=u_resp.cargo_id
      LEFT JOIN sucursales s    ON s.id=u_resp.sucursal_id
      ${where} ORDER BY m.id DESC
    `,params);
    const data=rows.map(r=>({...r,tecnico:seg(r.tecnico_nombre_u,r.tecnico_apellido_u)||r.tecnico||'—'}));
    res.json({
      data,
      totales:{
        registros:       data.length,
        costo_total:     data.reduce((a,r)=>a+Number(r.costo||0),0),
        repuestos_qty:   data.reduce((a,r)=>a+Number(r.total_repuestos_qty||0),0),
        repuestos_costo: data.reduce((a,r)=>a+Number(r.total_repuestos_costo||0),0),
        costo_general:   data.reduce((a,r)=>a+Number(r.costo||0)+Number(r.total_repuestos_costo||0),0),
      }
    });
  } catch(err){ res.status(500).json({message:err.message}); }
};

// ── MIS MANTENIMIENTOS (PERSONAL) ─────────────────────────────
exports.getMisMantenimientos = async (req,res) => {
  try {
    const [rows] = await db.query(`
      SELECT m.id,m.tipo,m.estado,m.descripcion,m.descripcion_problema,
             m.descripcion_solucion,m.costo,
             m.fecha_inicio,m.fecha_fin,m.fecha_programada,
             m.motivo_reprogramar,m.fecha_sugerida_rep,
             e.id AS equipo_id, e.codigo AS equipo_codigo,
             e.nombre AS equipo_nombre, e.estado AS equipo_estado,
             COALESCE(t.nombre,'Sin tipo') AS equipo_tipo,
             u_tec.nombre   AS tecnico_nombre,
             u_tec.apellido AS tecnico_apellido,
             io.nivel_riesgo AS nivel_riesgo_ia,
             io.probabilidad AS probabilidad_ia,
             io.motivo       AS motivo_ia,
             DATEDIFF(m.fecha_programada, CURDATE()) AS dias_restantes
      FROM asignaciones a
      JOIN equipos e ON e.id=a.equipo_id
      LEFT JOIN tipos_equipo t ON t.id=e.tipo_id
      LEFT JOIN mantenimientos m ON m.equipo_id=e.id AND m.estado NOT IN ('RECHAZADO')
      LEFT JOIN usuarios u_tec ON u_tec.id=m.tecnico_usuario_id
      LEFT JOIN ia_ordenes_trabajo ot ON ot.mantenimiento_id=m.id
      LEFT JOIN ia_ordenes io ON io.id=ot.orden_ia_id
      WHERE a.usuario_id=? AND a.estado=1
      ORDER BY
        FIELD(m.estado,'EN_PROCESO','PENDIENTE_CONFIRMACION','PROGRAMADO',
              'PAUSADO','REPROGRAMAR','PENDIENTE','FINALIZADO'),
        m.fecha_programada ASC
    `,[req.user.id]);
    res.json(rows.map(r=>({
      ...r,
      tecnico_nombre_completo: seg(r.tecnico_nombre,r.tecnico_apellido),
      dias_restantes: r.dias_restantes!==null?parseInt(r.dias_restantes):null,
    })));
  } catch(err){ res.status(500).json({message:err.message}); }
};

// ── NOTIFICACIONES ─────────────────────────────────────────────
exports.getNotificacionesUsuario = async (req,res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM notificaciones WHERE usuario_id=? ORDER BY fecha DESC LIMIT 40',[req.user.id]
    );
    res.json(rows.map(r=>({
      ...r,
      datos_json:(()=>{try{return typeof r.datos_json==='string'?JSON.parse(r.datos_json):(r.datos_json||{});}catch{return{};}})()
    })));
  } catch(err){ res.status(500).json({message:err.message}); }
};

exports.marcarNotifLeida = async (req,res) => {
  try {
    await db.query('UPDATE notificaciones SET leida=1 WHERE id=? AND usuario_id=?',[req.params.id,req.user.id]);
    res.json({message:'Leída'});
  } catch(err){ res.status(500).json({message:err.message}); }
};

exports.marcarTodasLeidas = async (req,res) => {
  try {
    await db.query('UPDATE notificaciones SET leida=1 WHERE usuario_id=?',[req.user.id]);
    res.json({message:'Todas leídas'});
  } catch(err){ res.status(500).json({message:err.message}); }
};