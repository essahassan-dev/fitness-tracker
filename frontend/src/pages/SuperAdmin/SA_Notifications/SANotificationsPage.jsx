import React, { useState, useEffect } from 'react';
import { RiCheckDoubleLine, RiDeleteBinLine, RiBellLine } from 'react-icons/ri';
import { notificationAPI } from '../../../services/api';
import { SkeletonTable } from '../shared/SkeletonKPI';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const SANotificationsPage = () => {
  const [notifs, setNotifs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try { const r = await notificationAPI.getAll(); setNotifs(r.data.data || []); }
    catch { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const markAll = async () => {
    await notificationAPI.markRead();
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    toast.success('All marked as read');
  };

  const deleteOne = async (id) => {
    await notificationAPI.deleteOne(id);
    setNotifs(prev => prev.filter(n => n._id !== id));
  };

  const clearAll = async () => {
    await notificationAPI.clearAll();
    setNotifs([]);
    toast.success('Cleared all notifications');
  };

  const typeColors = { success:'text-green-400', warning:'text-yellow-400', info:'text-blue-400', motivation:'text-purple-400' };
  const fmtDate = (d) => d ? new Date(d).toLocaleString() : '';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Notifications</h1>
          <p className="text-slate-500 text-sm mt-0.5">{notifs.filter(n=>!n.isRead).length} unread of {notifs.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={markAll} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-white bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-all">
            <RiCheckDoubleLine /> Mark all read
          </button>
          <button onClick={clearAll} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-red-400 hover:text-red-300 bg-red-400/8 border border-red-400/20 hover:bg-red-400/15 transition-all">
            <RiDeleteBinLine /> Clear all
          </button>
        </div>
      </div>

      {loading ? <SkeletonTable rows={6} cols={3} /> : notifs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <RiBellLine className="text-4xl text-slate-700 mb-3" />
          <p className="text-white font-semibold">No notifications</p>
          <p className="text-slate-500 text-sm mt-1">You're all caught up</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border:'1px solid rgba(255,255,255,0.07)' }}>
          {notifs.map((n, i) => (
            <div key={n._id}
              className={`flex items-start gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors cursor-pointer ${!n.isRead ? 'bg-white/[0.015]' : ''}`}
              style={{ borderBottom: i < notifs.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
              onClick={() => { if (n.link) navigate(n.link); }}>
              {!n.isRead && <span className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0 mt-2" />}
              <div className="flex-1 min-w-0" style={{ marginLeft: n.isRead ? '14px' : '0' }}>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white text-sm font-semibold">{n.title}</p>
                  <span className={`text-xs ${typeColors[n.type] || 'text-slate-400'}`}>{n.type}</span>
                </div>
                <p className="text-slate-400 text-sm">{n.message}</p>
                <p className="text-slate-600 text-xs mt-1">{fmtDate(n.createdAt)}</p>
              </div>
              <button onClick={e => { e.stopPropagation(); deleteOne(n._id); }}
                className="text-slate-600 hover:text-red-400 p-1 flex-shrink-0 transition-colors">
                <RiDeleteBinLine />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SANotificationsPage;
