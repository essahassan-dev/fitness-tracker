import React, { useState, useEffect, useCallback } from 'react';
import {
  RiCalendarLine, RiCheckLine, RiUserLine,
  RiQrCodeLine, RiDeleteBinLine, RiRefreshLine,
  RiAddLine, RiTimeLine,
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import { attendanceAPI, adminAPI } from '../../services/api';
import { formatDate, getInitials, getErrorMessage } from '../../utils/helpers';
import { PageLoader } from '../../components/UI/LoadingSpinner';
import ConfirmDialog from '../../components/UI/ConfirmDialog';
import Modal from '../../components/UI/Modal';
import QRScanner from '../../components/UI/QRScanner';

// Manual mark modal
const ManualMarkModal = ({ isOpen, onClose, onSuccess }) => {
  const [users, setUsers]   = useState([]);
  const [form, setForm]     = useState({ userId: '', date: new Date().toISOString().split('T')[0], notes: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      adminAPI.getUsers({ limit: 100, role: 'user' })
        .then((r) => setUsers(r.data.data))
        .catch(() => {});
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.userId) { toast.error('Select a user'); return; }
    setLoading(true);
    try {
      await attendanceAPI.manualMark(form);
      toast.success('Attendance marked manually');
      onSuccess();
      onClose();
      setForm({ userId: '', date: new Date().toISOString().split('T')[0], notes: '' });
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manual Attendance" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">User</label>
          <select value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} className="select" required>
            <option value="">Select user</option>
            {users.map((u) => <option key={u._id} value={u._id}>{u.name} — {u.email}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Date</label>
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input" />
        </div>
        <div>
          <label className="label">Notes (optional)</label>
          <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="e.g. Late arrival" className="input" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><RiCheckLine /> Mark Present</>}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const AdminAttendance = () => {
  const [records, setRecords]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [todayCount, setTodayCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage]         = useState(1);
  const [pagination, setPagination] = useState({});
  const [showManual, setShowManual] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attendanceAPI.getAll({ date: dateFilter || undefined, page, limit: 20 });
      setRecords(res.data.data);
      setTodayCount(res.data.todayCount);
      setTotalCount(res.data.total);
      setPagination(res.data.pagination);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [dateFilter, page]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await attendanceAPI.delete(deleteId);
      toast.success('Record deleted');
      setDeleteId(null);
      fetchRecords();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setDeleteLoading(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Attendance Management</h1>
          <p className="page-subtitle">{todayCount} present today · {totalCount} total records</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchRecords} className="btn-secondary"><RiRefreshLine /></button>
          <button onClick={() => setShowScanner(true)} className="btn-secondary"><RiQrCodeLine /> Scan QR</button>
          <button onClick={() => setShowManual(true)} className="btn-primary"><RiAddLine /> Manual Mark</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card-sm text-center">
          <p className="text-3xl font-bold text-brand-400">{todayCount}</p>
          <p className="text-dark-400 text-xs mt-1">Present Today</p>
        </div>
        <div className="card-sm text-center">
          <p className="text-3xl font-bold text-blue-400">{totalCount}</p>
          <p className="text-dark-400 text-xs mt-1">Total Records</p>
        </div>
      </div>

      {/* Filter */}
      <div className="card p-4 flex gap-3 items-center">
        <RiCalendarLine className="text-dark-500 flex-shrink-0" />
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
          className="input flex-1"
        />
        {dateFilter && (
          <button onClick={() => setDateFilter('')} className="btn-secondary py-2 px-3 text-sm">Clear</button>
        )}
      </div>

      {/* Records */}
      {loading ? <PageLoader /> : (
        <div className="card p-0 overflow-hidden">
          {records.length === 0 ? (
            <div className="text-center py-12">
              <RiCalendarLine className="text-4xl text-dark-700 mx-auto mb-2" />
              <p className="text-dark-500">No attendance records found</p>
            </div>
          ) : (
            <>
              <table className="w-full text-sm hidden md:table">
                <thead>
                  <tr className="border-b border-dark-800">
                    <th className="text-left text-dark-400 font-medium px-5 py-3">User</th>
                    <th className="text-left text-dark-400 font-medium px-4 py-3">Date</th>
                    <th className="text-left text-dark-400 font-medium px-4 py-3">Check-in</th>
                    <th className="text-left text-dark-400 font-medium px-4 py-3">Method</th>
                    <th className="text-right text-dark-400 font-medium px-5 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800/50">
                  {records.map((r) => (
                    <tr key={r._id} className="hover:bg-dark-800/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-brand-500/10 border border-brand-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-brand-400 text-xs font-bold">{getInitials(r.user?.name)}</span>
                          </div>
                          <div>
                            <p className="text-white font-medium">{r.user?.name}</p>
                            <p className="text-dark-500 text-xs">{r.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-dark-300 text-xs">{formatDate(r.date, 'MMM d, yyyy')}</td>
                      <td className="px-4 py-3 text-dark-300 text-xs flex items-center gap-1">
                        <RiTimeLine />{new Date(r.checkIn).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${r.method === 'qr' ? 'bg-brand-500/10 text-brand-400' : 'bg-blue-500/10 text-blue-400'}`}>
                          {r.method === 'qr' ? <><RiQrCodeLine className="inline mr-1" />QR</> : 'Manual'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => setDeleteId(r._id)} className="p-1.5 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                          <RiDeleteBinLine />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile */}
              <div className="md:hidden divide-y divide-dark-800">
                {records.map((r) => (
                  <div key={r._id} className="flex items-center gap-3 p-4">
                    <div className="w-10 h-10 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-brand-400 text-sm font-bold">{getInitials(r.user?.name)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{r.user?.name}</p>
                      <p className="text-dark-500 text-xs">{formatDate(r.date, 'MMM d')} · {new Date(r.checkIn).toLocaleTimeString()}</p>
                    </div>
                    <button onClick={() => setDeleteId(r._id)} className="p-1.5 text-dark-400 hover:text-red-400 rounded-lg">
                      <RiDeleteBinLine />
                    </button>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-dark-800">
                  <span className="text-dark-500 text-sm">{totalCount} records</span>
                  <div className="flex gap-2">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40">Previous</button>
                    <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40">Next</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <ManualMarkModal isOpen={showManual} onClose={() => setShowManual(false)} onSuccess={fetchRecords} />
      {showScanner && <QRScanner onClose={() => { setShowScanner(false); fetchRecords(); }} />}
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleteLoading} title="Delete Record" message="Delete this attendance record?" confirmText="Delete" />
    </div>
  );
};

export default AdminAttendance;
