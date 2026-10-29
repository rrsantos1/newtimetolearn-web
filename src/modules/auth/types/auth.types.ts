export interface RegisterResponse {
  success: true;
  data: {
    message: string;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
  requestId?: string;
}

export type UserRole = "ADMIN" | "TEACHER" | "STUDENT";

export type UserStatus =
  | "PENDING_VERIFICATION"
  | "ACTIVE"
  | "BLOCKED";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];
}

export interface UserProfile extends AuthUser {
  status: UserStatus;
  emailVerifiedAt: string | null;
  createdAt: string;
}

export interface LoginResponse {
  success: true;
  data: {
    accessToken: string;
    tokenType: "Bearer";
    expiresIn: number;
    user: AuthUser;
  };
}

export interface UserProfileResponse {
  success: true;
  data: UserProfile;
}

export interface UpdateUserProfileResponse {
  success: true;
  data: UserProfile;
}
