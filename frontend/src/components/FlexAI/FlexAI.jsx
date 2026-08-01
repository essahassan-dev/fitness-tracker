import React, { useState, useRef, useEffect } from 'react';
import { RiCloseLine, RiSendPlaneLine, RiRobot2Line, RiSparklingLine, RiUser3Line, RiRefreshLine, RiSubtractLine } from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const SUGGESTIONS = ['How much protein do I need?', 'Best home workout plan', 'How to lose belly fat?', 'Explain Weekly Plan'];

const FlexAI = () => {
  const { user } = useAuth();
  const [open, setOpen]       = useState(false);
  const [min, setMin]         = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', content: `Hey${user?.name ? ` ${user.name.split(' ')[0]}` : ''}! I'm **FLEX AI** — your personal fitness coach. Ask me anything!` }]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (open && !min) setTimeout(() => inputRef.current?.focus(), 100); }, [open, min]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    const updated = [...messages, { role: 'user', content: msg }];
    setMessages(updated);
    setLoading(true);
    try {
      const res = await api.post('/ai/chat', { message: msg, history: updated.slice(-8) });
      setMessages((p) => [...p, { role: 'assistant', content: res.data.reply }]);
    } catch {
      setMessages((p) => [...p, { role: 'assistant', content: 'Sorry, something went wrong. Try again!', error: true }]);
    } finally { setLoading(false); }
  };

  const clear = () => setMessages([{ role: 'assistant', content: 'Chat cleared! Ask me anything about fitness.' }]);

  const renderText = (t) => t?.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/^- (.+)$/gm, '<li>$1</li>').replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul style="padding-left:16px;margin:4px 0">${m}</ul>`).replace(/\n/g, '<br/>') || '';

  return (
    <>
      {/* Chat window */}
      {open && (
        <div className={`fixed bottom-20 right-4 z-50 transition-all duration-300 ${min ? 'w-64 h-14' : 'w-80 sm:w-96'}`}
          style={min ? {} : { height: '520px' }}>
          <div className="w-full h-full flex flex-col rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: 'rgba(9,12,22,0.97)', border: '1px solid rgba(59,130,246,0.2)', backdropFilter: 'blur(20px)' }}>

            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(29,78,216,0.4) 0%, rgba(15,23,42,0.6) 100%)', borderBottom: '1px solid rgba(59,130,246,0.15)' }}>
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', boxShadow: '0 0 16px rgba(59,130,246,0.4)' }}>
                  <RiSparklingLine className="text-white text-sm" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-dark-950 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">FLEX AI</p>
                {!min && <p className="text-xs" style={{ color: 'rgba(96,165,250,0.8)' }}>Your fitness coach · Online</p>}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={clear} title="Clear" className="p-1.5 rounded-lg transition-colors hover:bg-white/5 text-slate-400 hover:text-white">
                  <RiRefreshLine className="text-sm" />
                </button>
                <button onClick={() => setMin(!min)} className="p-1.5 rounded-lg transition-colors hover:bg-white/5 text-slate-400 hover:text-white">
                  <RiSubtractLine className="text-sm" />
                </button>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg transition-colors hover:bg-white/5 text-slate-400 hover:text-white">
                  <RiCloseLine className="text-base" />
                </button>
              </div>
            </div>

            {!min && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(59,130,246,0.2) transparent' }}>
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar */}
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-brand-600 to-blue-700'
                          : 'bg-gradient-to-br from-blue-800 to-indigo-900'
                      }`} style={{ border: '1px solid rgba(59,130,246,0.3)' }}>
                        {msg.role === 'user'
                          ? <RiUser3Line className="text-blue-200 text-xs" />
                          : <RiSparklingLine className="text-blue-300 text-xs" />}
                      </div>

                      {/* Bubble */}
                      <div className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'text-white rounded-tr-sm'
                          : msg.error
                          ? 'text-red-300 rounded-tl-sm'
                          : 'text-slate-200 rounded-tl-sm'
                      }`} style={{
                        background: msg.role === 'user'
                          ? 'linear-gradient(135deg, #1d4ed8, #2563eb)'
                          : msg.error
                          ? 'rgba(239,68,68,0.1)'
                          : 'rgba(30,41,59,0.8)',
                        border: msg.role === 'user' ? 'none' : '1px solid rgba(59,130,246,0.1)',
                        boxShadow: msg.role === 'user' ? '0 4px 12px rgba(29,78,216,0.3)' : 'none',
                      }}
                        dangerouslySetInnerHTML={{ __html: renderText(msg.content) }}
                      />
                    </div>
                  ))}

                  {loading && (
                    <div className="flex gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-800 to-indigo-900 flex items-center justify-center flex-shrink-0"
                        style={{ border: '1px solid rgba(59,130,246,0.3)' }}>
                        <RiSparklingLine className="text-blue-300 text-xs animate-pulse" />
                      </div>
                      <div className="px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5"
                        style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(59,130,246,0.1)' }}>
                        {[0, 150, 300].map((d) => (
                          <div key={d} className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Suggestions */}
                {messages.length === 1 && (
                  <div className="px-4 pb-3 flex gap-2 overflow-x-auto flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
                    {SUGGESTIONS.map((q) => (
                      <button key={q} onClick={() => send(q)}
                        className="text-xs px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 transition-all hover:scale-105"
                        style={{ background: 'rgba(29,78,216,0.15)', border: '1px solid rgba(59,130,246,0.25)', color: 'rgba(147,197,253,0.9)' }}>
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input */}
                <div className="flex gap-2 px-3 pb-3 flex-shrink-0">
                  <input
                    ref={inputRef} value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
                    placeholder="Ask FLEX AI anything..."
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 text-xs rounded-xl text-white placeholder-slate-500 focus:outline-none transition-all"
                    style={{ background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(59,130,246,0.15)', color: 'white' }}
                  />
                  <button onClick={() => send()} disabled={loading || !input.trim()}
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:scale-105 disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', boxShadow: loading || !input.trim() ? 'none' : '0 0 16px rgba(59,130,246,0.4)' }}>
                    <RiSendPlaneLine className="text-white text-sm" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button onClick={() => { setOpen(!open); setMin(false); }}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110"
        style={{
          background: open ? 'rgba(15,23,42,0.9)' : 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
          border: '1px solid rgba(59,130,246,0.3)',
          boxShadow: open ? 'none' : '0 0 24px rgba(59,130,246,0.35)',
        }}
        title="FLEX AI">
        {open ? <RiCloseLine className="text-white text-xl" /> : <RiRobot2Line className="text-white text-xl" />}
        {!open && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-dark-950 animate-pulse" />}
      </button>
    </>
  );
};

export default FlexAI;
