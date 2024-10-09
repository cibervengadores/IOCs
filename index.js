const { Telegraf } = require('telegraf');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

// Código del bot
bot.command('start', (ctx) => {
  ctx.reply('¡Hola! Estoy aquí para recibir tus peticiones. Usa el comando /chatp para enviar una.');
});

// Manejar el comando /chatp
bot.command('chatp', async (ctx) => {
  try {
    const petition = ctx.message.text.replace('/chatp', '').trim();
    if (petition) {
      // Aquí podrías agregar lógica para guardar la petición
      ctx.reply(`Petición guardada en https://github.com/cibervengadores/IOCs/blob/main/peticiones.md`);
    } else {
      ctx.reply('Por favor, proporciona una petición después del comando.');
    }
  } catch (error) {
    console.error('Error al procesar el comando /chatp:', error);
    ctx.reply('Ocurrió un error al procesar tu petición. Intenta de nuevo más tarde.');
  }
});

// Lanzar el bot
bot.launch().then(() => {
  console.log('Bot iniciado y escuchando comandos.');
}).catch((error) => {
  console.error('Error al lanzar el bot:', error);
});
