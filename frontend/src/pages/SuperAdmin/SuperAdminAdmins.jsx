import React, { useState, useEffect, useCallback } from 'react';
import {
  RiAddLine, RiDeleteBinLine, RiShieldLine, RiRefreshLine,
  RiCheckLine, RiCloseLine, RiSearchLine, RiAlertLine,
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import { superAdminAPI } from '../../services/api';
import { formatDate, getInitials, getErrorMessage } from '../../utils/helpers';
import { PageLoader } from '../../components/UI/LoadingSpinner';
import EmptyState from '../../components/UI/EmptyState';
import ConfirmDialog from '../../components/UI/ConfirmDialog';
import Modal from '../../components/UI/Modal';

const CreateAdminModal = ({ isOpen, onClose, onSuccess }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await superAdminAPI.createAdmin(form);
      toast.success('Admin account created!');
      onSuccess();
      onClose();
      setForm({ name: '', email: '', password: '' });
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Admin Account" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="label">Full Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" required /></div>
        <div><label className="label">Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" required /></div>
        <div><label className="label">Password</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input" required minLength={6} /></div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Admin'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Ban reason modal
const BanModal = ({ admin, isOpen, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    await onConfirm(reason);
    setLoading(false);
    setReason('');
  };

  if (!admin) return null;
  const isBanning = admin.isActive;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isBanning ? 'Ban Admin' : 'Unban Admin'} size="sm">
      <div className="space-y-4">
        <div className={`p-3 rounded-xl border ${isBanning ? 'bg-red-500/5 border-red-500/20' : 'bg-green-500/5 border-green-500/20'}`}>
          <p className={`text-sm ${isBanning ? 'text-red-400' : 'text-green-400'}`}>
            {isBanning ? `You are about to ban ${admin.name}. They will lose all admin access.` : `You are about to restore access for ${admin.name}.`}
          </p>
        </div>
        {isBanning && (
          <div>
            <label className="label">Reason (optional)</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Terms violation, suspicious activity..." rows={3} className="textarea" />
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={handle} disabled={loading}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 ${isBanning ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}>
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : isBanning ? <><RiCloseLine />Ban Admin</> : <><RiCheckLine />Restore Access</>}
          </button>
        </div>
      </div>
    </Modal>
  );
};

const SuperAdminAdmins = () => {
  const [admins, setAdmins]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [status, setStatus]       = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [banTarget, setBanTarget] = useState(null);
  const [deleteId, setDeleteId]   = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const res = await superAdminAPI.getAllAdmins({ search, status });
      setAdmins(res.data.data);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [search, status]);

  useEffect(() => { const t = setTimeout(fetchAdmins, 300); return () => clearTimeout(t); }, [fetchAdmins]);

  const handleBan = async (reason) => {
    try {
      const res = await superAdminAPI.toggleStatus(banTarget._id, { reason });
      toast.success(res.data.message);
      setBanTarget(null);
      fetchAdmins();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await superAdminAPI.deleteAdmin(deleteId);
      toast.success('Admin deleted');
      setDeleteId(null);
      fetchAdmins();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setDeleteLoading(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Admin Accounts</h1>
          <p className="page-subtitle">{admins.length} admin accounts · Full control over all admins</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAdmins} className="btn-secondary"><RiRefreshLine /></button>
          <button onClick={() => setShowCreate(true)} className="btn-primary"><RiAddLine /> New Admin</button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search admins..." className="input pl-10" />
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'inactive'].map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${status === s ? 'bg-brand-500 text-white' : 'bg-dark-800 text-dark-400 hover:text-white'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? <PageLoader /> : admins.length === 0 ? (
        <EmptyState icon={RiShieldLine} title="No admin accounts" description="Create the first admin account" action={<button onClick={() => setShowCreate(true)} className="btn-primary"><RiAddLine />Create Admin</button>} />
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm hidden md:table">
            <thead>
              <tr className="border-b border-dark-800">
                <th className="text-left text-dark-400 font-medium px-5 py-4">Admin</th>
                <th className="text-left text-dark-400 font-medium px-4 py-4">Status</th>
                <th className="text-left text-dark-400 font-medium px-4 py-4">Created</th>
                <th className="text-right text-dark-400 font-medium px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800/50">
              {admins.map((admin) => (
                <tr key={admin._id} className="hover:bg-dark-800/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: admin.isActive ? 'rgba(239,68,68,0.15)' : 'rgba(100,116,139,0.2)', border: `1px solid ${admin.isActive ? 'rgba(239,68,68,0.3)' : 'rgba(100,116,139,0.3)'}` }}>
                        <span className={`text-xs font-bold ${admin.isActive ? 'text-red-400' : 'text-dark-400'}`}>{getInitials(admin.name)}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{admin.name}</p>
                        <p className="text-dark-500 text-xs">{admin.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${admin.isActive ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                      {admin.isActive ? '● Active' : '● Banned'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-dark-400 text-xs">{formatDate(admin.createdAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setBanTarget(admin)}
                        className={`p-2 rounded-lg transition-colors text-sm ${admin.isActive ? 'text-dark-400 hover:text-red-400 hover:bg-red-500/10' : 'text-dark-400 hover:text-green-400 hover:bg-green-500/10'}`}
                        title={admin.isActive ? 'Ban' : 'Unban'}>
                        {admin.isActive ? <RiCloseLine /> : <RiCheckLine />}
                      </button>
                      <button onClick={() => setDeleteId(admin._id)} className="p-2 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                        <RiDeleteBinLine />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile */}
          <div className="md:hidden divide-y divide-dark-800">
            {admins.map((admin) => (
              <div key={admin._id} className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: admin.isActive ? 'rgba(239,68,68,0.15)' : 'rgba(100,116,139,0.2)' }}>
                  <span className={`text-sm font-bold ${admin.isActive ? 'text-red-400' : 'text-dark-400'}`}>{getInitials(admin.name)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{admin.name}</p>
                  <p className="text-dark-500 text-xs">{admin.email}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setBanTarget(admin)} className={`p-2 rounded-lg ${admin.isActive ? 'text-red-400' : 'text-green-400'}`}>
                    {admin.isActive ? <RiCloseLine /> : <RiCheckLine />}
                  </button>
                  <button onClick={() => setDeleteId(admin._id)} className="p-2 text-red-400"><RiDeleteBinLine /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <CreateAdminModal isOpen={showCreate} onClose={() => setShowCreate(false)} onSuccess={fetchAdmins} />
      <BanModal admin={banTarget} isOpen={!!banTarget} onClose={() => setBanTarget(null)} onConfirm={handleBan} />
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleteLoading} title="Delete Admin" message="This permanently deletes the admin account. Cannot be undone." confirmText="Delete Admin" />
    </div>
  );
};

export default SuperAdminAdmins;
