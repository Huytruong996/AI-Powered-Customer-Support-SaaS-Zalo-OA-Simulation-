"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/app/dashboard/layout";
import { cannedResponseAPI, CannedResponse } from "@/services/ai.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Edit } from "lucide-react";

export default function TemplatesPage() {
  const [responses, setResponses] = useState<CannedResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [shortcut, setShortcut] = useState("");

  const fetchResponses = async () => {
    try {
      setIsLoading(true);
      const res = await cannedResponseAPI.getResponses();
      if (res.success && res.data) {
        setResponses(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch responses", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResponses();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setCategory("");
    setShortcut("");
    setIsFormOpen(false);
  };

  const handleEdit = (response: CannedResponse) => {
    setEditingId(response.id);
    setTitle(response.title);
    setContent(response.content);
    setCategory(response.category || "");
    setShortcut(response.shortcut || "");
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa mẫu trả lời này?")) return;
    try {
      await cannedResponseAPI.deleteResponse(id);
      fetchResponses();
    } catch (error) {
      console.error("Failed to delete", error);
    }
  };

  const handleSave = async () => {
    if (!title || !content) {
      alert("Vui lòng nhập đủ Tiêu đề và Nội dung");
      return;
    }

    try {
      let finalShortcut = shortcut.trim();
      if (finalShortcut && !finalShortcut.startsWith('/')) {
        finalShortcut = '/' + finalShortcut;
      }
      
      const payload = { title, content, category, shortcut: finalShortcut };
      if (editingId) {
        await cannedResponseAPI.updateResponse(editingId, payload);
      } else {
        await cannedResponseAPI.createResponse(payload);
      }
      fetchResponses();
      resetForm();
    } catch (error) {
      console.error("Failed to save", error);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Canned Responses</h1>
            <p className="text-gray-500">Quản lý các mẫu trả lời nhanh (Templates).</p>
          </div>
          {!isFormOpen && (
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Thêm Mới
            </Button>
          )}
        </div>

        {isFormOpen && (
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle>{editingId ? "Sửa Mẫu Trả Lời" : "Tạo Mẫu Trả Lời Mới"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tiêu đề *</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ví dụ: Lời chào" />
                </div>
                <div className="space-y-2">
                  <Label>Phím tắt</Label>
                  <Input value={shortcut} onChange={e => setShortcut(e.target.value)} placeholder="Ví dụ: /hi" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Danh mục</Label>
                <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="Ví dụ: General, Sales, Support" />
              </div>
              <div className="space-y-2">
                <Label>Nội dung *</Label>
                <textarea
                  className="w-full min-h-[100px] p-3 rounded-md border border-input bg-transparent text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Nội dung sẽ được gửi cho khách..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={resetForm}>Hủy</Button>
                <Button onClick={handleSave}>Lưu</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex justify-center p-10">
            <Loader2 className="animate-spin text-gray-400" size={32} />
          </div>
        ) : (
          <div className="grid gap-4">
            {responses.map(response => (
              <Card key={response.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <CardContent className="p-4 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{response.title}</h3>
                      {response.category && <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">{response.category}</span>}
                      {response.shortcut && <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded font-mono">{response.shortcut}</span>}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{response.content}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(response)}>
                      <Edit className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(response.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {responses.length === 0 && !isFormOpen && (
              <div className="text-center p-10 text-gray-500 border border-dashed rounded-lg">
                Chưa có mẫu câu nào. Hãy tạo mới!
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
