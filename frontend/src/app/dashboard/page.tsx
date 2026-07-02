"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { conversationAPI } from "@/services/conversation.service";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    openConversations: 0,
    totalMessages: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await conversationAPI.getStats();
        if (res.success && res.data) {
          setStats({
            totalCustomers: res.data.totalCustomers || 0,
            openConversations: res.data.openConversations || 0,
            totalMessages: res.data.totalMessages || 0,
          });
        }
      } catch (error) {
        console.error("Failed to fetch stats", error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{stats.totalCustomers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{stats.openConversations}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{stats.totalMessages}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
