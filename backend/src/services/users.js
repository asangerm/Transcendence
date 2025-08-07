import db from '../db';
//C’est sécurisé contre les injections SQL 
// car les valeurs sont liées via des ? (paramètres), pas interpolées directement dans la requête.
export async function createUser({ email, username, passwordHash }) {
  const stmt = db.prepare(`
    INSERT INTO users (email, display_name, password_hash)
    VALUES (?, ?, ?)
  `);
  const result = stmt.run(email, username, passwordHash);

  return {
    id: result.lastInsertRowid,
    email,
    displayName: username
  };
}


