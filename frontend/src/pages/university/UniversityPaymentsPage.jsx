import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { paymentAPI } from '../../lib/api';
import { formatDate, formatCurrency } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { 
  CreditCard, DollarSign, TrendingUp, Search, RefreshCw, 
  CheckCircle, XCircle, Clock, Download, Users
} from 'lucide-react';
import { toast } from 'sonner';

// Mock data for university payments
const mockPayments = [
  { id: 'pay_001', student_name: 'Rahul Sharma', student_email: 'rahul@email.com', amount: 5000, status: 'success', fee_type: 'registration', created_at: '2025-01-15T10:30:00Z' },
  { id: 'pay_002', student_name: 'Priya Patel', student_email: 'priya@email.com', amount: 5000, status: 'success', fee_type: 'registration', created_at: '2025-01-14T09:15:00Z' },
  { id: 'pay_003', student_name: 'Amit Kumar', student_email: 'amit@email.com', amount: 5000, status: 'pending', fee_type: 'registration', created_at: '2025-01-14T08:45:00Z' },
  { id: 'pay_004', student_name: 'Sneha Reddy', student_email: 'sneha@email.com', amount: 5000, status: 'success', fee_type: 'registration', created_at: '2025-01-13T16:20:00Z' },
  { id: 'pay_005', student_name: 'Karthik Nair', student_email: 'karthik@email.com', amount: 5000, status: 'failed', fee_type: 'registration', created_at: '2025-01-13T14:10:00Z' },
];

const mockStats = {
  totalCollected: 75000,
  totalStudents: 15,
  pendingAmount: 10000,
  pendingCount: 2,
  thisMonth: 45000,
  thisMonthCount: 9,
};

export default function UniversityPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState(mockStats);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await paymentAPI.list({});
      if (res.data?.data?.length > 0) {
        setPayments(res.data.data);
      } else {
        setPayments(mockPayments);
      }
    } catch (err) {
      setPayments(mockPayments);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.student_name?.toLowerCase().includes(search.toLowerCase()) ||
      payment.student_email?.toLowerCase().includes(search.toLowerCase()) ||
      payment.id?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const styles = {
      success: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
    };
    const icons = {
      success: <CheckCircle className="h-3 w-3" />,
      pending: <Clock className="h-3 w-3" />,
      failed: <XCircle className="h-3 w-3" />,
    };
    return (
      <Badge className={`${styles[status] || styles.pending} flex items-center gap-1`}>
        {icons[status]}
        <span className="capitalize">{status}</span>
      </Badge>
    );
  };

  const handleExport = () => {
    toast.success('Exporting payment data...');
  };

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="university-payments-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Payments</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Track student registration fee payments</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadPayments} data-testid="refresh-payments">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleExport} className="bg-blue-600 hover:bg-blue-700" data-testid="export-payments">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total Collected</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats.totalCollected)}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {stats.totalStudents} students paid
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">This Month</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats.thisMonth)}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">{stats.thisMonthCount} transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Pending</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats.pendingAmount)}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">{stats.pendingCount} awaiting payment</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Paid Students</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalStudents}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">Registration fees received</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by student name, email or payment ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                  data-testid="search-payments"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]" data-testid="status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>All registration fee transactions</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment ID</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
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
                ) : filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id} data-testid={`payment-row-${payment.id}`}>
                      <TableCell>
                        <code className="text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                          {payment.id}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{payment.student_name}</p>
                          <p className="text-sm text-slate-500">{payment.student_email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{payment.fee_type}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell className="text-slate-500">{formatDate(payment.created_at)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
