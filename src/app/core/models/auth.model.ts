export interface AuthModel {
  accessToken: string | null;
  refreshToken: string | null;
  message?: string;
  trustedDeviceToken?: string;
}
