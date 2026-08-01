import React, { useState, useEffect, useCallback } from 'react';
import {
  RiMoneyDollarCircleLine, RiCheckLine, RiCloseLine,
  RiRefreshLine, RiAddLine, RiDeleteBinLine, RiCalendarLine,
  RiUserLine, RiAlertLine,
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import { feeAPI, adminAPI } from '../../services/api';
import { formatDate, getInitials, getErrorMessage } from '../../utils/helpers';
import { PageLoader } from '../../components/UI/LoadingSpinner';
import Modal from '../../components/UI/Modal';
import ConfirmDialog from '../../components/UI/ConfirmDialog';

const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(); d.setMonth(d.getMonth() - i);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
});

const STATUS_STYLES = {
  PAID:    'bg-brand-500/10 text-brand-400 border-brand-500/20',
  UNPAID:  'bg-red-500/10 text-red-400 border-red-500/20',
  PARTIAL: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
};

// Add/Edit fee modal
const FeeModal = ({ isOpen, onClose, onSuccess, editUser }) => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ userId: '', amount: 3000, status: 'PAID', method: 'cash', notes: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      adminAPI.getUsers({ limit: 200, role: 'user' }).then((r) => setUsers(r.data.data)).catch(() => {});
      if (editUser) setForm((f) => ({ ...f, userId: editUser._id }));
    }
  }, [isOpen, editUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await feeAPI.save(form);
      toast.success('Fee record saved');
      onSuccess();
      onClose();
      setForm({ userId: '', amount: 3000, status: 'PAID', method: 'cash', notes: '' });
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Fee Record" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">User</label>
          <select value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} className="select" required>
            <option value="">Select user</option>
            {users.map((u) => <option key={u._id} value={u._id}>{u.name} — {u.email}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Amount (PKR)</label>
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="input" required min="0" />
          </div>
          <div>
            <label className="label">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="select">
              <option value="PAID">Paid</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PARTIAL">Partial</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">Payment Method</label>
          <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className="select">
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="easypaisa">Easypaisa</option>
            <option value="jazzcash">JazzCash</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="label">Notes (optional)</label>
          <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="e.g. Paid half this month" className="input" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><RiCheckLine /> Save</>}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const AdminFees = () => {
  const [fees, setFees]           = useState([]);
  const [unpaid, setUnpaid]       = useState([]);
  const [stats, setStats]         = useState({});
  const [loading, setLoading]     = useState(true);
  const [month, setMonth]         = useState(MONTHS[0]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAdd, setShowAdd]     = useState(false);
  const [editUser, setEditUser]   = useState(null);
  const [deleteId, setDeleteId]   = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchFees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await feeAPI.getAll({ month, status: statusFilter });
      setFees(res.data.data);
      setUnpaid(res.data.unpaidUsers);
      setStats(res.data.stats);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [month, statusFilter]);

  useEffect(() => { fetchFees(); }, [fetchFees]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await feeAPI.generate({ month, amount: 3000 });
      toast.success(res.data.message);
      fetchFees();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setGenerating(false); }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await feeAPI.delete(deleteId);
      toast.success('Record deleted');
      setDeleteId(null);
      fetchFees();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setDeleteLoading(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <RiMoneyDollarCircleLine className="text-yellow-400" /> Fee Management
          </h1>
          <p className="page-subtitle">Track monthly fees for all members</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={fetchFees} className="btn-secondary"><RiRefreshLine /></button>
          <button onClick={handleGenerate} disabled={generating} className="btn-secondary text-sm">
            {generating ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Generate Month'}
          </button>
          <button onClick={() => { setEditUser(null); setShowAdd(true); }} className="btn-primary">
            <RiAddLine /> Add Record
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Members',  value: stats.total   || 0, color: 'text-white' },
          { label: 'Paid',           value: stats.paid    || 0, color: 'text-brand-400' },
          { label: 'Unpaid',         value: stats.unpaid  || 0, color: 'text-red-400' },
          { label: 'Revenue (PKR)',  value: `${(stats.totalAmount || 0).toLocaleString()}`, color: 'text-yellow-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card-sm text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-dark-400 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <select value={month} onChange={(e) => setMonth(e.target.value)} className="select w-auto">
          {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <div className="flex gap-1">
          {['all', 'PAID', 'UNPAID', 'PARTIAL'].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${statusFilter === s ? 'bg-brand-500 text-white' : 'bg-dark-800 text-dark-400 hover:text-white'}`}>
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      {loading ? <PageLoader /> : (
        <div className="space-y-4">
          {/* Unpaid users (no record yet) */}
          {unpaid.length > 0 && statusFilter !== 'PAID' && (
            <div className="card border-red-500/20">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <RiAlertLine className="text-red-400" /> No Fee Record — {unpaid.length} members
              </h3>
              <div className="space-y-2">
                {unpaid.map((u) => (
                  <div key={u._id} className="flex items-center gap-3 p-2.5 rounded-xl bg-dark-800/50">
                    <div className="w-8 h-8 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-red-400 text-xs font-bold">{getInitials(u.name)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{u.name}</p>
                      <p className="text-dark-500 text-xs">{u.email}</p>
                    </div>
                    <button onClick={() => { setEditUser(u); setShowAdd(true); }} className="btn-primary text-xs py-1.5 px-3">
                      <RiAddLine /> Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fee records */}
          {fees.length > 0 && (
            <div className="card p-0 overflow-hidden">
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-dark-800">
                      <th className="text-left text-dark-400 font-medium px-5 py-3">Member</th>
                      <th className="text-left text-dark-400 font-medium px-4 py-3">Amount</th>
                      <th className="text-left text-dark-400 font-medium px-4 py-3">Status</th>
                      <th className="text-left text-dark-400 font-medium px-4 py-3">Method</th>
                      <th className="text-left text-dark-400 font-medium px-4 py-3">Date</th>
                      <th className="text-right text-dark-400 font-medium px-5 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-800/50">
                    {fees.map((f) => (
                      <tr key={f._id} className="hover:bg-dark-800/30 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-brand-500/10 border border-brand-500/20 rounded-lg flex items-center justify-center">
                              <span className="text-brand-400 text-xs font-bold">{getInitials(f.user?.name)}</span>
                            </div>
                            <div>
                              <p className="text-white font-medium text-sm">{f.user?.name}</p>
                              <p className="text-dark-500 text-xs">{f.user?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-white font-semibold">PKR {f.amount?.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${STATUS_STYLES[f.status]}`}>{f.status}</span>
                        </td>
                        <td className="px-4 py-3 text-dark-400 text-xs capitalize">{f.method?.replace('_', ' ')}</td>
                        <td className="px-4 py-3 text-dark-400 text-xs">{f.paidDate ? formatDate(f.paidDate) : '—'}</td>
                        <td className="px-5 py-3 text-right">
                          <button onClick={() => setDeleteId(f._id)} className="p-1.5 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                            <RiDeleteBinLine />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden divide-y divide-dark-800">
                {fees.map((f) => (
                  <div key={f._id} className="flex items-center gap-3 p-4">
                    <div className="w-10 h-10 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-brand-400 text-sm font-bold">{getInitials(f.user?.name)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{f.user?.name}</p>
                      <p className="text-dark-500 text-xs">PKR {f.amount?.toLocaleString()} · {f.method}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLES[f.status]}`}>{f.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {fees.length === 0 && unpaid.length === 0 && (
            <div className="card text-center py-12">
              <RiMoneyDollarCircleLine className="text-4xl text-dark-700 mx-auto mb-2" />
              <p className="text-dark-500">No fee records for {month}</p>
              <button onClick={handleGenerate} className="btn-primary mt-4 mx-auto">Generate for all members</button>
            </div>
          )}
        </div>
      )}

      <FeeModal isOpen={showAdd} onClose={() => { setShowAdd(false); setEditUser(null); }} onSuccess={fetchFees} editUser={editUser} />
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleteLoading} title="Delete Fee Record" message="Delete this fee record?" confirmText="Delete" />
    </div>
  );
};

export default AdminFees;
