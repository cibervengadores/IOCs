import { Telegraf } from 'telegraf';
import simpleGit from 'simple-git';
import fs from 'fs';
import express from 'express';
import dotenv from 'dotenv';

// Cargar las variables de entorno
dotenv.config();

// Configuración de Git y el bot
const bot = new Telegraf(process.env.MY_BOT_TOKEN);
const git = simpleGit();
const GITHUB_REPO = process.env.MY_GITHUB_REPO;
const GITHUB_USER = process.env.MY_GITHUB_USER;
const GITHUB_TOKEN = process.env.MY_GITHUB_TOKEN;
const FILE_PATH = 'peticiones.adoc';

const app = express(); 

// Lista de grupos permitidos y tu propio ID
const ALLOWED_GROUP_IDS = ['-1002063977009', '-1002451309597']; // Reemplaza con los IDs de los grupos permitidos
const MY_USER_ID = '6303550179'; // Reemplaza con tu propio ID de usuario

// Variable para almacenar el ID del último mensaje de /chatp
let lastChatpMessageId = null;

// Función para configurar Git
const configureGit = async () => {
    await git.addConfig('user.name', 'cibervengadores');
    await git.addConfig('user.email', 'cibervengadores@proton.me');
};

// Función para verificar si el chat es permitido
const isAllowedChat = (ctx) => {
    const chatId = ctx.chat.id.toString(); 
    const userId = ctx.from.id.toString(); 

    // Permitir solo el uso en privado por el propietario del bot
    if (ctx.chat.type === 'private' && userId === MY_USER_ID) {
        return true; 
    } 
    // Permitir solo en los grupos especificados
    else if (ctx.chat.type === 'supergroup' || ctx.chat.type === 'group') {
        return ALLOWED_GROUP_IDS.includes(chatId);
    }

    return false; // Chats no permitidos
};

// Función para añadir la petición al archivo peticiones.adoc
const addToFile = async (petition) => {
    try {
        if (!fs.existsSync(FILE_PATH)) {
            fs.writeFileSync(FILE_PATH, `== Peticiones\n\n[cols="1,1,1,1"]\n|===\n| Hash | Archivo | Detección | Descripción\n`);
        }

        const formattedPetition = `| ${petition.hash} | ${petition.archivo} | ${petition.deteccion} | ${petition.descripcion}\n`;
        fs.appendFileSync(FILE_PATH, formattedPetition);
        console.log('Petición añadida:', formattedPetition);

        const gitUrl = `https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${GITHUB_REPO}.git`;

        await git.add(FILE_PATH);
        await git.commit(`Add petition: ${petition.hash}`);

        await git.push(gitUrl, 'main', { '--force': null });
        console.log('Push forzado realizado.');
    } catch (error) {
        if (error.message.includes('index.lock')) {
            fs.unlinkSync('.git/index.lock');
        } else {
            console.error('Error guardando en GitHub:', error.message);
        }
    }
};

// Manejo del comando /chatp
bot.command('chatp', async (ctx) => {
    // Verificar si el chat es permitido antes de responder al comando
    if (!isAllowedChat(ctx)) {
        ctx.reply('⚠️ No tienes permiso para usar este bot aquí.');
        return;
    }

    const message = await ctx.reply('✨ Por favor, proporciona los siguientes detalles en una sola línea, separados por comas (sin espacios):\n1️⃣ Hash,\n2️⃣ Nombre del archivo,\n3️⃣ Detección,\n4️⃣ Descripción.\n⚠️ Responde a este mensaje ⚠️');
    
    // Almacenar el ID del mensaje para futuras respuestas
    lastChatpMessageId = message.message_id;
});

// Escuchar solo respuestas al mensaje específico
bot.on('text', async (ctx) => {
    // Verificar si el chat es permitido antes de procesar el mensaje
    if (!isAllowedChat(ctx)) {
        return; // Ignorar mensajes de chats no permitidos
    }

    // Asegurarse de que solo se responde a mensajes específicos
    const isReply = ctx.message.reply_to_message && ctx.message.reply_to_message.message_id === lastChatpMessageId;

    if (!isReply) {
        return; // Ignorar mensajes que no son respuestas al último mensaje de /chatp
    }

    const input = ctx.message.text.split(',');

    if (input.length === 4) {
        const petitionData = {
            hash: input[0].trim(),
            archivo: input[1].trim(),
            deteccion: input[2].trim(),
            descripcion: input[3].trim(),
        };

        await addToFile(petitionData);
        ctx.reply(`✅ Indicador de compromiso guardado:\n\n1️⃣ Hash: ${petitionData.hash}\n2️⃣ Nombre del archivo: ${petitionData.archivo}\n3️⃣ Detección: ${petitionData.deteccion}\n4️⃣ Descripción: ${petitionData.descripcion}\n\n✅ Indicador de compromiso guardado exitosamente! 🎉\n🔗 Consulta aquí: https://github.com/${GITHUB_USER}/${GITHUB_REPO}/blob/main/peticiones.adoc`);
    } else {
        ctx.reply('⚠️ Por favor, asegúrate de proporcionar exactamente cuatro valores, separados por comas (sin espacios). ⚠️ Responde al mensaje principal ⚠️');
    }
});

// Iniciar el servidor Express
app.use(bot.webhookCallback('/bot'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
    await configureGit();
    bot.launch().then(() => {
        console.log('Bot iniciado y escuchando comandos.');
    }).catch((error) => {
        console.error('Error al lanzar el bot:', error);
    });
});
