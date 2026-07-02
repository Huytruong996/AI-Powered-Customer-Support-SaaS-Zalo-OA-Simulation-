"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { conversationAPI } from "@/services/conversation.service";
import { ConversationList } from "@/components/ConversationList";
import { Conversation } from "@/types/conversation";
import { Separator } from "@/components/ui/separator";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import DashboardLayout from "@/app/dashboard/layout";
import { io } from "socket.io-client";

export default function InboxLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const activeId = pathname.split("/").pop();

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const res = await conversationAPI.getConversations(page, 20, search);
      if (res.success && res.data) {
        setConversations(res.data.conversations);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch conversations", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchConversations();
    }, 500);

    return () => clearTimeout(debounce);
  }, [search, page]);

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000", {
      withCredentials: true,
    });

    socket.on("new_message", () => {
      // Refresh the list when a new message arrives
      fetchConversations();
    });

    return () => {
      socket.disconnect();
    };
  }, [search, page]);

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-120px)] w-full bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden border dark:border-gray-700">
        {/* Sidebar List */}
        <div className="w-80 border-r dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-gray-800/50">
          <div className="p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
            <h2 className="font-semibold text-lg mb-4">Hộp thư</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input 
                placeholder="Tìm kiếm..." 
                className="pl-9 h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {isLoading && conversations.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">Đang tải...</div>
            ) : (
              <div className="flex flex-col">
                <ConversationList conversations={conversations} activeId={activeId} />
                {totalPages > 1 && (
                  <div className="flex justify-between items-center p-4 border-t border-gray-200 dark:border-gray-700">
                    <button 
                      disabled={page === 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className="text-sm px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
                    >
                      Trước
                    </button>
                    <span className="text-xs text-gray-500">{page} / {totalPages}</span>
                    <button 
                      disabled={page >= totalPages}
                      onClick={() => setPage(p => p + 1)}
                      className="text-sm px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
                    >
                      Sau
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white dark:bg-gray-900">
          {children}
        </div>
      </div>
    </DashboardLayout>
  );
}
