import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { superAdminAPI } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { 
  CreditCard, Building2, TrendingUp, TrendingDown, RefreshCw, 
  CheckCircle, XCircle, Clock, Search, Download, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ExportButton } from '../../components/ui/export-csv';

const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#6366F1', '#EC4899'];

export default function PaymentsPage() {
  const [overview, setOverview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const response = await superAdminAPI.paymentsOverview();
      setOverview(response.data.data || []);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totals = overview.reduce((acc, uni) => ({
    total_collected: acc.total_collected + (uni.total_collected || 0),
    total_refunded: acc.total_refunded + (uni.total_refunded || 0),
    successful_payments: acc.successful_payments + (uni.successful_payments || 0),
    failed_payments: acc.failed_payments + (uni.failed_payments || 0),
    pending_transfers: acc.pending_transfers + (uni.pending_transfers || 0),
    successful_transfers: acc.successful_transfers + (uni.successful_transfers || 0),
  }), {
    total_collected: 0,
    total_refunded: 0,
    successful_payments: 0,
    failed_payments: 0,
    pending_transfers: 0,
    successful_transfers: 0,
  });

  const chartData = overview
    .filter(uni => uni.university_name)
    .map(uni => ({
      name: uni.university_name?.substring(0, 15) || 'Unknown',
      collected: uni.total_collected || 0,
      refunded: uni.total_refunded || 0,
    }));

  const statusData = [
    { name: 'Successful', value: totals.successful_payments, color: '#10B981' },
    { name: 'Failed', value: totals.failed_payments, color: '#EF4444' },
  ].filter(d => d.value > 0);

  const filteredOverview = overview.filter(uni => 
    !search || uni.university_name?.toLowerCase().includes(search.toLowerCase())
  );

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
      <div className="space-y-6" data-testid="payments-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Payments Overview</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Platform-wide payment analytics</p>
          </div>
          <Button variant="outline" onClick={loadPayments}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card data-testid="total-collected-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Collected</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">
                    {formatCurrency(totals.total_collected)}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">{totals.successful_payments} payments</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <ArrowUpRight className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="total-refunded-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Refunded</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">
                    {formatCurrency(totals.total_refunded)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <ArrowDownRight className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="pending-transfers-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Pending Transfers</p>
                  <p className="text-3xl font-bold text-amber-600 mt-1">
                    {formatCurrency(totals.pending_transfers)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="successful-transfers-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Transferred to Unis</p>
                  <p className="text-3xl font-bold text-blue-600 mt-1">
                    {formatCurrency(totals.successful_transfers)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Collection by University</CardTitle>
              <CardDescription>Fee collection vs refunds per university</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(v) => `₹${v/1000}k`} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="collected" name="Collected" fill="#10B981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="refunded" name="Refunded" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500">
                    No payment data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Status</CardTitle>
              <CardDescription>Distribution of payment outcomes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500">
                    No payment data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* University-wise Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>University-wise Breakdown</CardTitle>
                <CardDescription>Detailed payment stats per university</CardDescription>
              </div>
              <div className="flex gap-2 items-center">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search university..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <ExportButton
                  data={overview}
                  filename="payments_overview"
                  columns={[
                    { key: 'university_name', label: 'University' },
                    { key: 'total_collected', label: 'Collected' },
                    { key: 'successful_payments', label: 'Successful' },
                    { key: 'failed_payments', label: 'Failed' },
                    { key: 'total_refunded', label: 'Refunded' },
                    { key: 'successful_transfers', label: 'Transferred' },
                    { key: 'kyc_status', label: 'KYC Status' }
                  ]}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>University</TableHead>
                  <TableHead className="text-right">Collected</TableHead>
                  <TableHead className="text-right">Successful</TableHead>
                  <TableHead className="text-right">Failed</TableHead>
                  <TableHead className="text-right">Refunded</TableHead>
                  <TableHead className="text-right">Transferred</TableHead>
                  <TableHead>KYC Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOverview.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      No payment data found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOverview.map((uni, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="font-medium">{uni.university_name || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(uni.total_collected || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-green-100 text-green-800">
                          {uni.successful_payments || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-red-100 text-red-800">
                          {uni.failed_payments || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {formatCurrency(uni.total_refunded || 0)}
                      </TableCell>
                      <TableCell className="text-right text-blue-600">
                        {formatCurrency(uni.successful_transfers || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          uni.kyc_status === 'verified' 
                            ? 'bg-green-100 text-green-800' 
                            : uni.kyc_status === 'submitted'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-800'
                        }>
                          {uni.kyc_status || 'pending'}
                        </Badge>
                      </TableCell>
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
