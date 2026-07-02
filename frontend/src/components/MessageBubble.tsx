import { Message } from "@/types/conversation";
import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface MessageBubbleProps {
  message: Message;
  customerName?: string;
}

export function MessageBubble({ message, customerName }: MessageBubbleProps) {
  const isCustomer = message.senderType === "CUSTOMER";
  const isAI = message.senderType === "AI";
  
  const alignClass = isCustomer ? "justify-start" : "justify-end";
  const bubbleClass = isCustomer
    ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100 rounded-bl-none"
    : isAI 
      ? "bg-purple-100 text-purple-900 dark:bg-purple-900/40 dark:text-purple-100 rounded-br-none border border-purple-200 dark:border-purple-800"
      : "bg-blue-600 text-white rounded-br-none";

  return (
    <div className={`flex w-full ${alignClass} mb-4`}>
      {isCustomer && (
        <Avatar className="h-8 w-8 mr-2 mt-auto">
          <AvatarFallback className="bg-gray-300 dark:bg-gray-700 text-xs">
            {customerName ? customerName.charAt(0).toUpperCase() : "C"}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={`max-w-[70%] flex flex-col ${isCustomer ? "items-start" : "items-end"}`}>
        <div className={`px-4 py-2 rounded-2xl ${bubbleClass} whitespace-pre-wrap break-words text-sm`}>
          {message.content}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-gray-500">
            {format(new Date(message.createdAt), "HH:mm")}
          </span>
          {isAI && (
            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
              ✨ AI Auto-Reply
            </span>
          )}
        </div>
      </div>

      {!isCustomer && (
        <Avatar className="h-8 w-8 ml-2 mt-auto">
          <AvatarFallback className={isAI ? "bg-purple-600 text-white text-xs" : "bg-blue-600 text-white text-xs"}>
            {isAI ? "AI" : "Me"}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
