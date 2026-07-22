import React, { useState, useEffect, useCallback } from 'react';
import {
  RiBellLine, RiCloseLine, RiCheckLine, RiDeleteBinLine,
  RiTrophyLine, RiAlertLine, RiInformationLine, RiFlashlightLine,
} from 'react-icons/ri';
import { notificationAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatRelativeDate } from '../../utils/helpers';

const TYPE_ICONS = {
  success:    { icon: RiTrophyLine,      color: 'text-brand-400',  bg: 'bg-brand-500/10 border-brand-500/20' },
  warning:    { icon: RiAlertLine,       color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  motivation: { icon: RiFlashlightLine,  color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  info:       { icon: RiInformationLine, color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
};

const NotificationBell = () => {
  const { user } = useAuth();
  const [open, setOpen]           = useState(false);
  const [notifications, setNotifs] = useState([]);
  const [unread, setUnread]       = useState(0);

  // Skip for admin/trainer
  if (user?.role === 'admin' || user?.role === 'trainer') return null;

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await notificationAPI.getAll();
      setNotifs(res.data.data);
      setUnread(res.data.unread);
    } catch {}
  }, []);

  // Poll every 30 seconds
  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifs]);

  const handleOpen = async () => {
    setOpen(true);
    if (unread > 0) {
      await notificationAPI.markRead().catch(() => {});
      setUnread(0);
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    await notificationAPI.deleteOne(id).catch(() => {});
    setNotifs((prev) => prev.filter((n) => n._id !== id));
  };

  const handleClear = async () => {
    await notificationAPI.clearAll().catch(() => {});
    setNotifs([]);
    setUnread(0);
  };

  return (
    <div className="relative">
      <button
        onClick={open ? () => setOpen(false) : handleOpen}
        className="relative p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-xl transition-colors"
        title="Notifications"
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
                <RiBellLine className="text-brand-400" />
                <span className="text-white font-semibold text-sm">Notifications</span>
                {notifications.length > 0 && (
                  <span className="text-xs text-dark-500">({notifications.length})</span>
                )}
              </div>
              <div className="flex gap-1">
                {notifications.length > 0 && (
                  <button onClick={handleClear} className="text-xs text-dark-500 hover:text-red-400 px-2 py-1 rounded-lg transition-colors">
                    Clear all
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-dark-500 hover:text-white p-1 rounded-lg transition-colors">
                  <RiCloseLine />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <RiBellLine className="text-3xl text-dark-700 mx-auto mb-2" />
                  <p className="text-dark-500 text-sm">No notifications yet</p>
                  <p className="text-dark-600 text-xs mt-1">Log a workout or meal to get started</p>
                </div>
              ) : (
                <div className="divide-y divide-dark-800">
                  {notifications.map((n) => {
                    const cfg = TYPE_ICONS[n.type] || TYPE_ICONS.info;
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={n._id}
                        className={`flex items-start gap-3 p-4 hover:bg-dark-800/30 transition-colors ${!n.isRead ? 'bg-dark-800/20' : ''}`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border ${cfg.bg}`}>
                          <Icon className={`text-sm ${cfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-medium ${n.isRead ? 'text-dark-300' : 'text-white'}`}>
                              {n.title}
                            </p>
                            <button
                              onClick={(e) => handleDelete(n._id, e)}
                              className="text-dark-600 hover:text-red-400 flex-shrink-0 p-0.5 rounded transition-colors"
                            >
                              <RiCloseLine className="text-xs" />
                            </button>
                          </div>
                          <p className="text-dark-400 text-xs mt-0.5 leading-relaxed">{n.message}</p>
                          <p className="text-dark-600 text-xs mt-1">{formatRelativeDate(n.createdAt)}</p>
                        </div>
                        {!n.isRead && (
                          <div className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0 mt-1.5" />
                        )}
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

export default NotificationBell;
