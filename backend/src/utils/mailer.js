const { Resend } = require('resend');

// Sin RESEND_API_KEY el correo queda deshabilitado (ej. en local) sin
// romper nada — las notificaciones in-app y el push siguen funcionando.
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.RESEND_FROM || 'GAMS TI <onboarding@resend.dev>';

async function enviarCorreo(destinatario, asunto, textoPlano) {
  if (!resend || !destinatario) return;
  try {
    await resend.emails.send({
      from: FROM,
      to: destinatario,
      subject: asunto,
      text: textoPlano,
    });
  } catch (e) {
    console.error('mailer:', e.message);
  }
}

module.exports = { enviarCorreo };
