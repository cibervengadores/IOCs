const { Telegraf } = require('telegraf');
const axios = require('axios'); // Asegúrate de que axios esté instalado
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

const GITHUB_REPO = process.env.GITHUB_REPO; // Nombre del repositorio
const GITHUB_USER = process.env.GITHUB_USER; // Tu usuario de GitHub
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Tu token de GitHub
const FILE_PATH = 'peticiones.md'; // Nombre del archivo en el repositorio

// Función para añadir la petición al archivo peticiones.md en GitHub
const addToFile = async (petition) => {
  try {
    // URL de la API para el archivo peticiones.md
    const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${FILE_PATH}`;

    // Intentar obtener el contenido del archivo
    const response = await axios.get(url, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
      },
    });

    // Extraer el contenido existente y convertirlo de base64
    const content = Buffer.from(response.data.content, 'base64').toString();
    
    // Añadir la nueva petición
    const newContent = `${content}${petition}\n`;
    
    // Actualizar el archivo en GitHub
    await axios.put(url, {
      message: `Add petition: ${petition}`,
      content: Buffer.from(newContent).toString('base64'),
      sha: response.data.sha, // Necesario para actualizar el archivo
    }, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
      },
    });

    console.log('Petición añadida y cambios enviados a GitHub');
  } catch (error) {
    // Si el archivo no existe, se crea uno nuevo
    if (error.response && error.response.status === 404) {
      try {
        // Crear el archivo con el contenido de la primera petición
        await axios.put(url, {
          message: `Create peticiones.md`,
          content: Buffer.from(petition).toString('base64'),
        }, {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
          },
        });
        console.log('Archivo creado en GitHub con la primera petición');
      } catch (createError) {
        console.error('Error creando el archivo en GitHub:', createError.response.data.message || createError.message);
      }
    } else {
      console.error('Error guardando en GitHub:', error.response.data.message || error.message);
    }
  }
};

// Código del bot
bot.command('chatp', async (ctx) => {
  const petition = ctx.message.text.replace('/chatp', '').trim();
  if (petition) {
    await addToFile(petition);
    ctx.reply(`Petición guardada en peticiones.md de https://github.com/${GITHUB_USER}/${GITHUB_REPO}.`);
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
