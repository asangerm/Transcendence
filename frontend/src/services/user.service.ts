import { apiService } from './api.service';
import { User } from './auth.service';

export interface UserProfile extends User {
  id: number;
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
  score_p1: number;
  score_p2: number;
  winner_id: number;
  played_at: string;
}

export interface UserStats {
  game_id: number;
  game_name: string;
  victories: number;
  defeats: number;
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

	static async getUserProfile(username: string): Promise<UserProfile | null> {
		try {
			const response = await apiService.get(`/users/name/${username}`);
			return response.data.user;
		}
		catch (error: any) {
			if (error.response && error.response.status == 404) {
				console.warn(`Utilisateur "${username}" introuvable.`);
				return (null);
			}
			console.error("Erreur lors de la récupération du profil utilisateur :", error);
			throw error; // autres erreurs (500, 401, etc.)
		}
	}

	static async updateProfile(updates: Partial<User>): Promise<User> {
		const response = await apiService.patch('/users/profile', updates);
		return response.data;
	}

  static async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
      const response = await apiService.uploadFile('/users/avatar', formData);
      return response.data;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  static async deleteAvatar(): Promise<{ avatarUrl: string }> {
    const response = await apiService.delete('/users/avatar');
    return response.data;
} 


  static async getUserStats(userId: number): Promise<UserStats[]>  {
    const response = await apiService.get(`/users/${userId}/stats`);
    return response.data.stats as UserStats[];
  }

  static async getMatchHistory(userId: number): Promise<Match[]> {
    const response = await apiService.get(`/users/${userId}/matchHistory`);
    return response.data.matches || [];
  }

  static async getUserFriends(userId: number): Promise<Friend[]> {
    const response = await apiService.get(`/friends/${userId}`);
    return response.data;
  }
  static async getUserFriendsWithout(): Promise<Friend[]> {
    const response = await apiService.get(`/friends`);
    return response.data;
  }

  static async sendFriendRequest(friendId: number): Promise<{ message: string }> {
    const response = await apiService.post('/users/friends/request', { friendId });
    return response.data;
  }

  static async acceptFriendRequest(requestId: number): Promise<{ message: string }> {
    const response = await apiService.post('/users/friends/accept', { requestId });
    return response.data;
  }

  static async rejectFriendRequest(requestId: number): Promise<{ message: string }> {
    const response = await apiService.post('/users/friends/reject', { requestId });
    return response.data;
  }

  static async getPendingFriendRequests(): Promise<FriendRequest[]> {
    const response = await apiService.get('/users/friends/requests');
    return response.data;
  }

  static async removeFriend(friendId: number): Promise<{ message: string }> {
    const response = await apiService.delete(`/users/friends/${friendId}`);
    return response.data;
  }

  static async searchUsers(query: string): Promise<User[]> {
    const response = await apiService.get(`/users/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }

  static async anonymizeAccount(userId: number): Promise<{ message: string }> {
    const response = await apiService.post(`/users/${userId}/anonymize`);
    return response.data;
  }

  static async deleteAccount(userId: number): Promise<{ message: string }> {
    const response = await apiService.delete(`/users/${userId}`);
    return response.data;
  }
    
  static async exportData(userId: number): Promise<Blob> {
    const response = await apiService.get(`/users/${userId}/export`, {
      responseType: 'arraybuffer', // Important pour récupérer un Blob
    });
    return new Blob([response.data], { type: "application/json" });
  }


  
}

export default UserService;