const { Telegraf } = require('telegraf');
const simpleGit = require('simple-git');
const fs = require('fs');
const { exec } = require('child_process');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const git = simpleGit();

const GITHUB_REPO = process.env.GITHUB_REPO; // Asegúrate de que no tenga .git al final
const GITHUB_USER = process.env.GITHUB_USER;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const FILE_PATH = 'peticiones.md';

// Función para configurar el usuario de Git
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

// Función para añadir la petición al archivo peticiones.md
const addToFile = async (petition) => {
  try {
    // Asegúrate de que el archivo existe y si no, lo crea
    if (!fs.existsSync(FILE_PATH)) {
      fs.writeFileSync(FILE_PATH, '');
    }

    // Agregar la petición al archivo
    fs.appendFileSync(FILE_PATH, `${petition}\n`);
    console.log('Petición añadida:', petition);

    const gitUrl = `https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${GITHUB_REPO}.git`;

    // Hacer pull primero para integrar cambios remotos
    await git.pull('origin', 'main'); // Cambia 'main' por tu rama principal si es necesario

    // Añadir, commitear y hacer push a GitHub
    await git.add(FILE_PATH);
    await git.commit(`Add petition: ${petition}`);

    // Intentar push y manejar errores
    await pushToGithub(gitUrl);
  } catch (error) {
    console.error('Error guardando en GitHub:', error);
  }
};

// Función para hacer push a GitHub
const pushToGithub = async (gitUrl) => {
  try {
    await git.push(gitUrl, 'main'); // Cambia 'main' por tu rama principal si es necesario
    console.log('Cambios enviados a GitHub');
  } catch (error) {
    console.error('Error en push:', error);
    if (error.message.includes('rejected')) {
      console.log('Intentando hacer pull y push de nuevo debido a cambios remotos.');
      await git.pull('origin', 'main'); // Intenta hacer pull nuevamente
      await git.push(gitUrl, 'main'); // Luego intenta hacer push
    } else if (error.message.includes('Could not read from remote repository')) {
      console.error('No se pudo leer del repositorio remoto. Verifica la URL y tus credenciales.');
    }
  }
};

// Código del bot
bot.command('chatp', async (ctx) => {
  if (!ctx.message || !ctx.message.text) {
    ctx.reply('Error: No se pudo obtener el texto del mensaje.');
    return;
  }

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

module.exports = app; // Exporta la app para usar con un servidor Express si es necesario
