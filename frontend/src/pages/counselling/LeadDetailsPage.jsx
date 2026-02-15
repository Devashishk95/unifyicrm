import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { leadAPI } from '../../lib/api';
import { formatDateTime, LEAD_STAGES } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { ScrollArea } from '../../components/ui/scroll-area';
import { 
  ArrowLeft, User, Mail, Phone, Calendar, Clock, MessageSquare, 
  FileText, CreditCard, CheckCircle, AlertCircle, Plus, Edit2
} from 'lucide-react';
import { toast } from 'sonner';

const timelineIcons = {
  created: FileText,
  assigned: User,
  reassigned: User,
  status_changed: Edit2,
  note_added: MessageSquare,
  follow_up_set: Calendar,
  follow_up_completed: CheckCircle,
  document_uploaded: FileText,
  document_verified: CheckCircle,
  payment_initiated: CreditCard,
  payment_success: CheckCircle,
  payment_failed: AlertCircle,
  refund_initiated: CreditCard,
  refund_completed: CheckCircle,
  test_started: FileText,
  test_completed: CheckCircle,
  admission_confirmed: CheckCircle,
  closed: AlertCircle,
  chat_message: MessageSquare,
};

export default function LeadDetailsPage() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [showStageModal, setShowStageModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  
  const [newStage, setNewStage] = useState('');
  const [stageNotes, setStageNotes] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');

  useEffect(() => {
    loadLead();
  }, [leadId]);

  const loadLead = async () => {
    try {
      const response = await leadAPI.get(leadId);
      setLead(response.data);
      setNewStage(response.data.stage);
    } catch (err) {
      console.error('Failed to load lead:', err);
      toast.error('Failed to load lead details');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStage = async () => {
    try {
      await leadAPI.updateStage(leadId, { stage: newStage, notes: stageNotes });
      toast.success('Lead stage updated');
      setShowStageModal(false);
      setStageNotes('');
      loadLead();
    } catch (err) {
      toast.error('Failed to update stage');
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    try {
      await leadAPI.addNote(leadId, noteContent);
      toast.success('Note added');
      setShowNoteModal(false);
      setNoteContent('');
      loadLead();
    } catch (err) {
      toast.error('Failed to add note');
    }
  };

  const handleAddFollowUp = async () => {
    if (!followUpDate) return;
    try {
      await leadAPI.addFollowUp(leadId, {
        scheduled_at: new Date(followUpDate).toISOString(),
        notes: followUpNotes
      });
      toast.success('Follow-up scheduled');
      setShowFollowUpModal(false);
      setFollowUpDate('');
      setFollowUpNotes('');
      loadLead();
    } catch (err) {
      toast.error('Failed to schedule follow-up');
    }
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

  if (!lead) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Lead Not Found</h2>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="lead-details-page">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{lead.name}</h1>
            <p className="text-slate-600 dark:text-slate-400">Lead Details & Timeline</p>
          </div>
          <Badge className={LEAD_STAGES[lead.stage]?.color || 'bg-slate-100'} data-testid="lead-stage-badge">
            {LEAD_STAGES[lead.stage]?.label || lead.stage}
          </Badge>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Lead Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-slate-500">Email</p>
                      <p className="font-medium">{lead.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <Phone className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-slate-500">Phone</p>
                      <p className="font-medium">{lead.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <User className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-slate-500">Assigned To</p>
                      <p className="font-medium">{lead.assigned_to_name || 'Unassigned'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <FileText className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="text-sm text-slate-500">Source</p>
                      <p className="font-medium capitalize">{lead.source}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => setShowStageModal(true)} variant="outline" data-testid="update-stage-btn">
                    <Edit2 className="h-4 w-4 mr-2" />
                    Update Stage
                  </Button>
                  <Button onClick={() => setShowNoteModal(true)} variant="outline" data-testid="add-note-btn">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Add Note
                  </Button>
                  <Button onClick={() => setShowFollowUpModal(true)} variant="outline" data-testid="add-followup-btn">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Follow-up
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notes & Follow-ups */}
            <Tabs defaultValue="notes">
              <TabsList>
                <TabsTrigger value="notes">Notes ({lead.notes?.length || 0})</TabsTrigger>
                <TabsTrigger value="followups">Follow-ups ({lead.follow_ups?.length || 0})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="notes">
                <Card>
                  <CardContent className="pt-6">
                    {lead.notes?.length === 0 ? (
                      <p className="text-center text-slate-500 py-8">No notes yet</p>
                    ) : (
                      <div className="space-y-4">
                        {lead.notes?.map((note, index) => (
                          <div key={index} className="p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                            <p className="text-slate-900 dark:text-white">{note.content}</p>
                            <p className="text-sm text-slate-500 mt-2">
                              {note.created_by_name} • {formatDateTime(note.created_at)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="followups">
                <Card>
                  <CardContent className="pt-6">
                    {lead.follow_ups?.length === 0 ? (
                      <p className="text-center text-slate-500 py-8">No follow-ups scheduled</p>
                    ) : (
                      <div className="space-y-4">
                        {lead.follow_ups?.map((followUp, index) => (
                          <div 
                            key={index} 
                            className={`p-4 rounded-lg border ${
                              followUp.is_completed 
                                ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                                : 'border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">{formatDateTime(followUp.scheduled_at)}</span>
                              </div>
                              <Badge className={followUp.is_completed ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                                {followUp.is_completed ? 'Completed' : 'Pending'}
                              </Badge>
                            </div>
                            {followUp.notes && (
                              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{followUp.notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Timeline */}
          <div>
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Timeline
                </CardTitle>
                <CardDescription>Complete history of this lead</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-4">
                    {lead.timeline?.map((entry, index) => {
                      const Icon = timelineIcons[entry.event_type] || FileText;
                      return (
                        <div key={index} className="flex gap-3" data-testid={`timeline-${index}`}>
                          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                            <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                              {entry.description}
                            </p>
                            <p className="text-xs text-slate-500">
                              {entry.created_by_name && `${entry.created_by_name} • `}
                              {formatDateTime(entry.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Update Stage Modal */}
        <Dialog open={showStageModal} onOpenChange={setShowStageModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Update Lead Stage</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>New Stage</Label>
                <Select value={newStage} onValueChange={setNewStage}>
                  <SelectTrigger data-testid="stage-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(LEAD_STAGES).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  value={stageNotes}
                  onChange={(e) => setStageNotes(e.target.value)}
                  placeholder="Add notes about this stage change..."
                  data-testid="stage-notes-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowStageModal(false)}>Cancel</Button>
              <Button onClick={handleUpdateStage} className="bg-blue-600 hover:bg-blue-700" data-testid="confirm-stage-btn">
                Update Stage
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Note Modal */}
        <Dialog open={showNoteModal} onOpenChange={setShowNoteModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Note</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Enter your note..."
                rows={4}
                data-testid="note-content-input"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNoteModal(false)}>Cancel</Button>
              <Button onClick={handleAddNote} className="bg-blue-600 hover:bg-blue-700" disabled={!noteContent.trim()} data-testid="confirm-note-btn">
                Add Note
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Schedule Follow-up Modal */}
        <Dialog open={showFollowUpModal} onOpenChange={setShowFollowUpModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule Follow-up</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  data-testid="followup-date-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  placeholder="Add notes about this follow-up..."
                  data-testid="followup-notes-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowFollowUpModal(false)}>Cancel</Button>
              <Button onClick={handleAddFollowUp} className="bg-blue-600 hover:bg-blue-700" disabled={!followUpDate} data-testid="confirm-followup-btn">
                Schedule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
