import { Telegraf } from 'telegraf';
import simpleGit from 'simple-git';
import fs from 'fs';
import express from 'express';
import dotenv from 'dotenv';

// Cargar las variables de entorno
dotenv.config();

// Imprimir variables de entorno para depuración
console.log('MY_BOT_TOKEN:', process.env.MY_BOT_TOKEN);
console.log('MY_GITHUB_USER:', process.env.MY_GITHUB_USER);
console.log('MY_GITHUB_REPO:', process.env.MY_GITHUB_REPO);
console.log('MY_GITHUB_TOKEN:', process.env.MY_GITHUB_TOKEN); // También puedes imprimir el token de GitHub

const bot = new Telegraf(process.env.MY_BOT_TOKEN);
const git = simpleGit();

const GITHUB_REPO = process.env.MY_GITHUB_REPO;
const GITHUB_USER = process.env.MY_GITHUB_USER;
const GITHUB_TOKEN = process.env.MY_GITHUB_TOKEN; // Asegúrate de que también existe
const FILE_PATH = 'peticiones.adoc'; // Cambiado a .adoc

const app = express(); // Inicializar la aplicación Express

// Lista de grupos permitidos (IDs de los grupos que pueden usar el bot)
const ALLOWED_GROUPS = [
    /* Añade los IDs de los grupos permitidos aquí */
    -1002451309597,
    -1002063977009
];

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
        console.log('✅ Petición añadida:', formattedPetition);

        const gitUrl = `https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${GITHUB_REPO}.git`;

        // Añadir el archivo y hacer commit
        await git.add(FILE_PATH);
        await git.commit(`Add petition: ${petition.hash}`);

        // Hacer push forzado
        console.log('🔄 Intentando hacer push forzado.');
        await git.push(gitUrl, 'main', { '--force': null });
        console.log('✅ Push forzado realizado.');
    } catch (error) {
        // Manejo de errores
        if (error.message.includes('index.lock')) {
            console.error('⚠️ Error: El archivo index.lock existe. Eliminarlo para continuar.');
            // Eliminar el archivo de bloqueo
            fs.unlinkSync('.git/index.lock'); // Eliminar el archivo index.lock
            console.log('🗑️ Archivo index.lock eliminado. Intenta nuevamente.');
        } else {
            console.error('❌ Error guardando en GitHub:', error.message);
        }
    }
};

// Función para verificar si el bot está en un grupo permitido
const isGroupAllowed = (ctx) => {
    const chatId = ctx.chat.id;
    return ALLOWED_GROUPS.includes(chatId);
};

// Manejo del comando /chatp
bot.command('chatp', async (ctx) => {
    if (!isGroupAllowed(ctx)) {
        ctx.reply('🚫 Este bot solo está disponible en grupos específicos.');
        return;
    }
    ctx.reply('✨ Por favor, proporciona los siguientes detalles en una sola línea, separados por comas (sin espacios):\n1️⃣ Hash,\n2️⃣ Nombre del archivo,\n3️⃣ Detección,\n4️⃣ Descripción. Responde a este mensaje');
    
    // Escuchar la respuesta del usuario
    bot.on('text', async (ctx) => {
    // Verificar si el mensaje es una respuesta a otro mensaje
    const isReply = ctx.message.reply_to_message && ctx.message.reply_to_message.text;
    
    // Si no es una respuesta o el texto no incluye el mensaje de "proporciona"
    if (!isReply || !ctx.message.reply_to_message.text.includes('✨ Por favor, proporciona')) {
        ctx.reply('⚠️ Responde a la solicitud de detalles.');
        return;
    }

    // Continuar con el procesamiento solo si es una respuesta correcta
    const input = ctx.message.text.split(',');

    // Validar si el usuario proporcionó cuatro valores
    if (input.length === 4) {
        // Crear el objeto petitionData a partir de la entrada del usuario
        const petitionData = {
            hash: input[0].trim(),
            archivo: input[1].trim(),
            deteccion: input[2].trim(),
            descripcion: input[3].trim(),
        };

        // Almacenar la petición
        await addToFile(petitionData);
        ctx.reply(`✅ Indicador de compromiso guardado:\n\n1️⃣ Hash: ${petitionData.hash}\n2️⃣ Nombre del archivo: ${petitionData.archivo}\n3️⃣ Detección: ${petitionData.deteccion}\n4️⃣ Descripción: ${petitionData.descripcion}\n\n✅ Indicador de compromiso guardado exitosamente! 🎉\n🔗 Consulta aquí: https://github.com/${GITHUB_USER}/${GITHUB_REPO}/blob/main/peticiones.adoc`);
    } else {
        ctx.reply('⚠️ Por favor, asegúrate de proporcionar exactamente cuatro valores, separados por comas (sin espacios).');
    }
});

});

// Configurar el webhook de Telegram
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
