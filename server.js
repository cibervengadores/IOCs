import { Telegraf } from 'telegraf';
import simpleGit from 'simple-git';
import fs from 'fs';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const bot = new Telegraf(process.env.MY_BOT_TOKEN);
const git = simpleGit();
const GITHUB_REPO = process.env.MY_GITHUB_REPO;
const GITHUB_USER = process.env.MY_GITHUB_USER;
const GITHUB_TOKEN = process.env.MY_GITHUB_TOKEN;
const FILE_PATH = 'peticiones.adoc';

const app = express();

const ALLOWED_GROUP_IDS = ['-1002063977009', '-1002451309597'];
const MY_USER_ID = '6303550179';

let lastChatpMessageId = null;
let lastBuscarMessageId = null;
let lastListaMessageId = null;

const configureGit = async () => {
    try {
        // Inicializar si no existe
        if (!fs.existsSync('.git')) {
            await git.init();
        }

        await git.addConfig('user.name', 'cibervengadores');
        await git.addConfig('user.email', 'cibervengadores@proton.me');
        await git.addConfig('url."https://".insteadOf', 'git://');

        const remoteUrl = `https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${GITHUB_REPO}.git`;
        const remotes = await git.getRemotes();

        if (!remotes.find(r => r.name === 'origin')) {
            await git.addRemote('origin', remoteUrl);
        } else {
            await git.remote(['set-url', 'origin', remoteUrl]);
        }

        console.log('Configuración de Git realizada.');
    } catch (error) {
        console.error('Error configurando Git:', error);
    }
};

const isAllowedChat = (ctx) => {
    const chatId = ctx.chat.id.toString();
    const userId = ctx.from.id.toString();
    return (
        (ctx.chat.type === 'private' && userId === MY_USER_ID) ||
        ((ctx.chat.type === 'supergroup' || ctx.chat.type === 'group') && ALLOWED_GROUP_IDS.includes(chatId))
    );
};

const addToFile = async (petition) => {
    try {
        if (!fs.existsSync(FILE_PATH)) {
            fs.writeFileSync(FILE_PATH, `== Peticiones\n\n[cols="1,1,1,1"]\n|===\n| Hash | Archivo | Detección | Descripción\n`);
        }

        const formattedPetition = `| ${petition.hash} | ${petition.archivo} | ${petition.deteccion} | ${petition.descripcion}\n`;
        fs.appendFileSync(FILE_PATH, formattedPetition);

        await git.add('.');
        await git.commit(`Add petition: ${petition.hash}`);
        await git.push('origin', 'main');

    } catch (error) {
        console.error('Error guardando en GitHub:', error.message);
        if (error.message.includes('index.lock')) {
            fs.unlinkSync('.git/index.lock');
        }
    }
};

// Comandos

bot.command('iniciar', (ctx) => {
    ctx.reply(
        '👋 ¡Bienvenido! Este es un bot para registrar y consultar Indicadores de Compromiso (IOCs).\n\n' +
        '✨ Usa /chatp para añadir un IOC individual\n' +
        '📋 Usa /lista para agregar múltiples IOCs en bloque\n' +
        '🔎 Usa /buscar para consultar si un hash ya ha sido reportado\n\n' +
        '🛡️ Todos los indicadores se almacenan aquí:\n' +
        '🔗 https://iocs.curiosidadesdehackers.com'
    );
});

bot.command('buscar', async (ctx) => {
    if (!isAllowedChat(ctx)) return ctx.reply('⚠️ No tienes permiso para usar este bot aquí.');
    const mensaje = await ctx.reply('🔍 Por favor, responde a este mensaje con el hash que deseas buscar.');
    lastBuscarMessageId = mensaje.message_id;
});

bot.command('lista', async (ctx) => {
    if (!isAllowedChat(ctx)) return ctx.reply('⚠️ No tienes permiso para usar este bot aquí.');
    const mensaje = await ctx.reply('✍️ Por favor, responde a este mensaje con una lista de IOCs.\nCada línea debe tener el formato:\nhash,nombre,detección,descripción');
    lastListaMessageId = mensaje.message_id;
});

