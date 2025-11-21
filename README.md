# 🕹️ Transcendance

> Projet de développement d’un jeu multijoueur en ligne réalisé dans le cadre de l’École 42.

## 📌 Objectif

Ce projet met en place une plateforme web complète permettant de jouer à un jeu multijoueur en temps réel, incluant un système d’authentification sécurisé, un chat instantané, un matchmaking basé sur l’ELO, et une architecture backend moderne et entièrement containerisée conformément aux exigences du sujet ft_transcendence.

## 🚀 Fonctionnalités

- 🎮 **Jeu en ligne 1v1 en temps réel**
- 🤝 **Second jeu avec matchmaking basé sur un système d’ELO**
- 🔐 **Authentification sécurisée** (OAuth, JWT, 2FA TOTP)
- 👤 **Gestion complète des utilisateurs**
- 🛡️ **Modules de sécurité avancés**
- 🧱 **Architecture backend modulaire (Fastify + WebSocket)**
- 🐳 **Déploiement Docker rootless**

## 🧱 Stack technique

| Frontend           | Backend            | Base de données | Infra / CI         |
|--------------------|--------------------|------------------|---------------------|
| HTML / TailwindCSS | Node.js / Fastify  | SQLite           | Docker (rootless)   |
| TypeScript         | WebSocket - HTTP   |                  | GitHub Actions      |

## 📂 Structure du projet

/frontend → frontend (HTML, TailwindCSS, TS)
/backend → backend Fastify + WebSocket + HTTP

## 📊 Gestion des modules

📊 [Voir le tableau Google Sheets](https://docs.google.com/spreadsheets/d/14Mzw_ATNZ2kGa5tiQ0BoNGbKqMgrd8GDxE_yPBFLGqM/edit?usp=sharing)

## 🔧 Installation (développement)

```bash
# Clone le repo
git clone https://github.com/votre-repo/transcendance.git
cd transcendance

# Lancement
make
```

##Accès local

Frontend : http://localhost:3000

Backend : http://localhost:8000

##📸 Captures d’écran

Ajoutez ici des captures du jeu, du matchmaking, du chat, ou de l’interface.

##🙌 Contributeurs

@nfradet

@yonieva

@jde-meo

@nbiron

@asangerm

##🤝 Contribution

Consultez CONTRIBUTING.md
 pour connaître les conventions de développement, la structure Git et les bonnes pratiques.

##📄 Licence

Projet sous licence MIT.
