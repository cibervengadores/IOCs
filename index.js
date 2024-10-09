const { Telegraf } = require('telegraf');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

// URL del webhook
const vercelUrl = `https://${process.env.VERCEL_URL}/api/webhook`;

// Establece el webhook
bot.telegram.setWebhook(vercelUrl);

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

// Lanzar el bot con webhook
bot.startWebhook('/api/webhook', null, process.env.PORT || 3000);
