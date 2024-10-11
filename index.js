import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import { addToFile } from './fileManager.js'; // Importar la función de gestión de archivos

// Cargar las variables de entorno
dotenv.config();

const bot = new Telegraf(process.env.MY_BOT_TOKEN);

// Manejo del comando /chatp
bot.command('chatp', async (ctx) => {
    // Reiniciar los datos de la petición
    const petitionData = { hash: '', archivo: '', deteccion: '', descripcion: '' };
    
    ctx.reply('Por favor, proporciona los siguientes detalles para tu petición:');
    
    // Solicitar hash
    ctx.reply('1. Hash:');
    
    // Escuchar la respuesta del usuario
    bot.on('text', async (ctx) => {
        if (!petitionData.hash) {
            petitionData.hash = ctx.message.text;
            ctx.reply('2. Archivo:');
        } else if (!petitionData.archivo) {
            petitionData.archivo = ctx.message.text;
            ctx.reply('3. Detección:');
        } else if (!petitionData.deteccion) {
            petitionData.deteccion = ctx.message.text;
            ctx.reply('4. Descripción:');
        } else if (!petitionData.descripcion) {
            petitionData.descripcion = ctx.message.text;

            // Almacenar la petición
            await addToFile(petitionData);
            ctx.reply(`Petición guardada en https://github.com/${process.env.MY_GITHUB_USER}/${process.env.MY_GITHUB_REPO}/blob/main/peticiones.adoc`);
            
            // Reiniciar los datos después de completar la petición
            petitionData.hash = '';
            petitionData.archivo = '';
            petitionData.deteccion = '';
            petitionData.descripcion = '';
        }
    });
});

// Lanzar el bot
bot.launch().then(() => {
    console.log('Bot iniciado y escuchando comandos.');
}).catch((error) => {
    console.error('Error al lanzar el bot:', error);
});
