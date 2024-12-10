# ms-api-gateway

Lancer le projet : 
```bash
docker-compose up -d
```

Passer par la gateway pour les micros services : 

1. Aller sur Postman
2. Ajouter dans l'URL :

```bash
http://localhost:4000/ms-auth/register
```

Le port 4000 est le port de la gateway.
