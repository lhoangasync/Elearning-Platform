"use client";
import { ILoginReqBody, TUserProfileRes } from "@/types/backend";
import api from "@/utils/api";
import { clearTokens, getRefreshToken, setTokens } from "@/utils/token.service";
import { useRouter } from "next/navigation";
import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";

interface AuthContextType {
  user: TUserProfileRes | null;
  login: (credentials: ILoginReqBody) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<TUserProfileRes | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    try {
      // Interceptor trong api.ts sẽ tự động đính kèm accessToken
      // và refresh nó nếu cần
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch (error) {
      console.error("Failed to fetch user. Token might be invalid.", error);
      clearTokens();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      // Nếu có refresh token, thử lấy thông tin user
      fetchUser().finally(() => setIsLoading(false));
    } else {
      // Nếu không có token, kết thúc quá trình loading
      setIsLoading(false);
    }
  }, [fetchUser]);

  // Hàm xử lý đăng nhập
  const login = async (credentials: ILoginReqBody) => {
    const response = await api.post("/auth/login", credentials);
    const { accessToken, refreshToken } = response.data;

    // Lưu token bằng service đã tạo
    setTokens(accessToken, refreshToken);

    // Sau khi có token, lấy thông tin người dùng
    await fetchUser();
  };

  const logout = () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      api.post("/auth/logout", { refreshToken }).catch((err) => {
        console.error(
          "Server logout failed, logging out client-side anyway.",
          err
        );
      });
    }
    clearTokens();
    setUser(null);
    router.push("/sign-in");
  };

  const value = { user, login, logout, isLoading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
