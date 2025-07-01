import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { UsersService } from './users.service';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {
     console.log('✅ AuthService constructor - usersService:', usersService);  
  }

  async register(createUserDto: CreateUserDto) {
    try {
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      const user = await this.usersService.create({
        email: createUserDto.email,
        username: createUserDto.username,
        passwordHash: hashedPassword,
      });

      const { passwordHash, ...rest } = user;
      return { message: 'Utilisateur créé en base msg de authservice', user: rest };
    } catch (error) {
      console.error('❌ Error in register:', error);
      throw error;
    }
  }
}


