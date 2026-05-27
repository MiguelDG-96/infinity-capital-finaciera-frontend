export interface AuthModel {
  accessToken: string | null;
  refreshToken: string | null;
  message?: string;
  // We can add user details here later when we have the user model
}
