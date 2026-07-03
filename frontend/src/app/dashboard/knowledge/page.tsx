"use client";

import { useState, useEffect, useRef } from "react";
import { knowledgeAPI, KnowledgeItem } from "@/services/knowledge.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Upload, Trash2, Search } from "lucide-react";

export default function KnowledgePage() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("PRODUCT");

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const res = await knowledgeAPI.getKnowledgeList(1, 50, search, filterType);
      if (res.success && res.data) {
        setItems(res.data.items);
      }
    } catch (error) {
      console.error("Failed to fetch knowledge", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchItems();
    }, 500);
    return () => clearTimeout(delay);
  }, [search, filterType]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    
    setIsSubmitting(true);
    try {
      const res = await knowledgeAPI.createKnowledge({ title, content, type });
      if (res.success) {
        setTitle("");
        setContent("");
        fetchItems();
      }
    } catch (error) {
      console.error("Failed to create knowledge", error);
      alert("Lỗi khi thêm dữ liệu. Vui lòng kiểm tra lại AI Configuration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xoá dữ liệu này?")) return;
    try {
      await knowledgeAPI.deleteKnowledge(id);
      setItems(items.filter(item => item.id !== id));
    } catch (error) {
      console.error("Failed to delete", error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');
      setIsSubmitting(true);
      let successCount = 0;

      for (let i = 1; i < lines.length; i++) { // Skip header
        const line = lines[i].trim();
        if (!line) continue;
        
        // Basic CSV Parsing (Type,Title,Content) - Assuming no commas in Type/Title
        const parts = line.split(',');
        if (parts.length >= 3) {
          const cType = parts[0].trim();
          const cTitle = parts[1].trim();
          const cContent = parts.slice(2).join(',').trim(); // Content can have commas
          
          if (cTitle && cContent) {
            try {
              await knowledgeAPI.createKnowledge({ title: cTitle, content: cContent, type: cType });
              successCount++;
            } catch (err) {
              console.error("Error creating line", i, err);
            }
          }
        }
      }
      setIsSubmitting(false);
      alert(`Đã import thành công ${successCount} dòng dữ liệu!`);
      fetchItems();
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-gray-500">Quản lý tri thức nội bộ cho RAG AI (Sản phẩm, Chính sách, ...)</p>
        </div>
        <div>
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            Import CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Form Create */}
        <div className="col-span-1 bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700 shadow-sm h-fit">
          <h2 className="font-semibold text-lg mb-4">Thêm Dữ Liệu Mới</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Loại Dữ Liệu</label>
              <select 
                className="w-full flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:focus-visible:ring-gray-300"
                value={type}
                onChange={e => setType(e.target.value)}
              >
                <option value="PRODUCT">Sản phẩm (PRODUCT)</option>
                <option value="POLICY">Chính sách (POLICY)</option>
                <option value="GENERAL">Chung (GENERAL)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Tiêu Đề (Tên sản phẩm/chính sách)</label>
              <Input 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="VD: Áo thun nam Basic" 
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Nội Dung Chi Tiết</label>
              <textarea 
                className="flex min-h-[150px] w-full rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300"
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Nhập thông tin chi tiết (giá, màu sắc, size, chất liệu...)"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 size={16} className="animate-spin mr-2" /> Đang tạo Vector...</>
              ) : (
                <><Plus size={16} className="mr-2" /> Thêm vào Knowledge Base</>
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded text-sm">
            <strong>Mẹo Import CSV:</strong><br/>
            Chuẩn bị file CSV với cấu trúc 3 cột theo thứ tự:<br/>
            <code>Type,Title,Content</code><br/>
            Ví dụ:<br/>
            <code>PRODUCT,Áo Polo,Giá 200k chất cotton</code>
          </div>
        </div>

        {/* List Items */}
        <div className="col-span-1 md:col-span-2 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 shadow-sm flex flex-col">
          <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold text-lg">Dữ liệu hiện có</h2>
            <div className="flex space-x-2">
              <select 
                className="h-9 rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none dark:border-gray-700 dark:bg-gray-800"
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="PRODUCT">Sản phẩm</option>
                <option value="POLICY">Chính sách</option>
                <option value="GENERAL">Chung</option>
              </select>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <Input 
                  placeholder="Tìm kiếm..." 
                  className="pl-9 h-9" 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" /></div>
            ) : items.length === 0 ? (
              <div className="text-center py-10 text-gray-500">Chưa có dữ liệu nào.</div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="border dark:border-gray-700 p-4 rounded-lg hover:border-gray-300 transition relative group">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">
                          {item.type}
                        </span>
                        <h3 className="font-semibold">{item.title}</h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 whitespace-pre-wrap mt-2">
                        {item.content}
                      </p>
                      <p className="text-xs text-gray-400 mt-3">
                        Thêm vào: {new Date(item.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
