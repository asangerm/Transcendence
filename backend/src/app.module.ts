import { Module } from '@nestjs/common';
import { PrismaModule } from './modules/prisma.module';
import { AuthModule } from './modules/auth.module';
import { UsersModule } from './modules/users.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule],
})
export class AppModule {}


