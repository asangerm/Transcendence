import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database';
import * as dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const REFRESH_TOKEN_EXPIRES_IN_DAYS = 30;

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

export interface User {
  id: number;
  email: string;
  display_name: string;
  avatar_url: string;
  is_online: number;
  wins: number;
  losses: number;
  google_id?: string;
  two_factor_enabled: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateAccessToken(userId: number): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  generateRefreshToken(): string {
    return uuidv4();
  }

  verifyAccessToken(token: string): { userId: number } | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
      return decoded;
    } catch (error) {
      return null;
    }
  }

  async createUser(email: string, password: string, displayName: string): Promise<User> {
    const passwordHash = await this.hashPassword(password);
    
    const result = await db.run(
      'INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)',
      [email, passwordHash, displayName]
    );
    
    const user = await db.get('SELECT * FROM users WHERE id = ?', [result.id]);
    return this.sanitizeUser(user);
  }

  async createGoogleUser(email: string, googleId: string, displayName: string, avatarUrl?: string): Promise<User> {
    const result = await db.run(
      'INSERT INTO users (email, google_id, display_name, avatar_url) VALUES (?, ?, ?, ?)',
      [email, googleId, displayName, avatarUrl || '/avatars/default.png']
    );
    
    const user = await db.get('SELECT * FROM users WHERE id = ?', [result.id]);
    return this.sanitizeUser(user);
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    return user ? this.sanitizeUser(user) : null;
  }

  async findUserById(id: number): Promise<User | null> {
    const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    return user ? this.sanitizeUser(user) : null;
  }

  async findUserByGoogleId(googleId: string): Promise<User | null> {
    const user = await db.get('SELECT * FROM users WHERE google_id = ?', [googleId]);
    return user ? this.sanitizeUser(user) : null;
  }

  async login(email: string, password: string): Promise<{ user: User; tokens: AuthTokens } | null> {
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    
    if (!user || !user.password_hash) {
      return null;
    }
    
    const isValidPassword = await this.verifyPassword(password, user.password_hash);
    
    if (!isValidPassword) {
      return null;
    }
    
    const tokens = await this.generateTokens(user.id);
    await this.updateUserOnlineStatus(user.id, true);
    
    return {
      user: this.sanitizeUser(user),
      tokens
    };
  }

  async googleLogin(idToken: string): Promise<{ user: User; tokens: AuthTokens } | null> {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID
      });
      
      const payload = ticket.getPayload();
      if (!payload) {
        return null;
      }
      
      const { email, sub: googleId, name, picture } = payload;
      
      if (!email || !googleId) {
        return null;
      }
      
      let user = await this.findUserByGoogleId(googleId);
      
      if (!user) {
        user = await this.findUserByEmail(email);
        
        if (user) {
          await db.run('UPDATE users SET google_id = ? WHERE id = ?', [googleId, user.id]);
        } else {
          user = await this.createGoogleUser(email, googleId, name || email.split('@')[0], picture);
        }
      }
      
      const tokens = await this.generateTokens(user.id);
      await this.updateUserOnlineStatus(user.id, true);
      
      return {
        user: this.sanitizeUser(user),
        tokens
      };
    } catch (error) {
      console.error('Google login error:', error);
      return null;
    }
  }

  async generateTokens(userId: number): Promise<AuthTokens> {
    const accessToken = this.generateAccessToken(userId);
    const refreshToken = this.generateRefreshToken();
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_IN_DAYS);
    
    await db.run(
      'INSERT INTO sessions (user_id, refresh_token, expires_at) VALUES (?, ?, ?)',
      [userId, refreshToken, expiresAt.toISOString()]
    );
    
    return {
      accessToken,
      refreshToken
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string } | null> {
    const session = await db.get(
      'SELECT * FROM sessions WHERE refresh_token = ? AND expires_at > datetime("now")',
      [refreshToken]
    );
    
    if (!session) {
      return null;
    }
    
    const accessToken = this.generateAccessToken(session.user_id);
    return { accessToken };
  }

  async logout(userId: number): Promise<void> {
    await db.run('DELETE FROM sessions WHERE user_id = ?', [userId]);
    await this.updateUserOnlineStatus(userId, false);
  }

  async updateUserOnlineStatus(userId: number, isOnline: boolean): Promise<void> {
    await db.run('UPDATE users SET is_online = ? WHERE id = ?', [isOnline ? 1 : 0, userId]);
  }

  private sanitizeUser(user: any): User {
    const { password_hash, two_factor_secret, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  async isDisplayNameAvailable(displayName: string, excludeUserId?: number): Promise<boolean> {
    const query = excludeUserId 
      ? 'SELECT id FROM users WHERE display_name = ? AND id != ?'
      : 'SELECT id FROM users WHERE display_name = ?';
    const params = excludeUserId ? [displayName, excludeUserId] : [displayName];
    
    const existing = await db.get(query, params);
    return !existing;
  }
}

export const authService = new AuthService();