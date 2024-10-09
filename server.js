const { Telegraf } = require('telegraf');
const simpleGit = require('simple-git');
const fs = require('fs');
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
        // Configurar nombre y correo de Git (puedes comentar esto si ya está configurado globalmente)
        await git.addConfig('user.name', 'cibervengadores');
        await git.addConfig('user.email', 'cibervengadores@proton.me');

        // Asegurarse de que el archivo existe o crearlo
        if (!fs.existsSync(FILE_PATH)) {
            fs.writeFileSync(FILE_PATH, '');
        }

        // Añadir la petición al archivo
        fs.appendFileSync(FILE_PATH, `${petition}\n`);
        console.log('Petición añadida:', petition);

        // Añadir el archivo y hacer commit
        await git.add(FILE_PATH);
        await git.commit(`Add petition: ${petition}`);

        // Hacer push forzado
        console.log('Intentando hacer push forzado.');
        const gitUrl = `https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${GITHUB_REPO}.git`;
        await git.push(gitUrl, 'main', { '--force': null }); // Cambia 'main' si tu rama principal es diferente
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
            await addToFile(petition); // Llama a la función para agregar la petición al archivo
            ctx.reply(`Petición guardada en https://github.com/${GITHUB_USER}/${GITHUB_REPO}/blob/main/peticiones.md`);
        } else {
            ctx.reply('Por favor, proporciona una petición después del comando.');
        }
    } catch (error) {
        console.error('Error al procesar el comando /chatp:', error);
        ctx.reply('Ocurrió un error al procesar tu petición. Intenta de nuevo más tarde.');
    }
});

// Iniciar el bot
bot.launch().then(() => {
    console.log('Bot iniciado y escuchando comandos.');
}).catch((error) => {
    console.error('Error al lanzar el bot:', error);
});
const PORT = process.env.PORT || 3000; // Asegúrate de que el puerto sea 3000 o el especificado por Render
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
