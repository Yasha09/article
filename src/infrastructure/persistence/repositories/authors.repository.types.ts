import { User } from '../entities/user.entity';

export interface CreateAuthorParams {
  name: string;
  bio: string | null;
  avatarImagePath: string | null;
  createdBy: User;
}

export interface FindAuthorsParams {
  search?: string;
  skip: number;
  take: number;
}
