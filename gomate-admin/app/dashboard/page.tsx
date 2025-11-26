"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Users, Car, MapPin, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { API_CONFIG } from "@/lib/api-config";

const COLORS = ["#3b82f6", "#ef4444", "#f59e0b"];

interface DashboardStats {
  totalUsers: number;
  userGrowth: string;
  activeDrivers: number;
  driverGrowth: string;
  totalRides: number;
  rideGrowth: string;
  totalRevenue: number;
  revenueGrowth: string;
}

interface TrendData {
  month: string;
  rides: number;
  revenue: number;
}

interface StatusData {
  name: string;
  value: number;
  [key: string]: string | number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all dashboard data in parallel
        const [statsRes, trendRes, statusRes] = await Promise.all([
          fetch(`${API_CONFIG.BASE_URL}/statistics/dashboard`),
          fetch(`${API_CONFIG.BASE_URL}/statistics/rides-revenue-trend`),
          fetch(`${API_CONFIG.BASE_URL}/statistics/driver-status`),
        ]);

        // Check each response individually for better error messages
        if (!statsRes.ok) {
          const errorText = await statsRes.text();
          console.error("Dashboard stats API error:", errorText);
          throw new Error(
            `Failed to fetch dashboard statistics (${statsRes.status}). Is the backend running at ${API_CONFIG.BASE_URL}?`
          );
        }

        if (!trendRes.ok) {
          const errorText = await trendRes.text();
          console.error("Trend API error:", errorText);
          throw new Error(
            `Failed to fetch rides & revenue trend (${trendRes.status})`
          );
        }

        if (!statusRes.ok) {
          const errorText = await statusRes.text();
          console.error("Status API error:", errorText);
          throw new Error(
            `Failed to fetch driver status (${statusRes.status})`
          );
        }

        const statsData = await statsRes.json();
        const trendDataRes = await trendRes.json();
        const statusDataRes = await statusRes.json();

        setStats(statsData.data);
        setTrendData(trendDataRes.data);
        setStatusData(statusDataRes.data);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        // Check if it's a network error (CORS or connection refused)
        if (err instanceof TypeError && err.message.includes("fetch")) {
          setError(
            `Cannot connect to backend at ${API_CONFIG.BASE_URL}. Please ensure:\n1. Backend server is running\n2. CORS is enabled\n3. API URL is correct in .env.local`
          );
        } else {
          setError(
            err instanceof Error
              ? err.message
              : "An error occurred loading dashboard data"
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4 px-4">
        <div className="text-center space-y-2 max-w-2xl">
          <h2 className="text-lg font-semibold text-red-500">
            Failed to Load Dashboard
          </h2>
          <p className="text-muted-foreground whitespace-pre-line">{error}</p>
          <p className="text-sm text-muted-foreground">
            API URL: {API_CONFIG.BASE_URL}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
          <Button
            onClick={() => window.open(`${API_CONFIG.BASE_URL}/api`, "_blank")}
            variant="outline"
          >
            Open API Docs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalUsers.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.userGrowth || "0%"} from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Drivers
            </CardTitle>
            <Car className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.activeDrivers.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.driverGrowth || "0%"} from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rides</CardTitle>
            <MapPin className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalRides.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.rideGrowth || "0%"} from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              PKR {stats?.totalRevenue.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.revenueGrowth || "0%"} from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Rides & Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="rides" fill="#3b82f6" />
                <Bar dataKey="revenue" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Driver Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => `${props.name}: ${props.value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry: StatusData, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
