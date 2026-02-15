import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { universityAPI } from '../../lib/api';
import { formatCurrency, LEAD_STAGES } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Users, FileText, UserCog, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export default function UniversityDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await universityAPI.dashboard();
      setStats(response.data);
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

  const leadStageData = stats?.leads_by_stage 
    ? Object.entries(stats.leads_by_stage).map(([key, value]) => ({ 
        name: LEAD_STAGES[key]?.label || key.replace(/_/g, ' '), 
        value 
      }))
    : [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">University Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Overview of your admission process</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card data-testid="total-leads-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Leads</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                    {stats?.total_leads || 0}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="total-applications-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Applications</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                    {stats?.total_applications || 0}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="total-staff-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Staff Members</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                    {stats?.total_staff || 0}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <UserCog className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lead Stages Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Pipeline</CardTitle>
            <CardDescription>Distribution of leads across different stages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadStageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Users, label: 'View Leads', path: '/university/leads', color: 'blue' },
            { icon: UserCog, label: 'Manage Staff', path: '/university/staff', color: 'purple' },
            { icon: FileText, label: 'Question Bank', path: '/university/questions', color: 'green' },
            { icon: TrendingUp, label: 'Registration Config', path: '/university/registration-config', color: 'amber' },
          ].map((action, index) => (
            <Card key={index} className="hover:border-blue-500/50 cursor-pointer transition-colors" onClick={() => window.location.href = action.path}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`h-10 w-10 rounded-lg bg-${action.color}-100 dark:bg-${action.color}-900/30 flex items-center justify-center`}>
                  <action.icon className={`h-5 w-5 text-${action.color}-600 dark:text-${action.color}-400`} />
                </div>
                <span className="font-medium text-slate-900 dark:text-white">{action.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
