import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentLayout } from '../../components/layouts/StudentLayout';
import { applicationAPI, studentAPI, universityAPI, documentAPI } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Progress } from '../../components/ui/progress';
import { Badge } from '../../components/ui/badge';
import { 
  FileText, Upload, ClipboardCheck, CreditCard, CheckCircle, 
  ArrowRight, ArrowLeft, Save, Trash2, File, Image, AlertCircle, X
} from 'lucide-react';
import { toast } from 'sonner';

export default function StudentApplicationPage() {
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [config, setConfig] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  // Basic Info Form
  const [basicInfo, setBasicInfo] = useState({
    name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    guardian_name: '',
    guardian_phone: ''
  });
  
  // Educational Details
  const [educationalDetails, setEducationalDetails] = useState([
    { qualification: '', board_university: '', passing_year: '', marks_percentage: '', grade: '' }
  ]);
  
  // Course Selection
  const [selectedCourse, setSelectedCourse] = useState('');
  
  // Documents
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const createNewApplication = async () => {
    try {
      setCreating(true);
      await applicationAPI.create({});
      toast.success('Application created! You can now fill in your details.');
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create application');
    } finally {
      setCreating(false);
    }
  };

  const loadData = async () => {
    try {
      const [appsRes, configRes] = await Promise.all([
        applicationAPI.getMyApplications(),
        studentAPI.getRegistrationConfig()
      ]);
      
      const apps = appsRes.data.data || [];
      const regConfig = configRes.data;
      
      setConfig(regConfig);
      
      if (apps.length > 0) {
        const app = apps[0];
        setApplication(app);
        
        // Load existing data
        if (app.basic_info) {
          setBasicInfo(prev => ({ ...prev, ...app.basic_info }));
        }
        if (app.educational_details?.length > 0) {
          setEducationalDetails(app.educational_details);
        }
        if (app.course_id) {
          setSelectedCourse(app.course_id);
        }
        
        // Load documents
        try {
          const docsRes = await documentAPI.getApplicationDocuments(app.id);
          setDocuments(docsRes.data.data || []);
        } catch (err) {
          console.log('No documents found');
        }
        
        // Set current step
        const steps = regConfig.steps || [];
        const currentStep = app.current_step;
        const stepIndex = steps.findIndex(s => s.step === currentStep);
        setCurrentStepIndex(stepIndex >= 0 ? stepIndex : 0);
      }
      
      // Load courses
      try {
        const coursesRes = await universityAPI.listCourses();
        setCourses(coursesRes.data.data || []);
      } catch (err) {
        // Courses API might not be accessible for students
        console.log('Courses not available');
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      toast.error('Failed to load application data');
    } finally {
      setLoading(false);
    }
  };

  const steps = config?.steps || [];
  const currentStep = steps[currentStepIndex];
  const progress = steps.length > 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0;

  const saveBasicInfo = async () => {
    if (!application) return;
    setSaving(true);
    try {
      await applicationAPI.updateBasicInfo(application.id, basicInfo);
      toast.success('Basic information saved');
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const saveEducationalDetails = async () => {
    if (!application) return;
    setSaving(true);
    try {
      await applicationAPI.updateEducationalDetails(application.id, educationalDetails);
      toast.success('Educational details saved');
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const submitApplication = async () => {
    if (!application) return;
    setSaving(true);
    try {
      await applicationAPI.submit(application.id);
      toast.success('Application submitted successfully!');
      navigate('/student');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit application');
    } finally {
      setSaving(false);
    }
  };

  const goNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const goPrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const addEducationRow = () => {
    setEducationalDetails([
      ...educationalDetails,
      { qualification: '', board_university: '', passing_year: '', marks_percentage: '', grade: '' }
    ]);
  };

  const updateEducationRow = (index, field, value) => {
    const updated = [...educationalDetails];
    updated[index][field] = value;
    setEducationalDetails(updated);
  };

  // Document functions
  const handleFileSelect = async (e, documentName) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only PDF, JPG, and PNG files are allowed.');
      return;
    }
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit.');
      return;
    }
    
    setUploading(true);
    
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result.split(',')[1]; // Remove data:... prefix
        
        await documentAPI.upload({
          application_id: application.id,
          document_name: documentName,
          file_name: file.name,
          file_type: file.name.split('.').pop(),
          file_size: file.size,
          file_data: base64Data
        });
        
        toast.success(`${documentName} uploaded successfully`);
        await loadData(); // Refresh documents
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId, documentName) => {
    if (!confirm(`Are you sure you want to delete ${documentName}?`)) return;
    
    try {
      await documentAPI.delete(documentId);
      toast.success('Document deleted');
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete document');
    }
  };

  const getDocumentStatus = (docName) => {
    const doc = documents.find(d => d.name === docName);
    return doc;
  };

  const defaultSteps = [
    { step: 'basic_info', label: 'Basic Information', is_enabled: true },
    { step: 'educational_details', label: 'Educational Details', is_enabled: true },
    { step: 'course_selection', label: 'Course Selection', is_enabled: true },
    { step: 'document_upload', label: 'Document Upload', is_enabled: true },
    { step: 'final_submission', label: 'Review & Submit', is_enabled: true }
  ];

  const requiredDocuments = config?.config?.required_documents || [
    { name: '10th Marksheet', is_mandatory: true },
    { name: '12th Marksheet', is_mandatory: true },
    { name: 'Photo', is_mandatory: true },
    { name: 'Signature', is_mandatory: true },
    { name: 'ID Proof', is_mandatory: true },
    { name: 'Address Proof', is_mandatory: false },
  ];

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </StudentLayout>
    );
  }

  if (!application) {
    return (
      <StudentLayout>
        <div className="max-w-2xl mx-auto space-y-6" data-testid="no-application-view">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-2xl">Start Your Application</CardTitle>
              <CardDescription className="text-base">
                Begin your admission journey by creating a new application
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-slate-600 dark:text-slate-400">
                Click the button below to start your application. You'll be guided through multiple steps
                to provide your personal information, educational details, and required documents.
              </p>
              <Button 
                onClick={createNewApplication} 
                disabled={creating}
                className="bg-blue-600 hover:bg-blue-700"
                size="lg"
                data-testid="start-application-btn"
              >
                {creating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Application...
                  </>
                ) : (
                  <>
                    <FileText className="h-5 w-5 mr-2" />
                    Start New Application
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
          
          {/* Application Steps Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Application Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(config?.steps || defaultSteps).map((step, index) => (
                  <div key={step.step} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-medium text-slate-600 dark:text-slate-400">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white">{step.label}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {step.step === 'basic_info' && 'Provide your personal details like name, email, phone, and address'}
                        {step.step === 'educational_details' && 'Enter your educational qualifications and academic history'}
                        {step.step === 'course_selection' && 'Choose your preferred course and department'}
                        {step.step === 'document_upload' && 'Upload required documents like ID proof, marksheets, etc.'}
                        {step.step === 'final_submission' && 'Review your application and submit'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </StudentLayout>
    );
  }

  const renderStepContent = () => {
    switch (currentStep?.step) {
      case 'basic_info':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Please provide your personal details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={basicInfo.name}
                    onChange={(e) => setBasicInfo({ ...basicInfo, name: e.target.value })}
                    required
                    data-testid="basic-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={basicInfo.email}
                    onChange={(e) => setBasicInfo({ ...basicInfo, email: e.target.value })}
                    required
                    data-testid="basic-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={basicInfo.phone}
                    onChange={(e) => setBasicInfo({ ...basicInfo, phone: e.target.value })}
                    required
                    data-testid="basic-phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={basicInfo.date_of_birth}
                    onChange={(e) => setBasicInfo({ ...basicInfo, date_of_birth: e.target.value })}
                    data-testid="basic-dob"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={basicInfo.gender} onValueChange={(v) => setBasicInfo({ ...basicInfo, gender: v })}>
                    <SelectTrigger data-testid="basic-gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guardian_name">Guardian Name</Label>
                  <Input
                    id="guardian_name"
                    value={basicInfo.guardian_name}
                    onChange={(e) => setBasicInfo({ ...basicInfo, guardian_name: e.target.value })}
                    data-testid="basic-guardian"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={basicInfo.address}
                    onChange={(e) => setBasicInfo({ ...basicInfo, address: e.target.value })}
                    data-testid="basic-address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={basicInfo.city}
                    onChange={(e) => setBasicInfo({ ...basicInfo, city: e.target.value })}
                    data-testid="basic-city"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={basicInfo.state}
                    onChange={(e) => setBasicInfo({ ...basicInfo, state: e.target.value })}
                    data-testid="basic-state"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={saveBasicInfo} disabled={saving} className="bg-blue-600 hover:bg-blue-700" data-testid="save-basic-btn">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save & Continue'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'educational_details':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Educational Details</CardTitle>
              <CardDescription>Provide your educational qualifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {educationalDetails.map((edu, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Qualification {index + 1}</h4>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Qualification</Label>
                        <Select
                          value={edu.qualification}
                          onValueChange={(v) => updateEducationRow(index, 'qualification', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select qualification" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10th">10th Standard</SelectItem>
                            <SelectItem value="12th">12th Standard</SelectItem>
                            <SelectItem value="graduation">Graduation</SelectItem>
                            <SelectItem value="post_graduation">Post Graduation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Board/University</Label>
                        <Input
                          value={edu.board_university}
                          onChange={(e) => updateEducationRow(index, 'board_university', e.target.value)}
                          placeholder="e.g., CBSE, State Board"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Passing Year</Label>
                        <Input
                          type="number"
                          value={edu.passing_year}
                          onChange={(e) => updateEducationRow(index, 'passing_year', e.target.value)}
                          placeholder="e.g., 2023"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Percentage/CGPA</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={edu.marks_percentage}
                          onChange={(e) => updateEducationRow(index, 'marks_percentage', e.target.value)}
                          placeholder="e.g., 85.5"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button variant="outline" onClick={addEducationRow} className="w-full">
                  + Add Another Qualification
                </Button>
                
                {courses.length > 0 && (
                  <div className="pt-4 border-t space-y-2">
                    <Label>Course Applying For</Label>
                    <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name} ({course.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={saveEducationalDetails} disabled={saving} className="bg-blue-600 hover:bg-blue-700" data-testid="save-edu-btn">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save & Continue'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'documents':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Document Upload</CardTitle>
              <CardDescription>Upload required documents for your application</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {requiredDocuments.map((reqDoc, index) => {
                  const uploadedDoc = getDocumentStatus(reqDoc.name);
                  
                  return (
                    <div 
                      key={index} 
                      className="p-4 border rounded-lg flex items-center justify-between gap-4"
                      data-testid={`doc-row-${reqDoc.name.replace(/\s+/g, '-').toLowerCase()}`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                          uploadedDoc 
                            ? uploadedDoc.status === 'verified' 
                              ? 'bg-green-100 dark:bg-green-900/30' 
                              : uploadedDoc.status === 'rejected'
                                ? 'bg-red-100 dark:bg-red-900/30'
                                : 'bg-blue-100 dark:bg-blue-900/30'
                            : 'bg-slate-100 dark:bg-slate-800'
                        }`}>
                          {uploadedDoc?.file_type === 'pdf' ? (
                            <File className={`h-5 w-5 ${uploadedDoc ? 'text-blue-600' : 'text-slate-400'}`} />
                          ) : uploadedDoc ? (
                            <Image className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Upload className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium flex items-center gap-2">
                            {reqDoc.name}
                            {reqDoc.is_mandatory && <span className="text-red-500 text-xs">*</span>}
                          </p>
                          {uploadedDoc ? (
                            <p className="text-sm text-slate-500">{uploadedDoc.file_name}</p>
                          ) : (
                            <p className="text-sm text-slate-400">PDF, JPG, PNG (Max 5MB)</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {uploadedDoc && (
                          <>
                            <Badge 
                              className={
                                uploadedDoc.status === 'verified' 
                                  ? 'bg-green-100 text-green-800' 
                                  : uploadedDoc.status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                              }
                            >
                              {uploadedDoc.status === 'uploaded' ? 'Pending Review' : uploadedDoc.status}
                            </Badge>
                            {uploadedDoc.status !== 'verified' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteDocument(uploadedDoc.id, uploadedDoc.name)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                data-testid={`delete-doc-${reqDoc.name.replace(/\s+/g, '-').toLowerCase()}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        )}
                        
                        {!uploadedDoc && (
                          <>
                            <input
                              type="file"
                              id={`file-${index}`}
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileSelect(e, reqDoc.name)}
                              disabled={uploading}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById(`file-${index}`).click()}
                              disabled={uploading}
                              data-testid={`upload-${reqDoc.name.replace(/\s+/g, '-').toLowerCase()}`}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              {uploading ? 'Uploading...' : 'Upload'}
                            </Button>
                          </>
                        )}
                        
                        {uploadedDoc && uploadedDoc.status === 'rejected' && (
                          <>
                            <input
                              type="file"
                              id={`file-reupload-${index}`}
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => {
                                handleDeleteDocument(uploadedDoc.id, uploadedDoc.name).then(() => {
                                  handleFileSelect(e, reqDoc.name);
                                });
                              }}
                              disabled={uploading}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById(`file-reupload-${index}`).click()}
                              disabled={uploading}
                            >
                              Re-upload
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {/* Upload Status Summary */}
                <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {documents.length === requiredDocuments.filter(d => d.is_mandatory).length ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                      )}
                      <span className="font-medium">
                        {documents.length} of {requiredDocuments.filter(d => d.is_mandatory).length} mandatory documents uploaded
                      </span>
                    </div>
                    <Button 
                      onClick={goNext} 
                      disabled={documents.length < requiredDocuments.filter(d => d.is_mandatory).length}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Continue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'entrance_test':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Entrance Test</CardTitle>
              <CardDescription>Complete your entrance examination</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <ClipboardCheck className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">You will be redirected to the test portal when ready</p>
                <Button onClick={() => navigate('/student/test')} className="bg-blue-600 hover:bg-blue-700">
                  Start Test
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'payment':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Registration Fee Payment</CardTitle>
              <CardDescription>Complete your fee payment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-xl font-bold mb-2">Amount: ₹{config?.config?.fee_amount || 0}</p>
                <p className="text-slate-600 mb-4">Click below to proceed with payment</p>
                <Button onClick={() => navigate('/student/payment')} className="bg-blue-600 hover:bg-blue-700">
                  Pay Now
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'final_submission':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Final Submission</CardTitle>
              <CardDescription>Review and submit your application</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-400">Ready to Submit</p>
                      <p className="text-sm text-green-600 dark:text-green-500">All required steps have been completed</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-4">Application Summary</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Application Number</dt>
                      <dd className="font-medium">{application.application_number}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Name</dt>
                      <dd className="font-medium">{basicInfo.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Email</dt>
                      <dd className="font-medium">{basicInfo.email}</dd>
                    </div>
                  </dl>
                </div>
                
                <Button onClick={submitApplication} disabled={saving} className="w-full bg-green-600 hover:bg-green-700" data-testid="submit-application-btn">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {saving ? 'Submitting...' : 'Submit Application'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card>
            <CardContent className="pt-6 text-center">
              <p>Unknown step</p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto space-y-6" data-testid="student-application-page">
        {/* Progress Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Application Progress</h2>
              <span className="text-sm text-slate-500">
                Step {currentStepIndex + 1} of {steps.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            
            {/* Step Indicators */}
            <div className="flex justify-between mt-4">
              {steps.map((step, index) => {
                const isCompleted = application?.completed_steps?.includes(step.step);
                const isCurrent = index === currentStepIndex;
                
                return (
                  <div
                    key={step.step}
                    className={`flex flex-col items-center cursor-pointer ${
                      index <= currentStepIndex ? 'text-blue-600' : 'text-slate-400'
                    }`}
                    onClick={() => setCurrentStepIndex(index)}
                  >
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      isCompleted 
                        ? 'bg-green-600 text-white' 
                        : isCurrent 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-slate-200 dark:bg-slate-700'
                    }`}>
                      {isCompleted ? <CheckCircle className="h-4 w-4" /> : index + 1}
                    </div>
                    <span className="text-xs mt-1 hidden sm:block">{step.name}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        {renderStepContent()}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={currentStepIndex === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <Button
            onClick={goNext}
            disabled={currentStepIndex === steps.length - 1}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </StudentLayout>
  );
}
