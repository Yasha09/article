import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from './entities/user.entity';
import { UsersRepository } from './users.repository';

export interface UserProfileResponse {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

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

  async getProfileOrFail(
    userId: string,
  ): Promise<{ data: UserProfileResponse }> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      data: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }
}
