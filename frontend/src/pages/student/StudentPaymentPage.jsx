import { useState, useEffect } from 'react';
import { StudentLayout } from '../../components/layouts/StudentLayout';
import { paymentAPI, applicationAPI } from '../../lib/api';
import { formatDateTime, formatCurrency } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { 
  CreditCard, CheckCircle, XCircle, Clock, AlertCircle, 
  Receipt, IndianRupee, RefreshCw, Download
} from 'lucide-react';
import { toast } from 'sonner';

const PAYMENT_STATUS = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  success: { label: 'Successful', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  refunded: { label: 'Refunded', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: Receipt },
};

const FEE_TYPES = [
  { value: 'registration', label: 'Registration Fee', amount: 500 },
  { value: 'admission', label: 'Admission Fee', amount: 5000 },
  { value: 'tuition', label: 'Tuition Fee', amount: 50000 },
  { value: 'hostel', label: 'Hostel Fee', amount: 25000 },
  { value: 'exam', label: 'Examination Fee', amount: 1000 },
];

export default function StudentPaymentPage() {
  const [payments, setPayments] = useState([]);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [selectedFeeType, setSelectedFeeType] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    name: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [appsRes, paymentsRes] = await Promise.all([
        applicationAPI.getMyApplications(),
        paymentAPI.getMyPayments()
      ]);
      
      const apps = appsRes.data.data || [];
      if (apps.length > 0) {
        setApplication(apps[0]);
      }
      setPayments(paymentsRes.data.data || []);
    } catch (err) {
      console.error('Failed to load data:', err);
      toast.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!selectedFeeType || !application) return;

    try {
      setProcessing(true);
      
      // Create payment order
      const orderRes = await paymentAPI.createOrder({
        application_id: application.id,
        amount: selectedFeeType.amount,
        fee_type: selectedFeeType.value,
        currency: 'INR'
      });

      // Simulate payment processing (In real scenario, this would open Razorpay checkout)
      toast.info('Processing payment...', { duration: 2000 });
      
      // Simulate successful payment after 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify payment (mock)
      await paymentAPI.verify({
        payment_id: orderRes.data.id,
        razorpay_payment_id: `pay_${Date.now()}`,
        razorpay_signature: 'mock_signature'
      });

      toast.success('Payment successful!');
      setShowPayDialog(false);
      setSelectedFeeType(null);
      setPaymentDetails({ cardNumber: '', expiry: '', cvv: '', name: '' });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const totalPaid = payments
    .filter(p => p.status === 'success')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const paidFeeTypes = payments
    .filter(p => p.status === 'success')
    .map(p => p.fee_type);

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="space-y-6" data-testid="student-payment-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Fee Payment</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Pay your fees and view payment history
            </p>
          </div>
          <Button variant="outline" onClick={loadData} data-testid="refresh-payments">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {!application && (
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <p className="text-amber-800 dark:text-amber-200">
                Please complete your application to make payments.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Summary Card */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <IndianRupee className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Paid</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    ₹{totalPaid.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Receipt className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Transactions</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {payments.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Pending</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {payments.filter(p => p.status === 'pending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pay Fees Section */}
        <Card>
          <CardHeader>
            <CardTitle>Pay Fees</CardTitle>
            <CardDescription>Select a fee type to make payment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEE_TYPES.map(fee => {
                const isPaid = paidFeeTypes.includes(fee.value);
                return (
                  <Card 
                    key={fee.value}
                    className={`cursor-pointer transition-all ${
                      isPaid 
                        ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10' 
                        : 'hover:border-blue-500/50'
                    }`}
                    onClick={() => {
                      if (!isPaid && application) {
                        setSelectedFeeType(fee);
                        setShowPayDialog(true);
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-slate-900 dark:text-white">
                          {fee.label}
                        </h4>
                        {isPaid && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        ₹{fee.amount.toLocaleString()}
                      </p>
                      {isPaid ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Paid
                        </Badge>
                      ) : (
                        <Button 
                          size="sm" 
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          disabled={!application}
                          data-testid={`pay-${fee.value}-btn`}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pay Now
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>Your recent transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                <p className="text-slate-500 dark:text-slate-400">No payment history yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map(payment => {
                  const status = PAYMENT_STATUS[payment.status] || PAYMENT_STATUS.pending;
                  const StatusIcon = status.icon;
                  const feeLabel = FEE_TYPES.find(f => f.value === payment.fee_type)?.label || payment.fee_type;
                  
                  return (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 border dark:border-slate-800 rounded-lg"
                      data-testid={`payment-${payment.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                          payment.status === 'success' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-slate-100 dark:bg-slate-800'
                        }`}>
                          <StatusIcon className={`h-5 w-5 ${
                            payment.status === 'success' ? 'text-green-600' : 'text-slate-500'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{feeLabel}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {formatDateTime(payment.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900 dark:text-white">
                          ₹{(payment.amount || 0).toLocaleString()}
                        </p>
                        <Badge className={status.color}>
                          {status.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Dialog */}
        <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Make Payment</DialogTitle>
              <DialogDescription>
                Pay {selectedFeeType?.label} - ₹{selectedFeeType?.amount?.toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePayment}>
              <div className="space-y-4 py-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Amount</span>
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                      ₹{selectedFeeType?.amount?.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Card Number</Label>
                  <Input
                    placeholder="4111 1111 1111 1111"
                    value={paymentDetails.cardNumber}
                    onChange={(e) => setPaymentDetails(prev => ({ ...prev, cardNumber: e.target.value }))}
                    data-testid="card-number-input"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Expiry</Label>
                    <Input
                      placeholder="MM/YY"
                      value={paymentDetails.expiry}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, expiry: e.target.value }))}
                      data-testid="expiry-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CVV</Label>
                    <Input
                      placeholder="123"
                      type="password"
                      value={paymentDetails.cvv}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, cvv: e.target.value }))}
                      data-testid="cvv-input"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Name on Card</Label>
                  <Input
                    placeholder="John Doe"
                    value={paymentDetails.name}
                    onChange={(e) => setPaymentDetails(prev => ({ ...prev, name: e.target.value }))}
                    data-testid="card-name-input"
                  />
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                  This is a demo payment form. In production, Razorpay checkout will be used.
                </p>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowPayDialog(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={processing}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="confirm-payment-btn"
                >
                  {processing ? 'Processing...' : `Pay ₹${selectedFeeType?.amount?.toLocaleString()}`}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </StudentLayout>
  );
}
