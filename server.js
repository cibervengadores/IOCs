const { Telegraf } = require('telegraf');
const simpleGit = require('simple-git');
const fs = require('fs');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const git = simpleGit();

const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_USER = process.env.GITHUB_USER;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const FILE_PATH = 'peticiones.md';

// Función para añadir la petición al archivo peticiones.md
const addToFile = async (petition) => {
  try {
    // Asegúrate de que el archivo existe
    if (!fs.existsSync(FILE_PATH)) {
      fs.writeFileSync(FILE_PATH, ''); // Crear archivo si no existe
    }

    // Añadir la petición al archivo
    fs.appendFileSync(FILE_PATH, `${petition}\n`);
    console.log('Petición añadida:', petition);

    // Configurar identidad de usuario de Git
    await git.addConfig('user.email', 'cibervengadores@proton.me');
    await git.addConfig('user.name', 'cibervengadores');

    // Guardar los cambios en GitHub
    const gitUrl = `https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${GITHUB_REPO}.git`;

    // Añadir, commitear y hacer push a GitHub
    await git.add(FILE_PATH);
    await git.commit(`Add petition: ${petition}`);
    await git.push(gitUrl, 'main'); // Cambia 'main' por tu rama si es necesario
    console.log('Cambios enviados a GitHub');
  } catch (error) {
    console.error('Error guardando en GitHub:', error);
  }
};

// Código del bot
bot.command('chatp', async (ctx) => {
  const petition = ctx.message.text.replace('/chatp', '').trim();
  if (petition) {
    await addToFile(petition);
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

// Webhook
const express = require('express');
const app = express();

app.use(bot.webhookCallback('/bot'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});

module.exports = app;
