import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;

  const usersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const jwtService = {
    signAsync: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('register hashes password and creates user', async () => {
    usersService.findByEmail = jest.fn().mockResolvedValue(null);
    usersService.create = jest.fn().mockResolvedValue({
      id: 'user-id',
      email: 'user@example.com',
      passwordHash: 'hashed-password',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      articles: [],
    });

    const hashSpy = jest
      .spyOn(bcrypt, 'hash')
      .mockResolvedValue('hashed-password' as never);
    const findByEmailMock = usersService.findByEmail;
    const createMock = usersService.create;

    const result = await authService.register({
      email: 'user@example.com',
      password: 'password123',
    });

    expect(findByEmailMock).toHaveBeenCalledWith('user@example.com');
    expect(hashSpy).toHaveBeenCalledWith('password123', 10);
    expect(createMock).toHaveBeenCalledWith(
      'user@example.com',
      'hashed-password',
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: 'user-id',
        email: 'user@example.com',
      }),
    );
  });

  it('register throws ConflictException when email exists', async () => {
    usersService.findByEmail = jest
      .fn()
      .mockResolvedValue({ id: 'existing-id' });

    await expect(
      authService.register({
        email: 'user@example.com',
        password: 'password123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('login returns access token for valid credentials', async () => {
    usersService.findByEmail = jest.fn().mockResolvedValue({
      id: 'user-id',
      email: 'user@example.com',
      passwordHash: 'hashed-password',
    });

    const compareSpy = jest
      .spyOn(bcrypt, 'compare')
      .mockResolvedValue(true as never);
    jwtService.signAsync = jest.fn().mockResolvedValue('jwt-token');
    const signAsyncMock = jwtService.signAsync;

    const result = await authService.login({
      email: 'user@example.com',
      password: 'password123',
    });

    expect(compareSpy).toHaveBeenCalledWith('password123', 'hashed-password');
    expect(signAsyncMock).toHaveBeenCalledWith({
      sub: 'user-id',
      email: 'user@example.com',
    });
    expect(result).toEqual({ accessToken: 'jwt-token' });
  });

  it('login throws UnauthorizedException for missing user', async () => {
    usersService.findByEmail = jest.fn().mockResolvedValue(null);

    await expect(
      authService.login({ email: 'user@example.com', password: 'password123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('login throws UnauthorizedException for invalid password', async () => {
    usersService.findByEmail = jest.fn().mockResolvedValue({
      id: 'user-id',
      email: 'user@example.com',
      passwordHash: 'hashed-password',
    });
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

    await expect(
      authService.login({ email: 'user@example.com', password: 'password123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
