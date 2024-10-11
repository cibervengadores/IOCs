import { Telegraf } from 'telegraf';
import simpleGit from 'simple-git';
import fs from 'fs';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_USER = process.env.GITHUB_USER;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const FILE_PATH = 'peticiones.md';

// Verificar el token del bot antes de inicializar
const botToken = process.env.BOT_TOKEN;
if (!botToken) {
    console.error('Error: BOT_TOKEN no está definido en las variables de entorno.');
    process.exit(1); // Finaliza el proceso si el token no está definido
}
console.log('BOT_TOKEN cargado correctamente.');

const bot = new Telegraf(botToken);
const git = simpleGit();

const app = express(); // Inicializar la aplicación Express

// Función para configurar Git
const configureGit = async () => {
    try {
        await git.addConfig('user.name', 'cibervengadores');
        await git.addConfig('user.email', 'cibervengadores@proton.me');
        console.log('Configuración de Git completada.');
    } catch (error) {
        console.error('Error configurando Git:', error.message);
    }
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
        console.error('Error guardando en GitHub:', error.message);
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
    try {
        await bot.launch();
        console.log('Bot iniciado y escuchando comandos.');
    } catch (error) {
        console.error('Error al lanzar el bot:', error);
        process.exit(1); // Finaliza el proceso en caso de error crítico
    }
});
