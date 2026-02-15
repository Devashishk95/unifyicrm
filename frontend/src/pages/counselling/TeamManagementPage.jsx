import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { counsellingManagerAPI } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { 
  Users, RefreshCw, UserCheck, Target, TrendingUp, Phone, Mail
} from 'lucide-react';
import { toast } from 'sonner';

export default function TeamManagementPage() {
  const [loading, setLoading] = useState(true);
  const [counsellors, setCounsellors] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0 });

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    setLoading(true);
    try {
      const res = await counsellingManagerAPI.getDashboard();
      setCounsellors(res.data.counsellor_stats || []);
      setStats({
        total: res.data.counsellor_stats?.length || 0,
        active: res.data.counsellor_stats?.filter(c => c.assigned_leads > 0).length || 0
      });
    } catch (err) {
      toast.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (rate) => {
    if (rate >= 30) return 'text-green-600';
    if (rate >= 15) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="team-management-page">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Team Management</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Monitor counsellor performance</p>
          </div>
          <Button variant="outline" onClick={loadTeam}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-slate-500">Total Counsellors</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-sm text-slate-500">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Table */}
        <Card>
          <CardHeader>
            <CardTitle>Counsellor Performance</CardTitle>
            <CardDescription>Performance metrics for all team members</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Counsellor</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Converted</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Performance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    </TableCell>
                  </TableRow>
                ) : counsellors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      No counsellors in your team yet
                    </TableCell>
                  </TableRow>
                ) : (
                  counsellors.map((c, index) => {
                    const rate = c.assigned_leads > 0 ? (c.converted / c.assigned_leads) * 100 : 0;
                    return (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                              {c.name?.charAt(0) || 'C'}
                            </div>
                            <div>
                              <p className="font-medium">{c.name}</p>
                              <p className="text-sm text-slate-500">{c.person_id}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {c.email && <p className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</p>}
                            {c.phone && <p className="flex items-center gap-1 text-slate-500"><Phone className="h-3 w-3" />{c.phone}</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{c.assigned_leads || 0}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-green-600">{c.converted || 0}</span>
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${getPerformanceColor(rate)}`}>
                            {rate.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="w-24">
                            <Progress value={Math.min(rate, 100)} className="h-2" />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
