import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../../infrastructure/persistence/entities/user.entity';
import { UsersRepository } from '../../infrastructure/persistence/repositories/users.repository';
import {
  UserProfileDataResponse,
  UserProfileResponse,
} from './interfaces/users-response.interface';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }

  async create(email: string, passwordHash: string): Promise<User> {
    return this.usersRepository.create(email, passwordHash);
  }

  async getProfileOrFail(userId: string): Promise<UserProfileDataResponse> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profile: UserProfileResponse = {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return { data: profile };
  }
}
