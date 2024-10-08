const { Telegraf } = require('telegraf');
const fs = require('fs');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const FILE_PATH = 'IOCs/peticiones.txt'; // Ruta donde se guardarán las peticiones
const GITHUB_URL = 'https://github.com/cibervengadores/IOCs/peticiones.txt'; // URL del archivo en GitHub

// Función para agregar peticiones al archivo
const addToFile = (text) => {
  // Verifica si el directorio IOCs existe y si no, lo crea
  if (!fs.existsSync('IOCs')) {
    fs.mkdirSync('IOCs'); // Crea el directorio si no existe
  }

  // Agrega la petición al archivo peticiones.txt
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
    ctx.reply(`Petición guardada en [peticiones.txt](https://github.com/cibervengadores/IOCs/peticiones.txt).`);
  } else {
    ctx.reply('Por favor, proporciona una petición después del comando.');
  }
});

// Lanzar el bot
bot.launch();
