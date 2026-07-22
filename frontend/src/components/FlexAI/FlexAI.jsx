import React, { useState, useRef, useEffect } from 'react';
import {
  RiRobot2Line, RiCloseLine, RiSendPlaneLine,
  RiUser3Line, RiRefreshLine, RiSparklingLine,
} from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const SUGGESTIONS = [
  'How much protein do I need?',
  'Best exercises for weight loss',
  'How to gain muscle fast',
  'How to use Weekly Plan',
];

const FlexAI = () => {
  const { user } = useAuth();
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hey${user?.name ? ` ${user.name.split(' ')[0]}` : ''}! I'm **FLEX AI** — your personal fitness assistant. Ask me anything about workouts, nutrition, or FitStack!`,
    },
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');

    const updated = [...messages, { role: 'user', content: msg }];
    setMessages(updated);
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        message: msg,
        history: updated.slice(-8),
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.', error: true }]);
    } finally {
      setLoading(false);
    }
  };

  const clear = () => setMessages([{
    role: 'assistant',
    content: 'Chat cleared! Ask me anything about fitness or FitStack.',
  }]);

  const renderText = (text) =>
    text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul class="list-disc pl-4 space-y-0.5 mt-1">${m}</ul>`)
      .replace(/\n/g, '<br/>');

  return (
    <>
      {/* Chat window — bottom RIGHT */}
      {open && (
        <div
          className="fixed bottom-20 right-4 z-50 w-80 sm:w-96 flex flex-col bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
          style={{ height: '480px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-brand-500/20 to-blue-600/20 border-b border-dark-800 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center">
                <RiSparklingLine className="text-white text-sm" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">FLEX AI</p>
                <p className="text-brand-400 text-xs">Fitness Assistant</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={clear} title="Clear" className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors">
                <RiRefreshLine className="text-sm" />
              </button>
              <button onClick={() => setOpen(false)} className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors">
                <RiCloseLine className="text-base" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  msg.role === 'user' ? 'bg-brand-500/20 border border-brand-500/30' : 'bg-blue-500/20 border border-blue-500/30'
                }`}>
                  {msg.role === 'user'
                    ? <RiUser3Line className="text-brand-400 text-xs" />
                    : <RiSparklingLine className="text-blue-400 text-xs" />}
                </div>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-brand-500/20 border border-brand-500/20 text-white'
                      : msg.error
                      ? 'bg-red-500/10 border border-red-500/20 text-red-300'
                      : 'bg-dark-800 border border-dark-700 text-dark-200'
                  }`}
                  dangerouslySetInnerHTML={{ __html: renderText(msg.content) }}
                />
              </div>
            ))}

            {loading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <RiSparklingLine className="text-blue-400 text-xs animate-pulse" />
                </div>
                <div className="bg-dark-800 border border-dark-700 rounded-xl px-3 py-2.5">
                  <div className="flex gap-1 items-center">
                    {[0, 150, 300].map((d) => (
                      <span key={d} className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions — only on first open */}
          {messages.length === 1 && (
            <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto flex-shrink-0">
              {SUGGESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-xs bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white border border-dark-700 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors flex-shrink-0"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 px-3 pb-3 flex-shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask FLEX AI anything..."
              className="flex-1 bg-dark-800 border border-dark-700 text-white placeholder-dark-500 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-9 h-9 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-all flex-shrink-0"
            >
              <RiSendPlaneLine className="text-sm" />
            </button>
          </form>
        </div>
      )}

      {/* Toggle button — bottom RIGHT */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-4 right-4 z-50 rounded-2xl shadow-lg flex items-center justify-center transition-all duration-300 ${
          open ? 'bg-dark-800 border border-dark-700 text-white' : 'bg-brand-500 hover:bg-brand-600 text-white shadow-brand-500/30'
        }`}
        style={{ width: '52px', height: '52px' }}
        title="FLEX AI"
      >
        {open ? <RiCloseLine className="text-xl" /> : <RiRobot2Line className="text-xl" />}
        {!open && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-dark-950 animate-pulse" />}
      </button>
    </>
  );
};

export default FlexAI;
