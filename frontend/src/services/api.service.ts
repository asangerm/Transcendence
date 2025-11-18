import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { AuthService } from './auth.service';

export class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'https://localhost:8000',
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = AuthService.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = AuthService.getRefreshToken();
            if (refreshToken) {
              const response = await this.api.post('/api/auth/refresh', {
                refreshToken,
              });
              
              const { accessToken } = response.data;
              AuthService.setAccessToken(accessToken);
              
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            AuthService.logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T = any>(url: string, config = {}): Promise<AxiosResponse<T>> {
    return this.api.get(url, config);
  }

  async post<T = any>(url: string, data = {}, config = {}): Promise<AxiosResponse<T>> {
    return this.api.post(url, data, config);
  }

  async patch<T = any>(url: string, data = {}, config = {}): Promise<AxiosResponse<T>> {
    return this.api.patch(url, data, config);
  }

  async put<T = any>(url: string, data = {}, config = {}): Promise<AxiosResponse<T>> {
    return this.api.put(url, data, config);
  }

  async delete<T = any>(url: string, config = {}): Promise<AxiosResponse<T>> {
    return this.api.delete(url, config);
  }

  async uploadFile<T = any>(url: string, formData: FormData): Promise<AxiosResponse<T>> {
    return this.api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
}

export const apiService = new ApiService();