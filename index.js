const { Telegraf } = require('telegraf');
const simpleGit = require('simple-git');
const fs = require('fs');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const git = simpleGit();

const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_USER = process.env.GITHUB_USER;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const FILE_PATH = 'peticiones.txt';

// Función para agregar peticiones a GitHub
const addToGitHub = async (text) => {
  const gitUrl = `https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${GITHUB_REPO}.git`;

  try {
    await git.clone(gitUrl);
    await git.pull();

    const filePath = `IOCs/peticiones.txt`; // Ajusta la ruta según sea necesario
    fs.appendFileSync(filePath, `${text}\n`);

    await git.add(filePath);
    await git.commit(`Add petition: ${text}`);
    await git.push();
    console.log('Changes pushed to GitHub');
  } catch (error) {
    console.error('Error pushing to GitHub:', error);
  }
};

// Manejar el comando /chatp
bot.command('chatp', async (ctx) => {
  const petition = ctx.message.text.replace('/chatp', '').trim();
  if (petition) {
    await addToGitHub(petition);
    ctx.reply('Petición guardada en GitHub.');
  } else {
    ctx.reply('Por favor, proporciona una petición después del comando.');
  }
});

// Lanzar el bot
bot.launch();
