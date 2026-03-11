import React, { useState, useEffect, useRef } from 'react';
import {
  startHelpChatSession,
  sendHelpChatMessage,
  getHelpChatSessions,
  getHelpChatSession,
  getActiveHelpChatSession,
  closeHelpChatSession,
  resolveHelpChatSession,
  deleteHelpChatSession,
  HelpChatMessage,
  HelpChatSession,
  HelpChatSessionSummary,
  QUICK_HELP_SUGGESTIONS,
} from '../services/helpChat';

const FAQ_ITEMS = [
  {
    question: 'How do I log a dialysis session?',
    answer:
      'Navigate to the Dashboard and tap "Log Session". Fill in details such as session type, duration, fluid removed, and any notes. Your session will be saved and reflected in your reports.',
  },
  {
    question: 'Can I share my reports with my doctor?',
    answer:
      'Yes. Go to the Reports page, select the date range and data you want to include, then use the Export or Share button to generate a PDF or send it directly to your care team.',
  },
  {
    question: 'How does fluid tracking work?',
    answer:
      'Use the Fluid Log page to record each drink or fluid intake throughout the day. The app tracks your total intake against your daily limit and alerts you when you are approaching it.',
  },
  {
    question: 'What devices are supported for vitals import?',
    answer:
      'The app supports manual entry, Apple Watch (via HealthKit), and compatible Bluetooth blood pressure monitors and scales. Check Settings > Connected Devices for the full list.',
  },
  {
    question: 'How do I change my notification preferences?',
    answer:
      'Go to Settings > Notifications. You can toggle reminders for medications, appointments, fluid limits, and session logging individually.',
  },
  {
    question: 'Is my health data secure?',
    answer:
      'All data is encrypted in transit and at rest. We comply with healthcare data regulations and never share your information with third parties without your consent.',
  },
];

