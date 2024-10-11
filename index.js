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
    
    ctx.reply('✨ Por favor, proporciona los siguientes detalles en una sola línea, separados por comas (sin espacios): 📝 **Hash**, **Nombre del archivo**, **Detección**, **Descripción**.');
    
    // Escuchar la respuesta del usuario
    bot.on('text', async (ctx) => {
        const input = ctx.message.text.split(',');

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
            ctx.reply(`✅ **Petición guardada exitosamente!** 🎉\n🔗 **Consulta aquí:** https://github.com/${process.env.MY_GITHUB_USER}/${process.env.MY_GITHUB_REPO}/blob/main/peticiones.adoc`);
        } else {
            ctx.reply('⚠️ **Error:** Asegúrate de proporcionar exactamente cuatro valores, separados por comas (sin espacios). 🛑');
        }
    });
});

// Lanzar el bot
bot.launch().then(() => {
    console.log('🤖 Bot iniciado y escuchando comandos.');
}).catch((error) => {
    console.error('❌ Error al lanzar el bot:', error);
});
