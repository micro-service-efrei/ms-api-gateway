# API Gateway Microservices

Une passerelle API (API Gateway) servant de point d'entrée unique pour les microservices de l'application.

## 🚀 Fonctionnalités

- Routage des requêtes vers les microservices appropriés
- Documentation Swagger interactive
- Authentification JWT
- Gestion des CORS
- Logging détaillé
- Gestion des erreurs centralisée
- Support pour les microservices :
  - Auth Service (authentification)
  - Book Service (gestion des livres)
  - Notification Service (notifications)

## 📋 Prérequis

- Node.js (v14+)
- Docker et Docker Compose
- Les réseaux Docker suivants doivent exister :
  - ms-network
  - book-network
  - traefik-public

## 🛠 Installation

1. Cloner le dépôt :

`git clone https://...`

2. Installer les dépendances :

`npm install`

3. Configurer les variables d'environnement :

` cp .env.example .env`

## 🚀 Démarrage

- En mode développement :
  `npm run dev`

- Avec Docker Compose :
  `docker-compose up -d`

## 📚 Documentation API

- La documentation Swagger est disponible à l'URL :

## 🔒 Points d'entrée principaux

# Auth Service : `/ms-auth/*`

- POST /register : Inscription
- POST /login : Connexion
- Book Service : /ms-book/\*

# Book Service : `/ms-book/*`

- GET /books : Liste des livres
- POST /books : Création d'un livre
- PUT /books/:id : Modification d'un livre
- DELETE /books/:id : Suppression d'un livre
- Notification Service : /ms-notification/\*

# Notification Service : `/ms-notification/*`

- POST /notify : Envoi de notifications

## 🔧 Configuration

# Variables d'environnement principales :

- PORT : Port d'écoute (défaut: 4000)
- JWT_SECRET : Clé secrète pour JWT
- NODE_ENV : Environnement ('development', 'production')
- MS_AUTH_URL : URL du service d'authentification
- MS_NOTIFICATION_URL : URL du service de notification

## 🛡 Sécurité

- Authentification JWT pour les routes protégées
- Validation des tokens
- Headers de sécurité configurés
- Rate limiting
- Gestion sécurisée des CORS
