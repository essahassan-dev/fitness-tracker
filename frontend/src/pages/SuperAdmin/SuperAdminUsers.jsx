import React, { useState, useEffect, useCallback } from 'react';
import { RiSearchLine, RiRefreshLine, RiFilterLine, RiCloseLine, RiCheckLine } from 'react-icons/ri';
import toast from 'react-hot-toast';
import { superAdminAPI } from '../../services/api';
import { formatDate, getInitials, getErrorMessage } from '../../utils/helpers';
import { PageLoader } from '../../components/UI/LoadingSpinner';
import ConfirmDialog from '../../components/UI/ConfirmDialog';

const SuperAdminUsers = () => {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [role, setRole]       = useState('all');
  const [page, setPage]       = useState(1);
  const [pagination, setPagination] = useState({});
  const [banTarget, setBanTarget]   = useState(null);
  const [banLoading, setBanLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await superAdminAPI.getAllUsers({ search, role, page, limit: 20 });
      setUsers(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [search, role, page]);

  useEffect(() => { const t = setTimeout(fetchUsers, 300); return () => clearTimeout(t); }, [fetchUsers]);

  const handleBan = async () => {
    setBanLoading(true);
    try {
      const res = await superAdminAPI.banUser(banTarget._id, {});
      toast.success(res.data.message);
      setBanTarget(null);
      fetchUsers();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setBanLoading(false); }
  };

  const ROLE_COLORS = {
    user:        'bg-dark-700 text-dark-300',
    admin:       'bg-red-500/10 text-red-400',
    trainer:     'bg-blue-500/10 text-blue-400',
    super_admin: 'bg-purple-500/10 text-purple-400',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">All Platform Users</h1>
        <p className="page-subtitle">{pagination.total || 0} total accounts across all roles</p>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name or email..." className="input pl-10" />
        </div>
        <div className="relative">
          <RiFilterLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" />
          <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} className="select pl-10 w-full sm:w-40">
            <option value="all">All Roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
            <option value="trainer">Trainers</option>
            <option value="super_admin">Super Admins</option>
          </select>
        </div>
        <button onClick={fetchUsers} className="btn-secondary"><RiRefreshLine className={loading ? 'animate-spin' : ''} /></button>
      </div>

      {loading ? <PageLoader /> : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm hidden md:table">
            <thead>
              <tr className="border-b border-dark-800">
                <th className="text-left text-dark-400 font-medium px-5 py-4">User</th>
                <th className="text-left text-dark-400 font-medium px-4 py-4">Role</th>
                <th className="text-left text-dark-400 font-medium px-4 py-4">Status</th>
                <th className="text-left text-dark-400 font-medium px-4 py-4">Plan</th>
                <th className="text-left text-dark-400 font-medium px-4 py-4">Joined</th>
                <th className="text-right text-dark-400 font-medium px-5 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800/50">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-dark-800/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-brand-500/10 border border-brand-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-brand-400 text-xs font-bold">{getInitials(u.name)}</span>
                      </div>
                      <div><p className="text-white font-medium">{u.name}</p><p className="text-dark-500 text-xs">{u.email}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-4"><span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role] || 'bg-dark-700 text-dark-300'}`}>{u.role}</span></td>
                  <td className="px-4 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {u.isActive ? 'Active' : 'Banned'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs ${u.subscription?.type === 'PREMIUM' ? 'text-yellow-400' : 'text-dark-500'}`}>
                      {u.subscription?.type || 'FREE'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-dark-400 text-xs">{formatDate(u.createdAt)}</td>
                  <td className="px-5 py-4 text-right">
                    {u.role !== 'super_admin' && (
                      <button onClick={() => setBanTarget(u)}
                        className={`p-2 rounded-lg transition-colors ${u.isActive ? 'text-dark-400 hover:text-red-400 hover:bg-red-500/10' : 'text-dark-400 hover:text-green-400 hover:bg-green-500/10'}`}
                        title={u.isActive ? 'Ban' : 'Unban'}>
                        {u.isActive ? <RiCloseLine /> : <RiCheckLine />}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile */}
          <div className="md:hidden divide-y divide-dark-800">
            {users.map((u) => (
              <div key={u._id} className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-brand-400 text-sm font-bold">{getInitials(u.name)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{u.name}</p>
                  <div className="flex gap-2 mt-0.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${ROLE_COLORS[u.role]}`}>{u.role}</span>
                    <span className={`text-xs ${u.isActive ? 'text-green-400' : 'text-red-400'}`}>{u.isActive ? 'Active' : 'Banned'}</span>
                  </div>
                </div>
                {u.role !== 'super_admin' && (
                  <button onClick={() => setBanTarget(u)} className={`p-2 rounded-lg ${u.isActive ? 'text-red-400' : 'text-green-400'}`}>
                    {u.isActive ? <RiCloseLine /> : <RiCheckLine />}
                  </button>
                )}
              </div>
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-dark-800">
              <span className="text-dark-500 text-sm">{pagination.total} total</span>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40">Previous</button>
                <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!banTarget}
        onClose={() => setBanTarget(null)}
        onConfirm={handleBan}
        loading={banLoading}
        title={banTarget?.isActive ? 'Ban User' : 'Unban User'}
        message={banTarget?.isActive ? `Ban ${banTarget?.name}? They will lose all access.` : `Restore access for ${banTarget?.name}?`}
        confirmText={banTarget?.isActive ? 'Ban User' : 'Restore Access'}
      />
    </div>
  );
};

export default SuperAdminUsers;
