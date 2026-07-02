import { MessageSquare } from "lucide-react";

export default function InboxEmptyPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
      <MessageSquare size={48} className="opacity-20" />
      <p className="text-lg font-medium">Chọn một cuộc hội thoại để bắt đầu</p>
    </div>
  );
}
