# API Utilisateurs & RGPD

## Authentification
- `POST /auth/register` : Inscription
- `POST /auth/login` : Connexion (JWT + cookie HttpOnly)
- `POST /auth/logout` : Déconnexion
- `GET /auth/me` : Récupération utilisateur connecté

## Utilisateurs
- `GET /users` : Liste tous les utilisateurs
- `GET /users/:id` : Détail utilisateur
- `PUT /users/:id` : Mise à jour utilisateur
- `POST /users/:id/anonymize` : Anonymisation des données
- `DELETE /users/:id` : Suppression complète du compte

## RGPD
- `GET /rgpd/privacy` : Affiche les droits RGPD et les actions possibles sur vos données
  - Consultation des données
  - Mise à jour des données
  - Anonymisation
  - Suppression
  - Contact DPO/support
