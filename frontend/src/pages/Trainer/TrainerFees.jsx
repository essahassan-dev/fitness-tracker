import React, { useState, useEffect, useCallback } from 'react';
import {
  RiMoneyDollarCircleLine, RiRefreshLine,
  RiAlertLine, RiCheckLine, RiSendPlaneLine,
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import { feeAPI } from '../../services/api';
import { formatDate, getInitials, getErrorMessage } from '../../utils/helpers';
import { PageLoader } from '../../components/UI/LoadingSpinner';
import api from '../../services/api';

const MONTHS = Array.from({ length: 6 }, (_, i) => {
  const d = new Date(); d.setMonth(d.getMonth() - i);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
});

const STATUS_STYLES = {
  PAID:    'bg-brand-500/10 text-brand-400 border-brand-500/20',
  UNPAID:  'bg-red-500/10 text-red-400 border-red-500/20',
  PARTIAL: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
};

const TrainerFees = () => {
  const [fees, setFees]         = useState([]);
  const [unpaid, setUnpaid]     = useState([]);
  const [stats, setStats]       = useState({});
  const [loading, setLoading]   = useState(true);
  const [month, setMonth]       = useState(MONTHS[0]);
  const [notifying, setNotifying] = useState(null);

  const fetchFees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await feeAPI.getAll({ month });
      setFees(res.data.data);
      setUnpaid(res.data.unpaidUsers || []);
      setStats(res.data.stats || {});
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [month]);

  useEffect(() => { fetchFees(); }, [fetchFees]);

  // Notify admin about unpaid user
  const notifyAdmin = async (user, feeStatus = 'Unpaid') => {
    setNotifying(user._id);
    try {
      await api.post('/ai/notify-admin', {
        title: `Fee Alert — ${user.name}`,
        message: `Client Name: ${user.name}\nEmail: ${user.email}\nFee Status: ${feeStatus}\nMonth: ${month}\n\nPlease follow up with this client.`,
      });
      toast.success(`Admin notified: ${user.name} — ${feeStatus}`);
    } catch {
      toast.error('Failed to notify admin');
    } finally {
      setNotifying(null);
    }
  };

  const notifyAllUnpaid = async () => {
    const allUnpaid = [
      ...unpaid.map((u) => ({ user: u, status: 'No Record' })),
      ...fees.filter((f) => f.status !== 'PAID').map((f) => ({ user: f.user, status: f.status })),
    ];
    if (allUnpaid.length === 0) { toast.success('All clients have paid!'); return; }
    setNotifying('all');
    try {
      for (const { user, status } of allUnpaid) {
        await api.post('/ai/notify-admin', {
          title: `Fee Alert — ${user.name}`,
          message: `Client Name: ${user.name}\nEmail: ${user.email}\nFee Status: ${status}\nMonth: ${month}`,
        });
      }
      toast.success(`Admin notified about ${allUnpaid.length} unpaid client(s)`);
    } catch {
      toast.error('Failed to notify admin');
    } finally {
      setNotifying(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <RiMoneyDollarCircleLine className="text-yellow-400" /> Client Fees
          </h1>
          <p className="page-subtitle">View-only — contact admin to update records</p>
        </div>
        <div className="flex gap-2">
          <button onClick={notifyAllUnpaid} disabled={notifying === 'all'} className="btn-secondary text-sm">
            {notifying === 'all'
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><RiSendPlaneLine /> Notify All Unpaid</>}
          </button>
          <button onClick={fetchFees} className="btn-secondary flex-shrink-0">
            <RiRefreshLine className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Month selector */}
      <select value={month} onChange={(e) => setMonth(e.target.value)} className="select w-auto">
        {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-sm text-center">
          <p className="text-2xl font-bold text-brand-400">{stats.paid || 0}</p>
          <p className="text-dark-400 text-xs mt-1">Paid</p>
        </div>
        <div className="card-sm text-center">
          <p className="text-2xl font-bold text-red-400">{stats.unpaid || 0}</p>
          <p className="text-dark-400 text-xs mt-1">Unpaid</p>
        </div>
        <div className="card-sm text-center">
          <p className="text-2xl font-bold text-yellow-400">{stats.partial || 0}</p>
          <p className="text-dark-400 text-xs mt-1">Partial</p>
        </div>
      </div>

      {loading ? <PageLoader /> : (
        <div className="space-y-4">
          {/* Unpaid clients */}
          {unpaid.length > 0 && (
            <div className="card border-red-500/20">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <RiAlertLine className="text-red-400" /> No Record — {unpaid.length} clients
              </h3>
              <div className="space-y-2">
                {unpaid.map((u) => (
                  <div key={u._id} className="flex items-center gap-3 p-3 rounded-xl bg-dark-800/50">
                    <div className="w-9 h-9 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-red-400 text-xs font-bold">{getInitials(u.name)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{u.name}</p>
                      <p className="text-dark-500 text-xs">No fee record for {month}</p>
                    </div>
                    <button
                      onClick={() => notifyAdmin(u, 'No Record')}
                      disabled={notifying === u._id}
                      className="btn-secondary text-xs py-1.5 px-3 flex-shrink-0"
                    >
                      {notifying === u._id
                        ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                        : <><RiSendPlaneLine /> Notify Admin</>}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fee records */}
          {fees.length > 0 ? (
            <div className="card">
              <h3 className="text-white font-semibold mb-4">Fee Records — {month}</h3>
              <div className="space-y-2">
                {fees.map((f) => (
                  <div key={f._id} className="flex items-center gap-4 p-3 rounded-xl bg-dark-800/50">
                    <div className="w-10 h-10 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-brand-400 text-sm font-bold">{getInitials(f.user?.name)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{f.user?.name}</p>
                      <p className="text-dark-500 text-xs">
                        PKR {f.amount?.toLocaleString()} · {f.method?.replace('_', ' ')}
                        {f.paidDate ? ` · ${formatDate(f.paidDate)}` : ''}
                      </p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border flex-shrink-0 ${STATUS_STYLES[f.status]}`}>
                      {f.status}
                    </span>
                    {f.status !== 'PAID' && (
                      <button
                        onClick={() => notifyAdmin(f.user, f.status)}
                        disabled={notifying === f.user?._id}
                        className="p-1.5 text-dark-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors flex-shrink-0"
                        title="Notify admin"
                      >
                        {notifying === f.user?._id
                          ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                          : <RiSendPlaneLine className="text-sm" />}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card text-center py-10">
              <RiMoneyDollarCircleLine className="text-4xl text-dark-700 mx-auto mb-2" />
              <p className="text-dark-500 text-sm">No fee records for your clients this month</p>
            </div>
          )}

          <div className="card border-blue-500/20 bg-blue-500/5">
            <p className="text-blue-400 text-xs flex items-start gap-2">
              <RiAlertLine className="flex-shrink-0 mt-0.5" />
              You have view-only access. Use "Notify Admin" to alert the admin about unpaid fees. Only admin can add or modify fee records.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerFees;
