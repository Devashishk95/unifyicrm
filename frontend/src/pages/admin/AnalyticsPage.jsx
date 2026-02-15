import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { superAdminAPI } from '../../lib/api';
import { formatCurrency} from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { 
  BarChart3, TrendingUp, Users, Building2, FileText, CreditCard,
  ArrowUp, ArrowDown, RefreshCw, Calendar
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsRes, dashboardRes] = await Promise.all([
        superAdminAPI.analytics(),
        superAdminAPI.dashboard()
      ]);
      setAnalytics(analyticsRes.data);
      setDashboard(dashboardRes.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
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

  // Prepare chart data
  const leadsByStageData = analytics?.leads_by_stage 
    ? Object.entries(analytics.leads_by_stage).map(([key, value]) => ({
        name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value,
        fill: COLORS[Math.floor(Math.random() * COLORS.length)]
      }))
    : [];

  const applicationsByStatusData = analytics?.applications_by_status
    ? Object.entries(analytics.applications_by_status).map(([key, value], index) => ({
        name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value,
        fill: COLORS[index % COLORS.length]
      }))
    : [];

  const leadsByUniversityData = analytics?.leads_by_university
    ? Object.entries(analytics.leads_by_university).slice(0, 10).map(([id, count], index) => ({
        name: `Uni ${index + 1}`,
        leads: count
      }))
    : [];

  // Summary stats
  const totalLeads = dashboard?.leads || 0;
  const totalApplications = dashboard?.applications || 0;
  const totalStudents = dashboard?.students || 0;
  const totalUniversities = dashboard?.universities?.total || 0;

  // Calculate conversion rate
  const conversionRate = totalLeads > 0 ? ((totalApplications / totalLeads) * 100).toFixed(1) : 0;

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="analytics-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Platform Analytics</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Insights and performance metrics</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="today">Today</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadAnalytics}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Universities</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalUniversities}</p>
                </div>
                <Building2 className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Total Leads</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalLeads}</p>
                </div>
                <Users className="h-8 w-8 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Applications</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalApplications}</p>
                </div>
                <FileText className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Students</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalStudents}</p>
                </div>
                <Users className="h-8 w-8 text-amber-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-600 to-indigo-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-100 uppercase tracking-wider">Conversion Rate</p>
                  <p className="text-2xl font-bold text-white">{conversionRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-white opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lead Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Lead Funnel Analysis
            </CardTitle>
            <CardDescription>Distribution of leads across different stages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              {leadsByStageData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leadsByStageData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#2563EB" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No lead data available yet</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Application Status */}
          <Card>
            <CardHeader>
              <CardTitle>Application Status Distribution</CardTitle>
              <CardDescription>Current status of all applications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {applicationsByStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={applicationsByStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {applicationsByStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500">
                    No application data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Leads by University */}
          <Card>
            <CardHeader>
              <CardTitle>Leads by University</CardTitle>
              <CardDescription>Top universities by lead count</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {leadsByUniversityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={leadsByUniversityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="leads" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500">
                    No data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stage Breakdown Cards */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Stage Breakdown</CardTitle>
            <CardDescription>Detailed count per stage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {leadsByStageData.map((stage, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center"
                >
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stage.value}</p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{stage.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
