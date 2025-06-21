import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [UsersService], 
  controllers: [UsersController],
  exports: [UsersService], // pour que AuthModule puisse utiliser UsersService
})
export class UsersModule {}

