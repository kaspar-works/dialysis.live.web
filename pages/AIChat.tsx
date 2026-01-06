import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ICONS } from '../constants';
import { chat, getAIUsage, ChatMessage, ChatResponse, AIUsage, MEDICAL_DISCLAIMER } from '../services/ai';
import { FeatureRestrictedError, SubscriptionLimitError } from '../services/auth';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AIChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [usage, setUsage] = useState<AIUsage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [featureError, setFeatureError] = useState<{ message: string } | null>(null);
  const [limitError, setLimitError] = useState<{ message: string; limit?: number } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Fetch initial usage
    getAIUsage().then(setUsage).catch(() => {});
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
    setFeatureError(null);
    setLimitError(null);

    try {
      // Build conversation history
      const history: ChatMessage[] = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));
      history.push({ role: 'user', content: userMessage.content });

      const response = await chat(userMessage.content, history);

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Update usage
      const usageData = await getAIUsage().catch(() => null);
      if (usageData) setUsage(usageData);
    } catch (err) {
      if (err instanceof FeatureRestrictedError) {
        setFeatureError({ message: err.message });
        // Remove the user message since it failed
        setMessages(prev => prev.slice(0, -1));
      } else if (err instanceof SubscriptionLimitError) {
        setLimitError({ message: err.message, limit: err.limit });
        setMessages(prev => prev.slice(0, -1));
      } else {
        setError('Failed to send message. Please try again.');
      }
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center">
              <ICONS.MessageSquare className="w-5 h-5 text-white" />
            </div>
            AI Health Assistant
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Ask questions about dialysis, nutrition, and kidney health
          </p>
        </div>
        <div className="flex items-center gap-4">
          {usage && (
            <div className="text-sm text-slate-500 dark:text-slate-400">
              <span className="font-medium">{usage.used}</span>
              {usage.limit ? ` / ${usage.limit}` : ''} requests
            </div>
          )}
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              title="Clear chat"
            >
              <ICONS.Trash className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Feature Restricted Banner */}
      {featureError && (
        <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-2xl p-4 mb-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <ICONS.Lock className="w-5 h-5 text-purple-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Premium Feature</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">{featureError.message}</p>
              <Link
                to="/subscription/pricing"
                className="inline-flex items-center gap-2 mt-2 text-purple-500 text-sm font-medium hover:text-purple-600"
              >
                View Plans <ICONS.ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Limit Reached Banner */}
      {limitError && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4 mb-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <ICONS.AlertCircle className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Limit Reached</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">{limitError.message}</p>
              <Link
                to="/subscription/pricing"
                className="inline-flex items-center gap-2 mt-2 text-amber-500 text-sm font-medium hover:text-amber-600"
              >
                Upgrade <ICONS.ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !isLoading && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-sky-100 dark:bg-sky-900/30 rounded-2xl flex items-center justify-center mb-4">
                <ICONS.MessageSquare className="w-8 h-8 text-sky-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                Start a Conversation
              </h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">
                Ask me anything about dialysis, kidney health, nutrition, or managing your condition.
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {[
                  "What foods should I avoid?",
                  "How to manage fluid intake?",
                  "Why do I feel tired after dialysis?",
                  "Tips for managing phosphorus",
                ].map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(suggestion)}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ICONS.Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-sky-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-sky-100' : 'text-slate-400'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 bg-slate-200 dark:bg-slate-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ICONS.User className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <ICONS.Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Disclaimer */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700">
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center italic">
            {MEDICAL_DISCLAIMER}
          </p>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700">
          {error && (
            <div className="bg-red-500/10 text-red-500 text-sm p-2 rounded-lg mb-3">
              {error}
            </div>
          )}
          <div className="flex gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question..."
              rows={1}
              className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-4 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center"
            >
              {isLoading ? (
                <ICONS.RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <ICONS.Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatPage;
