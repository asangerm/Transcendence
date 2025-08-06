# Image de base légère avec Node.js
FROM node:20-alpine

# Crée le répertoire de travail
WORKDIR /app

# Copie les fichiers package.json et package-lock.json
COPY package*.json ./

# Installe les dépendances
RUN npm install

# Copie le reste des fichiers
COPY . .

# Compile le code TypeScript AVANT de lancer
RUN npm run build

# Expose le port utilisé par Fastify
EXPOSE 8000

# Lance l'application
CMD ["npm", "start"]