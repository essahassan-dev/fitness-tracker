import React, { useState, useEffect, useRef } from 'react';
import { RiBellLine, RiCheckDoubleLine, RiDeleteBinLine } from 'react-icons/ri';
import { notificationAPI } from '../../../services/api';
import { useSuperAdmin } from '../../../context/SuperAdminContext';
import { useNavigate } from 'react-router-dom';

const SANotificationBell = () => {
  const { notifCount, setNotifCount } = useSuperAdmin();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const ref = useRef(null);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const res = await notificationAPI.getAll();
      const all  = res.data.data || [];
      setNotifs(all);
      setNotifCount(all.filter(n => !n.isRead).length);
    } catch { /* ignore */ }
  };

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAll = async () => {
    await notificationAPI.markRead();
    setNotifCount(0);
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const badgeDisplay = notifCount >= 100 ? '99+' : notifCount;

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(s => !s)}
        className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
        <RiBellLine className="text-xl" />
        {notifCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-xs font-bold text-white flex items-center justify-center"
            style={{ background: '#ef4444', fontSize: '10px' }}>
            {badgeDisplay}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl overflow-hidden shadow-2xl z-50"
          style={{ background: '#0d1424', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h3 className="text-white font-semibold text-sm">Notifications</h3>
            <button onClick={markAll} className="text-xs text-slate-500 hover:text-white flex items-center gap-1 transition-colors">
              <RiCheckDoubleLine /> Mark all read
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <p className="text-slate-600 text-sm text-center py-8">No notifications</p>
            ) : (
              notifs.slice(0, 20).map(n => (
                <div key={n._id} onClick={() => { setOpen(false); if (n.link) navigate(n.link); }}
                  className={`px-4 py-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${!n.isRead ? 'bg-white/[0.02]' : ''}`}>
                  <div className="flex items-start gap-3">
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0 mt-1.5" />}
                    <div className={`flex-1 ${n.isRead ? 'opacity-60' : ''}`}>
                      <p className="text-white text-xs font-semibold">{n.title}</p>
                      <p className="text-slate-400 text-xs mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="px-4 py-2.5 border-t border-white/5">
            <button onClick={() => { setOpen(false); navigate('/super-admin/notifications'); }}
              className="text-xs text-slate-500 hover:text-white transition-colors w-full text-center">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SANotificationBell;
