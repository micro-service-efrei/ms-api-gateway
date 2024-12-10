FROM node:20-alpine

WORKDIR /app

# Installation des dépendances globales
RUN apk add --no-cache wget

# Copie des fichiers de configuration
COPY package*.json ./

# Installation des dépendances
RUN npm install --legacy-peer-deps

# Copie du code source
COPY . .

EXPOSE 4000

# Script de démarrage
CMD ["npm", "run", "start"]