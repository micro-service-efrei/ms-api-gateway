
import swaggerJsdoc from 'swagger-jsdoc';
import fs from 'fs';
import path from 'path';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Gateway Documentation',
      version: '1.0.0',
      description: 'Documentation complète de l\'API Gateway'
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Serveur de développement'
      }
    ]
  },
  apis: ['./src/swagger/*.yaml', './src/routes/*.js']
};

const specs = swaggerJsdoc(options);

// Créer le dossier swagger s'il n'existe pas
if (!fs.existsSync('./src/swagger')) {
  fs.mkdirSync('./src/swagger', { recursive: true });
}

// Écrire la spécification dans un fichier
fs.writeFileSync(
  './src/swagger/swagger.json',
  JSON.stringify(specs, null, 2)
);

console.log('Documentation Swagger générée avec succès !');