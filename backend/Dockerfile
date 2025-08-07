# Image de base avec Node.js
FROM node:20-bullseye

# Crée le répertoire de travail
WORKDIR /app

# Installer les outils nécessaires pour compiler les dépendances natives
RUN apt-get update && \
    apt-get install -y python3 g++ make

# Copier les fichiers nécessaires pour installer les dépendances
COPY package*.json ./

# Installer les dépendances (et compiler better-sqlite3)
RUN npm install --build-from-source && \
    npm rebuild better-sqlite3 --build-from-source

# Copier le reste de l'application
COPY . .

# Compiler le TypeScript
RUN npm run build

# Expose le port
EXPOSE 8000

# Lancer le backend
CMD ["npm", "start"]
