import { jwtDecode } from 'jwt-decode';
import { apiService } from './api.service';

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

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export class AuthService {
  private static readonly ACCESS_TOKEN_KEY = 'access_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly USER_KEY = 'user';

  static getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setAccessToken(token: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
  }

  static setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  static setTokens(tokens: AuthTokens): void {
    this.setAccessToken(tokens.accessToken);
    this.setRefreshToken(tokens.refreshToken);
  }

  static getUser(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    if (!userJson) return null;
    
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }

  static setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static isAuthenticated(): boolean {
    const user = this.getUser();
    return user !== null;
  }

  static logout(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  static async register(credentials: RegisterCredentials): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.post('/auth/register', credentials);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  }

  static async login(credentials: LoginCredentials): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.post('/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  static async googleLogin(idToken: string): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      const response = await apiService.post('/api/auth/google', { idToken });
      const { user, tokens } = response.data;
      
      this.setTokens(tokens);
      this.setUser(user);
      
      return { user, tokens };
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Google login failed');
    }
  }

  static async verifyToken(): Promise<User | null> {
    try {
      const response = await apiService.get('/auth/me');
      const { user } = response.data;
      
      this.setUser(user);
      return user;
    } catch (error) {
      this.logout();
      return null;
    }
  }

  static async logoutAsync(): Promise<void> {
    try {
      await apiService.post('/auth/logout');
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      this.logout();
    }
  }
}

export { AuthService as default };