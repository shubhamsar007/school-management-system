// API request/response types shared between frontend and backend

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    organizationId: string;
    roles: string[];
  };
}

export interface RefreshTokenResponse {
  accessToken: string;
}
