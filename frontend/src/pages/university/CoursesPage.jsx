import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { universityAPI } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { 
  Plus, BookOpen, Edit, Search, RefreshCw, GraduationCap, Clock, Download
} from 'lucide-react';
import { toast } from 'sonner';
import { ExportButton } from '../../components/ui/export-csv';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department_id: '',
    duration_years: 4,
    description: '',
    eligibility: '',
    fee_amount: 0
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [coursesRes, deptsRes] = await Promise.all([
        universityAPI.listCourses(),
        universityAPI.listDepartments()
      ]);
      setCourses(coursesRes.data.data || []);
      setDepartments(deptsRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingCourse(null);
    setFormData({
      name: '',
      code: '',
      department_id: departments[0]?.id || '',
      duration_years: 4,
      description: '',
      eligibility: '',
      fee_amount: 0
    });
    setDialogOpen(true);
  };

  const openEditDialog = (course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name || '',
      code: course.code || '',
      department_id: course.department_id || '',
      duration_years: course.duration_years || 4,
      description: course.description || '',
      eligibility: course.eligibility || '',
      fee_amount: course.fee_amount || 0
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code || !formData.department_id) {
      toast.error('Name, Code, and Department are required');
      return;
    }

    setSaving(true);
    try {
      if (editingCourse) {
        await universityAPI.updateCourse(editingCourse.id, formData);
        toast.success('Course updated successfully');
      } else {
        await universityAPI.createCourse(formData);
        toast.success('Course created successfully');
      }
      setDialogOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  const getDeptName = (deptId) => {
    const dept = departments.find(d => d.id === deptId);
    return dept?.name || '-';
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = 
      course.name?.toLowerCase().includes(search.toLowerCase()) ||
      course.code?.toLowerCase().includes(search.toLowerCase());
    const matchesDept = filterDept === 'all' || course.department_id === filterDept;
    return matchesSearch && matchesDept;
  });

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="courses-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Courses</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Manage courses offered by your university</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadData} data-testid="refresh-courses">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700" data-testid="add-course-btn">
              <Plus className="h-4 w-4 mr-2" />
              Add Course
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search courses..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                  data-testid="search-courses"
                />
              </div>
              <Select value={filterDept} onValueChange={setFilterDept}>
                <SelectTrigger className="w-[200px]" data-testid="filter-dept">
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ExportButton
                data={courses}
                filename="courses"
                columns={[
                  { key: 'name', label: 'Name' },
                  { key: 'code', label: 'Code' },
                  { key: 'department_name', label: 'Department' },
                  { key: 'duration_years', label: 'Duration (Years)' },
                  { key: 'fee_amount', label: 'Fee' },
                  { key: 'is_active', label: 'Status' }
                ]}
              />
            </div>
          </CardContent>
        </Card>

        {/* Courses Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              All Courses ({filteredCourses.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Status</TableHead>
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
                ) : filteredCourses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      No courses found. Create departments first, then add courses.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCourses.map((course) => (
                    <TableRow key={course.id} data-testid={`course-row-${course.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">{course.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-sm">
                          {course.code}
                        </code>
                      </TableCell>
                      <TableCell>{getDeptName(course.department_id)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-slate-400" />
                          {course.duration_years} years
                        </div>
                      </TableCell>
                      <TableCell>₹{(course.fee_amount || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={course.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {course.is_active !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(course)}
                          data-testid={`edit-course-${course.id}`}
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
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingCourse ? 'Edit Course' : 'Create Course'}</DialogTitle>
              <DialogDescription>
                {editingCourse ? 'Update course details' : 'Add a new course to your university'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Course Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., B.Tech Computer Science"
                    data-testid="course-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Course Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., BTCS"
                    data-testid="course-code-input"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Select 
                  value={formData.department_id} 
                  onValueChange={(v) => setFormData({ ...formData, department_id: v })}
                >
                  <SelectTrigger data-testid="course-dept-select">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (Years)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.duration_years}
                    onChange={(e) => setFormData({ ...formData, duration_years: parseInt(e.target.value) || 4 })}
                    data-testid="course-duration-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fee">Registration Fee (₹)</Label>
                  <Input
                    id="fee"
                    type="number"
                    min="0"
                    value={formData.fee_amount}
                    onChange={(e) => setFormData({ ...formData, fee_amount: parseInt(e.target.value) || 0 })}
                    data-testid="course-fee-input"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="eligibility">Eligibility Criteria</Label>
                <Input
                  id="eligibility"
                  value={formData.eligibility}
                  onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                  placeholder="e.g., 10+2 with PCM, min 60%"
                  data-testid="course-eligibility-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the course"
                  data-testid="course-desc-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700" data-testid="save-course-btn">
                {saving ? 'Saving...' : editingCourse ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
