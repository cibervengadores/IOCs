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

// Verifica que el BOT_TOKEN esté configurado
if (!process.env.BOT_TOKEN) {
  console.error('Falta el token de Telegram en .env');
  process.exit(1);
}

// Función para configurar el usuario de Git
const setGitConfig = async () => {
  try {
    await git.addConfig('user.name', GITHUB_USER);
    await git.addConfig('user.email', `${GITHUB_USER}@example.com`);
  } catch (error) {
    console.error(`Error configurando nombre o correo: ${error}`);
  }
};

// Llama a esta función al inicio
setGitConfig();

// Middleware para manejar el webhook
app.use(express.json());
app.post('/api/webhook', (req, res) => {
  console.log('Webhook recibido:', req.body); // Log para verificar que el webhook está funcionando
  bot.handleUpdate(req.body);
  res.sendStatus(200);
});

// Comandos del bot
bot.start((ctx) => ctx.reply('¡Hola! Estoy aquí para recibir tus peticiones. Usa el comando /chatp para enviar una.'));
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

// Función para añadir la petición al archivo peticiones.md
const addToFile = async (petition) => {
  try {
    if (!fs.existsSync(FILE_PATH)) {
      fs.writeFileSync(FILE_PATH, '');
    }

    fs.appendFileSync(FILE_PATH, `${petition}\n`);
    console.log('Petición añadida:', petition);

    const gitUrl = `https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${GITHUB_REPO}.git`;

    // Hacer pull primero para integrar cambios remotos
    await git.pull('origin', 'main'); // Cambia 'main' por tu rama principal si es necesario

    await git.add(FILE_PATH);
    await git.commit(`Add petition: ${petition}`);
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
      await git.pull('origin', 'main');
      await git.push(gitUrl, 'main');
    } else if (error.message.includes('Could not read from remote repository')) {
      console.error('No se pudo leer del repositorio remoto. Verifica la URL y tus credenciales.');
    }
  }
};

// Configurar el puerto y levantar el servidor
const PORT = process.env.PORT || 3000; // Usa el puerto configurado en la variable de entorno o el 3000 por defecto
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
