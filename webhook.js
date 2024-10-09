const { Telegraf } = require('telegraf');
require('dotenv').config();

if (!process.env.BOT_TOKEN) {
  throw new Error('Falta el token de Telegram. Asegúrate de que BOT_TOKEN está configurado en el archivo .env');
}

const bot = new Telegraf(process.env.BOT_TOKEN);

// Código del bot
bot.command('start', (ctx) => {
  ctx.reply('¡Hola! Estoy aquí para recibir tus peticiones. Usa el comando /chatp para enviar una.');
});

// Manejar el comando /chatp
bot.command('chatp', async (ctx) => {
  const petition = ctx.message.text.replace('/chatp', '').trim();
  if (petition) {
    ctx.reply(`Petición guardada en peticiones.md de https://github.com/cibervengadores/IOCs.`);
  } else {
    ctx.reply('Por favor, proporciona una petición después del comando.');
  }
});

// Exportar el manejador del webhook
module.exports = async (req, res) => {
  try {
    // Verificar si el cuerpo de la petición no está vacío
    if (req.body && Object.keys(req.body).length !== 0) {
      await bot.handleUpdate(req.body); // Manejar la actualización de Telegram
      res.sendStatus(200); // Responder con éxito
    } else {
      res.sendStatus(400); // Responder con "Bad Request" si el cuerpo está vacío
    }
  } catch (error) {
    console.error('Error manejando la actualización de Telegram:', error);
    res.sendStatus(500); // Responder con "Internal Server Error" en caso de fallo
  }
};
