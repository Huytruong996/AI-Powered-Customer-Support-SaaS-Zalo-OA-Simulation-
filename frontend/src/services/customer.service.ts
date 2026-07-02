import { apiFetch } from "@/lib/api.utils";
import { Customer, PaginatedResponse, Conversation } from "@/types/conversation";

export interface CustomerDetailData extends Customer {
  conversations: Conversation[];
}

export const customerAPI = {
  getCustomers(page = 1, limit = 20, search = '', tag = '') {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
      tag
    });
    return apiFetch.get<{ success: boolean; data: PaginatedResponse<{ customers: Customer[] }> }>(
      `/customers?${params.toString()}`
    );
  },

  getCustomerById(id: string) {
    return apiFetch.get<{ success: boolean; data: CustomerDetailData }>(`/customers/${id}`);
  },

  updateCustomer(id: string, data: Partial<Customer>) {
    return apiFetch.put<{ success: boolean; data: Customer }>(`/customers/${id}`, {
      body: JSON.stringify(data),
    });
  }
};
