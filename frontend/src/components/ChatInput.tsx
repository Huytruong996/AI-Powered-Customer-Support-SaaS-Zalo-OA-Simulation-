import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Send, Bot, MessageSquarePlus, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api.utils";
import { cannedResponseAPI, CannedResponse } from "@/services/ai.service";

interface ChatInputProps {
  conversationId: string;
  onMessageSent: () => void;
}

export function ChatInput({ conversationId, onMessageSent }: ChatInputProps) {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [templates, setTemplates] = useState<CannedResponse[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAiPopup, setShowAiPopup] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  
  const [slashSearch, setSlashSearch] = useState<string | null>(null);
  const [slashMatchIndex, setSlashMatchIndex] = useState<number | null>(null);
  const [hideSlashPopup, setHideSlashPopup] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await cannedResponseAPI.getResponses();
        if (res.success && res.data) {
          setTemplates(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch templates", error);
      }
    };
    fetchTemplates();
  }, []);

  // Close templates popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowTemplates(false);
        setShowAiPopup(false);
        setHideSlashPopup(true);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSend = async () => {
    if (!content.trim()) return;

    try {
      setIsSending(true);
      await apiFetch.post(`/conversations/${conversationId}/messages`, {
        body: JSON.stringify({ content: content.trim() }),
      });
      setContent("");
      setShowTemplates(false);
      setSlashSearch(null);
      setSelectedIndex(0);
      onMessageSent();
    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleSuggest = async () => {
    if (!aiPrompt.trim()) return;
    try {
      setIsSuggesting(true);
      setShowAiPopup(false);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${API_URL}/api/v1/ai/suggest-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ conversationId, message: aiPrompt.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to get suggestion from AI.");
      }
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let streamedContent = "";

      // Initialize content to empty before streaming starts
      setContent("");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') {
              break;
            }
            if (dataStr) {
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  streamedContent += parsed.text;
                  setContent(streamedContent);
                  
                  if (textareaRef.current) {
                    textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
                  }
                } else if (parsed.error) {
                   console.error("AI Error:", parsed.error);
                }
              } catch (e) {
                // Ignore incomplete JSON chunks
              }
            }
          }
        }
      }
      
      setAiPrompt("");
    } catch (error: any) {
      console.error("Failed to get suggestion", error);
      alert(error.message || "Failed to get suggestion from AI.");
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    setHideSlashPopup(false);

    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = val.substring(0, cursorPosition);
    const match = textBeforeCursor.match(/(?:\s|^)(\/[^\s]*)$/);

    if (match) {
      if (slashSearch !== match[1]) {
        setSelectedIndex(0);
      }
      setSlashSearch(match[1]); // e.g. "/hi"
      setSlashMatchIndex(match.index! + (match[0].startsWith(' ') ? 1 : 0));
    } else {
      setSlashSearch(null);
      setSelectedIndex(0);
    }
  };

  const insertTemplate = (templateContent: string) => {
    if (slashSearch !== null && !hideSlashPopup && slashMatchIndex !== null) {
      const before = content.substring(0, slashMatchIndex);
      const after = content.substring(slashMatchIndex + slashSearch.length);
      setContent(before + templateContent + after);
      setSlashSearch(null);
    } else {
      setContent(content + (content && !content.endsWith(' ') ? ' ' : '') + templateContent);
    }
    setShowTemplates(false);
    setHideSlashPopup(true);
    setSelectedIndex(0);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const displayTemplates = (slashSearch !== null && !hideSlashPopup)
    ? templates.filter(t => t.shortcut && (t.shortcut.toLowerCase().startsWith(slashSearch.toLowerCase()) || 
                                           t.shortcut.toLowerCase().startsWith(slashSearch.substring(1).toLowerCase())))
    : templates;

  const isPopupOpen = showTemplates || (slashSearch !== null && !hideSlashPopup && displayTemplates.length > 0);

  // Ensure selectedIndex is within bounds if the list shrinks
  const safeSelectedIndex = Math.min(selectedIndex, Math.max(0, displayTemplates.length - 1));

  useEffect(() => {
    if (isPopupOpen && displayTemplates.length > 0) {
      const el = document.getElementById(`template-item-${safeSelectedIndex}`);
      if (el) {
        el.scrollIntoView({ block: "nearest" });
      }
    }
  }, [safeSelectedIndex, isPopupOpen, displayTemplates]);

  return (
    <div className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700 relative" ref={wrapperRef}>
      
      {/* Templates Popup */}
      {isPopupOpen && (
        <div className="absolute bottom-full left-4 mb-2 w-72 max-h-60 overflow-y-auto bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl z-50">
          <div className="p-2 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900 sticky top-0 font-medium text-sm flex justify-between items-center z-10">
            <span>Chọn mẫu câu (Templates)</span>
            <span className="text-xs font-normal text-gray-500">Nhấn Esc để đóng</span>
          </div>
          {displayTemplates.length === 0 ? (
            <div className="p-4 text-sm text-gray-500 text-center">Chưa có mẫu câu nào phù hợp.</div>
          ) : (
            <div className="flex flex-col">
              {displayTemplates.map((template, idx) => (
                <button
                  key={template.id}
                  id={`template-item-${idx}`}
                  onClick={() => insertTemplate(template.content)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`text-left p-3 border-b dark:border-gray-700/50 last:border-0 transition-colors ${
                    idx === safeSelectedIndex 
                      ? "bg-blue-50 dark:bg-blue-900/30 border-l-2 border-l-blue-500" 
                      : "hover:bg-gray-100 dark:hover:bg-gray-700 border-l-2 border-l-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{template.title}</span>
                    {template.shortcut && (
                      <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-1.5 py-0.5 rounded">
                        {template.shortcut}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{template.content}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Prompt Popup */}
      {showAiPopup && (
        <div className="absolute bottom-full right-4 mb-2 w-80 p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl z-50">
          <div className="text-sm font-medium mb-2">Nhập yêu cầu cho AI</div>
          <textarea
            className="w-full min-h-[60px] p-2 mb-2 rounded border dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm resize-none"
            placeholder="Ví dụ: Gợi ý cách chào khách hàng..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            disabled={isSuggesting}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSuggest();
              }
            }}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowAiPopup(false)} disabled={isSuggesting}>Hủy</Button>
            <Button size="sm" onClick={handleSuggest} disabled={isSuggesting || !aiPrompt.trim()} className="bg-purple-600 hover:bg-purple-700 text-white">
              {isSuggesting ? <Loader2 className="animate-spin mr-1" size={14} /> : <Bot className="mr-1" size={14} />}
              Generate
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex flex-col gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => {
              setShowTemplates(!showTemplates);
              if (!showTemplates) {
                setHideSlashPopup(false);
                setSelectedIndex(0);
              }
            }}
            className="h-10 w-10 text-gray-600 hover:text-blue-600"
            title="Canned Responses (Templates)"
          >
            <MessageSquarePlus size={18} />
          </Button>
        </div>

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            className="w-full min-h-[80px] max-h-[200px] p-3 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
            placeholder="Nhập tin nhắn... (Gõ / để gọi mẫu câu)"
            value={content}
            onChange={handleContentChange}
            onKeyDown={(e) => {
              if (isPopupOpen) {
                if (e.key === "Escape") {
                  e.preventDefault();
                  setShowTemplates(false);
                  setHideSlashPopup(true);
                  return;
                }
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setSelectedIndex(prev => (prev + 1) % displayTemplates.length);
                  return;
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setSelectedIndex(prev => (prev - 1 + displayTemplates.length) % displayTemplates.length);
                  return;
                }
                if (e.key === "Enter" || e.key === "Tab") {
                  e.preventDefault();
                  if (displayTemplates[safeSelectedIndex]) {
                    insertTemplate(displayTemplates[safeSelectedIndex].content);
                  }
                  return;
                }
              }

              if (e.key === "Tab") {
                const match = content.match(/(\S+)$/);
                if (match) {
                  const lastWord = match[1];
                  const template = templates.find(t => t.shortcut === lastWord || `/${t.shortcut}` === lastWord);
                  if (template) {
                    e.preventDefault(); 
                    setContent(content.slice(0, match.index) + template.content);
                    setSlashSearch(null);
                    setShowTemplates(false);
                    return;
                  }
                }
              }
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setShowAiPopup(!showAiPopup)}
            disabled={isSuggesting}
            className="h-10 w-10 text-purple-600 border-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/20"
            title="AI Suggestion"
          >
            {isSuggesting ? <Loader2 size={18} className="animate-spin" /> : <Bot size={18} />}
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={!content.trim() || isSending}
            className="h-10 w-10 bg-blue-600 hover:bg-blue-700"
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}
