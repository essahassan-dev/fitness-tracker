import React, { useState, useEffect } from 'react';
import {
  RiBellLine, RiCloseLine, RiChatCheckLine,
  RiThumbUpLine, RiEditLine, RiAlertLine, RiUserHeartLine,
} from 'react-icons/ri';
import { trainerAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/helpers';

const TYPE_CONFIG = {
  feedback:      { icon: RiChatCheckLine, color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20',   label: 'Feedback' },
  encouragement: { icon: RiThumbUpLine,   color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20', label: 'Encouragement' },
  correction:    { icon: RiEditLine,      color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', label: 'Correction' },
  warning:       { icon: RiAlertLine,     color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20',     label: 'Warning' },
};

const TrainerRemarks = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [remarks, setRemarks] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // Only show for regular users (not admin, not trainer)
  const isRegularUser = user?.role === 'user';

  useEffect(() => {
    if (!isRegularUser) return;
    trainerAPI.getUnreadCount()
      .then((res) => setUnread(res.data.data.count))
      .catch(() => {});
  }, [isRegularUser]);

  if (!isRegularUser) return null;

  const handleOpen = async () => {
    setOpen(true);
    if (!loaded) {
      try {
        const res = await trainerAPI.getMyRemarks();
        setRemarks(res.data.data);
        setUnread(0);
        setLoaded(true);
      } catch {}
    } else {
      setUnread(0);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-xl transition-colors"
        title="Trainer Remarks"
      >
        <RiBellLine className="text-xl" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-40 w-80 bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-dark-800">
              <div className="flex items-center gap-2">
                <RiUserHeartLine className="text-blue-400" />
                <span className="text-white font-semibold text-sm">Trainer Remarks</span>
                {unread === 0 && remarks.length > 0 && (
                  <span className="text-xs text-dark-500">({remarks.length})</span>
                )}
              </div>
              <button onClick={() => setOpen(false)} className="text-dark-500 hover:text-white transition-colors">
                <RiCloseLine />
              </button>
            </div>

            {/* Body */}
            <div className="max-h-96 overflow-y-auto">
              {remarks.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <RiBellLine className="text-3xl text-dark-700 mx-auto mb-2" />
                  <p className="text-dark-500 text-sm">No remarks from your trainer yet</p>
                  {!user?.assignedTrainer && (
                    <p className="text-dark-600 text-xs mt-1">Ask your admin to assign a trainer</p>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-dark-800">
                  {remarks.map((r) => {
                    const cfg = TYPE_CONFIG[r.type] || TYPE_CONFIG.feedback;
                    const Icon = cfg.icon;
                    return (
                      <div key={r._id} className="p-4 hover:bg-dark-800/30 transition-colors">
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg} border`}>
                            <Icon className={`text-sm ${cfg.color}`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            {/* Type + date */}
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                              <span className="text-dark-600 text-xs flex-shrink-0">
                                {formatDate(r.createdAt, 'MMM d, h:mm a')}
                              </span>
                            </div>

                            {/* Related to */}
                            {r.relatedTo && (
                              <p className="text-dark-500 text-xs mb-1 flex items-center gap-1">
                                <span className="text-dark-600">Re:</span> {r.relatedTo}
                              </p>
                            )}

                            {/* Message */}
                            <p className="text-white text-sm leading-relaxed">{r.message}</p>

                            {/* Trainer name */}
                            <p className="text-dark-600 text-xs mt-1.5">
                              — {r.trainer?.name || 'Your Trainer'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TrainerRemarks;
