import { apiFetch } from "@/lib/api.utils";

export interface ZaloConfig {
  id: string;
  appId: string;
  hasSecretKey: boolean;
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
}

export const zaloAPI = {
  getConfig() {
    return apiFetch.get<{ success: boolean; data: ZaloConfig }>("/zalo/config");
  },

  updateConfig(data: {
    appId?: string;
    secretKey?: string;
    accessToken?: string;
    refreshToken?: string;
  }) {
    return apiFetch.put<{ success: boolean; data: ZaloConfig }>("/zalo/config", {
      body: JSON.stringify(data),
    });
  },
};
