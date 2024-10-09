const express = require('express');
const { Telegraf } = require('telegraf');
const simpleGit = require('simple-git');
const fs = require('fs');
require('dotenv').config();

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);
const git = simpleGit();

const GITHUB_REPO = process.env.GITHUB_REPO; // Asegúrate de que no tenga .git al final
const GITHUB_USER = process.env.GITHUB_USER;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const FILE_PATH = 'peticiones.md';

// Configura el usuario de Git
const setGitConfig = async () => {
  try {
    await git.addConfig('user.name', GITHUB_USER);
    await git.addConfig('user.email', `${GITHUB_USER}@proton.me`);
  } catch (error) {
    console.error(`Error configurando nombre o correo: ${error}`);
  }
};

// Llama a esta función al inicio
setGitConfig();

// Añadir la petición al archivo peticiones.md
const addToFile = async (petition) => {
  try {
    if (!fs.existsSync(FILE_PATH)) {
      fs.writeFileSync(FILE_PATH, '');
    }
    fs.appendFileSync(FILE_PATH, `${petition}\n`);
    console.log('Petición añadida:', petition);

    const gitUrl = `https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${GITHUB_REPO}.git`;

    await git.pull('origin', 'main'); // Cambia 'main' si es necesario

    await git.add(FILE_PATH);
    await git.commit(`Add petition: ${petition}`);

    await pushToGithub(gitUrl);
  } catch (error) {
    console.error('Error guardando en GitHub:', error);
  }
};

// Hacer push a GitHub
const pushToGithub = async (gitUrl) => {
  try {
    await git.push(gitUrl, 'main'); // Cambia 'main' si es necesario
    console.log('Cambios enviados a GitHub');
  } catch (error) {
    console.error('Error en push:', error);
  }
};

// Configura el webhook
app.use(bot.webhookCallback('/api/webhook'));

// Código del bot
bot.start((ctx) => {
  ctx.reply('¡Hola! Estoy aquí para recibir tus peticiones. Usa el comando /chatp para enviar una.');
});

// Manejar el comando /chatp
bot.command('chatp', async (ctx) => {
  const petition = ctx.message.text.replace('/chatp', '').trim();
  if (petition) {
    try {
      await addToFile(petition);
      ctx.reply(`Petición guardada en peticiones.md de https://github.com/${GITHUB_USER}/${GITHUB_REPO}.`);
    } catch (error) {
      ctx.reply('Ocurrió un error al procesar tu petición. Intenta de nuevo más tarde.');
    }
  } else {
    ctx.reply('Por favor, proporciona una petición después del comando.');
  }
});

// Inicia el servidor
const PORT = process.env.PORT || 10000; // Asegúrate de que el puerto sea 10000
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});

// Exportar la app
module.exports = app;
