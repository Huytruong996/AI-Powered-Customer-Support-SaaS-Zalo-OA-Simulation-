"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { customerAPI } from "@/services/customer.service";
import { Customer } from "@/types/conversation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search } from "lucide-react";
import DashboardLayout from "../dashboard/layout";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setIsLoading(true);
        const res = await customerAPI.getCustomers(page, 50, search, tag);
        if (res.success && res.data) {
          setCustomers(res.data.customers);
          setTotalPages(res.data.pagination.totalPages);
        }
      } catch (error) {
        console.error("Failed to fetch customers", error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(() => {
      fetchCustomers();
    }, 500);

    return () => clearTimeout(debounce);
  }, [search, tag, page]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Customers</h1>
        </div>

        <div className="flex gap-4 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              placeholder="Search by name, phone, or Zalo ID..." 
              className="pl-10"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="relative w-48">
            <Input 
              placeholder="Filter by tag..." 
              value={tag}
              onChange={(e) => { setTag(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-10">
            <Loader2 className="animate-spin text-gray-400" size={32} />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customers.map((customer) => (
                <Link href={`/customers/${customer.id}`} key={customer.id}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{customer.displayName}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <p>📱 {customer.phone || "No phone number"}</p>
                        <p>💬 Zalo ID: {customer.zaloUserId.slice(0, 10)}...</p>
                        <div className="flex flex-wrap gap-1 mt-3">
                          {customer.tags.map(tagItem => (
                            <Badge key={tagItem} variant="secondary" className="text-xs">{tagItem}</Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              {customers.length === 0 && (
                <div className="col-span-full text-center p-10 text-gray-500">
                  No customers found.
                </div>
              )}
            </div>
            
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-6">
                <button 
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm">Page {page} of {totalPages}</span>
                <button 
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
