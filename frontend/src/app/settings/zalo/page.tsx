"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/app/dashboard/layout";
import { zaloAPI, ZaloConfig } from "@/services/zalo.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function ZaloSettingsPage() {
  const [config, setConfig] = useState<ZaloConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [appId, setAppId] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await zaloAPI.getConfig();
        if (res.success && res.data) {
          setConfig(res.data);
          setAppId(res.data.appId);
        }
      } catch (error) {
        console.error("Failed to fetch Zalo config", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updatePayload: any = { appId };
      if (secretKey) updatePayload.secretKey = secretKey;
      if (accessToken) updatePayload.accessToken = accessToken;
      if (refreshToken) updatePayload.refreshToken = refreshToken;
      
      const res = await zaloAPI.updateConfig(updatePayload);
      if (res.success) {
        setConfig(res.data);
        setSecretKey('');
        setAccessToken('');
        setRefreshToken('');
        alert("Cập nhật cấu hình Zalo thành công!");
      }
    } catch (error) {
      console.error("Failed to update Zalo config", error);
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Zalo OA Configuration</h1>
          <p className="text-gray-500">Quản lý kết nối với Zalo Official Account, tự động làm mới Token.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Zalo App Information</CardTitle>
            <CardDescription>Nhập thông tin Ứng dụng Zalo của bạn (lấy từ Zalo Developers).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>App ID</Label>
              <Input 
                placeholder="Nhập App ID..."
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Secret Key {config?.hasSecretKey && <span className="text-green-500 text-xs ml-2">(Đã cấu hình)</span>}</Label>
              <Input 
                type="password"
                placeholder={config?.hasSecretKey ? "Nhập Secret Key mới để thay đổi..." : "Nhập Secret Key..."}
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
              />
              <p className="text-xs text-gray-500">Secret Key được dùng để lấy lại (refresh) Access Token tự động.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tokens</CardTitle>
            <CardDescription>Cung cấp Token để hệ thống gửi tin nhắn phản hồi tự động.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Access Token {config?.hasAccessToken && <span className="text-green-500 text-xs ml-2">(Đã cấu hình)</span>}</Label>
              <Input 
                type="password"
                placeholder={config?.hasAccessToken ? "Nhập Access Token mới..." : "Nhập Access Token..."}
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Refresh Token {config?.hasRefreshToken && <span className="text-green-500 text-xs ml-2">(Đã cấu hình)</span>}</Label>
              <Input 
                type="password"
                placeholder={config?.hasRefreshToken ? "Nhập Refresh Token mới..." : "Nhập Refresh Token..."}
                value={refreshToken}
                onChange={(e) => setRefreshToken(e.target.value)}
              />
            </div>
            
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
