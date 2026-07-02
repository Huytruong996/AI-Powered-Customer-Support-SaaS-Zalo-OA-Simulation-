"use client";

import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, UserCircle2 } from "lucide-react";
import { conversationAPI } from "@/services/conversation.service";
import { Conversation, Message } from "@/types/conversation";

export default function ZaloMockPage() {
  const [userId, setUserId] = useState("mock_user_123");
  const [userName, setUserName] = useState("Nguyễn Văn Test");
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch messages from DB for this mock user
  const fetchMessages = async () => {
    try {
      // 1. Find conversation by searching (we get all and filter by zaloUserId for simplicity in mock)
      const res = await conversationAPI.getConversations(1, 50, "");
      if (res.success && res.data) {
        const conv = res.data.conversations.find(
          (c: any) => c.customer?.zaloUserId === userId
        );
        
        if (conv) {
          // 2. Fetch full messages
          const detailRes = await conversationAPI.getConversationById(conv.id);
          if (detailRes.success && detailRes.data) {
            setMessages(detailRes.data.messages);
            scrollToBottom();
          }
        } else {
          setMessages([]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch mock messages:", error);
    }
  };

  useEffect(() => {
    if (!isConfigured) return;
    
    fetchMessages();

    const socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000", {
      withCredentials: true,
    });

    socket.on("new_message", (data: any) => {
      // When a new message comes in, re-fetch to see if it belongs to us
      // In a real app we'd check conversationId, but for mock re-fetching is fine.
      fetchMessages();
    });

    return () => {
      socket.disconnect();
    };
  }, [isConfigured, userId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    const textToSend = inputText.trim();
    setInputText("");
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/v1/mock-zalo/send-to-webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          userName,
          text: textToSend
        })
      });

      if (response.ok) {
        // Will be updated via Socket/Fetch
        setTimeout(fetchMessages, 500);
      }
    } catch (error) {
      console.error("Error sending mock message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full">
          <div className="flex justify-center mb-6 text-blue-500">
            <UserCircle2 size={64} />
          </div>
          <h1 className="text-2xl font-bold text-center mb-2">Zalo Mock Emulator</h1>
          <p className="text-gray-500 text-center mb-6 text-sm">
            Cấu hình thông tin người dùng giả lập để test gửi/nhận tin nhắn.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Mock User ID</label>
              <Input 
                value={userId} 
                onChange={(e) => setUserId(e.target.value)}
                placeholder="VD: mock_user_123"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tên hiển thị</label>
              <Input 
                value={userName} 
                onChange={(e) => setUserName(e.target.value)}
                placeholder="VD: Nguyễn Văn A"
              />
            </div>
            
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 mt-4"
              onClick={() => setIsConfigured(true)}
            >
              Bắt đầu giả lập
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      {/* Mobile Phone Mockup */}
      <div className="bg-white dark:bg-gray-800 w-full max-w-sm h-[800px] max-h-full rounded-[3rem] shadow-2xl border-[8px] border-gray-800 overflow-hidden flex flex-col relative">
        
        {/* Notch/Top Bar */}
        <div className="absolute top-0 inset-x-0 h-6 bg-gray-800 z-20 rounded-b-3xl mx-16"></div>
        
        {/* App Header (Zalo Blue) */}
        <div className="bg-[#0068ff] text-white p-4 pt-8 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
              OA
            </div>
            <div>
              <h2 className="font-semibold leading-tight">Doanh nghiệp SaaS</h2>
              <span className="text-xs text-white/80">Official Account</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-white/80 hover:text-white" onClick={() => setIsConfigured(false)}>
            Thoát
          </Button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-[#e2e8f0] dark:bg-gray-900 p-4 overflow-y-auto" ref={scrollRef}>
          <div className="flex flex-col gap-3">
            {messages.length === 0 ? (
              <div className="text-center text-sm text-gray-500 my-auto pt-10">
                Gửi tin nhắn đầu tiên để bắt đầu trò chuyện
              </div>
            ) : (
              messages.map((msg) => {
                const isCustomer = msg.senderType === "CUSTOMER";
                return (
                  <div key={msg.id} className={`flex ${isCustomer ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      isCustomer 
                        ? "bg-[#c6e1ff] dark:bg-blue-600 text-gray-900 dark:text-white rounded-br-sm" 
                        : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white dark:bg-gray-800 p-3 border-t dark:border-gray-700 flex items-center gap-2">
          <Input 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Nhắn tin..."
            className="flex-1 rounded-full bg-gray-100 dark:bg-gray-900 border-none focus-visible:ring-1"
          />
          <Button 
            size="icon" 
            className="rounded-full bg-[#0068ff] hover:bg-blue-700 shrink-0"
            onClick={handleSend}
            disabled={isLoading || !inputText.trim()}
          >
            <Send size={18} />
          </Button>
        </div>

      </div>
    </div>
  );
}
