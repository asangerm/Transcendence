import { z } from "zod";

const userSchema = z.object({
  name: z
    .string()
    .min(3, "Le nom doit faire au moins 3 caractères")
    .max(20, "Le nom ne doit pas dépasser 20 caractères"),
  email: z
    .string()
    .email("Email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit faire au moins 8 caractères")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
    .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre"),
});

export default userSchema;

