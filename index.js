import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import { addToFile } from './fileManager.js'; // Importar la función de gestión de archivos

// Cargar las variables de entorno
dotenv.config();

const bot = new Telegraf(process.env.MY_BOT_TOKEN);

// Definir emoticonos
const emoji = {
    success: '\u2705', // ✅
    error: '\u274C', // ❌
    warning: '\u26A0', // ⚠️
    note: '\u1F4DD', // 📝
    link: '\u1F517', // 🔗
    celebration: '\u1F389', // 🎉
    robot: '\u1F916', // 🤖
};

// Manejo del comando /chatp
bot.command('chatp', async (ctx) => {
    // Reiniciar los datos de la petición
    const petitionData = { hash: '', archivo: '', deteccion: '', descripcion: '' };
    
    ctx.reply(`✨ Por favor, proporciona los siguientes detalles en una sola línea, separados por comas (sin espacios): ${emoji.note} **Hash**, **Nombre del archivo**, **Detección**, **Descripción**.`);
    
    // Escuchar la respuesta del usuario
    bot.on('text', async (ctx) => {
        const input = ctx.message.text.split(',');

        if (input.length === 4) {
            // Crear el objeto petitionData a partir de la entrada del usuario
            petitionData.hash = input[0].trim();
            petitionData.archivo = input[1].trim();
            petitionData.deteccion = input[2].trim();
            petitionData.descripcion = input[3].trim();

            // Almacenar la petición
            await addToFile(petitionData);

            // Respuesta organizada
            ctx.reply(`✨ **Indicador de compromiso guardado:**\n\n` +
                      `**Hash:** ${petitionData.hash}\n` +
                      `**Nombre del archivo:** ${petitionData.archivo}\n` +
                      `**Detección:** ${petitionData.deteccion}\n` +
                      `**Descripción:** ${petitionData.descripcion}\n\n` +
                      `${emoji.success} **Indicador de compromiso guardada exitosamente!**\n` +
                      `${emoji.celebration} \n` +
                      `${emoji.link} **Consulta aquí:** https://github.com/${process.env.MY_GITHUB_USER}/${process.env.MY_GITHUB_REPO}/blob/main/peticiones.adoc`);
        } else {
            ctx.reply(`${emoji.warning} **Error:** Asegúrate de proporcionar exactamente cuatro valores, separados por comas (sin espacios). ${emoji.error}`);
        }
    });
});

// Lanzar el bot
bot.launch().then(() => {
    console.log(`${emoji.robot} Bot iniciado y escuchando comandos.`);
}).catch((error) => {
    console.error(`${emoji.error} Error al lanzar el bot:`, error);
});
