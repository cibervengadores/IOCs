import { Telegraf } from 'telegraf';
import simpleGit from 'simple-git';
import fs from 'fs';
import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';  // Importa axios para hacer las solicitudes keep-alive

// Cargar las variables de entorno
dotenv.config();

// Configuración de Git y el bot
const bot = new Telegraf(process.env.MY_BOT_TOKEN);
const git = simpleGit();
const GITHUB_REPO = process.env.MY_GITHUB_REPO;
const GITHUB_USER = process.env.MY_GITHUB_USER;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const FILE_PATH = 'peticiones.adoc';

const app = express(); 

// Lista de grupos permitidos y tu propio ID
const ALLOWED_GROUP_IDS = ['-1002063977009', '-1002451309597'];
const MY_USER_ID = '6303550179';

// Variable para almacenar el ID del último mensaje de /chatp
let lastChatpMessageId = null;

// Función para configurar Git
const configureGit = async () => {
    await git.addConfig('user.name', 'curiosidadesdehackers');
    await git.addConfig('user.email', 'info@curiosidadesdehackers.com');
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

        await addToFile(petitionData);
        ctx.reply(`✅ Indicador de compromiso guardado:\n\n1️⃣ Hash: ${petitionData.hash}\n2️⃣ Nombre del archivo: ${petitionData.archivo}\n3️⃣ Detección: ${petitionData.deteccion}\n4️⃣ Descripción: ${petitionData.descripcion}\n\n✅ Indicador guardado exitosamente! 🎉\n🔗 Consulta aquí: https://github.com/${GITHUB_USER}/${GITHUB_REPO}/blob/main/peticiones.adoc`);
    } else {
        ctx.reply('⚠️ Por favor, asegúrate de proporcionar exactamente cuatro valores, separados por comas (sin espacios). ⚠️ Responde al mensaje principal ⚠️');
    }
});

// Ruta para manejar el keep-alive en /peticiones.adoc
app.post('/peticiones.adoc', (req, res) => {
    console.log('Petición keep-alive recibida:', req.body);
    res.send('Keep-alive recibida');  // Respuesta simple para confirmar que la solicitud fue recibida
});

// Función para enviar solicitud de keep-alive cada dos horas
const keepAliveRequest = () => {
    axios.post('http://localhost:3000/peticiones.adoc', {
        data: '-,-,-,-'
    })
    .then(response => {
        console.log('Petición exitosa para mantener el servidor activo.');
    })
    .catch(error => {
        console.error('Error en la petición keep-alive:', error.message);
    });
};

// Ejecutar la solicitud keep-alive cada dos horas (7200000 milisegundos)
setInterval(keepAliveRequest, 7200000); // 2 horas = 7200000 ms

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

    // Ejecutar la primera solicitud inmediatamente
    keepAliveRequest();
});
