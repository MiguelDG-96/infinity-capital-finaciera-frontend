export interface AuthModel {
  accessToken: string;
  refreshToken: string;
  message?: string;
  // We can add user details here later when we have the user model
}
