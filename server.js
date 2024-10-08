const { Telegraf } = require('telegraf');
const simpleGit = require('simple-git');
const fs = require('fs');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const git = simpleGit();

const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_USER = process.env.GITHUB_USER;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const FILE_PATH = 'peticiones.md'; // Cambiado a peticiones.md

// Función para añadir la petición al archivo peticiones.md
const addToFile = async (petition) => {
  try {
    // Asegúrate de que el archivo existe y si no, lo crea
    if (!fs.existsSync(FILE_PATH)) {
      fs.writeFileSync(FILE_PATH, ''); // Crea el archivo si no existe
    }

    // Agregar la petición al archivo
    fs.appendFileSync(FILE_PATH, `${petition}\n`);
    console.log('Petición añadida:', petition);

    const gitUrl = `https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${GITHUB_REPO}.git`;

    // Configurar el nombre y correo de usuario para los commits
    await git.addConfig('user.email', 'cibervengadores@proton.me');
    await git.addConfig('user.name', 'cibervegnadores');

    // Hacer pull para obtener cambios remotos
    await git.pull(gitUrl, 'main');
    console.log('Repositorios sincronizados con éxito');

    // Añadir, commitear y hacer push a GitHub
    await git.add(FILE_PATH);
    await git.commit(`Add petition: ${petition}`);
    await git.push(gitUrl, 'main'); // Cambia 'main' por tu rama principal si es necesario
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

// Código para manejar el webhook (si es necesario)
const express = require('express');
const app = express();

app.use(bot.webhookCallback('/bot'));

const PORT = process.env.PORT || 3000; // Usa el puerto configurado en la variable de entorno o el 3000 por defecto
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});

module.exports = app;
