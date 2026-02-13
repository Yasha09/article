import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../infrastructure/persistence/entities/user.entity';
import { UsersController } from './users.controller';
import { UsersRepository } from '../../infrastructure/persistence/repositories/users.repository';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersRepository, UsersService],
  exports: [UsersRepository, UsersService, TypeOrmModule],
})
export class UsersModule {}
