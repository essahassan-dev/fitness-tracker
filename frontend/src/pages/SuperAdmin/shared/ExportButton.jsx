import React, { useState } from 'react';
import { RiDownloadLine, RiArrowDownSLine } from 'react-icons/ri';

const ExportButton = ({ onExport, formats = ['csv', 'pdf'], loading = false }) => {
  const [open, setOpen] = useState(false);

  if (formats.length === 1) {
    return (
      <button onClick={() => onExport(formats[0])} disabled={loading}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-all disabled:opacity-50">
        <RiDownloadLine className="text-base" /> Export {formats[0].toUpperCase()}
      </button>
    );
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(s => !s)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-all">
        <RiDownloadLine className="text-base" /> Export <RiArrowDownSLine />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 rounded-xl overflow-hidden shadow-2xl z-20"
          style={{ background: '#0d1424', border: '1px solid rgba(255,255,255,0.1)', minWidth: '120px' }}>
          {formats.map(f => (
            <button key={f} onClick={() => { onExport(f); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
              Export {f.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExportButton;
