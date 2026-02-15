import { useState, useEffect, useRef } from 'react';
import { StudentLayout } from '../../components/layouts/StudentLayout';
import { queryAPI } from '../../lib/api';
import { formatDateTime } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { ScrollArea } from '../../components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { 
  MessageCircle, Plus, Send, User, Clock, CheckCircle, 
  MessageSquare, ArrowLeft, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

const QUERY_STATUS = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  replied: { label: 'Replied', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  closed: { label: 'Closed', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' }
};

export default function StudentQueriesPage() {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [showNewQueryDialog, setShowNewQueryDialog] = useState(false);
  const [newQueryData, setNewQueryData] = useState({ subject: '', message: '' });
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadQueries();
  }, []);

  useEffect(() => {
    if (selectedQuery && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedQuery?.messages]);

  const loadQueries = async () => {
    try {
      setLoading(true);
      const res = await queryAPI.getMyQueries();
      setQueries(res.data.data || []);
    } catch (err) {
      console.error('Failed to load queries:', err);
      toast.error('Failed to load queries');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuery = async (e) => {
    e.preventDefault();
    if (!newQueryData.subject.trim() || !newQueryData.message.trim()) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      setSending(true);
      await queryAPI.create(newQueryData);
      toast.success('Query submitted successfully');
      setShowNewQueryDialog(false);
      setNewQueryData({ subject: '', message: '' });
      loadQueries();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit query');
    } finally {
      setSending(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedQuery) return;

    try {
      setSending(true);
      const res = await queryAPI.reply(selectedQuery.id, replyMessage);
      setSelectedQuery(res.data);
      setReplyMessage('');
      // Update in list
      setQueries(prev => prev.map(q => q.id === res.data.id ? res.data : q));
      toast.success('Reply sent');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const pendingCount = queries.filter(q => q.status === 'pending').length;
  const repliedCount = queries.filter(q => q.status === 'replied').length;

  if (selectedQuery) {
    return (
      <StudentLayout>
        <div className="space-y-4" data-testid="query-detail-view">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => setSelectedQuery(null)}
            className="mb-2"
            data-testid="back-to-queries"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Queries
          </Button>

          {/* Query Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{selectedQuery.subject}</CardTitle>
                  <CardDescription>
                    Created {formatDateTime(selectedQuery.created_at)}
                    {selectedQuery.counsellor_name && (
                      <span className="ml-2">• Assigned to {selectedQuery.counsellor_name}</span>
                    )}
                  </CardDescription>
                </div>
                <Badge className={QUERY_STATUS[selectedQuery.status]?.color}>
                  {QUERY_STATUS[selectedQuery.status]?.label}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Messages */}
          <Card className="flex-1">
            <CardContent className="p-0">
              <ScrollArea className="h-[400px] p-4">
                <div className="space-y-4">
                  {selectedQuery.messages?.map((msg, index) => (
                    <div
                      key={msg.id || index}
                      className={`flex ${msg.sender_role === 'student' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          msg.sender_role === 'student'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-3 w-3" />
                          <span className="text-xs font-medium">
                            {msg.sender_role === 'student' ? 'You' : msg.sender_name}
                          </span>
                          <span className="text-xs opacity-70">
                            {formatDateTime(msg.created_at)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Reply Input */}
              {selectedQuery.status !== 'closed' && (
                <form onSubmit={handleSendReply} className="p-4 border-t dark:border-slate-800">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type your message..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      disabled={sending}
                      data-testid="reply-input"
                    />
                    <Button
                      type="submit"
                      disabled={sending || !replyMessage.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                      data-testid="send-reply-btn"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="space-y-6" data-testid="student-queries-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Queries</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Ask questions to your counsellor
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadQueries} data-testid="refresh-queries">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => setShowNewQueryDialog(true)}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="new-query-btn"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Query
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{queries.length}</p>
                <p className="text-sm text-slate-500">Total Queries</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{pendingCount}</p>
                <p className="text-sm text-slate-500">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{repliedCount}</p>
                <p className="text-sm text-slate-500">Replied</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Queries List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              All Queries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : queries.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No queries yet</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-4">
                  Have a question? Start a conversation with your counsellor.
                </p>
                <Button
                  onClick={() => setShowNewQueryDialog(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ask a Question
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {queries.map((query) => (
                  <div
                    key={query.id}
                    onClick={() => setSelectedQuery(query)}
                    className="p-4 border dark:border-slate-800 rounded-lg hover:border-blue-500/50 cursor-pointer transition-colors"
                    data-testid={`query-item-${query.id}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900 dark:text-white truncate">
                          {query.subject}
                        </h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {query.messages?.[query.messages.length - 1]?.content || 'No messages'}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                          <span>{formatDateTime(query.updated_at)}</span>
                          <span>•</span>
                          <span>{query.messages?.length || 0} messages</span>
                          {query.counsellor_name && (
                            <>
                              <span>•</span>
                              <span>Assigned to {query.counsellor_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge className={QUERY_STATUS[query.status]?.color}>
                        {QUERY_STATUS[query.status]?.label}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* New Query Dialog */}
        <Dialog open={showNewQueryDialog} onOpenChange={setShowNewQueryDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Ask a Question</DialogTitle>
              <DialogDescription>
                Send a query to your assigned counsellor. They will respond as soon as possible.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateQuery}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="e.g., Question about admission requirements"
                    value={newQueryData.subject}
                    onChange={(e) => setNewQueryData(prev => ({ ...prev, subject: e.target.value }))}
                    data-testid="query-subject-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Your Question</Label>
                  <Textarea
                    id="message"
                    placeholder="Type your question here..."
                    rows={5}
                    value={newQueryData.message}
                    onChange={(e) => setNewQueryData(prev => ({ ...prev, message: e.target.value }))}
                    data-testid="query-message-input"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewQueryDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={sending}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="submit-query-btn"
                >
                  {sending ? 'Sending...' : 'Submit Query'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </StudentLayout>
  );
}
