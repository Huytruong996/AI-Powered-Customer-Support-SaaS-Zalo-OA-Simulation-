import { apiFetch } from "@/lib/api.utils";
import { 
  ConversationsData, 
  ConversationDetailData, 
  PaginatedResponse,
  Message
} from "@/types/conversation";

export const conversationAPI = {
  getConversations(page = 1, limit = 20, search = '', status = '') {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
      status
    });
    return apiFetch.get<{ success: boolean; data: PaginatedResponse<ConversationsData> }>(
      `/conversations?${params.toString()}`
    );
  },

  getConversationById(id: string, messagePage = 1, messageLimit = 50) {
    const params = new URLSearchParams({
      messagePage: messagePage.toString(),
      messageLimit: messageLimit.toString(),
    });
    return apiFetch.get<{ success: boolean; data: PaginatedResponse<ConversationDetailData> }>(
      `/conversations/${id}?${params.toString()}`
    );
  },

  sendMessage(id: string, content: string) {
    return apiFetch.post<{ success: boolean; data: Message }>(`/conversations/${id}/messages`, {
      body: JSON.stringify({ content }),
    });
  },

  getStats() {
    return apiFetch.get<{ success: boolean; data: any }>('/conversations/stats');
  },

  toggleBotStatus(id: string, botActive: boolean) {
    return apiFetch.patch<{ success: boolean; data: any }>(`/conversations/${id}/bot-status`, {
      body: JSON.stringify({ botActive }),
    });
  }
};
