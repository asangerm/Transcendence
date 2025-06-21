FROM node:20-alpine

WORKDIR /app

# Installer les paquets système nécessaires
RUN apk add --no-cache openssl openssl-dev sqlite

# Copier uniquement les fichiers package.json et package-lock.json 
COPY package*.json ./

# Installer les dépendances, y compris bcryptjs
RUN npm install

# Copier le reste des fichiers
COPY . .

# Rendre le script init.sh exécutable
RUN chmod +x init.sh

# Exposer le port backend
EXPOSE 8000

# Lancer l'application via le script d'initialisation
CMD ["/bin/sh", "./init.sh"]
