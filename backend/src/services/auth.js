import bcrypt from 'bcryptjs';
import { db } from '../db';

export async function login({ email, password }) {
  const user = await db.getUserByEmail(email);
  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new Error('Mot de passe incorrect');
  }
  return user;
}

export async function createUser({ name, email, password }) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await db.createUser({ name, email, password: hashedPassword });
  return user;
}