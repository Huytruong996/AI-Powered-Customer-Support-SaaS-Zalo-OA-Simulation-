import Link from "next/link";
import { Conversation } from "@/types/conversation";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface ConversationListProps {
  conversations: Conversation[];
  activeId?: string;
}

export function ConversationList({ conversations, activeId }: ConversationListProps) {
  if (!conversations?.length) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        Không có cuộc hội thoại nào.
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {conversations.map((conv) => {
        const isActive = conv.id === activeId;
        const lastMessageTime = conv.lastMessage?.createdAt || conv.updatedAt;

        return (
          <Link
            key={conv.id}
            href={`/inbox/${conv.id}`}
            className={`flex flex-col items-start gap-2 border-b p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
              isActive ? "bg-gray-100 dark:bg-gray-800" : ""
            }`}
          >
            <div className="flex w-full justify-between items-center">
              <span className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                {conv.customer?.displayName || "Khách hàng"}
                {conv.requiresHuman && (
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" title="Cần nhân viên hỗ trợ" />
                )}
              </span>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(lastMessageTime), { addSuffix: true, locale: vi })}
              </span>
            </div>
            
            <div className="flex w-full items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 flex-1 pr-4">
                {conv.lastMessage?.content || "Bắt đầu cuộc trò chuyện"}
              </p>
              {conv.unreadCount > 0 && (
                <Badge variant="destructive" className="ml-auto rounded-full h-5 w-5 flex items-center justify-center p-0">
                  {conv.unreadCount}
                </Badge>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
