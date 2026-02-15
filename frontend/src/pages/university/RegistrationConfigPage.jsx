import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { universityAPI } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Switch } from '../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Settings, FileText, Upload, ClipboardCheck, CreditCard, CheckCircle, Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

const defaultDocuments = [
  { name: '10th Marksheet', is_mandatory: true, allowed_types: ['pdf', 'jpg', 'jpeg', 'png'], max_size_mb: 5 },
  { name: '12th Marksheet', is_mandatory: true, allowed_types: ['pdf', 'jpg', 'jpeg', 'png'], max_size_mb: 5 },
  { name: 'ID Proof', is_mandatory: true, allowed_types: ['pdf', 'jpg', 'jpeg', 'png'], max_size_mb: 5 },
  { name: 'Photograph', is_mandatory: true, allowed_types: ['jpg', 'jpeg', 'png'], max_size_mb: 2 },
];

export default function RegistrationConfigPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [educationalEnabled, setEducationalEnabled] = useState(true);
  const [documentsEnabled, setDocumentsEnabled] = useState(true);
  const [testEnabled, setTestEnabled] = useState(false);
  const [feeEnabled, setFeeEnabled] = useState(false);
  const [feeAmount, setFeeAmount] = useState(0);
  const [paymentStage, setPaymentStage] = useState('after_application');
  const [refundAllowed, setRefundAllowed] = useState(false);
  const [testEligibility, setTestEligibility] = useState('after_registration');
  const [requiredDocuments, setRequiredDocuments] = useState(defaultDocuments);
  const [newDocName, setNewDocName] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await universityAPI.getConfig();
      const regConfig = response.data.registration_config || {};
      
      setEducationalEnabled(regConfig.educational_details_enabled ?? true);
      setDocumentsEnabled(regConfig.documents_enabled ?? true);
      setTestEnabled(regConfig.entrance_test_enabled ?? false);
      setFeeEnabled(regConfig.fee_enabled ?? false);
      setFeeAmount(regConfig.fee_amount || 0);
      setPaymentStage(regConfig.payment_stage || 'after_application');
      setRefundAllowed(regConfig.refund_allowed ?? false);
      setTestEligibility(regConfig.test_eligibility || 'after_registration');
      
      if (regConfig.required_documents && regConfig.required_documents.length > 0) {
        setRequiredDocuments(regConfig.required_documents);
      }
      
      setConfig(response.data);
    } catch (err) {
      console.error('Failed to load config:', err);
      toast.error('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await universityAPI.updateRegistrationConfig({
        educational_details_enabled: educationalEnabled,
        documents_enabled: documentsEnabled,
        entrance_test_enabled: testEnabled,
        test_eligibility: testEligibility,
        fee_enabled: feeEnabled,
        fee_amount: parseFloat(feeAmount) || 0,
        payment_stage: paymentStage,
        refund_allowed: refundAllowed,
        required_documents: requiredDocuments
      });
      toast.success('Configuration saved successfully');
    } catch (err) {
      console.error('Failed to save config:', err);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const addDocument = () => {
    if (!newDocName.trim()) return;
    setRequiredDocuments([
      ...requiredDocuments,
      { name: newDocName.trim(), is_mandatory: false, allowed_types: ['pdf', 'jpg', 'jpeg', 'png'], max_size_mb: 5 }
    ]);
    setNewDocName('');
  };

  const removeDocument = (index) => {
    setRequiredDocuments(requiredDocuments.filter((_, i) => i !== index));
  };

  const toggleDocMandatory = (index) => {
    const updated = [...requiredDocuments];
    updated[index].is_mandatory = !updated[index].is_mandatory;
    setRequiredDocuments(updated);
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

  const steps = [
    { 
      step: 'basic_info', 
      name: 'Basic Information', 
      icon: FileText, 
      enabled: true, 
      locked: true,
      description: 'Name, Email, Phone (Always Required)'
    },
    { 
      step: 'educational_details', 
      name: 'Educational Details', 
      icon: FileText, 
      enabled: educationalEnabled, 
      onToggle: setEducationalEnabled,
      description: 'Qualification, Board, Marks, Course Selection'
    },
    { 
      step: 'documents', 
      name: 'Document Upload', 
      icon: Upload, 
      enabled: documentsEnabled, 
      onToggle: setDocumentsEnabled,
      description: 'Upload required documents'
    },
    { 
      step: 'entrance_test', 
      name: 'Entrance Test', 
      icon: ClipboardCheck, 
      enabled: testEnabled, 
      onToggle: setTestEnabled,
      description: 'Online MCQ-based entrance examination'
    },
    { 
      step: 'payment', 
      name: 'Registration Fee', 
      icon: CreditCard, 
      enabled: feeEnabled, 
      onToggle: setFeeEnabled,
      description: 'Collect registration fee from students'
    },
    { 
      step: 'final_submission', 
      name: 'Final Submission', 
      icon: CheckCircle, 
      enabled: true, 
      locked: true,
      description: 'Review and submit application'
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="registration-config-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Registration Configuration</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Configure your student registration workflow</p>
          </div>
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={saving}
            data-testid="save-config-btn"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>

        {/* Workflow Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Registration Steps
            </CardTitle>
            <CardDescription>Enable or disable steps in the student registration workflow</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div 
                  key={step.step}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    step.enabled 
                      ? 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20' 
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                  data-testid={`step-config-${step.step}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      step.enabled 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}>
                      <step.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900 dark:text-white">{step.name}</p>
                        <Badge variant="outline" className="text-xs">Step {index + 1}</Badge>
                        {step.locked && (
                          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{step.description}</p>
                    </div>
                  </div>
                  {!step.locked && step.onToggle && (
                    <Switch
                      checked={step.enabled}
                      onCheckedChange={step.onToggle}
                      data-testid={`toggle-${step.step}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Entrance Test Configuration */}
        {testEnabled && (
          <Card data-testid="test-config-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                Entrance Test Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Test Eligibility</Label>
                  <Select value={testEligibility} onValueChange={setTestEligibility}>
                    <SelectTrigger data-testid="test-eligibility-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="after_registration">After Basic Registration</SelectItem>
                      <SelectItem value="after_documents">After Document Upload</SelectItem>
                      <SelectItem value="after_payment">After Fee Payment</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-slate-500">When can students take the entrance test?</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fee Configuration */}
        {feeEnabled && (
          <Card data-testid="fee-config-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Registration Fee Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="feeAmount">Fee Amount (INR)</Label>
                  <Input
                    id="feeAmount"
                    type="number"
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(e.target.value)}
                    placeholder="Enter amount"
                    data-testid="fee-amount-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Stage</Label>
                  <Select value={paymentStage} onValueChange={setPaymentStage}>
                    <SelectTrigger data-testid="payment-stage-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="after_application">After Application</SelectItem>
                      <SelectItem value="after_documents">After Documents</SelectItem>
                      <SelectItem value="after_test">After Entrance Test</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Allow Refunds</p>
                    <p className="text-sm text-slate-500">Enable refund requests for registration fee</p>
                  </div>
                  <Switch
                    checked={refundAllowed}
                    onCheckedChange={setRefundAllowed}
                    data-testid="refund-toggle"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Document Configuration */}
        {documentsEnabled && (
          <Card data-testid="documents-config-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Required Documents
              </CardTitle>
              <CardDescription>Configure documents required from students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {requiredDocuments.map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800"
                    data-testid={`doc-${index}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{doc.name}</p>
                        <p className="text-sm text-slate-500">
                          Max {doc.max_size_mb}MB • {doc.allowed_types.join(', ').toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">Mandatory</span>
                        <Switch
                          checked={doc.is_mandatory}
                          onCheckedChange={() => toggleDocMandatory(index)}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeDocument(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Add new document */}
                <div className="flex gap-2">
                  <Input
                    placeholder="New document name..."
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    data-testid="new-doc-input"
                  />
                  <Button onClick={addDocument} variant="outline" data-testid="add-doc-btn">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Document
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
