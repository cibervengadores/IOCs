const { Telegraf } = require('telegraf');
const express = require('express');
const serverless = require('serverless-http');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

// Código del bot (mismo que en index.js)
bot.command('chatp', async (ctx) => {
  const petition = ctx.message.text.replace('/chatp', '').trim();
  if (petition) {
    await addToGitHub(petition);
    ctx.reply('Petición guardada en GitHub.');
  } else {
    ctx.reply('Por favor, proporciona una petición después del comando.');
  }
});

bot.launch();

app.use(bot.webhookCallback('/bot'));
module.exports.handler = serverless(app);
