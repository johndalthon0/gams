const db = require('../config/database');
const { ahoraMySQL } = require('../utils/fecha');

let pushController;
const push = async (usuarioId, payload) => {
	try {
		if (!pushController) pushController = require('../controllers/push.controller');
		await pushController.enviarPushUsuario(usuarioId, payload);
	} catch (err) {
		console.error('recordatorio push:', err.message);
	}
};

// yyyy-mm-dd fijo — mantenimiento.fecha_programada llega como objeto Date
// desde mysql2; sin normalizar a texto antes de comparar, el "ya se mandó"
// (abajo) nunca coincidía y el recordatorio se repetía cada 60s sin fin.
const soloFecha = (d) => {
	const f = new Date(d);
	return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
};

const guardarYEnviar = async (usuarioId, mantenimiento, esAdmin, momento) => {
	const fechaProgramada = soloFecha(mantenimiento.fecha_programada);
	const datos = {
		mantenimiento_id: mantenimiento.id,
		equipo_id: mantenimiento.equipo_id,
		fecha_programada: fechaProgramada,
		momento,
	};
	const [result] = await db.query(
		`INSERT INTO notificaciones
			 (usuario_id, tipo, titulo, mensaje, leida, datos_json, respondida, respuesta, fecha)
		 SELECT ?, 'MANT_RECORDATORIO', ?, ?, 0, ?, 1, 'PENDIENTE', ?
		 FROM DUAL
		 WHERE NOT EXISTS (
			 SELECT 1 FROM notificaciones
			 WHERE usuario_id=? AND tipo='MANT_RECORDATORIO'
				 AND JSON_UNQUOTE(JSON_EXTRACT(datos_json, '$.mantenimiento_id'))=?
				 AND JSON_UNQUOTE(JSON_EXTRACT(datos_json, '$.fecha_programada'))=?
				 AND JSON_UNQUOTE(JSON_EXTRACT(datos_json, '$.momento'))=?
		 )`,
		[
			usuarioId,
			`📅 Mantenimiento programado — ${mantenimiento.codigo}`,
			esAdmin
				? `Hoy corresponde realizar el mantenimiento del equipo ${mantenimiento.codigo}.`
				: `Hoy se realizará el mantenimiento de tu equipo ${mantenimiento.codigo}.`,
			JSON.stringify(datos),
			ahoraMySQL(),
			usuarioId,
			mantenimiento.id,
			fechaProgramada,
			momento,
		]
	);

	if (!result.affectedRows) return false;
	await push(usuarioId, {
		titulo: momento === 'DIA_ANTES'
			? `📅 Mantenimiento mañana — ${mantenimiento.codigo}`
			: `📅 Mantenimiento hoy — ${mantenimiento.codigo}`,
		cuerpo: esAdmin
			? momento === 'DIA_ANTES'
				? `Mañana corresponde realizar el mantenimiento de ${mantenimiento.codigo}.`
				: `Hoy corresponde realizar el mantenimiento de ${mantenimiento.codigo}.`
			: momento === 'DIA_ANTES'
				? `Mañana se realizará el mantenimiento de tu equipo ${mantenimiento.codigo}.`
				: `Hoy se realizará el mantenimiento de tu equipo ${mantenimiento.codigo}.`,
		icono: '/icon-192.png',
		url: esAdmin ? '/admin/reparaciones' : '/personal/mi-equipo',
		tag: `recordatorio-mant-${mantenimiento.id}-${momento}`,
	});
	return true;
};

const enviarRecordatoriosMantenimiento = async () => {
	const [mantenimientos] = await db.query(`
		    SELECT m.id, m.equipo_id, m.fecha_programada, e.codigo,
			    CASE WHEN DATE(m.fecha_programada)=CURDATE() THEN 'DIA' ELSE 'DIA_ANTES' END AS momento
		FROM mantenimientos m
		JOIN equipos e ON e.id=m.equipo_id
		WHERE DATE(m.fecha_programada) IN (CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 DAY))
			AND m.estado IN ('PENDIENTE_CONFIRMACION','PROGRAMADO')
	`);
	if (!mantenimientos.length) return 0;

	const [admins] = await db.query(`
		SELECT DISTINCT u.id
		FROM usuarios u
		JOIN usuario_roles ur ON ur.usuario_id=u.id
		JOIN roles r ON r.id=ur.rol_id
		WHERE r.nombre='ADMIN' AND u.estado=1
	`);
	let enviados = 0;
	for (const mantenimiento of mantenimientos) {
		const { momento } = mantenimiento;
		const [[responsable]] = await db.query(`
			SELECT u.id
			FROM asignaciones a JOIN usuarios u ON u.id=a.usuario_id
			WHERE a.equipo_id=? AND a.estado=1 AND u.estado=1
			LIMIT 1
		`, [mantenimiento.equipo_id]);
		if (responsable && await guardarYEnviar(responsable.id, mantenimiento, false, momento)) enviados++;
		for (const admin of admins) {
			if (await guardarYEnviar(admin.id, mantenimiento, true, momento)) enviados++;
		}
	}
	return enviados;
};

const iniciarRecordatorios = () => {
	const revisar = () => enviarRecordatoriosMantenimiento()
		.catch((err) => console.error('recordatorios mantenimiento:', err.message));
	revisar();
	return setInterval(revisar, 60 * 1000);
};

module.exports = { enviarRecordatoriosMantenimiento, iniciarRecordatorios };
