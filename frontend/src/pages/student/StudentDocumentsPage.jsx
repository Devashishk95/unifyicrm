import { useState, useEffect } from 'react';
import { StudentLayout } from '../../components/layouts/StudentLayout';
import { documentAPI, applicationAPI } from '../../lib/api';
import { formatDateTime } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { 
  Upload, FileText, CheckCircle, XCircle, Clock, Eye, Trash2,
  AlertCircle, File, Image, FileCheck, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

const DOC_STATUS = {
  pending: { label: 'Pending Review', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  verified: { label: 'Verified', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
};

const DOC_TYPES = [
  { value: 'photo', label: 'Passport Photo', required: true },
  { value: 'id_proof', label: 'ID Proof (Aadhar/PAN)', required: true },
  { value: 'marksheet_10th', label: '10th Marksheet', required: true },
  { value: 'marksheet_12th', label: '12th Marksheet', required: true },
  { value: 'graduation_marksheet', label: 'Graduation Marksheet', required: false },
  { value: 'transfer_certificate', label: 'Transfer Certificate', required: false },
  { value: 'migration_certificate', label: 'Migration Certificate', required: false },
  { value: 'character_certificate', label: 'Character Certificate', required: false },
  { value: 'caste_certificate', label: 'Caste Certificate', required: false },
  { value: 'income_certificate', label: 'Income Certificate', required: false },
  { value: 'domicile_certificate', label: 'Domicile Certificate', required: false },
  { value: 'other', label: 'Other Document', required: false },
];

export default function StudentDocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [uploadData, setUploadData] = useState({
    doc_type: '',
    file: null,
    fileName: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [appsRes, docsRes] = await Promise.all([
        applicationAPI.getMyApplications(),
        documentAPI.getMyDocuments()
      ]);
      
      const apps = appsRes.data.data || [];
      if (apps.length > 0) {
        setApplication(apps[0]);
      }
      setDocuments(docsRes.data.data || []);
    } catch (err) {
      console.error('Failed to load data:', err);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only JPG, PNG, and PDF files are allowed');
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadData(prev => ({
          ...prev,
          file: reader.result,
          fileName: file.name
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadData.doc_type || !uploadData.file || !application) {
      toast.error('Please select document type and file');
      return;
    }

    try {
      setUploading(true);
      await documentAPI.upload({
        application_id: application.id,
        doc_type: uploadData.doc_type,
        file_data: uploadData.file,
        file_name: uploadData.fileName
      });
      
      toast.success('Document uploaded successfully');
      setShowUploadDialog(false);
      setUploadData({ doc_type: '', file: null, fileName: '' });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await documentAPI.delete(docId);
      toast.success('Document deleted');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete document');
    }
  };

  const getDocTypeLabel = (type) => {
    return DOC_TYPES.find(d => d.value === type)?.label || type;
  };

  const uploadedDocTypes = documents.map(d => d.doc_type);
  const requiredDocs = DOC_TYPES.filter(d => d.required);
  const uploadedRequiredCount = requiredDocs.filter(d => uploadedDocTypes.includes(d.value)).length;
  const progress = requiredDocs.length > 0 ? (uploadedRequiredCount / requiredDocs.length) * 100 : 0;

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
      <div className="space-y-6" data-testid="student-documents-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Documents</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Upload and manage your application documents
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadData} data-testid="refresh-docs">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => setShowUploadDialog(true)}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!application}
              data-testid="upload-doc-btn"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </div>
        </div>

        {!application && (
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <p className="text-amber-800 dark:text-amber-200">
                Please start your application first before uploading documents.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Progress Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Document Completion</CardTitle>
            <CardDescription>
              {uploadedRequiredCount} of {requiredDocs.length} required documents uploaded
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="h-3" />
            <div className="mt-4 flex flex-wrap gap-2">
              {requiredDocs.map(doc => {
                const isUploaded = uploadedDocTypes.includes(doc.value);
                return (
                  <Badge
                    key={doc.value}
                    className={isUploaded 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}
                  >
                    {isUploaded && <CheckCircle className="h-3 w-3 mr-1" />}
                    {doc.label}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Documents Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.length === 0 ? (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  No Documents Uploaded
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-4">
                  Start by uploading your required documents.
                </p>
                <Button
                  onClick={() => setShowUploadDialog(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={!application}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload First Document
                </Button>
              </CardContent>
            </Card>
          ) : (
            documents.map((doc) => {
              const status = DOC_STATUS[doc.status] || DOC_STATUS.pending;
              const StatusIcon = status.icon;
              const isImage = doc.file_name?.match(/\.(jpg|jpeg|png|gif)$/i);
              
              return (
                <Card key={doc.id} className="overflow-hidden" data-testid={`doc-card-${doc.id}`}>
                  <div className="aspect-video bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative">
                    {isImage && doc.url ? (
                      <img 
                        src={doc.url} 
                        alt={doc.doc_type}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <File className="h-16 w-16 text-slate-400" />
                    )}
                    <Badge className={`absolute top-2 right-2 ${status.color}`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h4 className="font-medium text-slate-900 dark:text-white mb-1">
                      {getDocTypeLabel(doc.doc_type)}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                      {doc.file_name || 'Document'}
                    </p>
                    <p className="text-xs text-slate-400 mb-3">
                      Uploaded: {formatDateTime(doc.created_at)}
                    </p>
                    {doc.rejection_reason && (
                      <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                        Rejection Reason: {doc.rejection_reason}
                      </p>
                    )}
                    <div className="flex gap-2">
                      {doc.url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPreviewDoc(doc);
                            setShowPreviewDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      )}
                      {doc.status !== 'verified' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(doc.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Upload Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                Select document type and upload your file. Max file size: 5MB.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpload}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Document Type</Label>
                  <Select
                    value={uploadData.doc_type}
                    onValueChange={(value) => setUploadData(prev => ({ ...prev, doc_type: value }))}
                  >
                    <SelectTrigger data-testid="doc-type-select">
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOC_TYPES.map(doc => (
                        <SelectItem 
                          key={doc.value} 
                          value={doc.value}
                          disabled={uploadedDocTypes.includes(doc.value)}
                        >
                          {doc.label} {doc.required && '*'}
                          {uploadedDocTypes.includes(doc.value) && ' (Already uploaded)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Select File</Label>
                  <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-6 text-center">
                    {uploadData.fileName ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileCheck className="h-5 w-5 text-green-600" />
                        <span className="text-sm">{uploadData.fileName}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setUploadData(prev => ({ ...prev, file: null, fileName: '' }))}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                          JPG, PNG or PDF (max 5MB)
                        </p>
                        <Input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={handleFileChange}
                          className="max-w-[200px] mx-auto"
                          data-testid="file-input"
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowUploadDialog(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={uploading || !uploadData.doc_type || !uploadData.file}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="submit-upload-btn"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>{previewDoc && getDocTypeLabel(previewDoc.doc_type)}</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center min-h-[400px] bg-slate-100 dark:bg-slate-800 rounded-lg">
              {previewDoc?.url && (
                previewDoc.file_name?.match(/\.pdf$/i) ? (
                  <iframe
                    src={previewDoc.url}
                    className="w-full h-[500px]"
                    title="Document Preview"
                  />
                ) : (
                  <img
                    src={previewDoc.url}
                    alt={previewDoc.doc_type}
                    className="max-w-full max-h-[500px] object-contain"
                  />
                )
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </StudentLayout>
  );
}
