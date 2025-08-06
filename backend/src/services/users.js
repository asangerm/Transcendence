import db from '../db';

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


