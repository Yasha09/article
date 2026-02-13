export interface UserProfileResponse {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfileDataResponse {
  data: UserProfileResponse;
}
