export interface RegisterResponse {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginResponse {
  accessToken: string;
}
