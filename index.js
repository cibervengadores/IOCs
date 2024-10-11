import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import express from 'express';
import { addToFile } from './fileManager.js'; // Importar la función para manejar las peticiones

// Cargar las variables de entorno
dotenv.config();

// Inicializar Express y el bot
const app = express();
const bot = new Telegraf(process.env.MY_BOT_TOKEN);

// Manejo del comando /start
bot.start((ctx) => {
    ctx.reply('¡Hola! Estoy aquí para recibir tus peticiones. Usa el comando /chatp para enviar una.');
});

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
    
    // Responder al usuario con el mensaje de confirmación
    ctx.reply(`Indicador de compromiso alojado en: https://github.com/cibervengadores/IOCs/blob/main/peticiones.adoc`);
});

// Iniciar el bot
bot.launch().then(() => {
    console.log('Bot iniciado y escuchando comandos.');
}).catch((error) => {
    console.error('Error al lanzar el bot:', error);
});