bot.command('chatp', async (ctx) => {
    if (!isAllowedChat(ctx)) return ctx.reply('⚠️ No tienes permiso para usar este bot aquí.');
    const message = await ctx.reply('✨ Por favor, proporciona los siguientes detalles en una sola línea, separados por comas (sin espacios):\n1️⃣ Hash,\n2️⃣ Nombre del archivo,\n3️⃣ Detección,\n4️⃣ Descripción.\n⚠️ Responde a este mensaje ⚠️');
    lastChatpMessageId = message.message_id;
});

// Respuestas

bot.on('text', async (ctx) => {
    if (!isAllowedChat(ctx)) return;

    const isReplyToChatp = ctx.message.reply_to_message?.message_id === lastChatpMessageId;
    const isReplyToBuscar = ctx.message.reply_to_message?.message_id === lastBuscarMessageId;
    const isReplyToLista  = ctx.message.reply_to_message?.message_id === lastListaMessageId;

    if (!isReplyToChatp && !isReplyToBuscar && !isReplyToLista) return;

    // Buscar
    if (isReplyToBuscar) {
        const hashBuscado = ctx.message.text.trim();
        try {
            const contenido = fs.readFileSync(FILE_PATH, 'utf-8');
            const linea = contenido.split('\n').find(l => l.includes(hashBuscado));

            if (linea) {
                const [ , hash, archivo, deteccion, descripcion ] = linea.split('|').map(x => x.trim());
                ctx.reply(`✅ Indicador encontrado:\n\n📄 Archivo: ${archivo}\n🧪 Detección: ${deteccion}\n📝 Descripción: ${descripcion}`);
            } else {
                ctx.reply('❌ No se encontró ningún IOC con ese hash.');
            }
        } catch (error) {
            console.error('Error al buscar el hash:', error);
            ctx.reply('⚠️ Ocurrió un error al buscar el hash.');
        }
        return;
    }

    // Lista
    if (isReplyToLista) {
        const lineas = ctx.message.text.split('\n');
        let exitos = 0, errores = 0, duplicados = 0;
        const hashesExistentes = new Set();

        try {
            const contenido = fs.readFileSync(FILE_PATH, 'utf-8');
            contenido.split('\n').forEach(l => {
                const partes = l.split('|').map(x => x.trim());
                if (partes.length >= 2 && partes[1]) hashesExistentes.add(partes[1]);
            });
        } catch (_) {}

        for (const linea of lineas) {
            if (!linea.trim()) continue;
            const partes = linea.split(',');
            if (partes.length !== 4) {
                errores++;
                continue;
            }

            const petitionData = {
                hash: partes[0].trim(),
                archivo: partes[1].trim(),
                deteccion: partes[2].trim(),
                descripcion: partes[3].trim()
            };

            if (hashesExistentes.has(petitionData.hash)) {
                duplicados++;
                continue;
            }

            try {
                await addToFile(petitionData);
                exitos++;
                hashesExistentes.add(petitionData.hash);
            } catch (err) {
                errores++;
                console.error('Error añadiendo indicador:', err);
            }
        }

        ctx.reply(`📥 Lista procesada:\n✅ Añadidos: ${exitos}\n❌ Errores de formato: ${errores}\n🔁 Duplicados ignorados: ${duplicados}\n\n🔗 Puedes ver la lista completa en: https://iocs.curiosidadesdehackers.com/`);
        return;
    }

    // Chatp
    if (isReplyToChatp) {
        const input = ctx.message.text.split(',');
        if (input.length !== 4) {
            ctx.reply('⚠️ Proporciona exactamente cuatro valores separados por comas. Responde al mensaje del bot.');
            return;
        }

        const petitionData = {
            hash: input[0].trim(),
            archivo: input[1].trim(),
            deteccion: input[2].trim(),
            descripcion: input[3].trim(),
        };

        try {
            await addToFile(petitionData);
            ctx.reply(`✅ Indicador de compromiso guardado:\n\n1️⃣ Hash: ${petitionData.hash}\n2️⃣ Nombre del archivo: ${petitionData.archivo}\n3️⃣ Detección: ${petitionData.deteccion}\n4️⃣ Descripción: ${petitionData.descripcion}\n\n🔗 Consulta aquí: https://iocs.curiosidadesdehackers.com/`);
        } catch (err) {
            console.error('Error guardando el indicador:', err);
            ctx.reply('⚠️ Error al guardar el indicador. Intenta más tarde.');
        }
    }
});

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
