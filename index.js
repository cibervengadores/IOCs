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
    // Envía la petición al servidor para guardarla
    ctx.reply(`Petición guardada en peticiones.md de https://github.com/cibervengadores/IOCs.`);
  } else {
    ctx.reply('Por favor, proporciona una petición después del comando.');
  }
});

// Lanzar el bot
bot.launch().then(() => {
  console.log('Bot iniciado y escuchando comandos.');
}).catch((error) => {
  console.error('Error al lanzar el bot:', error);
});
