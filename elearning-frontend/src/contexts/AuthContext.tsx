"use client";
import { API_ENDPOINT } from "@/constants/endpoint";
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
import { toast } from "sonner";

interface AuthContextType {
  user: TUserProfileRes | null;
  login: (credentials: ILoginReqBody) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  fetchUserAfterLogin: () => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  mutate: () => Promise<void>;
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
      const { data } = await api.get(API_ENDPOINT.PROFILE);
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
    const response = await api.post(API_ENDPOINT.LOGIN, credentials);
    const { accessToken, refreshToken } = response.data;

    // Lưu token bằng service đã tạo
    setTokens(accessToken, refreshToken);

    // Sau khi có token, lấy thông tin người dùng
    await fetchUser();
  };

  const fetchUserAfterLogin = async () => {
    await fetchUser();
  };

  const loginWithGoogle = async () => {
    try {
      const res = await api.get(API_ENDPOINT.LOGIN_WITH_GOOGLE);

      window.location.href = res.data.url;
    } catch (error) {
      console.log(error);
    }
  };

  const logout = async () => {
    const refreshToken = getRefreshToken();

    try {
      if (refreshToken) {
        await api.post(API_ENDPOINT.LOGOUT, { refreshToken });
      }
    } catch (error) {
      console.error(
        "Server-side logout failed, but proceeding with client-side cleanup.",
        error
      );
    } finally {
      clearTokens();
      setUser(null);
      router.push("/");
      toast.success("Logged out successfully");
    }
  };

  const value = {
    user,
    login,
    loginWithGoogle,
    fetchUserAfterLogin,
    logout,
    isLoading,
    mutate: fetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
