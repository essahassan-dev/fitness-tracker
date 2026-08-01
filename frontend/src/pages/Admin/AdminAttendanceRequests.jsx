import React, { useState, useEffect, useCallback } from 'react';
import {
  RiUserLocationLine, RiCheckLine, RiCloseLine,
  RiRefreshLine, RiCalendarLine, RiTimeLine,
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import { attendanceRequestAPI } from '../../services/api';
import { formatDate, getInitials, getErrorMessage } from '../../utils/helpers';
import { PageLoader } from '../../components/UI/LoadingSpinner';
import EmptyState from '../../components/UI/EmptyState';
import Modal from '../../components/UI/Modal';

const ReviewModal = ({ request, isOpen, onClose, onDone }) => {
  const [note, setNote]     = useState('');
  const [loading, setLoading] = useState(false);

  if (!request) return null;

  const handle = async (action) => {
    setLoading(true);
    try {
      if (action === 'approve') {
        await attendanceRequestAPI.approve(request._id, { adminNote: note });
        toast.success(`Attendance approved for ${request.user?.name}`);
      } else {
        await attendanceRequestAPI.reject(request._id, { adminNote: note });
        toast.success('Request rejected');
      }
      onDone();
      onClose();
      setNote('');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Review Attendance Request" size="sm">
      <div className="space-y-4">
        {/* User info */}
        <div className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-xl">
          <div className="w-10 h-10 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-brand-400 font-bold text-sm">{getInitials(request.user?.name)}</span>
          </div>
          <div>
            <p className="text-white font-semibold">{request.user?.name}</p>
            <p className="text-dark-500 text-xs">{request.user?.email}</p>
          </div>
        </div>

        {/* Details */}
        <div className="bg-dark-800/50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-dark-400">Date</span>
            <span className="text-white">{formatDate(request.date)}</span>
          </div>
          <div className="pt-2 border-t border-dark-700">
            <p className="text-dark-400 text-xs mb-1">Reason</p>
            <p className="text-white text-sm">"{request.reason}"</p>
          </div>
          <div className="text-dark-500 text-xs">
            Submitted {formatDate(request.createdAt, 'MMM d, h:mm a')}
          </div>
        </div>

        {/* Admin note */}
        <div>
          <label className="label">Note to user (optional)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Approved, get well soon!"
            className="input"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={() => handle('reject')} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-semibold text-sm transition-all disabled:opacity-50">
            <RiCloseLine /> Reject
          </button>
          <button onClick={() => handle('approve')} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-all disabled:opacity-50">
            {loading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><RiCheckLine /> Approve</>}
          </button>
        </div>
      </div>
    </Modal>
  );
};

const AdminAttendanceRequests = () => {
  const [requests, setRequests]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('PENDING');
  const [selected, setSelected]   = useState(null);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attendanceRequestAPI.getAll({ status: filter });
      setRequests(res.data.data);
      setPendingCount(res.data.pendingCount);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const STATUS_STYLES = {
    PENDING:  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    APPROVED: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
    REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <RiUserLocationLine className="text-blue-400" /> Attendance Requests
          </h1>
          <p className="page-subtitle">
            {pendingCount > 0
              ? `${pendingCount} pending request${pendingCount > 1 ? 's' : ''} waiting for review`
              : 'No pending requests'}
          </p>
        </div>
        <button onClick={fetchRequests} className="btn-secondary flex-shrink-0">
          <RiRefreshLine className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['PENDING', 'APPROVED', 'REJECTED', 'all'].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${filter === s ? 'bg-brand-500 text-white' : 'bg-dark-800 text-dark-400 hover:text-white'}`}>
            {s === 'all' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            {s === 'PENDING' && pendingCount > 0 && (
              <span className="ml-1.5 bg-yellow-500 text-dark-950 text-xs font-bold px-1.5 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? <PageLoader /> : requests.length === 0 ? (
        <EmptyState icon={RiUserLocationLine} title="No requests found" description={filter === 'PENDING' ? 'No pending attendance requests' : 'No requests in this category'} />
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r._id} className="card hover:border-dark-700 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-brand-400 text-sm font-bold">{getInitials(r.user?.name)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-semibold truncate">{r.user?.name}</p>
                    <p className="text-dark-500 text-xs">{r.user?.email}</p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium border flex-shrink-0 ${STATUS_STYLES[r.status]}`}>
                  {r.status}
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-dark-800 space-y-2">
                <div className="flex items-center gap-4 text-xs text-dark-400 flex-wrap">
                  <span className="flex items-center gap-1"><RiCalendarLine />{formatDate(r.date)}</span>
                  <span className="flex items-center gap-1"><RiTimeLine />{formatDate(r.createdAt, 'h:mm a')}</span>
                </div>
                <div className="bg-dark-800/50 rounded-xl p-3">
                  <p className="text-dark-400 text-xs mb-1">Reason</p>
                  <p className="text-white text-sm">"{r.reason}"</p>
                </div>
                {r.adminNote && (
                  <p className="text-dark-500 text-xs italic">Admin note: {r.adminNote}</p>
                )}
              </div>

              {r.status === 'PENDING' && (
                <button onClick={() => setSelected(r)} className="mt-3 btn-primary w-full justify-center text-sm py-2">
                  Review Request
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <ReviewModal request={selected} isOpen={!!selected} onClose={() => setSelected(null)} onDone={fetchRequests} />
    </div>
  );
};

export default AdminAttendanceRequests;
