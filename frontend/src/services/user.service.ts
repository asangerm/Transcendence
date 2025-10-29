import { apiService } from './api.service';
import { User } from './auth.service';

export interface UserProfile extends User {
  id: number;
  friendCount?: number;
  matchHistory?: Match[];
  friends?: Friend[];
}

export interface Tournament {
	id?: number;
	name: string;
	game: string;
	status?: string;
	playersNumber: Number;
	playersNames: string[];
}

export interface Friend {
	friend_id: number;
	friend_name: string;
	avatar_url: string;
	is_online: number;
	since: Date;
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
			response.data.user.friends = await this.getUserFriends(response.data.user.id);
			response.data.user.friendCount = response.data.user.friends.length;
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

  static async updateInfos(updates: { display_name: string; email: string }, userId?: number): Promise<User> {
	if (!userId) {
		throw new Error("User ID is required to update profile.");
	}
	const response = await apiService.put(`/users/${userId}`, updates);
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
    return response.data.friends;
  }
  static async getUserFriendsWithout(): Promise<Friend[]> {
    const response = await apiService.get(`/friends`);
    return response.data;
  }

  static async addFriend(userId: number, friendId: number): Promise<{ message: string }> {
	console.log("Adding friend:", userId, friendId);
    const response = await apiService.post(`/friends/add/${userId}/${friendId}`);
    return response.data;
  }

  static async removeFriend(userId: number, friendId: number): Promise<{ message: string }> {
    const response = await apiService.delete(`/friends/remove/${userId}/${friendId}`);
    return response.data;
  }

  static async searchUsers(query: string): Promise<User[]> {
    const response = await apiService.get(`/users/search?q=${encodeURIComponent(query)}`);
    return response.data.users;
  }

  static async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await apiService.put(`/users/${userId}/password`, { oldPassword, newPassword });
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