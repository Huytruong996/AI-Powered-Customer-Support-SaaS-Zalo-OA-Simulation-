"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/app/dashboard/layout";
import { aiAPI, AIConfig } from "@/services/ai.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function AISettingsPage() {
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [provider, setProvider] = useState<'gemini' | 'openrouter'>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await aiAPI.getConfig();
        if (res.success && res.data) {
          setConfig(res.data);
          setProvider(res.data.provider);
          setSystemPrompt(res.data.systemPrompt || '');
          setAutoReplyEnabled(res.data.autoReplyEnabled);
        }
      } catch (error) {
        console.error("Failed to fetch AI config", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updatePayload: any = {
        provider,
        systemPrompt,
        autoReplyEnabled
      };
      if (apiKey) {
        updatePayload.apiKey = apiKey;
      }
      
      const res = await aiAPI.updateConfig(updatePayload);
      if (res.success) {
        setConfig(res.data);
        setApiKey(''); // clear on success
        alert("Cập nhật cấu hình AI thành công!");
      }
    } catch (error) {
      console.error("Failed to update AI config", error);
      alert("Cập nhật thất bại.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-full">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Configuration</h1>
          <p className="text-gray-500">Quản lý cấu hình AI, Prompt và tính năng Auto-reply.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>AI Provider</CardTitle>
            <CardDescription>Chọn mô hình AI bạn muốn sử dụng.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Provider</Label>
              <select 
                className="w-full p-2 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-700"
                value={provider}
                onChange={(e) => setProvider(e.target.value as any)}
              >
                <option value="gemini">Google Gemini (Free Tier Available)</option>
                <option value="openrouter">OpenRouter (Multiple Models)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>API Key {config?.hasApiKey && <span className="text-green-500 text-xs ml-2">(Đã cấu hình)</span>}</Label>
              <Input 
                type="password"
                placeholder={config?.hasApiKey ? "Nhập API Key mới để thay đổi..." : "Nhập API Key của bạn..."}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-gray-500">API Key được lưu trữ an toàn. Lấy key tại Google AI Studio hoặc OpenRouter.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Behavior</CardTitle>
            <CardDescription>Cấu hình cách AI trả lời khách hàng.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>System Prompt</Label>
              <textarea
                className="w-full min-h-[150px] p-3 rounded-md border border-input bg-transparent text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Bạn là nhân viên CSKH của cửa hàng..."
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
              />
              <p className="text-xs text-gray-500">Hướng dẫn AI cách xưng hô, giọng điệu, và thông tin cơ bản về doanh nghiệp.</p>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input 
                type="checkbox" 
                id="autoReply" 
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={autoReplyEnabled}
                onChange={(e) => setAutoReplyEnabled(e.target.checked)}
              />
              <Label htmlFor="autoReply" className="cursor-pointer">
                Bật tính năng Auto-Reply
              </Label>
            </div>
            <p className="text-xs text-gray-500 ml-6">Nếu bật, AI sẽ tự động trả lời tin nhắn của khách hàng. Nếu tắt, AI chỉ gợi ý câu trả lời cho nhân viên.</p>
            
            <div className="pt-4">
              <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Lưu Cấu Hình
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