export default function Help() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<HelpChatSession | null>(null);
  const [pastSessions, setPastSessions] = useState<HelpChatSessionSummary[]>([]);
  const [messages, setMessages] = useState<HelpChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSessions, setShowSessions] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [sessionFilter, setSessionFilter] = useState<'all' | 'active' | 'resolved' | 'closed'>('all');

  const hasFetched = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [active, sessionsRes] = await Promise.all([
        getActiveHelpChatSession().catch(() => null),
        getHelpChatSessions({ limit: 50 }).catch(() => ({ sessions: [] })),
      ]);
      if (active) {
        setActiveSession(active);
        setMessages(active.messages);
      }
      setPastSessions(sessionsRes.sessions);
    } catch {
      // Silently handle — page still renders
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSession = async (message: string) => {
    if (!message.trim() || isSending) return;
    setIsSending(true);
    setError(null);

    // Show the user message immediately
    const userMsg: HelpChatMessage = {
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages([userMsg]);
    setInput('');

    try {
      const response = await startHelpChatSession(message.trim());
      const fullSession = await getHelpChatSession(response.sessionId);
      setActiveSession(fullSession);
      setMessages(fullSession.messages);
      // Refresh sessions list
      const sessionsRes = await getHelpChatSessions({ limit: 50 }).catch(() => ({ sessions: [] }));
      setPastSessions(sessionsRes.sessions);
    } catch {
      setError('Failed to start chat session. Please try again.');
      setMessages([]);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isSending || !activeSession) return;
    setIsSending(true);
    setError(null);

    const userMsg: HelpChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input.trim();
    setInput('');

    try {
      const response = await sendHelpChatMessage(activeSession.sessionId, currentInput);
      setMessages((prev) => [...prev, response.message]);
    } catch {
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleLoadSession = async (sessionId: string) => {
    try {
      setIsLoading(true);
      const session = await getHelpChatSession(sessionId);
      setActiveSession(session);
      setMessages(session.messages);
      setShowSessions(false);
    } catch {
      setError('Failed to load session.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSession = async () => {
    if (!activeSession) return;
    try {
      await closeHelpChatSession(activeSession.sessionId);
      setActiveSession(null);
      setMessages([]);
      const sessionsRes = await getHelpChatSessions({ limit: 50 }).catch(() => ({ sessions: [] }));
      setPastSessions(sessionsRes.sessions);
    } catch {
      setError('Failed to close session.');
    }
  };

  const handleResolveSession = async () => {
    if (!activeSession) return;
    try {
      await resolveHelpChatSession(activeSession.sessionId);
      setActiveSession(null);
      setMessages([]);
      const sessionsRes = await getHelpChatSessions({ limit: 50 }).catch(() => ({ sessions: [] }));
      setPastSessions(sessionsRes.sessions);
    } catch {
      setError('Failed to resolve session.');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteHelpChatSession(sessionId);
      if (activeSession?.sessionId === sessionId) {
        setActiveSession(null);
        setMessages([]);
      }
      setPastSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
    } catch {
      setError('Failed to delete session.');
    }
  };

  const handleNewSession = () => {
    setActiveSession(null);
    setMessages([]);
    setError(null);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (activeSession) {
        handleSendMessage();
      } else if (input.trim()) {
        handleStartSession(input);
      }
    }
  };

  const filteredSessions = pastSessions.filter((s) => {
    if (sessionFilter === 'all') return true;
    return s.status === sessionFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
            Active
          </span>
        );
      case 'resolved':
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400">
            Resolved
          </span>
        );
      case 'closed':
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
            Closed
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoading && !activeSession && messages.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Help & Support</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Get help from our AI assistant or browse common questions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSessions(!showSessions)}
            className="px-3 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {showSessions ? 'Hide History' : 'Chat History'}
          </button>
          {activeSession && (
            <button
              onClick={handleNewSession}
              className="px-3 py-2 text-sm font-medium rounded-xl bg-sky-500 text-white hover:bg-sky-600 transition-colors"
            >
              New Chat
            </button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-center justify-between">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600 dark:hover:text-red-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Past Sessions Panel */}
      {showSessions && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Past Sessions</h2>
            <div className="flex gap-1">
              {(['all', 'active', 'resolved', 'closed'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSessionFilter(filter)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                    sessionFilter === filter
                      ? 'bg-sky-500 text-white'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {filteredSessions.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
              No sessions found.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredSessions.map((session) => (
                <div
                  key={session.sessionId}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <button
                    onClick={() => handleLoadSession(session.sessionId)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-800 dark:text-white truncate">
                        {session.title}
                      </span>
                      {getStatusBadge(session.status)}
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      {session.messageCount} messages
                      {' -- '}
                      {new Date(session.createdAt).toLocaleDateString()}
                    </p>
                  </button>
                  <button
                    onClick={() => handleDeleteSession(session.sessionId)}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0 ml-2"
                    title="Delete session"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Help Suggestions — shown when no active chat */}
      {!activeSession && messages.length === 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-3">
            How can we help?
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {QUICK_HELP_SUGGESTIONS.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleStartSession(suggestion.message)}
                disabled={isSending}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-left hover:border-sky-500 dark:hover:border-sky-500 hover:shadow-sm transition-all disabled:opacity-50"
              >
                <span className="text-2xl block mb-2">{suggestion.icon}</span>
                <span className="text-sm font-medium text-slate-800 dark:text-white">
                  {suggestion.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Area */}
      {(activeSession || messages.length > 0) && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col" style={{ minHeight: '400px' }}>
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-slate-800 dark:text-white">
                {activeSession?.title || 'New Conversation'}
              </h2>
              {activeSession && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Started {new Date(activeSession.createdAt).toLocaleString()}
                </p>
              )}
            </div>
            {activeSession && activeSession.status === 'active' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResolveSession}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                >
                  Mark Resolved
                </button>
                <button
                  onClick={handleCloseSession}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
            {activeSession && activeSession.status !== 'active' && (
              <div className="flex items-center gap-2">
                {getStatusBadge(activeSession.status)}
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '500px' }}>
            {messages
              .filter((m) => m.role !== 'system')
              .map((message, idx) => (
                <div
                  key={idx}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    <p
                      className={`text-xs mt-1.5 ${
                        message.role === 'user'
                          ? 'text-sky-200'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}

            {isSending && (
              <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span
                      className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          {(!activeSession || activeSession.status === 'active') && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex gap-3">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={activeSession ? 'Type your message...' : 'Describe what you need help with...'}
                  rows={1}
                  className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-sm"
                />
                <button
                  onClick={() => {
                    if (activeSession) {
                      handleSendMessage();
                    } else {
                      handleStartSession(input);
                    }
                  }}
                  disabled={!input.trim() || isSending}
                  className="px-4 py-3 bg-sky-500 text-white rounded-xl hover:bg-sky-600 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isSending ? (
                    <svg
                      className="w-5 h-5 animate-spin"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FAQ Section */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-3">
          Frequently Asked Questions
        </h2>
        <div className="space-y-2">
          {FAQ_ITEMS.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <button
                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <span className="text-sm font-medium text-slate-800 dark:text-white">
                  {faq.question}
                </span>
                <svg
                  className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ml-2 ${
                    expandedFaq === idx ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedFaq === idx && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Still need help? Reach us at{' '}
          <a
            href="mailto:support@dialysis.live"
            className="text-sky-500 hover:text-sky-600 font-medium"
          >
            support@dialysis.live
          </a>
        </p>
      </div>
    </div>
  );
}
