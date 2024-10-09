const { Telegraf } = require('telegraf');
require('dotenv').config();

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

// Exportar el manejador
module.exports = (req, res) => {
  bot.handleUpdate(req.body); // Manejar la actualización
  res.sendStatus(200); // Enviar un estado 200
};
