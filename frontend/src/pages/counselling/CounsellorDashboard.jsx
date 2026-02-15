import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { counsellorAPI, leadAPI } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { 
  Users, Target, Calendar, Clock, ArrowRight, RefreshCw, Phone, Mail, 
  AlertTriangle, CheckCircle, TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

export default function CounsellorDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeads: 0,
    convertedLeads: 0,
    overdueFollowUps: 0
  });
  const [myLeads, setMyLeads] = useState([]);
  const [todayFollowUps, setTodayFollowUps] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await counsellorAPI.getDashboard();
      const data = res.data;
      
      setStats({
        totalLeads: data.total_leads || 0,
        newLeads: data.new_leads || 0,
        convertedLeads: data.converted_leads || 0,
        overdueFollowUps: data.overdue_follow_ups || 0
      });
      
      setMyLeads(data.recent_leads || []);
      setTodayFollowUps(data.today_follow_ups || []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      // Use empty state
    } finally {
      setLoading(false);
    }
  };

  const getStageColor = (stage) => {
    const colors = {
      'new_lead': 'bg-blue-100 text-blue-800',
      'contacted': 'bg-cyan-100 text-cyan-800',
      'interested': 'bg-green-100 text-green-800',
      'not_interested': 'bg-red-100 text-red-800',
      'follow_up': 'bg-yellow-100 text-yellow-800',
      'application_started': 'bg-purple-100 text-purple-800',
      'converted': 'bg-emerald-100 text-emerald-800',
    };
    return colors[stage] || 'bg-slate-100 text-slate-800';
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

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="counsellor-dashboard">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Dashboard</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Your lead management overview</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadDashboard}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => navigate('/counsellor/leads')} className="bg-blue-600 hover:bg-blue-700">
              View My Leads
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">My Leads</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalLeads}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">New Leads</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.newLeads}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <p className="text-xs text-green-600 mt-2">Need to contact</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Converted</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.convertedLeads}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={stats.overdueFollowUps > 0 ? 'border-red-200 dark:border-red-800' : ''}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Overdue Follow-ups</p>
                  <p className={`text-3xl font-bold ${stats.overdueFollowUps > 0 ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
                    {stats.overdueFollowUps}
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                  stats.overdueFollowUps > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-slate-100 dark:bg-slate-800'
                }`}>
                  <AlertTriangle className={`h-6 w-6 ${stats.overdueFollowUps > 0 ? 'text-red-600' : 'text-slate-400'}`} />
                </div>
              </div>
              {stats.overdueFollowUps > 0 && (
                <p className="text-xs text-red-600 mt-2">Needs immediate attention</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Today's Follow-ups */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Today's Follow-ups
                  </CardTitle>
                  <CardDescription>Scheduled calls and tasks for today</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {todayFollowUps.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-400">No follow-ups scheduled for today</p>
                  <p className="text-sm text-slate-500">Great job staying on top of things!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayFollowUps.map((followUp, index) => (
                    <div 
                      key={index}
                      className="p-3 rounded-lg border hover:border-blue-500 cursor-pointer transition-colors"
                      onClick={() => navigate(`/counselling/leads/${followUp.lead_id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{followUp.lead_name}</p>
                          <p className="text-sm text-slate-500">{followUp.type}</p>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">{followUp.time || 'All day'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Leads */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>My Recent Leads</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/counsellor/leads')}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {myLeads.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No leads assigned yet</p>
                </div>
              ) : (
                <Table>
                  <TableBody>
                    {myLeads.slice(0, 5).map((lead) => (
                      <TableRow 
                        key={lead.id}
                        className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        onClick={() => navigate(`/counselling/leads/${lead.id}`)}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium">{lead.name}</p>
                            <div className="flex items-center gap-3 text-sm text-slate-500">
                              {lead.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {lead.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStageColor(lead.stage)}>
                            {lead.stage?.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm">
                          {formatDate(lead.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
