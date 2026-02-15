import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { formatDateTime } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  Server, Database, Mail, Activity, CheckCircle, XCircle, 
  RefreshCw, Users, Building2, FileText, CreditCard, HelpCircle,
  Clock, AlertTriangle, Shield
} from 'lucide-react';
import { toast } from 'sonner';

export default function SystemPage() {
  const [stats, setStats] = useState(null);
  const [emailLogs, setEmailLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSystemData();
  }, []);

  const loadSystemData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('unify-token');
      
      // Load system stats
      const statsRes = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/superadmin/system/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      
      // Load email logs
      const emailRes = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/superadmin/system/email-logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (emailRes.ok) {
        const emailData = await emailRes.json();
        setEmailLogs(emailData.data || []);
      }
    } catch (err) {
      console.error('Failed to load system data:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkHealth = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/health`);
      if (res.ok) {
        toast.success('System is healthy');
      } else {
        toast.error('System health check failed');
      }
    } catch (err) {
      toast.error('Failed to reach server');
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

  const dbStats = stats?.database_stats || {};
  const recentUsers = stats?.recent_users || [];
  const recentLeads = stats?.recent_leads || [];

  const collectionIcons = {
    users: Users,
    universities: Building2,
    leads: Users,
    applications: FileText,
    payments: CreditCard,
    questions: HelpCircle,
    test_attempts: FileText,
  };

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="system-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">System Monitoring</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Server health and database statistics</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={checkHealth}>
              <Activity className="h-4 w-4 mr-2" />
              Health Check
            </Button>
            <Button variant="outline" onClick={loadSystemData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Server className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">API Server</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-600">Operational</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Database className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Database</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-600">Connected</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-amber-200 dark:border-amber-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Email Service (Brevo)</p>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span className="font-medium text-amber-600">Not Configured</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Database Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Collections
            </CardTitle>
            <CardDescription>Document counts per collection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {Object.entries(dbStats).map(([collection, count]) => {
                const Icon = collectionIcons[collection] || Database;
                return (
                  <div 
                    key={collection}
                    className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center"
                  >
                    <Icon className="h-6 w-6 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{count}</p>
                    <p className="text-xs text-slate-500 capitalize">{collection}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Activity and Logs */}
        <Card>
          <Tabs defaultValue="activity" className="w-full">
            <CardHeader>
              <TabsList>
                <TabsTrigger value="activity">Recent Activity</TabsTrigger>
                <TabsTrigger value="emails">Email Logs</TabsTrigger>
                <TabsTrigger value="webhooks">Webhook Status</TabsTrigger>
              </TabsList>
            </CardHeader>
            
            <TabsContent value="activity">
              <CardContent className="p-0">
                <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
                  {/* Recent Users */}
                  <div className="p-6">
                    <h4 className="font-medium mb-4 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Recent Users
                    </h4>
                    <div className="space-y-3">
                      {recentUsers.length === 0 ? (
                        <p className="text-sm text-slate-500">No recent users</p>
                      ) : (
                        recentUsers.map((user, index) => (
                          <div key={index} className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800/50">
                            <div>
                              <p className="font-medium text-sm">{user.name}</p>
                              <p className="text-xs text-slate-500">{user.email}</p>
                            </div>
                            <Badge variant="outline" className="text-xs capitalize">
                              {user.role?.replace('_', ' ')}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  
                  {/* Recent Leads */}
                  <div className="p-6">
                    <h4 className="font-medium mb-4 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Recent Leads
                    </h4>
                    <div className="space-y-3">
                      {recentLeads.length === 0 ? (
                        <p className="text-sm text-slate-500">No recent leads</p>
                      ) : (
                        recentLeads.map((lead, index) => (
                          <div key={index} className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800/50">
                            <div>
                              <p className="font-medium text-sm">{lead.name}</p>
                              <p className="text-xs text-slate-500">{lead.email}</p>
                            </div>
                            <Badge variant="outline" className="text-xs capitalize">
                              {lead.stage?.replace('_', ' ')}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </TabsContent>
            
            <TabsContent value="emails">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emailLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <Mail className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                          <p className="text-slate-500">No email logs available</p>
                          <p className="text-xs text-slate-400 mt-1">Email service not yet configured</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      emailLogs.map((log, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <p className="font-medium">{log.to_name || 'N/A'}</p>
                            <p className="text-sm text-slate-500">{log.to_email}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {log.email_type?.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{log.subject}</TableCell>
                          <TableCell>
                            <Badge className={
                              log.status === 'sent' || log.status === 'delivered'
                                ? 'bg-green-100 text-green-800'
                                : log.status === 'failed'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                            }>
                              {log.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-500">
                            {formatDateTime(log.sent_at || log.created_at)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </TabsContent>
            
            <TabsContent value="webhooks">
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">Razorpay Webhooks</p>
                          <p className="text-sm text-slate-500">Payment and transfer notifications</p>
                        </div>
                      </div>
                      <Badge className="bg-amber-100 text-amber-800">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending Setup
                      </Badge>
                    </div>
                    <div className="mt-4 p-3 rounded bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-xs text-slate-500 font-mono">
                        Webhook URL: {process.env.REACT_APP_BACKEND_URL}/api/webhooks/razorpay
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                          <Mail className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium">Brevo Webhooks</p>
                          <p className="text-sm text-slate-500">Email delivery tracking</p>
                        </div>
                      </div>
                      <Badge className="bg-slate-100 text-slate-800">
                        Not Configured
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Security Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <p className="text-sm text-slate-500 mb-1">JWT Algorithm</p>
                <p className="font-mono font-medium">HS256</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <p className="text-sm text-slate-500 mb-1">Token Expiration</p>
                <p className="font-mono font-medium">24 hours</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <p className="text-sm text-slate-500 mb-1">Password Hashing</p>
                <p className="font-mono font-medium">bcrypt</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
