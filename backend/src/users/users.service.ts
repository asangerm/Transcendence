import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateUserDto } from '../auth/dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {
    console.log('✅ UsersService constructor - prisma:', prisma);
  }

  async create(data: { email: string; username: string; passwordHash: string }) {
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        displayName: data.username,
        passwordHash: data.passwordHash,
      },
    });
    console.log('User created:', user);
    return user;
  }
}

/*
✅ PrismaService bien injecté

✅ correspondre les noms (displayName, passwordHash) à  schéma Prisma

✅ loggues la création du user (utile pour debug)

✅ encapsules bien la logique dans UsersService*/