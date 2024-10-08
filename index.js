const { Telegraf } = require('telegraf');
const fetch = require('node-fetch');
const simpleGit = require('simple-git');
require('dotenv').config();

const git = simpleGit();
const bot = new Telegraf(process.env.BOT_TOKEN);

const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_USER = process.env.GITHUB_USER;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const FILE_PATH = 'peticiones.txt';

const addToGitHub = async (text) => {
  const gitUrl = `https://cibervengadores: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@github.com/github.com/cibervengadores/IOCs.git`;

  try {
    await git.clone(gitUrl);
    await git.pull();

    const fs = require('fs');
    const filePath = `IOCs/peticiones.txt`;
    fs.appendFileSync(filePath, `${text}\n`);

    await git.add(filePath);
    await git.commit(`Add petition: ${text}`);
    await git.push();
    console.log('Changes pushed to GitHub');
  } catch (error) {
    console.error('Error pushing to GitHub:', error);
  }
};

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
