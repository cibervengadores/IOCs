const { Telegraf } = require('telegraf');
const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const git = simpleGit();

const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_USER = process.env.GITHUB_USER;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const FILE_PATH = 'peticiones.md'; // Cambiado a .md

// Verifica si el archivo existe y lo crea si no
if (!fs.existsSync(FILE_PATH)) {
    fs.writeFileSync(FILE_PATH, ''); // Crea el archivo si no existe
}

// Función para agregar peticiones a GitHub
const addToGitHub = async (text) => {
    const gitUrl = `https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${GITHUB_REPO}.git`;
    
    try {
        // Clona el repositorio si no existe, de lo contrario hace pull
        const repoPath = path.join(__dirname, 'IOCs');
        if (!fs.existsSync(repoPath)) {
            await git.clone(gitUrl);
        } else {
            await git.pull();
        }

        // Agrega la petición al archivo
        fs.appendFileSync(FILE_PATH, `${text}\n`);

        // Resto de la lógica para Git
        await git.add(FILE_PATH);
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
        ctx.reply(`Petición guardada en peticiones.md de: https://github.com/${GITHUB_USER}/${GITHUB_REPO}`);
    } else {
        ctx.reply('Por favor, proporciona una petición después del comando.');
    }
});

// Lanzar el bot
bot.launch();
