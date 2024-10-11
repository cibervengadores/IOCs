const { Telegraf } = require('telegraf');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

// Variables para almacenar la información de la petición
let petitionData = { hash: '', archivo: '', deteccion: '', descripcion: '' };

// Código del bot
bot.command('start', (ctx) => {
  ctx.reply('¡Hola! Estoy aquí para recibir tus peticiones. Usa el comando /chatp para enviar una.');
});

// Manejar el comando /chatp
bot.command('chatp', async (ctx) => {
  // Reiniciar los datos de la petición
  petitionData = { hash: '', archivo: '', deteccion: '', descripcion: '' };
  
  ctx.reply('Por favor, proporciona los siguientes detalles para tu petición:');
  
  // Solicitar hash
  ctx.reply('1. Hash:');
  
  // Escuchar la respuesta del usuario
  bot.on('text', (ctx) => {
    if (!petitionData.hash) {
      petitionData.hash = ctx.message.text;
      ctx.reply('2. Archivo:');
    } else if (!petitionData.archivo) {
      petitionData.archivo = ctx.message.text;
      ctx.reply('3. Detección:');
    } else if (!petitionData.deteccion) {
      petitionData.deteccion = ctx.message.text;
      ctx.reply('4. Descripción:');
    } else if (!petitionData.descripcion) {
      petitionData.descripcion = ctx.message.text;

      // Almacenar la petición (aquí podrías agregar lógica para guardar la petición en un archivo o base de datos)
      ctx.reply(`Petición guardada:\nHash: ${petitionData.hash}\nArchivo: ${petitionData.archivo}\nDetección: ${petitionData.deteccion}\nDescripción: ${petitionData.descripcion}`);
      ctx.reply('Gracias por tu petición. Puedes revisar la lista de peticiones en https://github.com/cibervengadores/IOCs/blob/main/peticiones.md');
      
      // Reiniciar los datos después de completar la petición
      petitionData = { hash: '', archivo: '', deteccion: '', descripcion: '' };
    }
  });
});

// Lanzar el bot
bot.launch().then(() => {
  console.log('Bot iniciado y escuchando comandos.');
}).catch((error) => {
  console.error('Error al lanzar el bot:', error);
});
