import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentLayout } from '../../components/layouts/StudentLayout';
import { applicationAPI, studentAPI } from '../../lib/api';
import { APPLICATION_STATUS, formatDate } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { 
  FileText, Upload, ClipboardCheck, CreditCard, CheckCircle, 
  Clock, ArrowRight, Building2, AlertCircle 
} from 'lucide-react';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [registrationConfig, setRegistrationConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [appsRes, configRes] = await Promise.all([
        applicationAPI.getMyApplications(),
        studentAPI.getRegistrationConfig()
      ]);
      setApplications(appsRes.data.data || []);
      setRegistrationConfig(configRes.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </StudentLayout>
    );
  }

  const currentApplication = applications[0];
  const steps = registrationConfig?.steps || [];
  const completedSteps = currentApplication?.completed_steps || [];
  const progress = steps.length > 0 ? (completedSteps.length / steps.length) * 100 : 0;

  const getStepIcon = (step) => {
    switch (step) {
      case 'basic_info': return FileText;
      case 'educational_details': return FileText;
      case 'documents': return Upload;
      case 'entrance_test': return ClipboardCheck;
      case 'payment': return CreditCard;
      case 'final_submission': return CheckCircle;
      default: return FileText;
    }
  };

  const isStepCompleted = (step) => completedSteps.includes(step);
  const isStepCurrent = (step) => currentApplication?.current_step === step;

  return (
    <StudentLayout>
      <div className="space-y-8" data-testid="student-dashboard">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
          <p className="text-blue-100 text-lg">
            {registrationConfig?.university_name || 'Your university'} - Application Portal
          </p>
          {currentApplication && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-100">Application Progress</span>
                <span className="text-sm font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-blue-400" />
            </div>
          )}
        </div>

        {/* Current Application Status */}
        {currentApplication ? (
          <Card data-testid="application-status-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Your Application</CardTitle>
                  <CardDescription>Application No: {currentApplication.application_number}</CardDescription>
                </div>
                <Badge className={APPLICATION_STATUS[currentApplication.status]?.color || 'bg-slate-100'}>
                  {APPLICATION_STATUS[currentApplication.status]?.label || currentApplication.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Steps Progress */}
              <div className="space-y-4">
                {steps.map((step, index) => {
                  const Icon = getStepIcon(step.step);
                  const completed = isStepCompleted(step.step);
                  const current = isStepCurrent(step.step);
                  
                  return (
                    <div 
                      key={step.step}
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                        completed 
                          ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                          : current 
                            ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20' 
                            : 'border-slate-200 dark:border-slate-800'
                      }`}
                      data-testid={`step-${step.step}`}
                    >
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        completed 
                          ? 'bg-green-600 text-white' 
                          : current 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                      }`}>
                        {completed ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${completed ? 'text-green-700 dark:text-green-400' : current ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                          {step.name}
                        </p>
                        <p className="text-sm text-slate-500">
                          {completed ? 'Completed' : current ? 'In Progress' : 'Pending'}
                        </p>
                      </div>
                      {current && (
                        <Button 
                          onClick={() => navigate('/student/application')}
                          className="bg-blue-600 hover:bg-blue-700"
                          data-testid="continue-application-btn"
                        >
                          Continue
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Application</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                You don't have any active application. Start your application now.
              </p>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => navigate('/student/application')}
                data-testid="start-application-btn"
              >
                Start Application
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="hover:border-blue-500/50 cursor-pointer transition-colors" onClick={() => navigate('/student/documents')}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Upload className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Upload Documents</p>
                <p className="text-sm text-slate-500">Submit required documents</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-blue-500/50 cursor-pointer transition-colors" onClick={() => navigate('/student/test')}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <ClipboardCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Entrance Test</p>
                <p className="text-sm text-slate-500">Take your entrance exam</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-blue-500/50 cursor-pointer transition-colors" onClick={() => navigate('/student/institution')}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Know Your Institution</p>
                <p className="text-sm text-slate-500">Learn about the university</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </StudentLayout>
  );
}
