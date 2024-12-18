import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import express from 'express';
import { addToFile } from './filemanager.js'; // Importar la función addToFile

// Cargar las variables de entorno
dotenv.config();

const requiredEnvVars = ['MY_BOT_TOKEN', 'MY_GITHUB_USER', 'MY_GITHUB_TOKEN', 'MY_GITHUB_REPO'];
requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
        console.error(`Error: ${varName} no está definido en el archivo .env`);
        process.exit(1);
    }
});

const bot = new Telegraf(process.env.MY_BOT_TOKEN);
const app = express();

const ALLOWED_GROUP_IDS = ['-1002063977009', '-1002451309597'];
const MY_USER_ID = '6303550179';

let lastChatpMessageId = null;

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

bot.command('chatp', async (ctx) => {
    if (!isAllowedChat(ctx)) {
        ctx.reply('⚠️ No tienes permiso para usar este bot aquí.');
        return;
    }

    const message = await ctx.reply('✨ Por favor, proporciona los siguientes detalles en una sola línea, separados por comas (sin espacios):\n1️⃣ Hash,\n2️⃣ Nombre del archivo,\n3️⃣ Detección,\n4️⃣ Descripción.\n⚠️ Responde a este mensaje ⚠️');
    lastChatpMessageId = message.message_id;
});

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

        console.log('Datos recibidos:', petitionData);
        try {
            await addToFile(petitionData);
            ctx.reply(`✅ Indicador de compromiso guardado:\n\n1️⃣ Hash: ${petitionData.hash}\n2️⃣ Nombre del archivo: ${petitionData.archivo}\n3️⃣ Detección: ${petitionData.deteccion}\n4️⃣ Descripción: ${petitionData.descripcion}\n\n✅ Indicador guardado exitosamente! 🎉\n🔗 Consulta aquí: https://github.com/${process.env.MY_GITHUB_USER}/${process.env.MY_GITHUB_REPO}/blob/main/peticiones.adoc`);
        } catch (error) {
            console.error('Error al agregar el indicador:', error);
            ctx.reply('⚠️ Hubo un error al guardar el indicador. Inténtalo de nuevo más tarde.');
        }
    } else {
        ctx.reply('⚠️ Por favor, asegúrate de proporcionar exactamente cuatro valores, separados por comas (sin espacios). ⚠️ Responde al mensaje principal ⚠️');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
    bot.launch().then(() => {
        console.log('Bot iniciado y escuchando comandos.');
    }).catch((error) => {
        console.error('Error al lanzar el bot:', error);
        process.exit(1);
    });
});
