import React, { useState } from 'react';
import { RiDownloadLine, RiFilePdfLine, RiFileTextLine, RiArrowDownSLine } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ExportButton = ({ onExportPDF, onExportCSV, disabled = false, label = 'Export' }) => {
  const { isPremium } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const premium = isPremium();

  const handleClick = (type) => {
    setOpen(false);
    if (!premium) {
      toast.error('Export is a Premium feature. Upgrade to download your data.');
      navigate('/pricing');
      return;
    }
    if (type === 'pdf') onExportPDF?.();
    else onExportCSV?.();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className="btn-secondary text-sm py-2 px-3 disabled:opacity-40"
      >
        <RiDownloadLine />
        {label}
        <RiArrowDownSLine className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        {!premium && (
          <span className="ml-1 text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full">PRO</span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-dark-900 border border-dark-700 rounded-xl shadow-xl overflow-hidden min-w-[160px]">
            <button
              onClick={() => handleClick('pdf')}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-dark-300 hover:text-white hover:bg-dark-800 transition-colors"
            >
              <RiFilePdfLine className="text-red-400 text-base" />
              Export PDF
            </button>
            <button
              onClick={() => handleClick('csv')}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-dark-300 hover:text-white hover:bg-dark-800 transition-colors border-t border-dark-800"
            >
              <RiFileTextLine className="text-green-400 text-base" />
              Export CSV
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportButton;
