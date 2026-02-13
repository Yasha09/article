import { NotFoundException } from '@nestjs/common';
import { User } from './entities/user.entity';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  const usersRepository = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(usersRepository as unknown as UsersRepository);
  });

  it('getProfileOrFail returns user profile data', async () => {
    const user = {
      id: 'user-id',
      email: 'user@example.com',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    } as User;

    usersRepository.findById = jest.fn().mockResolvedValue(user);

    await expect(service.getProfileOrFail('user-id')).resolves.toEqual({
      data: {
        id: 'user-id',
        email: 'user@example.com',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  });

  it('getProfileOrFail throws NotFoundException for unknown user', async () => {
    usersRepository.findById = jest.fn().mockResolvedValue(null);

    await expect(
      service.getProfileOrFail('missing-user-id'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
