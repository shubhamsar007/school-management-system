export interface JwtPayload {
  sub: string;
  org: string;
  campuses: string[];
  roles: string[];
}
