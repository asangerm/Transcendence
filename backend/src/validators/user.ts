import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(3, "Le nom doit faire au moins 3 caractères"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit faire au moins 8 caractères"),
});

export default userSchema;
