import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentLayout } from '../../components/layouts/StudentLayout';
import { testAPI, applicationAPI } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Checkbox } from '../../components/ui/checkbox';
import { Label } from '../../components/ui/label';
import {
  Clock, AlertTriangle, CheckCircle, XCircle, ArrowRight, ArrowLeft,
  Play, Send, FileText, Timer, BookOpen, Flag
} from 'lucide-react';
import { toast } from 'sonner';

export default function StudentTestPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [testConfig, setTestConfig] = useState(null);
  const [result, setResult] = useState(null);
  
  // Test state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Test status: 'loading' | 'not_started' | 'in_progress' | 'submitted' | 'evaluated'
  const [testStatus, setTestStatus] = useState('loading');

  useEffect(() => {
    loadTestData();
  }, []);

  // Timer effect
  useEffect(() => {
    if (testStatus !== 'in_progress' || timeRemaining === null) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [testStatus, timeRemaining]);

  const loadTestData = async () => {
    try {
      const appsRes = await applicationAPI.getMyApplications();
      const apps = appsRes.data.data || [];
      
      if (apps.length === 0) {
        toast.error('No application found');
        navigate('/student');
        return;
      }
      
      const app = apps[0];
      setApplication(app);
      
      // Check if there's an existing attempt
      if (app.test_attempt_id) {
        // Load existing attempt - in a real app, you'd have an API for this
        setTestStatus('submitted');
      } else {
        setTestStatus('not_started');
      }
    } catch (err) {
      console.error('Failed to load test data:', err);
      toast.error('Failed to load test data');
    } finally {
      setLoading(false);
    }
  };

  const startTest = async () => {
    if (!application) return;
    
    setLoading(true);
    try {
      const res = await testAPI.startTest(application.id);
      const attemptData = res.data;
      
      setAttempt(attemptData);
      setTestConfig(attemptData.config);
      setTimeRemaining(attemptData.config?.duration_minutes * 60 || 3600);
      setTestStatus('in_progress');
      
      // Initialize responses
      const initialResponses = {};
      attemptData.questions?.forEach(q => {
        initialResponses[q.id] = [];
      });
      setResponses(initialResponses);
      
      toast.success('Test started! Good luck!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to start test');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSubmit = useCallback(async () => {
    if (testStatus !== 'in_progress') return;
    toast.warning('Time is up! Submitting your test...');
    await submitTest();
  }, [testStatus]);

  const submitTest = async () => {
    if (!attempt) return;
    
    setSubmitting(true);
    try {
      const res = await testAPI.submitTest(attempt.id, responses);
      setResult(res.data);
      setTestStatus('evaluated');
      toast.success('Test submitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit test');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOptionSelect = (questionId, optionIndex, isMultiple) => {
    setResponses(prev => {
      const current = prev[questionId] || [];
      
      if (isMultiple) {
        // Multiple choice - toggle the option
        if (current.includes(optionIndex)) {
          return { ...prev, [questionId]: current.filter(i => i !== optionIndex) };
        } else {
          return { ...prev, [questionId]: [...current, optionIndex] };
        }
      } else {
        // Single choice - replace
        return { ...prev, [questionId]: [optionIndex] };
      }
    });
  };

  const toggleFlag = (questionId) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const questions = attempt?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.values(responses).filter(r => r.length > 0).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </StudentLayout>
    );
  }

  // Not started view
  if (testStatus === 'not_started') {
    return (
      <StudentLayout>
        <div className="max-w-2xl mx-auto space-y-6" data-testid="test-instructions">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Entrance Test</CardTitle>
              <CardDescription>Read the instructions carefully before starting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Important Instructions</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-4 mt-2 space-y-1 text-sm">
                    <li>Once started, the test cannot be paused</li>
                    <li>Ensure you have a stable internet connection</li>
                    <li>Do not refresh or close the browser during the test</li>
                    <li>The test will auto-submit when time runs out</li>
                    <li>You can flag questions to review later</li>
                  </ul>
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <Timer className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                  <p className="text-sm text-slate-500">Duration</p>
                  <p className="font-bold">60 Minutes</p>
                </div>
                <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <FileText className="h-6 w-6 mx-auto mb-2 text-green-600" />
                  <p className="text-sm text-slate-500">Questions</p>
                  <p className="font-bold">50 Questions</p>
                </div>
              </div>
              
              <Button 
                onClick={startTest} 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                size="lg"
                disabled={loading}
                data-testid="start-test-btn"
              >
                <Play className="h-5 w-5 mr-2" />
                Start Test
              </Button>
            </CardContent>
          </Card>
        </div>
      </StudentLayout>
    );
  }

  // Result view
  if (testStatus === 'evaluated' && result) {
    return (
      <StudentLayout>
        <div className="max-w-2xl mx-auto space-y-6" data-testid="test-result">
          <Card>
            <CardHeader className="text-center">
              <div className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-4 ${
                result.passed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
              }`}>
                {result.passed ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-600" />
                )}
              </div>
              <CardTitle className="text-2xl">
                {result.passed ? 'Congratulations!' : 'Test Completed'}
              </CardTitle>
              <CardDescription>
                {result.passed 
                  ? 'You have passed the entrance test!' 
                  : 'Unfortunately, you did not meet the passing criteria.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                  <p className="text-sm text-slate-500">Score</p>
                  <p className="text-2xl font-bold">{result.marks_obtained}/{result.total_marks}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                  <p className="text-sm text-slate-500">Percentage</p>
                  <p className="text-2xl font-bold">{result.percentage.toFixed(1)}%</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Questions</span>
                  <span className="font-medium">{result.total_questions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Attempted</span>
                  <span className="font-medium">{result.attempted}</span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>Correct</span>
                  <span className="font-medium">{result.correct}</span>
                </div>
                <div className="flex justify-between text-sm text-red-600">
                  <span>Incorrect</span>
                  <span className="font-medium">{result.incorrect}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Unanswered</span>
                  <span className="font-medium">{result.unanswered}</span>
                </div>
              </div>
              
              <Button 
                onClick={() => navigate('/student/application')} 
                className="w-full"
                data-testid="continue-application-btn"
              >
                Continue Application
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </StudentLayout>
    );
  }

  // Test in progress view
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900" data-testid="test-in-progress">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-bold text-blue-600">UNIFY</span>
              <Badge variant="outline">Entrance Test</Badge>
            </div>
            
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              timeRemaining < 300 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
            }`}>
              <Clock className="h-5 w-5" />
              <span className="font-mono font-bold text-lg" data-testid="time-remaining">
                {formatTime(timeRemaining || 0)}
              </span>
            </div>
            
            <Button 
              onClick={submitTest} 
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
              data-testid="submit-test-btn"
            >
              <Send className="h-4 w-4 mr-2" />
              {submitting ? 'Submitting...' : 'Submit Test'}
            </Button>
          </div>
          
          {/* Progress */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm mb-1">
              <span>{answeredCount} of {questions.length} answered</span>
              <span>{progress.toFixed(0)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="pt-32 pb-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Question Panel */}
            <div className="lg:col-span-3">
              {currentQuestion ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Question {currentQuestionIndex + 1}</Badge>
                      <Button
                        variant={flaggedQuestions.has(currentQuestion.id) ? "default" : "ghost"}
                        size="sm"
                        onClick={() => toggleFlag(currentQuestion.id)}
                        className={flaggedQuestions.has(currentQuestion.id) ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                        data-testid="flag-question-btn"
                      >
                        <Flag className="h-4 w-4 mr-1" />
                        {flaggedQuestions.has(currentQuestion.id) ? 'Flagged' : 'Flag'}
                      </Button>
                    </div>
                    <CardTitle className="text-lg mt-4">{currentQuestion.question_text}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentQuestion.question_type === 'single_choice' ? (
                      <RadioGroup 
                        value={responses[currentQuestion.id]?.[0]?.toString() || ''}
                        onValueChange={(val) => handleOptionSelect(currentQuestion.id, parseInt(val), false)}
                      >
                        <div className="space-y-3">
                          {currentQuestion.options?.map((option, idx) => (
                            <div 
                              key={idx} 
                              className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 ${
                                responses[currentQuestion.id]?.includes(idx) ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
                              }`}
                              onClick={() => handleOptionSelect(currentQuestion.id, idx, false)}
                              data-testid={`option-${idx}`}
                            >
                              <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
                              <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">{option}</Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    ) : (
                      <div className="space-y-3">
                        {currentQuestion.options?.map((option, idx) => (
                          <div 
                            key={idx} 
                            className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 ${
                              responses[currentQuestion.id]?.includes(idx) ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
                            }`}
                            onClick={() => handleOptionSelect(currentQuestion.id, idx, true)}
                            data-testid={`option-${idx}`}
                          >
                            <Checkbox 
                              checked={responses[currentQuestion.id]?.includes(idx)} 
                              id={`option-${idx}`}
                            />
                            <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">{option}</Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p>No questions available</p>
                  </CardContent>
                </Card>
              )}
              
              {/* Navigation */}
              <div className="flex justify-between mt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  data-testid="prev-question-btn"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <Button
                  onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                  disabled={currentQuestionIndex === questions.length - 1}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="next-question-btn"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
            
            {/* Question Navigator */}
            <div className="lg:col-span-1">
              <Card className="sticky top-32">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Question Navigator</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-2">
                    {questions.map((q, idx) => {
                      const isAnswered = responses[q.id]?.length > 0;
                      const isFlagged = flaggedQuestions.has(q.id);
                      const isCurrent = idx === currentQuestionIndex;
                      
                      return (
                        <button
                          key={q.id}
                          onClick={() => setCurrentQuestionIndex(idx)}
                          className={`h-8 w-8 rounded text-sm font-medium transition-colors ${
                            isCurrent 
                              ? 'ring-2 ring-blue-600 ring-offset-2' 
                              : ''
                          } ${
                            isFlagged
                              ? 'bg-yellow-500 text-white'
                              : isAnswered
                                ? 'bg-green-500 text-white'
                                : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                          data-testid={`nav-q-${idx + 1}`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Legend */}
                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded bg-green-500" />
                      <span>Answered</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded bg-yellow-500" />
                      <span>Flagged</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-700" />
                      <span>Not Answered</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
