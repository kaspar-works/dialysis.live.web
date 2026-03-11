import React, { useState, useEffect, useRef } from 'react';
import { authFetch } from '../services/auth';

interface Conversation {
  _id: string;
  participants: { _id: string; name: string }[];
  lastMessage?: {
    content: string;
    createdAt: string;
    sender: string;
  };
  unreadCount: number;
  updatedAt: string;
}

interface Message {
  _id: string;
  conversationId: string;
  sender: { _id: string; name: string };
  content: string;
  read: boolean;
  createdAt: string;
}

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
  </svg>
);

const InboxIcon = () => (
  <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export default function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [newRecipientId, setNewRecipientId] = useState('');
  const [newMessageContent, setNewMessageContent] = useState('');
  const hasFetched = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserId = useRef<string>('');

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await authFetch('/messages');
      const data = res.conversations || res.data || res || [];
      setConversations(Array.isArray(data) ? data : []);
      if (res.userId) {
        currentUserId.current = res.userId;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (conversation: Conversation) => {
    try {
      setIsLoadingMessages(true);
      setError(null);
      const res = await authFetch(`/messages/${conversation._id}`);
      const data = res.messages || res.data || res || [];
      setMessages(Array.isArray(data) ? data : []);
      if (res.userId) {
        currentUserId.current = res.userId;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load messages');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSelectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowNewMessage(false);
    await fetchMessages(conversation);

    // Mark unread messages as read
    if (conversation.unreadCount > 0) {
      try {
        const unreadMessages = messages.filter(
          (m) => !m.read && m.sender._id !== currentUserId.current
        );
        for (const msg of unreadMessages) {
          await authFetch(`/messages/${msg._id}/read`, { method: 'PATCH' });
        }
        setConversations((prev) =>
          prev.map((c) =>
            c._id === conversation._id ? { ...c, unreadCount: 0 } : c
          )
        );
      } catch {
        // Silently fail on mark-read
      }
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || isSending) return;

    const otherParticipant = selectedConversation.participants.find(
      (p) => p._id !== currentUserId.current
    );
    if (!otherParticipant) return;

    try {
      setIsSending(true);
      const res = await authFetch('/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: otherParticipant._id,
          content: newMessage.trim(),
        }),
      });

      const sentMessage = res.message || res.data || res;
      if (sentMessage && sentMessage._id) {
        setMessages((prev) => [...prev, sentMessage]);
      }
      setNewMessage('');

      // Refresh conversations to update last message
      fetchConversations();
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendNewMessage = async () => {
    if (!newRecipientId.trim() || !newMessageContent.trim() || isSending) return;

    try {
      setIsSending(true);
      setError(null);
      await authFetch('/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: newRecipientId.trim(),
          content: newMessageContent.trim(),
        }),
      });

      setNewRecipientId('');
      setNewMessageContent('');
      setShowNewMessage(false);
      await fetchConversations();
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  const getOtherParticipant = (conversation: Conversation) => {
    return (
      conversation.participants.find((p) => p._id !== currentUserId.current) ||
      conversation.participants[0]
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Messages</h1>
        <button
          onClick={() => {
            setShowNewMessage(true);
            setSelectedConversation(null);
            setMessages([]);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <PlusIcon />
          New Message
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 text-red-700 dark:text-red-400 text-sm">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Two-column layout */}
      <div className="flex gap-4 h-[calc(100vh-180px)]">
        {/* Conversation list */}
        <div
          className={`${
            selectedConversation || showNewMessage ? 'hidden md:flex' : 'flex'
          } flex-col w-full md:w-96 md:flex-shrink-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden`}
        >
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Conversations
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="text-slate-300 dark:text-slate-600 mb-4">
                  <InboxIcon />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                  No conversations yet
                </p>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                  Start a new message to begin
                </p>
              </div>
            ) : (
              conversations.map((conversation) => {
                const other = getOtherParticipant(conversation);
                const isSelected = selectedConversation?._id === conversation._id;

                return (
                  <button
                    key={conversation._id}
                    onClick={() => handleSelectConversation(conversation)}
                    className={`w-full text-left p-4 border-b border-slate-100 dark:border-slate-800 transition-colors ${
                      isSelected
                        ? 'bg-sky-50 dark:bg-sky-900/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center text-sky-600 dark:text-sky-400 font-semibold text-sm flex-shrink-0">
                        {other?.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`font-medium truncate ${
                              conversation.unreadCount > 0
                                ? 'text-slate-900 dark:text-white'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {other?.name || 'Unknown'}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
                            {conversation.lastMessage
                              ? formatTime(conversation.lastMessage.createdAt)
                              : formatTime(conversation.updatedAt)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <p
                            className={`text-sm truncate ${
                              conversation.unreadCount > 0
                                ? 'text-slate-700 dark:text-slate-300 font-medium'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {conversation.lastMessage?.content || 'No messages yet'}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <span className="bg-sky-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                              {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Message thread / New message / Empty state */}
        <div
          className={`${
            !selectedConversation && !showNewMessage ? 'hidden md:flex' : 'flex'
          } flex-col flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden`}
        >
          {showNewMessage ? (
            /* New message form */
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setShowNewMessage(false)}
                  className="md:hidden text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <ChevronLeftIcon />
                </button>
                <h2 className="font-semibold text-slate-900 dark:text-white">
                  New Message
                </h2>
              </div>
              <div className="flex-1 p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Recipient ID
                  </label>
                  <input
                    type="text"
                    value={newRecipientId}
                    onChange={(e) => setNewRecipientId(e.target.value)}
                    placeholder="Enter recipient user ID"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Message
                  </label>
                  <textarea
                    value={newMessageContent}
                    onChange={(e) => setNewMessageContent(e.target.value)}
                    placeholder="Write your message..."
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm resize-none"
                  />
                </div>
                <button
                  onClick={handleSendNewMessage}
                  disabled={isSending || !newRecipientId.trim() || !newMessageContent.trim()}
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-600/50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors"
                >
                  {isSending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </div>
          ) : selectedConversation ? (
            /* Message thread */
            <div className="flex flex-col h-full">
              {/* Thread header */}
              <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => {
                    setSelectedConversation(null);
                    setMessages([]);
                  }}
                  className="md:hidden text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <ChevronLeftIcon />
                </button>
                <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center text-sky-600 dark:text-sky-400 font-semibold text-sm">
                  {getOtherParticipant(selectedConversation)
                    ?.name?.charAt(0)
                    ?.toUpperCase() || '?'}
                </div>
                <h2 className="font-semibold text-slate-900 dark:text-white">
                  {getOtherParticipant(selectedConversation)?.name || 'Unknown'}
                </h2>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-8 h-8 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-slate-400 dark:text-slate-500 text-sm">
                      No messages yet. Send the first message!
                    </p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwn = message.sender._id === currentUserId.current;
                    return (
                      <div
                        key={message._id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                            isOwn
                              ? 'bg-sky-600 text-white'
                              : 'bg-slate-700 text-white'
                          }`}
                        >
                          {!isOwn && (
                            <p className="text-xs font-medium text-slate-300 mb-1">
                              {message.sender.name}
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              isOwn ? 'text-sky-200' : 'text-slate-400'
                            }`}
                          >
                            {formatTimestamp(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-end gap-2">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    rows={1}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm resize-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isSending || !newMessage.trim()}
                    className="p-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-600/50 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex-shrink-0"
                  >
                    {isSending ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <SendIcon />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Empty state - no conversation selected */
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="text-slate-300 dark:text-slate-600 mb-4">
                <InboxIcon />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                Select a conversation
              </p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                Choose a conversation from the list or start a new message
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
