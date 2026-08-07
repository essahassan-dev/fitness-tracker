import React, { useState } from 'react';
import { RiAlertLine, RiCloseLine } from 'react-icons/ri';

const ConfirmDialog = ({
  isOpen, onClose, onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  confirmClassName = 'bg-red-500 hover:bg-red-600 text-white',
  requireTyping = null, // string user must type to confirm
  loading = false,
}) => {
  const [typed, setTyped] = useState('');
  if (!isOpen) return null;

  const canConfirm = requireTyping ? typed === requireTyping : true;

  const handleClose = () => { setTyped(''); onClose(); };
  const handleConfirm = () => { if (canConfirm && !loading) { setTyped(''); onConfirm(); } };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#0d1424', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <RiAlertLine className="text-red-400 text-base" />
            </div>
            <h2 className="text-white font-bold text-base">{title}</h2>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-white p-1 transition-colors">
            <RiCloseLine className="text-xl" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-slate-300 text-sm leading-relaxed">{message}</p>
          {requireTyping && (
            <div>
              <p className="text-slate-500 text-xs mb-2">
                Type <span className="text-red-400 font-mono font-bold">{requireTyping}</span> to confirm:
              </p>
              <input
                value={typed}
                onChange={e => setTyped(e.target.value)}
                placeholder={requireTyping}
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500/50"
                autoFocus
              />
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button onClick={handleClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400 border border-white/10 hover:text-white hover:bg-white/5 transition-all">
              Cancel
            </button>
            <button onClick={handleConfirm} disabled={!canConfirm || loading}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${confirmClassName}`}>
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
