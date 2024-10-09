const { Telegraf } = require('telegraf');
const simpleGit = require('simple-git');
const fs = require('fs');
const { exec } = require('child_process');
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
        if (!fs.existsSync(FILE_PATH)) {
            fs.writeFileSync(FILE_PATH, '');
        }

        fs.appendFileSync(FILE_PATH, `${petition}\n`);
        console.log('Petición añadida:', petition);

        const gitUrl = `https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${GITHUB_REPO}.git`;

        console.log('Intentando hacer pull desde:', gitUrl);
        try {
            await git.pull('origin', 'main'); // Cambia 'main' si tu rama principal es diferente
        } catch (error) {
            console.error('Error al hacer pull:', error.message);
            console.error('URL del repositorio:', gitUrl);
            throw error;
        }

        await git.add(FILE_PATH);
        await git.commit(`Add petition: ${petition}`);

        await git.push(gitUrl, 'main'); // Cambia 'main' si tu rama principal es diferente
        console.log('Cambios enviados a GitHub');
    } catch (error) {
        console.error('Error guardando en GitHub:', error.message);
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
      ctx.reply(`Petición guardada de https://github.com/${GITHUB_USER}/${GITHUB_REPO}/blob/main/peticiones.md.`);
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

// Endpoint para probar conexión a GitHub
app.get('/test-github', async (req, res) => {
  try {
    const response = await axios.get('https://api.github.com', {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`, // Autenticación con el token
      },
    });
    res.send('Conectado a GitHub: ' + response.data.current_user_url);
  } catch (error) {
    res.status(500).send('No se puede conectar a GitHub: ' + error.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});

module.exports = app;
