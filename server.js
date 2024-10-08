const { Telegraf } = require('telegraf');
const express = require('express');
const serverless = require('serverless-http');
const simpleGit = require('simple-git');
require('dotenv').config();

const git = simpleGit();
const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_USER = process.env.GITHUB_USER;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const FILE_PATH = 'peticiones.txt';

// Función para agregar contenido al repositorio de GitHub
const addToGitHub = async (text) => {
    const gitUrl = `https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${GITHUB_REPO}.git`;

    try {
        // Clonar el repositorio si no existe
        await git.clone(gitUrl);
        await git.pull();

        const fs = require('fs');
        const filePath = `${GITHUB_REPO}/${FILE_PATH}`;
        fs.appendFileSync(filePath, `${text}\n`);

        await git.add(filePath);
        await git.commit(`Add petition: ${text}`);
        await git.push();
        console.log('Changes pushed to GitHub');
    } catch (error) {
        console.error('Error pushing to GitHub:', error);
    }
};

// Manejo del comando /chatp
bot.command('chatp', async (ctx) => {
    const petition = ctx.message.text.replace('/chatp', '').trim();
    if (petition) {
        await addToGitHub(petition);
        ctx.reply('Petición guardada en GitHub.');
    } else {
        ctx.reply('Por favor, proporciona una petición después del comando.');
    }
});

// Configuración del webhook
app.use(bot.webhookCallback('/bot'));

// Iniciar el bot
bot.launch();

// Exportar el manejador para funciones serverless
module.exports.handler = serverless(app);
