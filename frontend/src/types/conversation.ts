import { User } from './user';

export type ConversationStatus = 'OPEN' | 'CLOSED';
export type SenderType = 'CUSTOMER' | 'STAFF' | 'AI';

export interface Customer {
  id: string;
  zaloUserId: string;
  displayName: string;
  phone: string | null;
  tags: string[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  senderType: SenderType;
  zaloMessageId: string | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  customerId: string;
  status: ConversationStatus;
  unreadCount: number;
  requiresHuman?: boolean;
  botActive?: boolean;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  lastMessage?: Message;
}

export type PaginatedResponse<T> = T & {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export interface ConversationsData {
  conversations: Conversation[];
}

export interface ConversationDetailData {
  conversation: Conversation;
  messages: Message[];
}
