import { useState, useEffect, useRef } from 'react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { queryAPI } from '../../lib/api';
import { formatDateTime } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  MessageCircle, Send, User, Clock, CheckCircle, XCircle,
  MessageSquare, ArrowLeft, RefreshCw, Inbox
} from 'lucide-react';
import { toast } from 'sonner';
import { ExportButton } from '../../components/ui/export-csv';

const QUERY_STATUS = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  replied: { label: 'Replied', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  closed: { label: 'Closed', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' }
};

function apiErrText(err) {
  const status = err?.response?.status;
  const data = err?.response?.data;

  // FastAPI/Pydantic errors often: { detail: [...] }
  let detail = data?.detail ?? data?.message ?? data;

  if (typeof detail === 'object') {
    try {
      detail = JSON.stringify(detail);
    } catch {
      detail = String(detail);
    }
  }

  if (status && detail) return `${status}: ${detail}`;
  if (status) return `${status}: Request failed`;
  return detail || err?.message || 'Request failed';
}

export default function CounsellorQueriesPage() {
  const { user } = useAuth();
  const isCounsellor = user?.role === 'counsellor';

  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, pending: 0, replied: 0, closed: 0 });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedQuery && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedQuery?.messages]);

  const loadData = async () => {
    setLoading(true);

    // ✅ 1) Queries (main)
    try {
      if (isCounsellor) {
        const queriesRes = await queryAPI.getCounsellorQueries();
        setQueries(queriesRes.data?.data || []);
      } else {
        // ✅ Counselling Manager / University Admin -> fetch all pages, limit max = 100
        const limit = 100;
        let page = 1;
        let all = [];
        let pages = 1;

        do {
          const res = await queryAPI.getAllQueries({ page, limit });
          const data = res.data?.data || [];
          pages = res.data?.pages || 1;
          all = all.concat(data);
          page += 1;

          // safety cap (avoid infinite loop in case of bad pages value)
          if (page > 50) break;
        } while (page <= pages);

        setQueries(all);
      }
    } catch (err) {
      console.error('Failed to load queries:', err);
      toast.error(`Failed to load queries (${apiErrText(err)})`);
    }

    // ✅ 2) Stats (secondary) — should NOT break the page
    try {
      const statsRes = await queryAPI.getStats();
      setStats(statsRes.data || { total: 0, pending: 0, replied: 0, closed: 0 });
    } catch (err) {
      console.error('Failed to load query stats:', err);
      toast.error(`Failed to load query stats (${apiErrText(err)})`);
    } finally {
      setLoading(false);
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
      setQueries(prev => prev.map(q => q.id === res.data.id ? res.data : q));

      toast.success('Reply sent');
      queryAPI.getStats().then(r => setStats(r.data)).catch(() => {});
    } catch (err) {
      toast.error(apiErrText(err));
    } finally {
      setSending(false);
    }
  };

  const handleCloseQuery = async () => {
    if (!selectedQuery) return;

    try {
      const res = await queryAPI.updateStatus(selectedQuery.id, 'closed');
      setSelectedQuery(res.data);
      setQueries(prev => prev.map(q => q.id === res.data.id ? res.data : q));
      toast.success('Query closed');
      queryAPI.getStats().then(r => setStats(r.data)).catch(() => {});
    } catch (err) {
      toast.error(apiErrText(err));
    }
  };

  const filteredQueries = statusFilter === 'all'
    ? queries
    : queries.filter(q => q.status === statusFilter);

  if (selectedQuery) {
    return (
      <AdminLayout>
        <div className="space-y-4" data-testid="counsellor-query-detail">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setSelectedQuery(null)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Queries
            </Button>
            <div className="flex items-center gap-2">
              {selectedQuery.status !== 'closed' && (
                <Button variant="outline" onClick={handleCloseQuery} className="gap-2">
                  <XCircle className="h-4 w-4" />
                  Close Query
                </Button>
              )}
              <Badge className={QUERY_STATUS[selectedQuery.status]?.color}>
                {QUERY_STATUS[selectedQuery.status]?.label}
              </Badge>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{selectedQuery.subject}</CardTitle>
              <CardDescription className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {selectedQuery.student_name}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDateTime(selectedQuery.created_at)}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 pr-4">
                <div className="space-y-4">
                  {selectedQuery.messages?.map((msg, idx) => {
                    const isMine = msg.sender_role !== 'student';
                    return (
                      <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg p-3 ${isMine ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                          <div className="text-xs opacity-80 mb-1">
                            {msg.sender_name} • {formatDateTime(msg.created_at)}
                          </div>
                          <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {selectedQuery.status !== 'closed' && (
                <form onSubmit={handleSendReply} className="mt-4 flex gap-2">
                  <Input
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply..."
                    disabled={sending}
                  />
                  <Button type="submit" disabled={sending || !replyMessage.trim()} className="gap-2">
                    <Send className="h-4 w-4" />
                    {sending ? 'Sending...' : 'Send'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="counsellor-queries-page">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Student Queries</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">View and respond to student questions</p>
          </div>
          <div className="flex gap-2">
            <ExportButton
              data={filteredQueries}
              filename="student-queries"
              columns={[
                { key: 'student_name', label: 'Student' },
                { key: 'student_email', label: 'Email' },
                { key: 'subject', label: 'Subject' },
                { key: 'status', label: 'Status' },
                { key: 'created_at', label: 'Created At' },
                { key: 'updated_at', label: 'Updated At' }
              ]}
            />
            <Button variant="outline" onClick={loadData} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-500">Total</div>
                <div className="text-2xl font-bold">{stats.total}</div>
              </div>
              <Inbox className="h-8 w-8 text-slate-300" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-500">Pending</div>
                <div className="text-2xl font-bold">{stats.pending}</div>
              </div>
              <Clock className="h-8 w-8 text-amber-300" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-500">Replied</div>
                <div className="text-2xl font-bold">{stats.replied}</div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-300" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-500">Closed</div>
                <div className="text-2xl font-bold">{stats.closed}</div>
              </div>
              <XCircle className="h-8 w-8 text-slate-300" />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-blue-600" />
                Queries
              </CardTitle>
              <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="replied">Replied</TabsTrigger>
                  <TabsTrigger value="closed">Closed</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredQueries.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  No queries found
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  {statusFilter === 'all'
                    ? (isCounsellor ? 'No student queries assigned to you yet.' : 'No student queries found yet.')
                    : `No ${statusFilter} queries.`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredQueries.map((query) => (
                  <div
                    key={query.id}
                    className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition cursor-pointer"
                    onClick={() => setSelectedQuery(query)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {query.subject}
                        </div>
                        <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                          <User className="h-3 w-3" />
                          {query.student_name} • {query.student_email}
                        </div>
                        <div className="text-xs text-slate-400 mt-2">
                          Last updated: {formatDateTime(query.updated_at)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={QUERY_STATUS[query.status]?.color}>
                          {QUERY_STATUS[query.status]?.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}