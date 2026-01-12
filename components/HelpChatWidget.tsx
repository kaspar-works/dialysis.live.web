import React, { useState, useEffect, useRef } from 'react';
import { ICONS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import {
  startHelpChatSession,
  sendHelpChatMessage,
  getActiveHelpChatSession,
  getHelpChatSessions,
  getHelpChatSession,
  closeHelpChatSession,
  HelpChatMessage,
  HelpChatSession,
  HelpChatSessionSummary,
  QUICK_HELP_SUGGESTIONS,
} from '../services/helpChat';

const HelpChatWidget: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [view, setView] = useState<'chat' | 'history'>('chat');

  // Chat state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<HelpChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // History state
  const [sessions, setSessions] = useState<HelpChatSessionSummary[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Load active session when widget opens
  useEffect(() => {
    if (isOpen && isAuthenticated && !sessionId && !isLoading) {
      loadActiveSession();
    }
  }, [isOpen, isAuthenticated]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const loadActiveSession = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const activeSession = await getActiveHelpChatSession();
      if (activeSession) {
        setSessionId(activeSession.sessionId);
        setMessages(activeSession.messages);
      }
    } catch (err: any) {
      console.error('Failed to load active session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadChatHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const result = await getHelpChatSessions({ limit: 20 });
      setSessions(result.sessions);
    } catch (err: any) {
      console.error('Failed to load chat history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadSession = async (sessionIdToLoad: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await getHelpChatSession(sessionIdToLoad);
      setSessionId(session.sessionId);
      setMessages(session.messages);
      setView('chat');
    } catch (err: any) {
      setError('Failed to load chat session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const message = messageText || inputValue.trim();
    if (!message || isSending) return;

    setInputValue('');
    setError(null);
    setIsSending(true);

    // Add user message optimistically
    const userMessage: HelpChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      let response;
      if (sessionId) {
        response = await sendHelpChatMessage(sessionId, message);
      } else {
        response = await startHelpChatSession(message);
        setSessionId(response.sessionId);
      }

      // Add assistant response
      setMessages(prev => [...prev, response.message]);
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
      // Remove the optimistic user message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsSending(false);
    }
  };

  const handleNewChat = async () => {
    if (sessionId && messages.length > 0) {
      try {
        await closeHelpChatSession(sessionId);
      } catch (err) {
        // Ignore close errors
      }
    }
    setSessionId(null);
    setMessages([]);
    setError(null);
    setView('chat');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleViewHistory = () => {
    setView('history');
    loadChatHistory();
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'long' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Don't render if not authenticated
  if (!isAuthenticated) return null;

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-full shadow-lg shadow-sky-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          aria-label="Open help chat"
        >
          <ICONS.MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed z-50 ${
            isMinimized
              ? 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-72'
              : 'inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-96 sm:h-[600px] sm:max-h-[80vh]'
          } flex flex-col bg-white dark:bg-slate-800 sm:rounded-2xl shadow-2xl overflow-hidden transition-all duration-200`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <ICONS.HelpCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base">Help & Support</h3>
                <p className="text-[10px] sm:text-xs text-white/80">
                  {isSending ? 'Typing...' : 'Ask me anything'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!isMinimized && (
                <>
                  <button
                    onClick={handleNewChat}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    title="New chat"
                  >
                    <ICONS.Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={handleViewHistory}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    title="Chat history"
                  >
                    <ICONS.Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </>
              )}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors hidden sm:block"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? (
                  <ICONS.Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <ICONS.Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Close"
              >
                <ICONS.X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          {!isMinimized && (
            <>
              {view === 'chat' ? (
                <>
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
                    {isLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="w-8 h-8 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="space-y-4">
                        {/* Welcome Message */}
                        <div className="bg-sky-50 dark:bg-sky-500/10 rounded-2xl p-4">
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            Hi! I'm your support assistant. I can help you with:
                          </p>
                          <ul className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                            <li>- Using app features</li>
                            <li>- Account & settings</li>
                            <li>- Subscription questions</li>
                            <li>- Troubleshooting issues</li>
                          </ul>
                        </div>

                        {/* Quick Suggestions */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                            Quick help
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {QUICK_HELP_SUGGESTIONS.slice(0, 4).map((suggestion, i) => (
                              <button
                                key={i}
                                onClick={() => handleSendMessage(suggestion.message)}
                                disabled={isSending}
                                className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                              >
                                <span className="text-lg">{suggestion.icon}</span>
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                                  {suggestion.label}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      messages.map((msg, i) => (
                        <div
                          key={i}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                              msg.role === 'user'
                                ? 'bg-sky-500 text-white rounded-br-md'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-md'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            <p
                              className={`text-[10px] mt-1 ${
                                msg.role === 'user' ? 'text-white/70' : 'text-slate-400'
                              }`}
                            >
                              {formatTime(msg.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}

                    {/* Typing indicator */}
                    {isSending && (
                      <div className="flex justify-start">
                        <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl rounded-bl-md px-4 py-3">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Error message */}
                    {error && (
                      <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-xl">
                        <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex gap-2">
                      <textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message..."
                        rows={1}
                        className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                        style={{ minHeight: '42px', maxHeight: '120px' }}
                      />
                      <button
                        onClick={() => handleSendMessage()}
                        disabled={!inputValue.trim() || isSending}
                        className="w-10 h-10 sm:w-11 sm:h-11 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white rounded-xl flex items-center justify-center transition-colors disabled:cursor-not-allowed"
                      >
                        <ICONS.Send className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 text-center">
                      Press Enter to send, Shift+Enter for new line
                    </p>
                  </div>
                </>
              ) : (
                /* History View */
                <div className="flex-1 overflow-y-auto">
                  <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-700">
                    <button
                      onClick={() => setView('chat')}
                      className="flex items-center gap-2 text-sm text-sky-500 hover:text-sky-600"
                    >
                      <ICONS.ChevronLeft className="w-4 h-4" />
                      Back to chat
                    </button>
                  </div>

                  {isLoadingHistory ? (
                    <div className="flex items-center justify-center h-48">
                      <div className="w-8 h-8 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="p-6 text-center">
                      <ICONS.MessageCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        No chat history yet
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                      {sessions.map((session) => (
                        <button
                          key={session.sessionId}
                          onClick={() => loadSession(session.sessionId)}
                          className="w-full p-3 sm:p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                                {session.title}
                              </p>
                              {session.lastMessage && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                  {session.lastMessage}
                                </p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-[10px] text-slate-400">
                                {formatDate(session.updatedAt)}
                              </p>
                              <span
                                className={`inline-block mt-1 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded ${
                                  session.status === 'active'
                                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                    : session.status === 'resolved'
                                    ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400'
                                    : 'bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-400'
                                }`}
                              >
                                {session.status}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Minimized state */}
          {isMinimized && (
            <div className="p-3 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click to expand chat
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default HelpChatWidget;
