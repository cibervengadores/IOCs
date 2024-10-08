const { Telegraf } = require('telegraf');
const fs = require('fs');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const FILE_PATH = 'peticiones.txt'; // Ruta donde se guardarán las peticiones

// Función para agregar peticiones al archivo
const addToFile = (text) => {
  fs.appendFileSync(FILE_PATH, `${text}\n`, (err) => {
    if (err) {
      console.error('Error escribiendo en el archivo:', err);
    } else {
      console.log('Petición añadida:', text);
    }
  });
};

// Manejar el comando /chatp
bot.command('chatp', async (ctx) => {
  const petition = ctx.message.text.replace('/chatp', '').trim();
  if (petition) {
    addToFile(petition); // Guardar directamente en el archivo
    ctx.reply('Petición guardada en peticiones.txt.');
  } else {
    ctx.reply('Por favor, proporciona una petición después del comando.');
  }
});

// Lanzar el bot
bot.launch();
