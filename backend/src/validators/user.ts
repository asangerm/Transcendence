import { Validator } from 'fastify-validator';

const userValidator = new Validator({
  name: 'string',
  email: 'email',
  password: 'string',
});

export default userValidator;


// Vérifie les champs avant insertion en base
