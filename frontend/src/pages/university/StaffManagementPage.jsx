import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { universityAPI } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Plus, UserCog, Users, Key, Mail, Phone, Download } from 'lucide-react';
import { toast } from 'sonner';
import { ExportButton } from '../../components/ui/export-csv';

export default function StaffManagementPage() {
  const [managers, setManagers] = useState([]);
  const [counsellors, setCounsellors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    person_id: '',
    password: '',
    role: 'counsellor'
  });

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const [managersRes, counsellorsRes] = await Promise.all([
        universityAPI.listStaff('counselling_manager'),
        universityAPI.listStaff('counsellor')
      ]);
      setManagers(managersRes.data.data || []);
      setCounsellors(counsellorsRes.data.data || []);
    } catch (err) {
      console.error('Failed to load staff:', err);
      toast.error('Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await universityAPI.createStaff(formData);
      toast.success('Staff member created successfully');
      setShowCreateModal(false);
      setFormData({ name: '', email: '', phone: '', person_id: '', password: '', role: 'counsellor' });
      loadStaff();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create staff member');
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !selectedUser) return;
    try {
      await universityAPI.resetPassword(selectedUser.id, newPassword);
      toast.success('Password reset successfully');
      setShowResetPasswordModal(false);
      setSelectedUser(null);
      setNewPassword('');
    } catch (err) {
      toast.error('Failed to reset password');
    }
  };

  const StaffTable = ({ staff, role }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Staff Member</TableHead>
          <TableHead>Person ID</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            </TableCell>
          </TableRow>
        ) : staff.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8 text-slate-500">
              <Users className="h-8 w-8 mx-auto mb-2 text-slate-400" />
              No {role === 'counselling_manager' ? 'managers' : 'counsellors'} found
            </TableCell>
          </TableRow>
        ) : (
          staff.map((member) => (
            <TableRow key={member.id} data-testid={`staff-row-${member.id}`}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      {member.name?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{member.name}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-sm">{member.person_id}</code>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {member.email}
                  </div>
                  <div className="flex items-center gap-1 text-slate-500">
                    <Phone className="h-3 w-3" /> {member.phone || 'N/A'}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={member.is_active 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }>
                  {member.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell className="text-slate-500">{formatDate(member.created_at)}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedUser(member);
                    setShowResetPasswordModal(true);
                  }}
                  data-testid={`reset-password-${member.id}`}
                >
                  <Key className="h-4 w-4 mr-1" />
                  Reset Password
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="staff-management-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Staff Management</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Manage counselling managers and counsellors</p>
          </div>
          <div className="flex gap-2">
            <ExportButton
              data={[...managers, ...counsellors]}
              filename="staff"
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'person_id', label: 'Person ID' },
                { key: 'email', label: 'Email' },
                { key: 'phone', label: 'Phone' },
                { key: 'role', label: 'Role' },
                { key: 'is_active', label: 'Status' },
                { key: 'created_at', label: 'Created At' }
              ]}
            />
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="add-staff-btn"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Staff Member
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <UserCog className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Counselling Managers</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{managers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Counsellors</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{counsellors.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Staff Tables */}
        <Card>
          <Tabs defaultValue="counsellors" className="w-full">
            <CardHeader>
              <TabsList>
                <TabsTrigger value="counsellors" data-testid="counsellors-tab">
                  Counsellors ({counsellors.length})
                </TabsTrigger>
                <TabsTrigger value="managers" data-testid="managers-tab">
                  Managers ({managers.length})
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="p-0">
              <TabsContent value="counsellors" className="m-0">
                <StaffTable staff={counsellors} role="counsellor" />
              </TabsContent>
              <TabsContent value="managers" className="m-0">
                <StaffTable staff={managers} role="counselling_manager" />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        {/* Create Staff Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                    <SelectTrigger data-testid="staff-role-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="counsellor">Counsellor</SelectItem>
                      <SelectItem value="counselling_manager">Counselling Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    data-testid="staff-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    data-testid="staff-email-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    data-testid="staff-phone-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="person_id">Person ID</Label>
                  <Input
                    id="person_id"
                    value={formData.person_id}
                    onChange={(e) => setFormData({ ...formData, person_id: e.target.value })}
                    placeholder="Unique ID for login"
                    required
                    data-testid="staff-person-id-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Initial Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    data-testid="staff-password-input"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" data-testid="submit-staff-btn">
                  Create Staff
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Reset Password Modal */}
        <Dialog open={showResetPasswordModal} onOpenChange={setShowResetPasswordModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-slate-600 mb-4">
                Reset password for <strong>{selectedUser?.name}</strong>
              </p>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  data-testid="new-password-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowResetPasswordModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleResetPassword}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!newPassword}
                data-testid="confirm-reset-password-btn"
              >
                Reset Password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
