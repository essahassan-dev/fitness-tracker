import React, { useState, useEffect, useCallback } from 'react';
import {
  RiCheckLine, RiCloseLine, RiTimeLine, RiRefreshLine,
  RiVipCrownLine, RiBankCardLine, RiBankLine, RiSmartphoneLine,
  RiUserLine, RiCalendarLine,
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import { upgradeAPI } from '../../services/api';
import { formatDate, getInitials, getErrorMessage } from '../../utils/helpers';
import { PageLoader } from '../../components/UI/LoadingSpinner';
import EmptyState from '../../components/UI/EmptyState';
import Modal from '../../components/UI/Modal';

const METHOD_ICONS = {
  card:          RiBankCardLine,
  bank_transfer: RiBankLine,
  easypaisa:     RiSmartphoneLine,
  jazzcash:      RiSmartphoneLine,
};

const STATUS_STYLES = {
  PENDING:  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  APPROVED: 'bg-green-500/10  text-green-400  border-green-500/20',
  REJECTED: 'bg-red-500/10    text-red-400    border-red-500/20',
};

// Review modal
const ReviewModal = ({ request, isOpen, onClose, onDone }) => {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  if (!request) return null;

  const handle = async (action) => {
    setLoading(true);
    try {
      if (action === 'approve') {
        await upgradeAPI.approve(request._id, { adminNote: note });
        toast.success(`Premium activated for ${request.user?.name}`);
      } else {
        await upgradeAPI.reject(request._id, { adminNote: note });
        toast.success('Request rejected');
      }
      onDone();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const MethodIcon = METHOD_ICONS[request.payment?.method] || RiBankCardLine;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Review Upgrade Request" size="md">
      <div className="space-y-5">
        {/* User info */}
        <div className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-xl">
          <div className="w-10 h-10 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-brand-400 text-sm font-bold">{getInitials(request.user?.name)}</span>
          </div>
          <div>
            <p className="text-white font-semibold">{request.user?.name}</p>
            <p className="text-dark-500 text-xs">{request.user?.email}</p>
          </div>
        </div>

        {/* Plan + amount */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-dark-800/50 rounded-xl p-3">
            <p className="text-dark-400 text-xs">Plan</p>
            <p className="text-white font-semibold capitalize mt-0.5">{request.plan}</p>
          </div>
          <div className="bg-dark-800/50 rounded-xl p-3">
            <p className="text-dark-400 text-xs">Amount</p>
            <p className="text-yellow-400 font-bold mt-0.5">${request.amount}</p>
          </div>
        </div>

        {/* Payment details */}
        <div className="bg-dark-800/50 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <MethodIcon className="text-brand-400" />
            <p className="text-white font-medium text-sm capitalize">{request.payment?.method?.replace('_', ' ')}</p>
          </div>
          {request.payment?.cardHolder && (
            <div className="flex justify-between text-sm">
              <span className="text-dark-400">Card Holder</span>
              <span className="text-white">{request.payment.cardHolder}</span>
            </div>
          )}
          {request.payment?.cardLast4 && (
            <div className="flex justify-between text-sm">
              <span className="text-dark-400">Card Last 4</span>
              <span className="text-white">**** {request.payment.cardLast4}</span>
            </div>
          )}
          {request.payment?.bankName && (
            <div className="flex justify-between text-sm">
              <span className="text-dark-400">Bank</span>
              <span className="text-white">{request.payment.bankName}</span>
            </div>
          )}
          {request.payment?.accountName && (
            <div className="flex justify-between text-sm">
              <span className="text-dark-400">Account Name</span>
              <span className="text-white">{request.payment.accountName}</span>
            </div>
          )}
          {request.payment?.transactionId && (
            <div className="flex justify-between text-sm">
              <span className="text-dark-400">Transaction ID</span>
              <span className="text-white font-mono">{request.payment.transactionId}</span>
            </div>
          )}
          <div className="flex justify-between text-sm pt-1 border-t border-dark-700">
            <span className="text-dark-400">Submitted</span>
            <span className="text-white">{formatDate(request.createdAt, 'MMM d, yyyy h:mm a')}</span>
          </div>
        </div>

        {/* Admin note */}
        <div>
          <label className="label">Admin Note (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reason for approval or rejection..."
            rows={2}
            className="textarea"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => handle('reject')}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-semibold text-sm transition-all disabled:opacity-50"
          >
            <RiCloseLine /> Reject
          </button>
          <button
            onClick={() => handle('approve')}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold text-sm transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><RiCheckLine /> Approve & Activate</>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Main component
const AdminUpgradeRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [selected, setSelected] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await upgradeAPI.getAll({ status: filter });
      setRequests(res.data.data);
      setPendingCount(res.data.pendingCount);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <RiVipCrownLine className="text-yellow-400" /> Upgrade Requests
          </h1>
          <p className="page-subtitle">
            {pendingCount > 0
              ? `${pendingCount} pending request${pendingCount > 1 ? 's' : ''} waiting for approval`
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
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
              filter === s ? 'bg-brand-500 text-white' : 'bg-dark-800 text-dark-400 hover:text-white'
            }`}
          >
            {s === 'all' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            {s === 'PENDING' && pendingCount > 0 && (
              <span className="ml-1.5 bg-yellow-500 text-dark-950 text-xs font-bold px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <PageLoader />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={RiVipCrownLine}
          title="No requests found"
          description={filter === 'PENDING' ? 'No pending upgrade requests' : 'No requests in this category'}
        />
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const MethodIcon = METHOD_ICONS[req.payment?.method] || RiBankCardLine;
            return (
              <div key={req._id} className="card hover:border-dark-700 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  {/* User */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-brand-400 text-sm font-bold">{getInitials(req.user?.name)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold truncate">{req.user?.name}</p>
                      <p className="text-dark-500 text-xs truncate">{req.user?.email}</p>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium border flex-shrink-0 ${STATUS_STYLES[req.status]}`}>
                    {req.status}
                  </span>
                </div>

                {/* Details row */}
                <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-dark-800 text-sm">
                  <span className="flex items-center gap-1.5 text-yellow-400 font-semibold">
                    <RiVipCrownLine /> {req.plan} — ${req.amount}
                  </span>
                  <span className="flex items-center gap-1.5 text-dark-400">
                    <MethodIcon className="text-base" />
                    <span className="capitalize">{req.payment?.method?.replace('_', ' ')}</span>
                  </span>
                  {req.payment?.transactionId && (
                    <span className="text-dark-500 text-xs font-mono">TXN: {req.payment.transactionId}</span>
                  )}
                  <span className="flex items-center gap-1 text-dark-500 text-xs ml-auto">
                    <RiCalendarLine /> {formatDate(req.createdAt)}
                  </span>
                </div>

                {/* Admin note if reviewed */}
                {req.adminNote && (
                  <p className="text-dark-500 text-xs mt-2 italic">Note: {req.adminNote}</p>
                )}

                {/* Review button for pending */}
                {req.status === 'PENDING' && (
                  <button
                    onClick={() => setSelected(req)}
                    className="mt-3 btn-primary text-sm py-2 w-full justify-center"
                  >
                    Review Request
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ReviewModal
        request={selected}
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        onDone={fetchRequests}
      />
    </div>
  );
};

export default AdminUpgradeRequests;
