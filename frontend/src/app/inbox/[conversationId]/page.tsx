"use client";

import { useEffect, useState, useRef, use } from "react";
import { io } from "socket.io-client";
import { conversationAPI } from "@/services/conversation.service";
import { Conversation, Message } from "@/types/conversation";
import { MessageBubble } from "@/components/MessageBubble";
import { ChatInput } from "@/components/ChatInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, ArrowDown, Bot, BotOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const resolvedParams = use(params);
  const conversationId = resolvedParams.conversationId;

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchConversation = async () => {
    try {
      const res = await conversationAPI.getConversationById(conversationId);
      console.log(res.data)
      if (res.success && res.data) {
        setConversation(res.data.conversation);
        setMessages(res.data.messages);
      }
    } catch (error) {
      console.error("Failed to fetch conversation detail", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBot = async () => {
    if (!conversation) return;
    try {
      const newStatus = !conversation.botActive;
      setConversation(prev => prev ? { ...prev, botActive: newStatus, requiresHuman: newStatus ? false : prev.requiresHuman } : null);
      await conversationAPI.toggleBotStatus(conversationId, newStatus);
    } catch (error) {
      console.error("Failed to toggle bot status", error);
      fetchConversation(); // Revert on error
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchConversation();

    const socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000", {
      withCredentials: true,
    });

    socket.on("new_message", (data: any) => {
      if (data && data.conversationId === conversationId) {
        fetchConversation();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [conversationId]);

  useEffect(() => {
    if (scrollRef.current && !showScrollButton) {
      // Auto scroll to bottom only if user hasn't manually scrolled up
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    // Show button if scrolled up more than 100px from the bottom
    const isNotAtBottom = scrollHeight - scrollTop - clientHeight > 100;
    setShowScrollButton(isNotAtBottom);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  };

  if (isLoading && !conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Không tìm thấy cuộc hội thoại.
      </div>
    );
  }
  console.log(conversation)
  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-center z-10">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            {conversation.customer?.displayName || "Khách hàng"}
            {conversation.requiresHuman && (
              <span className="flex items-center gap-1 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-full animate-pulse">
                <AlertCircle size={14} /> Cần hỗ trợ
              </span>
            )}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {conversation.customer?.phone || "Chưa có SĐT"} • Trạng thái: {conversation.status === "OPEN" ? "Mở" : "Đóng"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={conversation.botActive ? "outline" : "secondary"}
            size="sm"
            onClick={toggleBot}
            className={`flex items-center gap-2 ${!conversation.botActive ? "bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400" : ""}`}
            title={conversation.botActive ? "Tắt tự động trả lời" : "Bật tự động trả lời"}
          >
            {conversation.botActive ? <Bot size={16} /> : <BotOff size={16} />}
            <span className="hidden sm:inline">{conversation.botActive ? "Bot đang bật" : "Bot đang tắt"}</span>
          </Button>
        </div>
      </div>

      {conversation.requiresHuman && (
        <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/50 p-3 px-4 flex items-center gap-3 text-red-800 dark:text-red-400 text-sm z-10">
          <AlertCircle size={16} className="shrink-0" />
          <p>
            Khách hàng này đang yêu cầu nhân viên hỗ trợ trực tiếp. Bot AI đã được tự động tắt. Hãy trả lời khách hàng để tiếp nhận!
          </p>
        </div>
      )}

      {/* Messages */}
      <div
        className="flex-1 p-4 bg-gray-50 dark:bg-gray-900/50 overflow-y-auto"
        ref={scrollRef}
        onScroll={handleScroll}
      >
        <div className="flex flex-col gap-2 pb-4">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              customerName={conversation.customer?.displayName}
            />
          ))}
          {messages.length === 0 && (
            <div className="text-center text-sm text-gray-500 mt-10">
              Chưa có tin nhắn nào. Hãy gửi lời chào!
            </div>
          )}
        </div>
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <Button
          onClick={scrollToBottom}
          size="icon"
          className="absolute bottom-28 left-1/2 -translate-x-1/2 rounded-full shadow-lg h-10 w-10 bg-blue-600 hover:bg-blue-700 text-white z-20 transition-opacity"
        >
          <ArrowDown size={18} />
        </Button>
      )}

      {/* Input */}
      <ChatInput
        conversationId={conversationId}
        onMessageSent={fetchConversation}
      />
    </div>
  );
}
