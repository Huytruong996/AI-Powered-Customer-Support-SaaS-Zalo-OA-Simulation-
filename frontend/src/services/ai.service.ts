import { apiFetch } from "@/lib/api.utils";

export interface AIConfig {
  id: string;
  provider: 'gemini' | 'openrouter';
  hasApiKey: boolean;
  systemPrompt: string | null;
  autoReplyEnabled: boolean;
}

export const aiAPI = {
  getConfig() {
    return apiFetch.get<{ success: boolean; data: AIConfig }>('/ai/config');
  },

  updateConfig(data: Partial<AIConfig> & { apiKey?: string }) {
    return apiFetch.put<{ success: boolean; data: AIConfig }>('/ai/config', {
      body: JSON.stringify(data),
    });
  }
};

export interface CannedResponse {
  id: string;
  title: string;
  content: string;
  category: string | null;
  shortcut: string | null;
  createdAt: string;
  updatedAt: string;
}

export const cannedResponseAPI = {
  getResponses(category?: string) {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    return apiFetch.get<{ success: boolean; data: CannedResponse[] }>(`/canned-responses?${params.toString()}`);
  },

  createResponse(data: Partial<CannedResponse>) {
    return apiFetch.post<{ success: boolean; data: CannedResponse }>('/canned-responses', {
      body: JSON.stringify(data),
    });
  },

  updateResponse(id: string, data: Partial<CannedResponse>) {
    return apiFetch.put<{ success: boolean; data: CannedResponse }>(`/canned-responses/${id}`, {
      body: JSON.stringify(data),
    });
  },

  deleteResponse(id: string) {
    return apiFetch.delete<{ success: boolean; message: string }>(`/canned-responses/${id}`);
  }
};
