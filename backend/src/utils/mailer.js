const nodemailer = require('nodemailer');

// Sin GMAIL_USER/GMAIL_APP_PASSWORD el correo queda deshabilitado (ej. en
// local) sin romper nada — las notificaciones in-app y el push siguen
// funcionando igual.
let transporter = null;
if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD, // "Contraseña de aplicación" de Google, no la contraseña normal
    },
  });
}

async function enviarCorreo(destinatario, asunto, textoPlano) {
  if (!transporter || !destinatario) return;
  try {
    await transporter.sendMail({
      from: `GAMS TI <${process.env.GMAIL_USER}>`,
      to: destinatario,
      subject: asunto,
      text: textoPlano,
    });
  } catch (e) {
    console.error('mailer:', e.message);
  }
}

module.exports = { enviarCorreo };
