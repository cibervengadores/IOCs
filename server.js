import { Telegraf } from 'telegraf';
import simpleGit from 'simple-git';
import fs from 'fs';
import express from 'express';
import dotenv from 'dotenv';

// Cargar las variables de entorno
dotenv.config();

// Imprimir variables de entorno para depuración
console.log('MY_BOT_TOKEN:', process.env.MY_BOT_TOKEN);
console.log('MY_GITHUB_USER:', process.env.MY_GITHUB_USER);
console.log('MY_GITHUB_REPO:', process.env.MY_GITHUB_REPO);
console.log('MY_GITHUB_TOKEN:', process.env.MY_GITHUB_TOKEN); // También puedes imprimir el token de GitHub

const bot = new Telegraf(process.env.MY_BOT_TOKEN);
const git = simpleGit();

const GITHUB_REPO = process.env.MY_GITHUB_REPO;
const GITHUB_USER = process.env.MY_GITHUB_USER;
const GITHUB_TOKEN = process.env.MY_GITHUB_TOKEN; // Asegúrate de que también existe
const FILE_PATH = 'peticiones.adoc'; // Cambiado a .adoc

const app = express(); // Inicializar la aplicación Express

// Función para configurar Git
const configureGit = async () => {
    await git.addConfig('user.name', 'cibervengadores');
    await git.addConfig('user.email', 'cibervengadores@proton.me');
};

// Función para añadir la petición al archivo peticiones.adoc
const addToFile = async (petition) => {
    try {
        // Asegurarse de que el archivo existe o crearlo
        if (!fs.existsSync(FILE_PATH)) {
            fs.writeFileSync(FILE_PATH, `== Peticiones\n\n[cols="1,1,1,1"]\n|===\n| Hash | Archivo | Detección | Descripción\n`);
        }

        // Añadir la petición en formato de tabla
        const formattedPetition = `| ${petition.hash} | ${petition.archivo} | ${petition.deteccion} | ${petition.descripcion}\n`;
        fs.appendFileSync(FILE_PATH, formattedPetition);
        console.log('Petición añadida:', formattedPetition);

        const gitUrl = `https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${GITHUB_REPO}.git`;

        // Añadir el archivo y hacer commit
        await git.add(FILE_PATH);
        await git.commit(`Add petition: ${petition.hash}`);

        // Hacer push forzado
        console.log('Intentando hacer push forzado.');
        await git.push(gitUrl, 'main', { '--force': null });
        console.log('Push forzado realizado.');
    } catch (error) {
        // Manejo de errores
        if (error.message.includes('index.lock')) {
            console.error('Error: El archivo index.lock existe. Eliminarlo para continuar.');
            // Eliminar el archivo de bloqueo
            fs.unlinkSync('.git/index.lock'); // Eliminar el archivo index.lock
            console.log('Archivo index.lock eliminado. Intenta nuevamente.');
        } else {
            console.error('Error guardando en GitHub:', error.message);
        }
    }
};

// Manejo del comando /chatp
bot.command('chatp', async (ctx) => {
    ctx.reply('✨ Por favor, proporciona los siguientes detalles en una sola línea, separados por comas (sin espacios): Hash, Nombre del archivo, Detección, Descripción.');
    
    // Escuchar la respuesta del usuario
    bot.on('text', async (ctx) => {
        const input = ctx.message.text.split(',');

        if (input.length === 4) {
            // Crear el objeto petitionData a partir de la entrada del usuario
            const petitionData = {
                hash: input[0].trim(),
                archivo: input[1].trim(),
                deteccion: input[2].trim(),
                descripcion: input[3].trim(),
            };

            // Almacenar la petición
            await addToFile(petitionData);
            
            // Respuesta organizada
            ctx.reply(`✅ **Indicador de compromiso guardado:**\n\n` +
                      `**Hash:** ${petitionData.hash}\n` +
                      `**Nombre del archivo:** ${petitionData.archivo}\n` +
                      `**Detección:** ${petitionData.deteccion}\n` +
                      `**Descripción:** ${petitionData.descripcion}\n\n` +
                      `✅ **Indicador de compromiso guardada exitosamente!** 🎉\n` +
                      `🔗 **Consulta aquí:** https://github.com/${GITHUB_USER}/${GITHUB_REPO}/blob/main/peticiones.adoc`);
        } else {
            ctx.reply('⚠️ Por favor, asegúrate de proporcionar exactamente cuatro valores, separados por comas (sin espacios). ❌');
        }
    });
});

// Configurar el webhook de Telegram
app.use(bot.webhookCallback('/bot')); // Asegúrate de que este sea el endpoint correcto

// Iniciar el servidor Express
const PORT = process.env.PORT || 3000; // Puerto que escucha
app.listen(PORT, async () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
    // Configurar Git al iniciar el servidor
    await configureGit();
    // Iniciar el bot
    bot.launch().then(() => {
        console.log('Bot iniciado y escuchando comandos.');
    }).catch((error) => {
        console.error('Error al lanzar el bot:', error);
    });
});
