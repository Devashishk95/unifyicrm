import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { universityAPI } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
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
  Plus, Building2, Edit, Trash2, Users, BookOpen, Search, RefreshCw, Download
} from 'lucide-react';
import { toast } from 'sonner';
import { ExportButton } from '../../components/ui/export-csv';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    head_name: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const res = await universityAPI.listDepartments();
      setDepartments(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingDept(null);
    setFormData({ name: '', code: '', description: '', head_name: '' });
    setDialogOpen(true);
  };

  const openEditDialog = (dept) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name || '',
      code: dept.code || '',
      description: dept.description || '',
      head_name: dept.head_name || ''
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code) {
      toast.error('Name and Code are required');
      return;
    }

    setSaving(true);
    try {
      if (editingDept) {
        await universityAPI.updateDepartment(editingDept.id, formData);
        toast.success('Department updated successfully');
      } else {
        await universityAPI.createDepartment(formData);
        toast.success('Department created successfully');
      }
      setDialogOpen(false);
      loadDepartments();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save department');
    } finally {
      setSaving(false);
    }
  };

  const filteredDepts = departments.filter(dept =>
    dept.name?.toLowerCase().includes(search.toLowerCase()) ||
    dept.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="departments-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Departments</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your university departments</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadDepartments} data-testid="refresh-depts">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700" data-testid="add-dept-btn">
              <Plus className="h-4 w-4 mr-2" />
              Add Department
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search departments..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                  data-testid="search-depts"
                />
              </div>
              <ExportButton
                data={departments}
                filename="departments"
                columns={[
                  { key: 'name', label: 'Name' },
                  { key: 'code', label: 'Code' },
                  { key: 'head_name', label: 'Head' },
                  { key: 'description', label: 'Description' },
                  { key: 'is_active', label: 'Status' },
                  { key: 'created_at', label: 'Created At' }
                ]}
              />
            </div>
          </CardContent>
        </Card>

        {/* Departments Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              All Departments ({filteredDepts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Head</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredDepts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                      No departments found. Create your first department to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDepts.map((dept) => (
                    <TableRow key={dept.id} data-testid={`dept-row-${dept.id}`}>
                      <TableCell className="font-medium">{dept.name}</TableCell>
                      <TableCell>
                        <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-sm">
                          {dept.code}
                        </code>
                      </TableCell>
                      <TableCell>{dept.head_name || '-'}</TableCell>
                      <TableCell>
                        <Badge className={dept.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {dept.is_active !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(dept)}
                          data-testid={`edit-dept-${dept.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingDept ? 'Edit Department' : 'Create Department'}</DialogTitle>
              <DialogDescription>
                {editingDept ? 'Update department details' : 'Add a new department to your university'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Department Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Computer Science"
                  data-testid="dept-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Department Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., CS"
                  data-testid="dept-code-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="head">Head of Department</Label>
                <Input
                  id="head"
                  value={formData.head_name}
                  onChange={(e) => setFormData({ ...formData, head_name: e.target.value })}
                  placeholder="e.g., Dr. John Smith"
                  data-testid="dept-head-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the department"
                  data-testid="dept-desc-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700" data-testid="save-dept-btn">
                {saving ? 'Saving...' : editingDept ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
