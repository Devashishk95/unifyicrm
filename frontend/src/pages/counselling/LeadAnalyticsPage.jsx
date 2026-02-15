import { useState, useEffect, useRef } from 'react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { counsellingManagerAPI, leadAPI } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, LineChart, Line, Funnel, FunnelChart
} from 'recharts';
import { 
  TrendingUp, Users, Target, Filter, Download, Upload, RefreshCw,
  Globe, Building2, FileSpreadsheet, CheckCircle, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { ExportButton } from '../../components/ui/export-csv';

const SOURCE_COLORS = {
  manual: '#3B82F6',
  website: '#10B981',
  shiksha: '#F59E0B',
  collegedunia: '#8B5CF6',
  other_api: '#EC4899',
  bulk_upload: '#6366F1',
  unknown: '#94A3B8'
};

const STAGE_COLORS = {
  new_lead: '#3B82F6',
  contacted: '#06B6D4',
  interested: '#10B981',
  not_interested: '#EF4444',
  follow_up_scheduled: '#F59E0B',
  application_started: '#8B5CF6',
  documents_pending: '#EC4899',
  documents_submitted: '#14B8A6',
  fee_pending: '#F97316',
  fee_paid: '#22C55E',
  admission_confirmed: '#059669',
  closed_lost: '#6B7280'
};

const FUNNEL_COLORS = ['#3B82F6', '#06B6D4', '#10B981', '#F59E0B', '#22C55E'];

export default function LeadAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importSource, setImportSource] = useState('');
  const [importData, setImportData] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await counsellingManagerAPI.getLeadAnalytics();
      setAnalytics(res.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importData.trim()) {
      toast.error('Please enter lead data');
      return;
    }

    try {
      setImporting(true);
      // Parse JSON data
      let leads;
      try {
        leads = JSON.parse(importData);
        if (!Array.isArray(leads)) {
          leads = [leads];
        }
      } catch (e) {
        toast.error('Invalid JSON format');
        return;
      }

      let res;
      if (importSource === 'shiksha') {
        res = await leadAPI.importShiksha(leads);
      } else if (importSource === 'collegedunia') {
        res = await leadAPI.importCollegedunia(leads);
      }

      setImportResult(res.data);
      toast.success(`Import complete: ${res.data.created} leads created`);
      loadAnalytics();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const funnelData = analytics?.funnel ? [
    { name: 'Total Leads', value: analytics.funnel.total, fill: FUNNEL_COLORS[0] },
    { name: 'Contacted', value: analytics.funnel.contacted, fill: FUNNEL_COLORS[1] },
    { name: 'Interested', value: analytics.funnel.interested, fill: FUNNEL_COLORS[2] },
    { name: 'Applied', value: analytics.funnel.applied, fill: FUNNEL_COLORS[3] },
    { name: 'Converted', value: analytics.funnel.converted, fill: FUNNEL_COLORS[4] },
  ] : [];

  const conversionRate = analytics?.funnel?.total > 0 
    ? ((analytics.funnel.converted / analytics.funnel.total) * 100).toFixed(1)
    : 0;

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
      <div className="space-y-6" data-testid="lead-analytics-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Lead Analytics</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Track lead sources, conversion funnel, and import leads from third parties
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadAnalytics} data-testid="refresh-analytics">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => {
                setImportSource('');
                setImportData('');
                setImportResult(null);
                setShowImportDialog(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="import-leads-btn"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Leads
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {analytics?.funnel?.total || 0}
                  </p>
                  <p className="text-sm text-slate-500">Total Leads</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {analytics?.funnel?.converted || 0}
                  </p>
                  <p className="text-sm text-slate-500">Converted</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {conversionRate}%
                  </p>
                  <p className="text-sm text-slate-500">Conversion Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {analytics?.by_source?.length || 0}
                  </p>
                  <p className="text-sm text-slate-500">Lead Sources</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Lead Sources Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Leads by Source</CardTitle>
              <CardDescription>Distribution of leads across acquisition channels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics?.by_source || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ source, percent }) => `${source} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="source"
                    >
                      {analytics?.by_source?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={SOURCE_COLORS[entry.source] || SOURCE_COLORS.unknown} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>Lead progression through stages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={funnelData}
                    margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3B82F6">
                      {funnelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Leads by Stage */}
          <Card>
            <CardHeader>
              <CardTitle>Leads by Stage</CardTitle>
              <CardDescription>Current distribution across all stages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.by_stage || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stage" angle={-45} textAnchor="end" height={100} fontSize={10} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6">
                      {analytics?.by_stage?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STAGE_COLORS[entry.stage] || '#94A3B8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Leads Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Leads Over Time</CardTitle>
              <CardDescription>New leads acquired in the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics?.over_time || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={10} />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Third-Party Import Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-600" />
              Third-Party Integrations
            </CardTitle>
            <CardDescription>
              Import leads from external platforms like Shiksha and Collegedunia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <Card 
                className="cursor-pointer hover:border-amber-500/50 transition-colors"
                onClick={() => {
                  setImportSource('shiksha');
                  setImportData('');
                  setImportResult(null);
                  setShowImportDialog(true);
                }}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white">Shiksha</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Import leads from Shiksha platform
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer hover:border-purple-500/50 transition-colors"
                onClick={() => {
                  setImportSource('collegedunia');
                  setImportData('');
                  setImportResult(null);
                  setShowImportDialog(true);
                }}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Globe className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white">Collegedunia</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Import leads from Collegedunia platform
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Import Dialog */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                Import Leads from {importSource === 'shiksha' ? 'Shiksha' : importSource === 'collegedunia' ? 'Collegedunia' : 'Third Party'}
              </DialogTitle>
              <DialogDescription>
                Paste lead data in JSON format to import
              </DialogDescription>
            </DialogHeader>
            
            {!importSource && (
              <div className="py-4">
                <Label className="mb-2 block">Select Source</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-20"
                    onClick={() => setImportSource('shiksha')}
                  >
                    <Building2 className="h-6 w-6 mr-2 text-amber-600" />
                    Shiksha
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20"
                    onClick={() => setImportSource('collegedunia')}
                  >
                    <Globe className="h-6 w-6 mr-2 text-purple-600" />
                    Collegedunia
                  </Button>
                </div>
              </div>
            )}
            
            {importSource && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Lead Data (JSON format)</Label>
                  <Textarea
                    rows={10}
                    placeholder={`[
  {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+91 9876543210",
    "course_interest": "MBA",
    "campaign": "Summer 2025"
  }
]`}
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    className="font-mono text-sm"
                    data-testid="import-data-textarea"
                  />
                </div>
                
                {importResult && (
                  <div className={`p-4 rounded-lg ${importResult.created > 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {importResult.created > 0 ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-amber-600" />
                      )}
                      <span className="font-medium">Import Result</span>
                    </div>
                    <ul className="text-sm space-y-1">
                      <li>Created: {importResult.created} leads</li>
                      <li>Duplicates skipped: {importResult.duplicates}</li>
                      <li>Failed: {importResult.failed}</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                Close
              </Button>
              {importSource && (
                <Button
                  onClick={handleImport}
                  disabled={importing || !importData.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="submit-import-btn"
                >
                  {importing ? 'Importing...' : 'Import Leads'}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
