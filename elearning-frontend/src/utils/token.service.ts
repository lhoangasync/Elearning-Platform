// src/services/token.service.ts
import Cookies from "js-cookie";

// === Access Token (in-memory) ===
let inMemoryAccessToken: string | null = null;

export const getAccessToken = (): string | null => {
  return inMemoryAccessToken;
};

export const setAccessToken = (token: string | null): void => {
  inMemoryAccessToken = token;
};

// === Refresh Token (in Cookie) ===
const REFRESH_TOKEN_COOKIE_NAME = "refreshToken";

export const getRefreshToken = (): string | undefined => {
  return Cookies.get(REFRESH_TOKEN_COOKIE_NAME);
};

// === Combined Functions ===
export const setTokens = (accessToken: string, refreshToken: string): void => {
  // 1. Set accessToken in memory
  setAccessToken(accessToken);

  // 2. Set refreshToken in a secure-ish cookie
  Cookies.set(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    expires: 30, // 30 ngày
    secure: process.env.NODE_ENV === "production", // Chỉ gửi qua HTTPS ở production
    sameSite: "strict", // Chống CSRF
    path: "/",
  });
};

export const clearTokens = (): void => {
  setAccessToken(null);
  Cookies.remove(REFRESH_TOKEN_COOKIE_NAME, { path: "/" });
};
