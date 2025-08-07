import validateUser from './validator'; // On importe la fonction qui valide les données utilisateur

// On crée un objet fictif représentant un utilisateur
const userData = {
  name: 'John Doe',                      // Nom fictif
  email: 'john.doe@example.com',        // Email fictif
  password: 'password123',              // Mot de passe simple pour le test
};

// On appelle la fonction validateUser pour vérifier si l’objet est conforme au schéma défini
const validatedUser = validateUser(userData);

// Si la validation réussit, on affiche les données validées dans la console
console.log(validatedUser);
