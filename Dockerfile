FROM node:20-alpine

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier les fichiers package.json et package-lock.json pour installer les dépendances
COPY package*.json ./

# Installer les dépendances nécessaires
RUN npm install

# Copier tout le code source dans le conteneur
COPY . .

# Exposer le port 4000 pour le conteneur
EXPOSE 4000

# Commande par défaut pour démarrer l'application
CMD ["npm", "start"]
