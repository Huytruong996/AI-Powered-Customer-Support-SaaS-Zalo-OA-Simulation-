import { apiFetch } from "@/lib/api.utils";

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedKnowledge {
  items: KnowledgeItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const knowledgeAPI = {
  getKnowledgeList(page = 1, limit = 20, search = '', type = '') {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) params.append('search', search);
    if (type) params.append('type', type);

    return apiFetch.get<{ success: boolean; data: PaginatedKnowledge }>(
      `/knowledge?${params.toString()}`
    );
  },

  createKnowledge(data: { title: string; content: string; type?: string }) {
    return apiFetch.post<{ success: boolean; data: KnowledgeItem }>('/knowledge', {
      body: JSON.stringify(data),
    });
  },

  deleteKnowledge(id: string) {
    return apiFetch.delete<{ success: boolean; message: string }>(`/knowledge/${id}`);
  }
};
