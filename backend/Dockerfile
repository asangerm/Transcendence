# Image de base avec Node.js
FROM node:20-bookworm

# Crée le répertoire de travail
WORKDIR /app

# Installer les outils nécessaires pour compiler les dépendances natives
RUN apt-get update && \
    apt-get install -y python3 g++ make && \
    rm -rf /var/lib/apt/lists/*

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances et compiler better-sqlite3
RUN npm install --build-from-source && \
    npm rebuild better-sqlite3 --build-from-source

# Copier tout le code source
COPY . .

# Compiler le TypeScript
RUN npm run build

# Copier schema.sql dans le bon dossier pour que le backend le trouve
RUN mkdir -p dist/src && cp src/schema.sql dist/src/schema.sql

# Expose le port du backend
EXPOSE 8000

# Lancer le backend
CMD ["npm", "start"]
