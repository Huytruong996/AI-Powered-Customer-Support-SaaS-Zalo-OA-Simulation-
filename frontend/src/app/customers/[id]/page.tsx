"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { customerAPI, CustomerDetailData } from "@/services/customer.service";
import DashboardLayout from "@/app/dashboard/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const customerId = resolvedParams.id;
  const router = useRouter();
  
  const [customer, setCustomer] = useState<CustomerDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit states
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [newTag, setNewTag] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const res = await customerAPI.getCustomerById(customerId);
        if (res.success && res.data) {
          setCustomer(res.data);
          setDisplayName(res.data.displayName);
          setPhone(res.data.phone || "");
          setNotes(res.data.notes || "");
          setTags(res.data.tags);
        }
      } catch (error) {
        console.error("Failed to fetch customer", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCustomer();
  }, [customerId]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await customerAPI.updateCustomer(customerId, {
        displayName,
        phone,
        notes,
        tags
      });
      // Optionally show success toast
    } catch (error) {
      console.error("Failed to update customer", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      if (!tags.includes(newTag.trim())) {
        setTags([...tags, newTag.trim()]);
      }
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
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

  if (!customer) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center text-gray-500">Customer not found.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft size={18} />
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Customer Profile</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Info */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input 
                  id="displayName" 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Internal Notes</Label>
                <textarea
                  id="notes"
                  className="w-full min-h-[120px] p-3 rounded-md border border-input bg-transparent text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this customer..."
                />
              </div>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </CardContent>
          </Card>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1 pr-1">
                      {tag}
                      <button 
                        onClick={() => removeTag(tag)}
                        className="ml-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 p-0.5"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                  {tags.length === 0 && <span className="text-sm text-gray-500">No tags yet.</span>}
                </div>
                <Input 
                  placeholder="Add tag and press Enter..." 
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Zalo Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>Zalo User ID:</strong><br/><span className="text-gray-500 break-all">{customer.zaloUserId}</span></p>
                <p><strong>Created:</strong><br/><span className="text-gray-500">{new Date(customer.createdAt).toLocaleDateString()}</span></p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
