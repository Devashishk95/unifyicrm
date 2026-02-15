import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { superAdminAPI } from '../../lib/api';
import { formatCurrency } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Building2, Users, FileText, CreditCard, TrendingUp, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [dashboardRes, analyticsRes] = await Promise.all([
        superAdminAPI.dashboard(),
        superAdminAPI.analytics()
      ]);
      setStats(dashboardRes.data);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  const leadStageData = analytics?.leads_by_stage 
    ? Object.entries(analytics.leads_by_stage).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))
    : [];

  const applicationStatusData = analytics?.applications_by_status
    ? Object.entries(analytics.applications_by_status).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))
    : [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Platform overview and analytics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card data-testid="universities-stat">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Universities</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                    {stats?.universities?.total || 0}
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    {stats?.universities?.active || 0} active
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="students-stat">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Students</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                    {stats?.students || 0}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="leads-stat">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Leads</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                    {stats?.leads || 0}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="applications-stat">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Applications</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                    {stats?.applications || 0}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Stats */}
        <Card data-testid="payment-stats">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Overview
            </CardTitle>
            <CardDescription>Platform-wide payment statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Successful</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats?.payments?.success?.total || 0)}
                </p>
                <p className="text-sm text-slate-500">{stats?.payments?.success?.count || 0} payments</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Failed</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(stats?.payments?.failed?.total || 0)}
                </p>
                <p className="text-sm text-slate-500">{stats?.payments?.failed?.count || 0} payments</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Refunded</p>
                <p className="text-2xl font-bold text-amber-600">
                  {formatCurrency(stats?.payments?.refunded?.total || 0)}
                </p>
                <p className="text-sm text-slate-500">{stats?.payments?.refunded?.count || 0} refunds</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Pending</p>
                <p className="text-2xl font-bold text-slate-600">
                  {formatCurrency(stats?.payments?.initiated?.total || 0)}
                </p>
                <p className="text-sm text-slate-500">{stats?.payments?.initiated?.count || 0} pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Lead Stages Distribution</CardTitle>
              <CardDescription>Current distribution of leads across stages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leadStageData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#2563EB" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Application Status</CardTitle>
              <CardDescription>Applications by current status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={applicationStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {applicationStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
