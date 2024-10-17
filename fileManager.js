import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import express from 'express';
import { addToFile } from './filemanager.js'; // Importar la función addToFile

// Cargar las variables de entorno
dotenv.config();

// Configuración del bot
const bot = new Telegraf(process.env.MY_BOT_TOKEN);
const app = express();

// Lista de grupos permitidos y tu propio ID
const ALLOWED_GROUP_IDS = ['-1002063977009', '-1002451309597'];
const MY_USER_ID = '6303550179';

// Variable para almacenar el ID del último mensaje de /chatp
let lastChatpMessageId = null;

// Función para verificar si el chat es permitido
const isAllowedChat = (ctx) => {
    const chatId = ctx.chat.id.toString(); 
    const userId = ctx.from.id.toString(); 

    if (ctx.chat.type === 'private' && userId === MY_USER_ID) {
        return true; 
    } else if (ctx.chat.type === 'supergroup' || ctx.chat.type === 'group') {
        return ALLOWED_GROUP_IDS.includes(chatId);
    }

    return false;
};

// Manejo del comando /chatp
bot.command('chatp', async (ctx) => {
    if (!isAllowedChat(ctx)) {
        ctx.reply('⚠️ No tienes permiso para usar este bot aquí.');
        return;
    }

    const message = await ctx.reply('✨ Por favor, proporciona los siguientes detalles en una sola línea, separados por comas (sin espacios):\n1️⃣ Hash,\n2️⃣ Nombre del archivo,\n3️⃣ Detección,\n4️⃣ Descripción.\n⚠️ Responde a este mensaje ⚠️');
    lastChatpMessageId = message.message_id;
});

// Escuchar solo respuestas al mensaje específico
bot.on('text', async (ctx) => {
    if (!isAllowedChat(ctx)) {
        return;
    }

    const isReply = ctx.message.reply_to_message && ctx.message.reply_to_message.message_id === lastChatpMessageId;

    if (!isReply) {
        return;
    }

    const input = ctx.message.text.split(',');

    if (input.length === 4) {
        const petitionData = {
            hash: input[0].trim(),
            archivo: input[1].trim(),
            deteccion: input[2].trim(),
            descripcion: input[3].trim(),
        };

        console.log('Datos recibidos:', petitionData); // Verifica que los datos se reciben correctamente
        await addToFile(petitionData); // Llama a addToFile para añadir la petición
        ctx.reply(`✅ Indicador de compromiso guardado:\n\n1️⃣ Hash: ${petitionData.hash}\n2️⃣ Nombre del archivo: ${petitionData.archivo}\n3️⃣ Detección: ${petitionData.deteccion}\n4️⃣ Descripción: ${petitionData.descripcion}\n\n✅ Indicador guardado exitosamente! 🎉\n🔗 Consulta aquí: https://github.com/${process.env.MY_GITHUB_USER}/${process.env.MY_GITHUB_REPO}/blob/main/peticiones.adoc`);
    } else {
        ctx.reply('⚠️ Por favor, asegúrate de proporcionar exactamente cuatro valores, separados por comas (sin espacios). ⚠️ Responde al mensaje principal ⚠️');
    }
});

// Iniciar el servidor Express
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
    bot.launch().then(() => {
        console.log('Bot iniciado y escuchando comandos.');
    }).catch((error) => {
        console.error('Error al lanzar el bot:', error);
    });
});
