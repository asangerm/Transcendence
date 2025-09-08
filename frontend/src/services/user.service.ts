import { apiService } from './api.service';
import { User } from './auth.service';

export interface UserProfile extends User {
  friendCount?: number;
  matchHistory?: Match[];
  friends?: Friend[];
}

export interface Friend {
  id: number;
  display_name: string;
  avatar_url: string;
  is_online: number;
}

export interface Match {
  id: number;
  game_name: string;
  opponent_name: string;
  opponent_id: number;
  player_score: number;
  opponent_score: number;
  result: 'win' | 'loss';
  played_at: string;
}

export interface UserStats {
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  recentMatches: Match[];
}

export interface FriendRequest {
  id: number;
  sender_id: number;
  receiver_id: number;
  sender_name: string;
  sender_avatar: string;
  status: string;
  created_at: string;
}

export class UserService {
  static async getCurrentUserProfile(): Promise<UserProfile> {
    const response = await apiService.get('/auth/me');
    return response.data.user;
  }

  static async getUserProfile(userId: number): Promise<UserProfile> {
    const response = await apiService.get(`/api/users/${userId}`);
    return response.data;
  }

  static async updateProfile(updates: Partial<User>): Promise<User> {
    const response = await apiService.patch('/api/users/profile', updates);
    return response.data;
  }

  static async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
      const response = await apiService.uploadFile('/api/users/avatar', formData);
      return response.data;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  static async getUserStats(userId: number): Promise<UserStats> {
    const response = await apiService.get(`/api/users/${userId}/stats`);
    return response.data;
  }

  static async getMatchHistory(userId: number): Promise<Match[]> {
    const response = await apiService.get(`/api/users/${userId}/matches`);
    return response.data;
  }

  static async getUserFriends(userId: number): Promise<Friend[]> {
    const response = await apiService.get(`/api/users/${userId}/friends`);
    return response.data;
  }

  static async sendFriendRequest(friendId: number): Promise<{ message: string }> {
    const response = await apiService.post('/api/users/friends/request', { friendId });
    return response.data;
  }

  static async acceptFriendRequest(requestId: number): Promise<{ message: string }> {
    const response = await apiService.post('/api/users/friends/accept', { requestId });
    return response.data;
  }

  static async rejectFriendRequest(requestId: number): Promise<{ message: string }> {
    const response = await apiService.post('/api/users/friends/reject', { requestId });
    return response.data;
  }

  static async getPendingFriendRequests(): Promise<FriendRequest[]> {
    const response = await apiService.get('/api/users/friends/requests');
    return response.data;
  }

  static async removeFriend(friendId: number): Promise<{ message: string }> {
    const response = await apiService.delete(`/api/users/friends/${friendId}`);
    return response.data;
  }

  static async searchUsers(query: string): Promise<User[]> {
    const response = await apiService.get(`/api/users/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }
}

export default UserService;