import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { superAdminAPI } from '../../lib/api';
import { formatDate, formatDateTime, formatCurrency } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { ScrollArea } from '../../components/ui/scroll-area';
import { 
  Plus, Search, Edit, Building2, CheckCircle, XCircle, Eye, Key, 
  Mail, Phone, MapPin, Globe, Calendar, CreditCard, Users, FileText, Download
} from 'lucide-react';
import { toast } from 'sonner';
import { ExportButton } from '../../components/ui/export-csv';

export default function UniversitiesPage() {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [adminPersonId, setAdminPersonId] = useState('');
  
  // Create/Edit form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    subscription_plan: 'basic',
    about: ''
  });

  useEffect(() => {
    loadUniversities();
  }, [page, search]);

  const loadUniversities = async () => {
    try {
      setLoading(true);
      const response = await superAdminAPI.listUniversities({ page, limit: 20, search });
      setUniversities(response.data.data || []);
      setTotalPages(response.data.pages || 1);
    } catch (err) {
      console.error('Failed to load universities:', err);
      toast.error('Failed to load universities');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await superAdminAPI.createUniversity(formData);
      toast.success('University created successfully');
      setShowCreateModal(false);
      resetForm();
      loadUniversities();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create university');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!selectedUniversity) return;
    try {
      await superAdminAPI.updateUniversity(selectedUniversity.id, formData);
      toast.success('University updated successfully');
      setShowEditModal(false);
      setSelectedUniversity(null);
      resetForm();
      loadUniversities();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update university');
    }
  };

  const handleToggleStatus = async (university) => {
    try {
      await superAdminAPI.updateUniversity(university.id, { is_active: !university.is_active });
      toast.success(`University ${university.is_active ? 'deactivated' : 'activated'}`);
      loadUniversities();
    } catch (err) {
      toast.error('Failed to update university status');
    }
  };

  const handleCreateAdmin = async () => {
    if (!selectedUniversity || !adminPersonId || !newAdminPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    
    try {
      // Create university admin user via API
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/superadmin/universities/${selectedUniversity.id}/create-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('unify-token')}`
        },
        body: JSON.stringify({
          person_id: adminPersonId,
          password: newAdminPassword,
          name: `${selectedUniversity.name} Admin`,
          email: selectedUniversity.email
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create admin');
      }
      
      toast.success('University admin created/password updated successfully');
      setShowPasswordModal(false);
      setNewAdminPassword('');
      setAdminPersonId('');
      setSelectedUniversity(null);
    } catch (err) {
      toast.error(err.message || 'Failed to create admin');
    }
  };

  const openEditModal = (university) => {
    setSelectedUniversity(university);
    setFormData({
      name: university.name || '',
      code: university.code || '',
      email: university.email || '',
      phone: university.phone || '',
      address: university.address || '',
      website: university.website || '',
      subscription_plan: university.subscription_plan || 'basic',
      about: university.about || ''
    });
    setShowEditModal(true);
  };

  const openViewModal = (university) => {
    setSelectedUniversity(university);
    setShowViewModal(true);
  };

  const openPasswordModal = (university) => {
    setSelectedUniversity(university);
    setAdminPersonId('');
    setNewAdminPassword('');
    setShowPasswordModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      subscription_plan: 'basic',
      about: ''
    });
  };

  const UniversityForm = ({ onSubmit, isEdit = false }) => (
    <form onSubmit={onSubmit}>
      <div className="space-y-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">University Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              data-testid="uni-name-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">University Code *</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g., MIT, HARVARD"
              required
              disabled={isEdit}
              data-testid="uni-code-input"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              data-testid="uni-email-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              data-testid="uni-phone-input"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address *</Label>
          <Textarea
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
            data-testid="uni-address-input"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://..."
              data-testid="uni-website-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plan">Subscription Plan</Label>
            <Select value={formData.subscription_plan} onValueChange={(v) => setFormData({ ...formData, subscription_plan: v })}>
              <SelectTrigger data-testid="uni-plan-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="about">About University</Label>
          <Textarea
            id="about"
            value={formData.about}
            onChange={(e) => setFormData({ ...formData, about: e.target.value })}
            placeholder="Brief description of the university..."
            rows={3}
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => isEdit ? setShowEditModal(false) : setShowCreateModal(false)}>
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700" data-testid="submit-university-btn">
          {isEdit ? 'Update University' : 'Create University'}
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Universities</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Manage registered universities</p>
          </div>
          <Button
            onClick={() => { resetForm(); setShowCreateModal(true); }}
            className="bg-blue-600 hover:bg-blue-700"
            data-testid="create-university-btn"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add University
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search universities..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                  data-testid="search-universities"
                />
              </div>
              <ExportButton
                data={universities}
                filename="universities"
                columns={[
                  { key: 'name', label: 'Name' },
                  { key: 'code', label: 'Code' },
                  { key: 'email', label: 'Email' },
                  { key: 'phone', label: 'Phone' },
                  { key: 'address', label: 'Address' },
                  { key: 'subscription_plan', label: 'Plan' },
                  { key: 'is_active', label: 'Status' },
                  { key: 'created_at', label: 'Created At' }
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
                  <TableHead>University</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : universities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      No universities found
                    </TableCell>
                  </TableRow>
                ) : (
                  universities.map((uni) => (
                    <TableRow key={uni.id} data-testid={`university-row-${uni.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{uni.name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-sm">{uni.code}</code>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{uni.email}</p>
                          <p className="text-slate-500">{uni.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{uni.subscription_plan}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={uni.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }>
                          {uni.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500">{formatDate(uni.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openViewModal(uni)}
                            title="View Details"
                            data-testid={`view-${uni.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(uni)}
                            title="Edit University"
                            data-testid={`edit-${uni.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openPasswordModal(uni)}
                            title="Manage Admin"
                            data-testid={`password-${uni.id}`}
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(uni)}
                            title={uni.is_active ? 'Deactivate' : 'Activate'}
                            data-testid={`toggle-${uni.id}`}
                          >
                            {uni.is_active ? (
                              <XCircle className="h-4 w-4 text-red-500" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
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
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        )}

        {/* Create Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New University</DialogTitle>
              <DialogDescription>Create a new university account on the platform</DialogDescription>
            </DialogHeader>
            <UniversityForm onSubmit={handleCreate} />
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit University</DialogTitle>
              <DialogDescription>Update university information</DialogDescription>
            </DialogHeader>
            <UniversityForm onSubmit={handleEdit} isEdit />
          </DialogContent>
        </Dialog>

        {/* View Modal */}
        <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
          <DialogContent className="max-w-3xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                {selectedUniversity?.name}
              </DialogTitle>
              <DialogDescription>Complete university information</DialogDescription>
            </DialogHeader>
            
            {selectedUniversity && (
              <ScrollArea className="max-h-[60vh]">
                <Tabs defaultValue="info" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="info">Basic Info</TabsTrigger>
                    <TabsTrigger value="config">Configuration</TabsTrigger>
                    <TabsTrigger value="payment">Payment</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="info" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                          <Building2 className="h-4 w-4" />
                          <span className="text-sm">University Code</span>
                        </div>
                        <p className="font-mono font-medium">{selectedUniversity.code}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">Created</span>
                        </div>
                        <p className="font-medium">{formatDateTime(selectedUniversity.created_at)}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                          <Mail className="h-4 w-4" />
                          <span className="text-sm">Email</span>
                        </div>
                        <p className="font-medium">{selectedUniversity.email}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                          <Phone className="h-4 w-4" />
                          <span className="text-sm">Phone</span>
                        </div>
                        <p className="font-medium">{selectedUniversity.phone}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 col-span-2">
                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm">Address</span>
                        </div>
                        <p className="font-medium">{selectedUniversity.address}</p>
                      </div>
                      {selectedUniversity.website && (
                        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 col-span-2">
                          <div className="flex items-center gap-2 text-slate-500 mb-1">
                            <Globe className="h-4 w-4" />
                            <span className="text-sm">Website</span>
                          </div>
                          <a href={selectedUniversity.website} target="_blank" rel="noreferrer" className="font-medium text-blue-600 hover:underline">
                            {selectedUniversity.website}
                          </a>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 pt-4">
                      <Badge className={selectedUniversity.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                      }>
                        {selectedUniversity.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {selectedUniversity.subscription_plan} Plan
                      </Badge>
                    </div>
                    
                    {selectedUniversity.about && (
                      <div className="pt-4">
                        <h4 className="font-medium mb-2">About</h4>
                        <p className="text-slate-600 dark:text-slate-400">{selectedUniversity.about}</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="config" className="space-y-4">
                    <h4 className="font-medium">Registration Configuration</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { key: 'educational_details_enabled', label: 'Educational Details' },
                        { key: 'documents_enabled', label: 'Document Upload' },
                        { key: 'entrance_test_enabled', label: 'Entrance Test' },
                        { key: 'fee_enabled', label: 'Registration Fee' },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                          <span>{item.label}</span>
                          <Badge className={selectedUniversity.registration_config?.[item.key] 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-slate-100 text-slate-800'
                          }>
                            {selectedUniversity.registration_config?.[item.key] ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    
                    {selectedUniversity.registration_config?.fee_enabled && (
                      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        <p className="text-sm text-slate-600 dark:text-slate-400">Registration Fee Amount</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(selectedUniversity.registration_config?.fee_amount || 0)}
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="payment" className="space-y-4">
                    <h4 className="font-medium">Razorpay Configuration</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <p className="text-sm text-slate-500 mb-1">Linked Account ID</p>
                        <p className="font-mono">{selectedUniversity.razorpay_config?.linked_account_id || 'Not configured'}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <p className="text-sm text-slate-500 mb-1">Account Status</p>
                        <Badge className="capitalize">{selectedUniversity.razorpay_config?.account_status || 'pending'}</Badge>
                      </div>
                      <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <p className="text-sm text-slate-500 mb-1">KYC Status</p>
                        <Badge className={
                          selectedUniversity.razorpay_config?.kyc_status === 'verified' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-amber-100 text-amber-800'
                        }>
                          {selectedUniversity.razorpay_config?.kyc_status || 'pending'}
                        </Badge>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </ScrollArea>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowViewModal(false)}>Close</Button>
              <Button onClick={() => { setShowViewModal(false); openEditModal(selectedUniversity); }} className="bg-blue-600 hover:bg-blue-700">
                <Edit className="h-4 w-4 mr-2" />
                Edit University
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Password/Admin Modal */}
        <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Manage University Admin</DialogTitle>
              <DialogDescription>
                Create or update the university admin account for {selectedUniversity?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-400">
                  This will create a new admin user or update the password if the Person ID already exists.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminPersonId">Person ID *</Label>
                <Input
                  id="adminPersonId"
                  value={adminPersonId}
                  onChange={(e) => setAdminPersonId(e.target.value)}
                  placeholder="e.g., ADMIN001"
                  data-testid="admin-person-id"
                />
                <p className="text-xs text-slate-500">The admin will use this ID along with university code to login</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Password *</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="Enter new password"
                  data-testid="admin-password"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPasswordModal(false)}>Cancel</Button>
              <Button 
                onClick={handleCreateAdmin}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="confirm-admin-btn"
              >
                <Key className="h-4 w-4 mr-2" />
                Create/Update Admin
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
