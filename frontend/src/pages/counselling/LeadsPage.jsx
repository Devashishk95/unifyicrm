import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { leadAPI, universityAPI } from '../../lib/api';
import { formatDateTime, LEAD_STAGES } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Checkbox } from '../../components/ui/checkbox';
import { Plus, Search, Eye, UserPlus, Users, RefreshCw, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { ExportButton } from '../../components/ui/export-csv';
import { useAuth } from '../../context/AuthContext';

export default function LeadsPage({ filterFollowUps = false }) {
  const navigate = useNavigate();
  const { isCounsellor } = useAuth();

  const [leads, setLeads] = useState([]);
  const [counsellors, setCounsellors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showBulkReassignModal, setShowBulkReassignModal] = useState(false);

  const [selectedLeads, setSelectedLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedCounsellor, setSelectedCounsellor] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    source: 'manual'
  });

  const title = useMemo(() => (filterFollowUps ? 'Follow-ups' : 'Leads'), [filterFollowUps]);
  const subtitle = useMemo(
    () => (filterFollowUps ? 'View follow-ups that are due' : 'Manage and track your leads'),
    [filterFollowUps]
  );

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, stageFilter, filterFollowUps]);

  const isDueFollowUp = (lead) => {
    // Backend lead has `next_follow_up` (ISO string) when follow-up is scheduled.
    if (!lead?.next_follow_up) return false;
    const dt = new Date(lead.next_follow_up);
    if (Number.isNaN(dt.getTime())) return false;
    return dt.getTime() <= Date.now();
  };

  const loadData = async () => {
    try {
      setLoading(true);

      // 1) Leads always load from /leads (backend already restricts counsellor to their assigned leads)
      const leadsRes = await leadAPI.list({
        page,
        limit: 20,
        search,
        stage: stageFilter || undefined
      });

      let rows = leadsRes.data.data || [];

      // 2) For Follow-ups page: show only leads whose follow-up is due (client-side filter)
      if (filterFollowUps) {
        rows = rows.filter(isDueFollowUp);
      }

      setLeads(rows);
      setTotalPages(leadsRes.data.pages || 1);

      // 3) IMPORTANT: counsellor should NOT call university staff list (often 403),
      // otherwise it breaks the entire page.
      if (!isCounsellor) {
        const staffRes = await universityAPI.listStaff('counsellor');
        setCounsellors(staffRes.data.data || []);
      } else {
        setCounsellors([]);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      toast.error(`Failed to load ${filterFollowUps ? 'follow-ups' : 'leads'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await leadAPI.create(formData);
      toast.success('Lead created successfully');
      setShowCreateModal(false);
      setFormData({ name: '', email: '', phone: '', source: 'manual' });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create lead');
    }
  };

  const handleAssign = async () => {
    if (!selectedCounsellor || !selectedLead) return;
    try {
      await leadAPI.assign(selectedLead.id, selectedCounsellor);
      toast.success('Lead assigned successfully');
      setShowAssignModal(false);
      setSelectedLead(null);
      setSelectedCounsellor('');
      loadData();
    } catch (err) {
      toast.error('Failed to assign lead');
    }
  };

  const handleBulkReassign = async () => {
    if (!selectedCounsellor || selectedLeads.length === 0) return;
    try {
      await leadAPI.bulkReassign({
        lead_ids: selectedLeads,
        to_counsellor_id: selectedCounsellor
      });
      toast.success(`${selectedLeads.length} leads reassigned successfully`);
      setShowBulkReassignModal(false);
      setSelectedLeads([]);
      setSelectedCounsellor('');
      loadData();
    } catch (err) {
      toast.error('Failed to reassign leads');
    }
  };

  const toggleLeadSelection = (leadId) => {
    setSelectedLeads((prev) =>
      prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedLeads.length === leads.length) setSelectedLeads([]);
    else setSelectedLeads(leads.map((l) => l.id));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{title}</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">{subtitle}</p>
          </div>

          {/* Counsellor should not create / reassign leads */}
          {!isCounsellor && (
            <div className="flex gap-2">
              {selectedLeads.length > 0 && (
                <Button variant="outline" onClick={() => setShowBulkReassignModal(true)} data-testid="bulk-reassign-btn">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reassign ({selectedLeads.length})
                </Button>
              )}
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="create-lead-btn"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Lead
              </Button>
            </div>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={search}
                  onChange={(e) => {
                    setPage(1);
                    setSearch(e.target.value);
                  }}
                  className="pl-10"
                  data-testid="search-leads"
                />
              </div>

              <Select
                value={stageFilter || 'all'}
                onValueChange={(v) => {
                  setPage(1);
                  setStageFilter(v === 'all' ? '' : v);
                }}
              >
                <SelectTrigger className="w-full sm:w-48" data-testid="stage-filter">
                  <SelectValue placeholder="All Stages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  {Object.entries(LEAD_STAGES).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <ExportButton
                data={leads}
                filename={filterFollowUps ? 'followups' : 'leads'}
                columns={[
                  { key: 'name', label: 'Name' },
                  { key: 'email', label: 'Email' },
                  { key: 'phone', label: 'Phone' },
                  { key: 'source', label: 'Source' },
                  { key: 'stage', label: 'Stage' },
                  { key: 'assigned_to_name', label: 'Assigned To' },
                  { key: 'created_at', label: 'Created At' },
                  { key: 'updated_at', label: 'Updated At' }
                ]}
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {!isCounsellor && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedLeads.length === leads.length && leads.length > 0}
                        onCheckedChange={toggleSelectAll}
                        data-testid="select-all-checkbox"
                      />
                    </TableHead>
                  )}
                  <TableHead>Lead</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={isCounsellor ? 6 : 7} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isCounsellor ? 6 : 7} className="text-center py-8 text-slate-500">
                      <Users className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                      {filterFollowUps ? 'No follow-ups due' : 'No leads found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead) => (
                    <TableRow key={lead.id} data-testid={`lead-row-${lead.id}`}>
                      {!isCounsellor && (
                        <TableCell>
                          <Checkbox checked={selectedLeads.includes(lead.id)} onCheckedChange={() => toggleLeadSelection(lead.id)} />
                        </TableCell>
                      )}

                      <TableCell>
                        <div className="font-medium text-slate-900 dark:text-white">{lead.name}</div>
                        <div className="text-sm text-slate-500 capitalize">{lead.source}</div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" /> {lead.email}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <Phone className="h-3 w-3" /> {lead.phone}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge className={LEAD_STAGES[lead.stage]?.color || 'bg-slate-100'}>
                          {LEAD_STAGES[lead.stage]?.label || lead.stage}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {lead.assigned_to_name || <span className="text-slate-400 text-sm">Unassigned</span>}
                      </TableCell>

                      <TableCell className="text-slate-500 text-sm">{formatDateTime(lead.created_at)}</TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/counselling/leads/${lead.id}`)} data-testid={`view-${lead.id}`}>
                            <Eye className="h-4 w-4" />
                          </Button>

                          {!isCounsellor && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedLead(lead);
                                setShowAssignModal(true);
                              }}
                              data-testid={`assign-${lead.id}`}
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Page {page} of {totalPages}
            </span>
            <Button variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        )}

        {/* Create Lead Modal (only for admin/manager) */}
        {!isCounsellor && (
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Lead</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="source">Source</Label>
                    <Select value={formData.source} onValueChange={(v) => setFormData({ ...formData, source: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="shiksha">Shiksha</SelectItem>
                        <SelectItem value="collegedunia">Collegedunia</SelectItem>
                        <SelectItem value="other_api">Other API</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Create Lead
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Assign Modal (only for admin/manager) */}
        {!isCounsellor && (
          <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Assign Lead</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-slate-600 mb-4">
                  Assign <strong>{selectedLead?.name}</strong> to a counsellor
                </p>
                <Select value={selectedCounsellor} onValueChange={setSelectedCounsellor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Counsellor" />
                  </SelectTrigger>
                  <SelectContent>
                    {counsellors.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAssignModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAssign} className="bg-blue-600 hover:bg-blue-700" disabled={!selectedCounsellor}>
                  Assign
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Bulk Reassign Modal (only for admin/manager) */}
        {!isCounsellor && (
          <Dialog open={showBulkReassignModal} onOpenChange={setShowBulkReassignModal}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Bulk Reassign Leads</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-slate-600 mb-4">
                  Reassign <strong>{selectedLeads.length}</strong> selected leads to:
                </p>
                <Select value={selectedCounsellor} onValueChange={setSelectedCounsellor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Counsellor" />
                  </SelectTrigger>
                  <SelectContent>
                    {counsellors.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowBulkReassignModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleBulkReassign} className="bg-blue-600 hover:bg-blue-700" disabled={!selectedCounsellor}>
                  Reassign All
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AdminLayout>
  );
}