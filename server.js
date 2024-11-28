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
const ALLOWED_GROUP_IDS = ['-1002063977009', '-1002451309597'];
const MY_USER_ID = '6303550179';

// Variable para almacenar el ID del último mensaje de /chatp
let lastChatpMessageId = null;

// Función para configurar Git
const configureGit = async () => {
    try {
        await git.addConfig('user.name', 'curiosidadesdehackers');
        await git.addConfig('user.email', 'info@curiosidadesdehackers.com');
        await git.addConfig('url."https://".insteadOf', 'git://');  // Asegura que se use https en lugar de git
        console.log('Configuración de Git realizada.');
    } catch (error) {
        console.error('Error configurando Git:', error);
    }
};

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

// Función para añadir la petición al archivo peticiones.adoc
const addToFile = async (petition) => {
    try {
        // Si no existe el archivo, crearlo con encabezados
        if (!fs.existsSync(FILE_PATH)) {
            fs.writeFileSync(FILE_PATH, `== Peticiones\n\n[cols="1,1,1,1"]\n|===\n| Hash | Archivo | Detección | Descripción\n`);
            console.log('Archivo peticiones.adoc creado.');
        }

        // Formatear la petición
        const formattedPetition = `| ${petition.hash} | ${petition.archivo} | ${petition.deteccion} | ${petition.descripcion}\n`;
        fs.appendFileSync(FILE_PATH, formattedPetition);
        console.log('Petición añadida:', formattedPetition);

        // Configuración del repositorio remoto con GitHub
        const gitUrl = `https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${GITHUB_REPO}.git`;

        // Añadir el archivo modificado al repositorio
        await git.add(FILE_PATH);
        console.log(`Archivo ${FILE_PATH} añadido a Git.`);

        // Realizar commit con el mensaje correspondiente
        await git.commit(`Add petition: ${petition.hash}`);
        console.log(`Commit realizado con el mensaje: "Add petition: ${petition.hash}"`);

        // Realizar push a GitHub
        await git.push('origin', 'main');
        console.log('Push realizado con éxito.');
    } catch (error) {
        console.error('Error guardando en GitHub:', error.message);
        if (error.message.includes('index.lock')) {
            fs.unlinkSync('.git/index.lock');
        }
    }
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

        console.log('Datos recibidos:', petitionData);  // Verifica que los datos se reciben correctamente
        await addToFile(petitionData);
        ctx.reply(`✅ Indicador de compromiso guardado:\n\n1️⃣ Hash: ${petitionData.hash}\n2️⃣ Nombre del archivo: ${petitionData.archivo}\n3️⃣ Detección: ${petitionData.deteccion}\n4️⃣ Descripción: ${petitionData.descripcion}\n\n✅ Indicador guardado exitosamente! 🎉\n🔗 Consulta aquí: https://github.com/${GITHUB_USER}/${GITHUB_REPO}/blob/main/peticiones.adoc`);
    } else {
        ctx.reply('⚠️ Por favor, asegúrate de proporcionar exactamente cuatro valores, separados por comas (sin espacios). ⚠️ Responde al mensaje principal ⚠️');
    }
});

// Iniciar el servidor Express
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
