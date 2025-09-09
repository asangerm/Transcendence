/*import { db } from '../database';
import { authService, User } from './auth.service';
import path from 'path';
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';

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

export class UserService {
  async getUserProfile(userId: number): Promise<UserProfile | null> {
    const user = await authService.findUserById(userId);
    if (!user) {
      return null;
    }
    
    const friendCount = await this.getFriendCount(userId);
    const friends = await this.getUserFriends(userId);
    const matchHistory = await this.getUserMatchHistory(userId, 10);
    
    return {
      ...user,
      friendCount,
      friends,
      matchHistory
    };
  }

  async updateUserProfile(userId: number, updates: Partial<User>): Promise<User | null> {
    const allowedUpdates = ['display_name', 'avatar_url'];
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    
    for (const key of allowedUpdates) {
      if (key in updates) {
        updateFields.push(`${key} = ?`);
        updateValues.push(updates[key as keyof User]);
      }
    }
    
    if (updateFields.length === 0) {
      return await authService.findUserById(userId);
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(userId);
    
    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    await db.run(query, updateValues);
    
    return await authService.findUserById(userId);
  }

  async uploadAvatar(userId: number, fileData: Buffer, fileName: string): Promise<string> {
    const fileExtension = path.extname(fileName);
    const avatarFileName = `${userId}_${uuidv4()}${fileExtension}`;
    const avatarPath = path.join(__dirname, '..', '..', 'uploads', 'avatars', avatarFileName);
    
    await fs.mkdir(path.dirname(avatarPath), { recursive: true });
    await fs.writeFile(avatarPath, fileData);
    
    const avatarUrl = `/uploads/avatars/${avatarFileName}`;
    await this.updateUserProfile(userId, { avatar_url: avatarUrl });
    
    return avatarUrl;
  }

  async getUserStats(userId: number): Promise<UserStats | null> {
    const user = await authService.findUserById(userId);
    if (!user) {
      return null;
    }
    
    const totalGames = user.wins + user.losses;
    const winRate = totalGames > 0 ? (user.wins / totalGames) * 100 : 0;
    const recentMatches = await this.getUserMatchHistory(userId, 5);
    
    return {
      totalGames,
      wins: user.wins,
      losses: user.losses,
      winRate,
      recentMatches
    };
  }

  async getUserMatchHistory(userId: number, limit: number = 20): Promise<Match[]> {
    const matches = await db.all(
      `SELECT 
        m.id,
        g.name as game_name,
        m.score_p1,
        m.score_p2,
        m.played_at,
        m.player1_id,
        m.player2_id,
        m.winner_id,
        CASE 
          WHEN m.player1_id = ? THEN u2.display_name
          ELSE u1.display_name
        END as opponent_name,
        CASE 
          WHEN m.player1_id = ? THEN m.player2_id
          ELSE m.player1_id
        END as opponent_id
      FROM matches m
      JOIN games g ON m.game_id = g.id
      JOIN users u1 ON m.player1_id = u1.id
      JOIN users u2 ON m.player2_id = u2.id
      WHERE m.player1_id = ? OR m.player2_id = ?
      ORDER BY m.played_at DESC
      LIMIT ?`,
      [userId, userId, userId, userId, limit]
    );
    
    return matches.map(match => ({
      id: match.id,
      game_name: match.game_name,
      opponent_name: match.opponent_name,
      opponent_id: match.opponent_id,
      player_score: match.player1_id === userId ? match.score_p1 : match.score_p2,
      opponent_score: match.player1_id === userId ? match.score_p2 : match.score_p1,
      result: match.winner_id === userId ? 'win' : 'loss',
      played_at: match.played_at
    }));
  }

  async addFriend(userId: number, friendId: number): Promise<boolean> {
    if (userId === friendId) {
      return false;
    }
    
    const existingFriendship = await db.get(
      'SELECT * FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
      [userId, friendId, friendId, userId]
    );
    
    if (existingFriendship) {
      return false;
    }
    
    await db.run('INSERT INTO friends (user_id, friend_id) VALUES (?, ?)', [userId, friendId]);
    await db.run('INSERT INTO friends (user_id, friend_id) VALUES (?, ?)', [friendId, userId]);
    
    return true;
  }

  async removeFriend(userId: number, friendId: number): Promise<boolean> {
    const result = await db.run(
      'DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
      [userId, friendId, friendId, userId]
    );
    
    return true;
  }

  async getUserFriends(userId: number): Promise<Friend[]> {
    const friends = await db.all(
      `SELECT u.id, u.display_name, u.avatar_url, u.is_online
      FROM friends f
      JOIN users u ON f.friend_id = u.id
      WHERE f.user_id = ?
      ORDER BY u.is_online DESC, u.display_name ASC`,
      [userId]
    );
    
    return friends;
  }

  async getFriendCount(userId: number): Promise<number> {
    const result = await db.get(
      'SELECT COUNT(*) as count FROM friends WHERE user_id = ?',
      [userId]
    );
    
    return result?.count || 0;
  }

  async sendFriendRequest(senderId: number, receiverId: number): Promise<boolean> {
    if (senderId === receiverId) {
      return false;
    }
    
    try {
      await db.run(
        'INSERT INTO friend_requests (sender_id, receiver_id) VALUES (?, ?)',
        [senderId, receiverId]
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  async acceptFriendRequest(requestId: number, userId: number): Promise<boolean> {
    const request = await db.get(
      'SELECT * FROM friend_requests WHERE id = ? AND receiver_id = ? AND status = "pending"',
      [requestId, userId]
    );
    
    if (!request) {
      return false;
    }
    
    await db.run('UPDATE friend_requests SET status = "accepted" WHERE id = ?', [requestId]);
    await this.addFriend(request.sender_id, request.receiver_id);
    
    return true;
  }

  async rejectFriendRequest(requestId: number, userId: number): Promise<boolean> {
    const result = await db.run(
      'UPDATE friend_requests SET status = "rejected" WHERE id = ? AND receiver_id = ?',
      [requestId, userId]
    );
    
    return true;
  }

  async getPendingFriendRequests(userId: number): Promise<any[]> {
    return await db.all(
      `SELECT fr.*, u.display_name as sender_name, u.avatar_url as sender_avatar
      FROM friend_requests fr
      JOIN users u ON fr.sender_id = u.id
      WHERE fr.receiver_id = ? AND fr.status = "pending"
      ORDER BY fr.created_at DESC`,
      [userId]
    );
  }

  async searchUsers(query: string, currentUserId?: number): Promise<User[]> {
    let sql = 'SELECT id, display_name, avatar_url, is_online FROM users WHERE display_name LIKE ?';
    const params: any[] = [`%${query}%`];
    
    if (currentUserId) {
      sql += ' AND id != ?';
      params.push(currentUserId);
    }
    
    sql += ' LIMIT 20';
    
    const users = await db.all(sql, params);
    return users;
  }
}

export const userService = new UserService();*/