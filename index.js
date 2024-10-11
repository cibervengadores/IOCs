import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import { addToFile } from './fileManager.js'; // Importar la función de gestión de archivos

// Cargar las variables de entorno
dotenv.config();

const bot = new Telegraf(process.env.MY_BOT_TOKEN);

// Manejo del comando /chatp
bot.command('chatp', async (ctx) => {
    // Solicitar detalles en un solo mensaje
    ctx.reply('Por favor, proporciona los siguientes detalles separados por comas (sin espacios): Hash, Nombre del archivo, Detección, Descripción.');
});

// Escuchar la respuesta del usuario
bot.on('text', async (ctx) => {
    const input = ctx.message.text;

    // Separar los datos por comas
    const data = input.split(',').map(item => item.trim());

    // Validar que se hayan proporcionado al menos 4 elementos
    if (data.length < 4) {
        ctx.reply('Por favor, asegúrate de proporcionar todos los detalles: Hash, Nombre del archivo, Detección, Descripción. Si falta algún dato, se representará como un punto.');
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
    ctx.reply(`Petición guardada en https://github.com/${process.env.MY_GITHUB_USER}/${process.env.MY_GITHUB_REPO}/blob/main/peticiones.adoc`);
});

// Lanzar el bot
bot.launch().then(() => {
    console.log('Bot iniciado y escuchando comandos.');
}).catch((error) => {
    console.error('Error al lanzar el bot:', error);
});
