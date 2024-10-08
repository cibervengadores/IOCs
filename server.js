const { Telegraf } = require('telegraf');
const express = require('express');
const fs = require('fs');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

// Función para añadir la petición al archivo peticiones.md
const addToFile = (petition) => {
  const filePath = 'peticiones.md'; // Cambiamos a peticiones.md
  fs.appendFile(filePath, `${petition}\n`, (err) => {
    if (err) {
      console.error('Error escribiendo en el archivo:', err);
    } else {
      console.log('Petición añadida:', petition);
    }
  });
};

// Código del bot
bot.command('chatp', async (ctx) => {
  const petition = ctx.message.text.replace('/chatp', '').trim();
  if (petition) {
    addToFile(petition);
    ctx.reply('Petición guardada en peticiones.md de https://github.com/cibervengadores/IOCs');
  } else {
    ctx.reply('Por favor, proporciona una petición después del comando.');
  }
});

bot.launch();

app.use(bot.webhookCallback('/bot'));
module.exports = app; // Cambié el export para que funcione correctamente con Express
