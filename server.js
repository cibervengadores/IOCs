import { Telegraf } from 'telegraf';
import simpleGit from 'simple-git';
import fs from 'fs';
import express from 'express';
import dotenv from 'dotenv';

// Cargar las variables de entorno
dotenv.config();

// Inicializar Express y el bot
const app = express();
const bot = new Telegraf(process.env.MY_BOT_TOKEN);
const git = simpleGit();
const GITHUB_REPO = process.env.MY_GITHUB_REPO;
const GITHUB_USER = process.env.MY_GITHUB_USER;
const GITHUB_TOKEN = process.env.MY_GITHUB_TOKEN; // Asegúrate de que también existe
const FILE_PATH = 'peticiones.adoc'; // Archivo para almacenar las peticiones

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
bot.command('chatp', (ctx) => {
    ctx.reply('Por favor, proporciona los siguientes detalles en una sola línea, separados por comas (sin espacios): Hash, Nombre del archivo, Detección, Descripción.');
});

// Escuchar la respuesta del usuario
bot.on('text', async (ctx) => {
    const input = ctx.message.text.trim();

    // Separar los datos por comas
    const data = input.split(',').map(item => item.trim());

    // Validar que se hayan proporcionado al menos 4 elementos
    if (data.length < 4) {
        ctx.reply('Faltan datos. Por favor, asegúrate de proporcionar todos los detalles: Hash, Nombre del archivo, Detección, Descripción. Si falta algún dato, se representará como un punto.');
        return;
    }

    // Asignar los datos a variables, usando '.' si falta alguno
    const hash = data[0] || '.';
    const archivo = data[1] || '.';
    const deteccion = data[2] || '.';
    const descripcion = data[3] || '.';

    // Crear el objeto de la petición
    const petitionData = {
        hash,
        archivo,
        deteccion,
        descripcion
    };

    // Almacenar la petición
    await addToFile(petitionData);
    
    // Responder al usuario con la misma estructura
    ctx.reply(`Petición guardada: ${hash}, ${archivo}, ${deteccion}, ${descripcion}`);
});

// Configurar el webhook de Telegram (opcional, si decides usar webhook)
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
