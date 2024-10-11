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
const FILE_PATH = 'peticiones.md';

const app = express(); // Inicializar la aplicación Express

// Función para configurar Git
const configureGit = async () => {
    await git.addConfig('user.name', 'cibervengadores');
    await git.addConfig('user.email', 'cibervengadores@proton.me');
};

// Función para añadir la petición al archivo peticiones.md
const addToFile = async (petition) => {
    try {
        // Asegurarse de que el archivo existe o crearlo
        if (!fs.existsSync(FILE_PATH)) {
            fs.writeFileSync(FILE_PATH, '');
        }

        // Añadir la petición al archivo
        fs.appendFileSync(FILE_PATH, `${petition}\n`);
        console.log('Petición añadida:', petition);

        const gitUrl = `https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${GITHUB_REPO}.git`;

        // Añadir el archivo y hacer commit
        await git.add(FILE_PATH);
        await git.commit(`Add petition: ${petition}`);

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
    try {
        const petition = ctx.message.text.replace('/chatp', '').trim();
        if (petition) {
            await addToFile(petition);
            ctx.reply(`Petición guardada en https://github.com/${GITHUB_USER}/${GITHUB_REPO}/blob/main/peticiones.md`);
        } else {
            ctx.reply('Por favor, proporciona una petición después del comando.');
        }
    } catch (error) {
        console.error('Error al procesar el comando /chatp:', error);
        ctx.reply('Ocurrió un error al procesar tu petición. Intenta de nuevo más tarde.');
    }
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
