"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";
import { logoutService } from "@/services/auth.service";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const handleLogout = async () => {
    await logoutService()
    router.push("/login");
  };

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700">
        <div className="p-4 border-b dark:border-gray-700">
          <Link href="/">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Zalo AI SaaS</h2>
          </Link>
        </div>
        <nav className="p-4 space-y-2">
          <Link href="/dashboard" className="block px-4 py-2 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-700">Dashboard</Link>
          <Link href="/inbox" className="block px-4 py-2 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-700">Inbox</Link>
          <Link href="/customers" className="block px-4 py-2 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-700">Customers</Link>
          <Link href="/templates" className="block px-4 py-2 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-700">Templates</Link>
          <Link href="/dashboard/knowledge" className="block px-4 py-2 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-700">Knowledge Base</Link>
          <div className="pt-4 pb-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Settings</div>
          <Link href="/settings/ai" className="block px-4 py-2 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-700">AI Config</Link>
          <Link href="/settings/zalo" className="block px-4 py-2 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-700">Zalo Config</Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex items-center justify-end px-6">
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
