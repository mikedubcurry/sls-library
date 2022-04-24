import { sign } from "jsonwebtoken";

export function getTokenFromHeader(authHeader: string) {
  if (authHeader.includes("Bearer ")) {
    return authHeader.slice(7);
  }
}

export function tokenForUser(user: User) {
  return sign(
    {
      data: { userId: user.userId, role: user.role },
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    },
    process.env.JWT_SECRET!
  );
}
