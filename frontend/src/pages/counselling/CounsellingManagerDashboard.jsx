import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { leadAPI, counsellingManagerAPI } from '../../lib/api';
import { formatDate, formatCurrency } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Progress } from '../../components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Switch } from '../../components/ui/switch';
import { 
  Users, TrendingUp, Target, UserCheck, ArrowRight, RefreshCw,
  Upload, Settings, Download, FileSpreadsheet, AlertCircle, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const API = process.env.REACT_APP_BACKEND_URL;

export default function CounsellingManagerDashboard() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeads: 0,
    convertedLeads: 0,
    pendingLeads: 0,
    conversionRate: 0
  });
  const [counsellors, setCounsellors] = useState([]);
  const [recentLeads, setRecentLeads] = useState([]);
  
  // Bulk Upload State
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const fileInputRef = useRef(null);

  // Auto Assignment Rules State
  const [rulesDialogOpen, setRulesDialogOpen] = useState(false);
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(false);
  const [assignmentRules, setAssignmentRules] = useState({
    method: 'round_robin',
    max_leads_per_counsellor: 50,
    priority_sources: []
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const res = await counsellingManagerAPI.getDashboard();
      const data = res.data;
      
      setStats({
        totalLeads: data.total_leads || 0,
        newLeads: data.new_leads || 0,
        convertedLeads: data.converted_leads || 0,
        pendingLeads: data.pending_leads || 0,
        conversionRate: data.conversion_rate || 0
      });
      
      setCounsellors(data.counsellor_stats || []);
      setRecentLeads(data.recent_leads || []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast.error('Please select a CSV file');
        return;
      }
      setUploadFile(file);
      setUploadResult(null);
    }
  };

  const handleBulkUpload = async () => {
    if (!uploadFile) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);

      // Read file as text and send as JSON
      const text = await uploadFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const leads = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length >= 3) {
          const lead = {};
          headers.forEach((header, idx) => {
            lead[header] = values[idx] || '';
          });
          leads.push({
            name: lead.name || lead.full_name || '',
            email: lead.email || '',
            phone: lead.phone || lead.mobile || '',
            source: lead.source || 'bulk_upload',
            course_interest: lead.course || lead.course_interest || ''
          });
        }
      }

      const res = await axios.post(`${API}/api/leads/bulk-upload`, { leads }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUploadResult({
        success: res.data.created || 0,
        failed: res.data.failed || 0,
        duplicates: res.data.duplicates || 0
      });
      
      toast.success(`${res.data.created} leads imported successfully`);
      loadDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to upload leads');
      setUploadResult({ error: err.response?.data?.detail || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csv = 'name,email,phone,source,course_interest\nJohn Doe,john@email.com,9876543210,website,B.Tech CS\nJane Smith,jane@email.com,9876543211,referral,MBA';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveAssignmentRules = async () => {
    try {
      await axios.put(`${API}/api/leads/assignment-rules`, {
        enabled: autoAssignEnabled,
        ...assignmentRules
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Assignment rules saved');
      setRulesDialogOpen(false);
    } catch (err) {
      toast.error('Failed to save rules');
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

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="cm-dashboard">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Counselling Dashboard</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Manage leads and team performance</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setRulesDialogOpen(true)} data-testid="auto-assign-btn">
              <Settings className="h-4 w-4 mr-2" />
              Auto-Assign Rules
            </Button>
            <Button variant="outline" onClick={() => setUploadDialogOpen(true)} data-testid="bulk-upload-btn">
              <Upload className="h-4 w-4 mr-2" />
              Bulk Upload
            </Button>
            <Button onClick={() => navigate('/counselling/leads')} className="bg-blue-600 hover:bg-blue-700">
              View All Leads
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
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total Leads</p>
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
              <p className="text-xs text-green-600 mt-2">Unassigned leads</p>
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
                  <UserCheck className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Conversion Rate</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.conversionRate.toFixed(1)}%</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Target className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Performance & Recent Leads */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Team Performance */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Team Performance</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/counselling/team')}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {counsellors.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No counsellors in your team yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {counsellors.slice(0, 5).map((counsellor, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                        {counsellor.name?.charAt(0) || 'C'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{counsellor.name}</p>
                        <p className="text-sm text-slate-500">{counsellor.assigned_leads || 0} leads</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">{counsellor.converted || 0}</p>
                        <p className="text-xs text-slate-500">converted</p>
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
                <CardTitle>Recent Leads</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/counselling/leads')}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {recentLeads.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No leads yet</p>
                </div>
              ) : (
                <Table>
                  <TableBody>
                    {recentLeads.slice(0, 5).map((lead) => (
                      <TableRow 
                        key={lead.id} 
                        className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        onClick={() => navigate(`/counselling/leads/${lead.id}`)}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium">{lead.name}</p>
                            <p className="text-sm text-slate-500">{lead.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{lead.source}</Badge>
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

        {/* Bulk Upload Dialog */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                Bulk Lead Upload
              </DialogTitle>
              <DialogDescription>
                Upload a CSV file to import multiple leads at once
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Download className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="font-medium">Download Template</p>
                    <p className="text-sm text-slate-500">Get the CSV format</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  Download
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Upload CSV File</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                  {uploadFile ? (
                    <p className="font-medium text-blue-600">{uploadFile.name}</p>
                  ) : (
                    <p className="text-slate-500">Click to select CSV file</p>
                  )}
                </div>
              </div>

              {uploadResult && (
                <div className={`p-4 rounded-lg ${uploadResult.error ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
                  {uploadResult.error ? (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-5 w-5" />
                      <span>{uploadResult.error}</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span>{uploadResult.success} leads imported</span>
                      </div>
                      {uploadResult.duplicates > 0 && (
                        <p className="text-sm text-slate-500 ml-7">{uploadResult.duplicates} duplicates skipped</p>
                      )}
                      {uploadResult.failed > 0 && (
                        <p className="text-sm text-red-500 ml-7">{uploadResult.failed} failed</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleBulkUpload} 
                disabled={!uploadFile || uploading}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="upload-leads-btn"
              >
                {uploading ? 'Uploading...' : 'Upload Leads'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Auto-Assignment Rules Dialog */}
        <Dialog open={rulesDialogOpen} onOpenChange={setRulesDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Lead Auto-Assignment Rules</DialogTitle>
              <DialogDescription>
                Configure how new leads are automatically assigned to counsellors
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Enable Auto-Assignment</h4>
                  <p className="text-sm text-slate-500">Automatically assign new leads to counsellors</p>
                </div>
                <Switch
                  checked={autoAssignEnabled}
                  onCheckedChange={setAutoAssignEnabled}
                  data-testid="auto-assign-toggle"
                />
              </div>

              {autoAssignEnabled && (
                <>
                  <div className="space-y-2">
                    <Label>Assignment Method</Label>
                    <Select 
                      value={assignmentRules.method} 
                      onValueChange={(v) => setAssignmentRules({ ...assignmentRules, method: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="round_robin">Round Robin (Equal distribution)</SelectItem>
                        <SelectItem value="load_balanced">Load Balanced (Fewest active leads)</SelectItem>
                        <SelectItem value="performance_based">Performance Based (Best converters first)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Max Leads per Counsellor</Label>
                    <Input
                      type="number"
                      min="1"
                      max="500"
                      value={assignmentRules.max_leads_per_counsellor}
                      onChange={(e) => setAssignmentRules({ 
                        ...assignmentRules, 
                        max_leads_per_counsellor: parseInt(e.target.value) || 50 
                      })}
                    />
                    <p className="text-sm text-slate-500">Counsellors won't receive new leads after this limit</p>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRulesDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveAssignmentRules} className="bg-blue-600 hover:bg-blue-700">
                Save Rules
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
