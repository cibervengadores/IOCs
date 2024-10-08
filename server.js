const { Telegraf } = require('telegraf');
const simpleGit = require('simple-git');
const fs = require('fs');
const { exec } = require('child_process'); // Importa exec
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const git = simpleGit();

const GITHUB_REPO = process.env.GITHUB_REPO; // Asegúrate de que esto sea correcto
const GITHUB_USER = process.env.GITHUB_USER;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const FILE_PATH = 'peticiones.md'; // Cambiado a peticiones.md

// Función para añadir la petición al archivo peticiones.md
const addToFile = async (petition) => {
  try {
    // Configurar el nombre y el correo de usuario usando exec
    await new Promise((resolve, reject) => {
      exec('git config --global user.name "cibervengadores"', (error) => {
        if (error) {
          console.error(`Error configurando nombre de usuario: ${error}`);
          return reject(error);
        }
        resolve();
      });
    });

    await new Promise((resolve, reject) => {
      exec('git config --global user.email "cibervengadores@proton.me"', (error) => {
        if (error) {
          console.error(`Error configurando correo electrónico: ${error}`);
          return reject(error);
        }
        resolve();
      });
    });

    // Asegúrate de que el archivo existe y si no, lo crea
    if (!fs.existsSync(FILE_PATH)) {
      fs.writeFileSync(FILE_PATH, ''); // Crea el archivo si no existe
    }

    // Agregar la petición al archivo
    fs.appendFileSync(FILE_PATH, `${petition}\n`);
    console.log('Petición añadida:', petition);

    // Guardar los cambios en GitHub
    const gitUrl = `https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${GITHUB_REPO}.git`;

    // Primero, hacer pull para integrar los cambios remotos
    try {
      await git.pull('origin', 'main'); // Asegúrate de usar el nombre correcto de tu rama
      console.log('Cambios remotos integrados');
    } catch (pullError) {
      console.error('Error al hacer pull:', pullError);
      throw new Error('Error al intentar actualizar el repositorio remoto.'); // Lanza un error para manejarlo más arriba
    }

    // Añadir, commitear y hacer push a GitHub
    await git.add(FILE_PATH);
    await git.commit(`Add petition: ${petition}`);
    await git.push(gitUrl, 'main'); // Cambia 'main' por tu rama principal si es necesario
    console.log('Cambios enviados a GitHub');
  } catch (error) {
    console.error('Error guardando en GitHub:', error);
    throw error; // Lanza el error para manejarlo más arriba
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
      ctx.reply(`Petición guardada en peticiones.md de https://github.com/cibervengadores/IOCs.`);
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
