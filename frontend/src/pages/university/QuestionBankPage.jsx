import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { testAPI, universityAPI } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { 
  Plus, FileQuestion, Edit, Search, RefreshCw, Trash2, CheckCircle, 
  XCircle, BookOpen, ListChecks
} from 'lucide-react';
import { toast } from 'sonner';

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  
  // Question Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [formData, setFormData] = useState({
    question_text: '',
    question_type: 'single_choice',
    options: ['', '', '', ''],
    correct_options: [0],
    marks: 1,
    negative_marks: 0,
    subject: '',
    difficulty: 'medium',
    tags: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [questionsRes, deptsRes] = await Promise.all([
        testAPI.listQuestions({}),
        universityAPI.listDepartments()
      ]);
      setQuestions(questionsRes.data.data || []);
      setDepartments(deptsRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingQuestion(null);
    setFormData({
      question_text: '',
      question_type: 'single_choice',
      options: ['', '', '', ''],
      correct_options: [0],
      marks: 1,
      negative_marks: 0,
      subject: '',
      difficulty: 'medium',
      tags: ''
    });
    setDialogOpen(true);
  };

  const openEditDialog = (question) => {
    setEditingQuestion(question);
    setFormData({
      question_text: question.question_text || '',
      question_type: question.question_type || 'single_choice',
      options: question.options || ['', '', '', ''],
      correct_options: question.correct_options || [0],
      marks: question.marks || 1,
      negative_marks: question.negative_marks || 0,
      subject: question.subject || '',
      difficulty: question.difficulty || 'medium',
      tags: (question.tags || []).join(', ')
    });
    setDialogOpen(true);
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const addOption = () => {
    setFormData({ ...formData, options: [...formData.options, ''] });
  };

  const removeOption = (index) => {
    if (formData.options.length <= 2) return;
    const newOptions = formData.options.filter((_, i) => i !== index);
    const newCorrect = formData.correct_options
      .filter(i => i !== index)
      .map(i => i > index ? i - 1 : i);
    setFormData({ ...formData, options: newOptions, correct_options: newCorrect });
  };

  const toggleCorrectOption = (index) => {
    if (formData.question_type === 'single_choice') {
      setFormData({ ...formData, correct_options: [index] });
    } else {
      const current = formData.correct_options;
      if (current.includes(index)) {
        if (current.length > 1) {
          setFormData({ ...formData, correct_options: current.filter(i => i !== index) });
        }
      } else {
        setFormData({ ...formData, correct_options: [...current, index] });
      }
    }
  };

  const handleSave = async () => {
    if (!formData.question_text.trim()) {
      toast.error('Question text is required');
      return;
    }
    
    const validOptions = formData.options.filter(o => o.trim());
    if (validOptions.length < 2) {
      toast.error('At least 2 options are required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        options: validOptions,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t)
      };

      await testAPI.createQuestion(payload);
      toast.success('Question created successfully');
      setDialogOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const subjects = [...new Set(questions.map(q => q.subject).filter(Boolean))];
  
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.question_text?.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = filterSubject === 'all' || q.subject === filterSubject;
    const matchesDifficulty = filterDifficulty === 'all' || q.difficulty === filterDifficulty;
    return matchesSearch && matchesSubject && matchesDifficulty;
  });

  const stats = {
    total: questions.length,
    easy: questions.filter(q => q.difficulty === 'easy').length,
    medium: questions.filter(q => q.difficulty === 'medium').length,
    hard: questions.filter(q => q.difficulty === 'hard').length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="question-bank-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Question Bank</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Manage entrance test questions</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadData} data-testid="refresh-questions">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700" data-testid="add-question-btn">
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <FileQuestion className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-slate-500">Total Questions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.easy}</p>
                  <p className="text-sm text-slate-500">Easy</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <ListChecks className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.medium}</p>
                  <p className="text-sm text-slate-500">Medium</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.hard}</p>
                  <p className="text-sm text-slate-500">Hard</p>
                </div>
              </div>
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
                  placeholder="Search questions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                  data-testid="search-questions"
                />
              </div>
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Questions List */}
        <Card>
          <CardHeader>
            <CardTitle>Questions ({filteredQuestions.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%]">Question</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Marks</TableHead>
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
                ) : filteredQuestions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      No questions found. Add your first question to build the test bank.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuestions.map((question) => (
                    <TableRow key={question.id} data-testid={`question-row-${question.id}`}>
                      <TableCell>
                        <p className="line-clamp-2">{question.question_text}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {question.question_type === 'single_choice' ? 'Single' : 'Multiple'}
                        </Badge>
                      </TableCell>
                      <TableCell>{question.subject || '-'}</TableCell>
                      <TableCell>
                        <Badge className={
                          question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                          question.difficulty === 'hard' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {question.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell>{question.marks}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(question)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add Question'}</DialogTitle>
              <DialogDescription>
                {editingQuestion ? 'Update question details' : 'Add a new question to the bank'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Question Text *</Label>
                <Textarea
                  value={formData.question_text}
                  onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                  placeholder="Enter the question"
                  rows={3}
                  data-testid="question-text-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Question Type</Label>
                  <Select 
                    value={formData.question_type} 
                    onValueChange={(v) => setFormData({ ...formData, question_type: v, correct_options: [0] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single_choice">Single Choice</SelectItem>
                      <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., Mathematics"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Options (Click to mark correct)</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={addOption}>
                    <Plus className="h-4 w-4 mr-1" /> Add Option
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={formData.correct_options.includes(index) ? "default" : "outline"}
                        size="icon"
                        className={formData.correct_options.includes(index) ? "bg-green-600 hover:bg-green-700" : ""}
                        onClick={() => toggleCorrectOption(index)}
                      >
                        {formData.correct_options.includes(index) ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <span className="text-sm">{String.fromCharCode(65 + index)}</span>
                        )}
                      </Button>
                      <Input
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + index)}`}
                        className="flex-1"
                      />
                      {formData.options.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOption(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select 
                    value={formData.difficulty} 
                    onValueChange={(v) => setFormData({ ...formData, difficulty: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Marks</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.marks}
                    onChange={(e) => setFormData({ ...formData, marks: parseFloat(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Negative Marks</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.25"
                    value={formData.negative_marks}
                    onChange={(e) => setFormData({ ...formData, negative_marks: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tags (comma separated)</Label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g., algebra, quadratic"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700" data-testid="save-question-btn">
                {saving ? 'Saving...' : editingQuestion ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
