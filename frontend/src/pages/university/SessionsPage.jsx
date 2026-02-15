import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { universityAPI } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { 
  Plus, Calendar, Edit, RefreshCw, CalendarDays, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '../../lib/utils';

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    registration_start: '',
    registration_end: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const res = await universityAPI.listSessions();
      setSessions(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingSession(null);
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      name: `Session ${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      start_date: today,
      end_date: '',
      registration_start: today,
      registration_end: ''
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.start_date || !formData.end_date) {
      toast.error('Name, Start Date, and End Date are required');
      return;
    }

    setSaving(true);
    try {
      await universityAPI.createSession(formData);
      toast.success('Session created successfully');
      setDialogOpen(false);
      loadSessions();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save session');
    } finally {
      setSaving(false);
    }
  };

  const getSessionStatus = (session) => {
    const now = new Date();
    const start = new Date(session.start_date);
    const end = new Date(session.end_date);
    
    if (now < start) return { label: 'Upcoming', className: 'bg-blue-100 text-blue-800' };
    if (now > end) return { label: 'Completed', className: 'bg-slate-100 text-slate-800' };
    return { label: 'Active', className: 'bg-green-100 text-green-800' };
  };

  const getRegistrationStatus = (session) => {
    if (!session.registration_start || !session.registration_end) return null;
    
    const now = new Date();
    const start = new Date(session.registration_start);
    const end = new Date(session.registration_end);
    
    if (now < start) return { label: 'Not Started', className: 'bg-yellow-100 text-yellow-800' };
    if (now > end) return { label: 'Closed', className: 'bg-red-100 text-red-800' };
    return { label: 'Open', className: 'bg-green-100 text-green-800' };
  };

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="sessions-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Academic Sessions</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Manage academic years and registration periods</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadSessions} data-testid="refresh-sessions">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700" data-testid="add-session-btn">
              <Plus className="h-4 w-4 mr-2" />
              Add Session
            </Button>
          </div>
        </div>

        {/* Sessions Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : sessions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Sessions Created</h3>
              <p className="text-slate-500 mb-4">Create your first academic session to start accepting admissions</p>
              <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Session
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map(session => {
              const status = getSessionStatus(session);
              const regStatus = getRegistrationStatus(session);
              
              return (
                <Card key={session.id} data-testid={`session-card-${session.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{session.name}</CardTitle>
                        <Badge className={`mt-2 ${status.className}`}>{status.label}</Badge>
                      </div>
                      <CalendarDays className="h-5 w-5 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Session Period</span>
                        <span className="font-medium">
                          {formatDate(session.start_date)} - {formatDate(session.end_date)}
                        </span>
                      </div>
                      {session.registration_start && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Registration</span>
                          <div className="text-right">
                            <span className="font-medium">
                              {formatDate(session.registration_start)} - {formatDate(session.registration_end)}
                            </span>
                            {regStatus && (
                              <Badge className={`ml-2 ${regStatus.className}`}>{regStatus.label}</Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Session</DialogTitle>
              <DialogDescription>
                Add a new academic session for your university
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Session Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Session 2025-2026"
                  data-testid="session-name-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start">Session Start *</Label>
                  <Input
                    id="start"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    data-testid="session-start-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end">Session End *</Label>
                  <Input
                    id="end"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    data-testid="session-end-input"
                  />
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-slate-500 mb-4">Registration Window (Optional)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-start">Registration Opens</Label>
                    <Input
                      id="reg-start"
                      type="date"
                      value={formData.registration_start}
                      onChange={(e) => setFormData({ ...formData, registration_start: e.target.value })}
                      data-testid="reg-start-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-end">Registration Closes</Label>
                    <Input
                      id="reg-end"
                      type="date"
                      value={formData.registration_end}
                      onChange={(e) => setFormData({ ...formData, registration_end: e.target.value })}
                      data-testid="reg-end-input"
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700" data-testid="save-session-btn">
                {saving ? 'Creating...' : 'Create Session'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
