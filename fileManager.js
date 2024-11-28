import fs from 'fs';
import simpleGit from 'simple-git';
import dotenv from 'dotenv';

dotenv.config();

const git = simpleGit();
const FILE_PATH = 'peticiones.adoc';

export const addToFile = async (petitionData) => {
    try {
        // Si el archivo no existe, crea la cabecera
        if (!fs.existsSync(FILE_PATH)) {
            fs.writeFileSync(FILE_PATH, `== Peticiones\n\n[cols="1,1,1,1"]\n|===\n| Hash | Archivo | Detección | Descripción\n`);
        }

        // Formatear y añadir los datos al archivo
        const formattedPetition = `| ${petitionData.hash} | ${petitionData.archivo} | ${petitionData.deteccion} | ${petitionData.descripcion}\n`;
        fs.appendFileSync(FILE_PATH, formattedPetition);

        // Establecer la URL del repositorio remoto de GitHub
        const gitUrl = `https://${process.env.MY_GITHUB_USER}:${process.env.MY_GITHUB_TOKEN}@github.com/${process.env.MY_GITHUB_USER}/${process.env.MY_GITHUB_REPO}.git`;
        
        // Configurar la URL remota para Git
        await git.addRemote('origin', gitUrl);

        // Realizar las operaciones de Git
        await git.add(FILE_PATH);
        await git.commit(`Add petition: ${petitionData.hash}`);
        await git.push('origin', 'main', { '--force': null });

        console.log('Datos añadidos y empujados a GitHub.');
    } catch (error) {
        console.error('Error al guardar en GitHub:', error);
        if (error.message.includes('index.lock')) {
            fs.unlinkSync('.git/index.lock');
        }
    }
};
