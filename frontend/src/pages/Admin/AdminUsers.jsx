import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiSearchLine, RiShieldLine, RiDeleteBinLine,
  RiCheckLine, RiCloseLine, RiEyeLine,
  RiFilterLine, RiRefreshLine, RiUserAddLine,
  RiRunLine, RiRestaurantLine, RiTimeLine,
  RiVipCrownLine,
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import { adminAPI, subscriptionAPI } from '../../services/api';
import { formatDate, formatRelativeDate, getInitials, getErrorMessage } from '../../utils/helpers';
import { PageLoader } from '../../components/UI/LoadingSpinner';
import EmptyState from '../../components/UI/EmptyState';
import ConfirmDialog from '../../components/UI/ConfirmDialog';

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers({ page, limit: 15, search, role: roleFilter, status: statusFilter });
      setUsers(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  const handleToggleStatus = async (user) => {
    setActionLoading(user._id);
    try {
      await adminAPI.toggleStatus(user._id);
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleRole = async (user) => {
    // Cycle: user → trainer → admin → user
    const roleMap = { user: 'trainer', trainer: 'admin', admin: 'user' };
    const newRole = roleMap[user.role] || 'user';
    setActionLoading(user._id);
    try {
      await adminAPI.updateRole(user._id, newRole);
      toast.success(`Role changed to ${newRole}`);
      fetchUsers();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await adminAPI.deleteUser(deleteId);
      toast.success('User deleted');
      setDeleteId(null);
      fetchUsers();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">{pagination.total ?? 0} registered users — click any row to view full profile</p>
        </div>
        <button onClick={fetchUsers} className="btn-secondary flex-shrink-0">
          <RiRefreshLine className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name or email..."
              className="input pl-10"
            />
          </div>
          <div className="relative">
            <RiFilterLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" />
            <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="select pl-10 w-full sm:w-36">
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="trainer">Trainer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="select w-full sm:w-36">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <PageLoader />
      ) : users.length === 0 ? (
        <EmptyState icon={RiUserAddLine} title="No users found" description="Try adjusting your filters" />
      ) : (
        <div className="card p-0 overflow-hidden">
          {/* Desktop */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-800">
                  <th className="text-left text-dark-400 font-medium px-5 py-4">User</th>
                  <th className="text-left text-dark-400 font-medium px-4 py-4">Role / Status</th>
                  <th className="text-left text-dark-400 font-medium px-4 py-4">Workouts</th>
                  <th className="text-left text-dark-400 font-medium px-4 py-4">Calories In</th>
                  <th className="text-left text-dark-400 font-medium px-4 py-4">Last Active</th>
                  <th className="text-left text-dark-400 font-medium px-4 py-4">Joined</th>
                  <th className="text-right text-dark-400 font-medium px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800/50">
                {users.map((user) => (
                  <tr
                    key={user._id}
                    onClick={() => navigate(`/admin/users/${user._id}`)}
                    className="hover:bg-dark-800/40 transition-colors cursor-pointer group"
                  >
                    {/* User */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-brand-400 text-xs font-bold">{getInitials(user.name)}</span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.name}</p>
                          <p className="text-dark-500 text-xs">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role / Status */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${
                          user.role === 'admin'   ? 'bg-red-500/10 text-red-400' :
                          user.role === 'trainer' ? 'bg-blue-500/10 text-blue-400' :
                          'bg-dark-700 text-dark-300'
                        }`}>
                          {user.role === 'admin'   ? '🛡 Admin' :
                           user.role === 'trainer' ? '🏋️ Trainer' :
                           '👤 User'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${user.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                          {user.isActive ? '● Active' : '● Banned'}
                        </span>
                      </div>
                    </td>

                    {/* Workouts */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <RiRunLine className="text-orange-400 text-sm" />
                        <span className="text-white font-medium">{user.workoutCount}</span>
                        {user.totalDuration > 0 && (
                          <span className="text-dark-500 text-xs">· {Math.round(user.totalDuration / 60)}h</span>
                        )}
                      </div>
                    </td>

                    {/* Calories */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <RiRestaurantLine className="text-brand-400 text-sm" />
                        <span className="text-white font-medium">{Math.round(user.totalCaloriesIn).toLocaleString()}</span>
                        <span className="text-dark-500 text-xs">kcal</span>
                      </div>
                    </td>

                    {/* Last active */}
                    <td className="px-4 py-4 text-dark-400 text-xs">
                      {user.lastWorkout ? formatRelativeDate(user.lastWorkout) : '—'}
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-4 text-dark-400 text-xs">{formatDate(user.createdAt)}</td>

                    {/* Actions */}
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/admin/users/${user._id}`)}
                          title="View full profile"
                          className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                        >
                          <RiEyeLine />
                        </button>
                        <button
                          onClick={() => handleToggleRole(user)}
                          disabled={actionLoading === user._id}
                          title={
                            user.role === 'user'    ? 'Promote to Trainer' :
                            user.role === 'trainer' ? 'Promote to Admin' :
                            'Demote to User'
                          }
                          className="p-2 text-dark-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors disabled:opacity-40"
                        >
                          <RiShieldLine />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          disabled={actionLoading === user._id}
                          title={user.isActive ? 'Ban user' : 'Unban user'}
                          className={`p-2 rounded-lg transition-colors disabled:opacity-40 ${user.isActive ? 'text-dark-400 hover:text-orange-400 hover:bg-orange-500/10' : 'text-dark-400 hover:text-green-400 hover:bg-green-500/10'}`}
                        >
                          {user.isActive ? <RiCloseLine /> : <RiCheckLine />}
                        </button>
                        <button
                          onClick={() => setDeleteId(user._id)}
                          title="Delete user"
                          className="p-2 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <RiDeleteBinLine />
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const isPrem = user.subscription?.type === 'PREMIUM' && user.subscription?.status === 'ACTIVE';
                              await subscriptionAPI.adminSet(user._id, isPrem
                                ? { type: 'FREE', status: 'ACTIVE' }
                                : { type: 'PREMIUM', status: 'ACTIVE', durationDays: 30 });
                              toast.success(isPrem ? 'Downgraded to Free' : 'Upgraded to Premium');
                              fetchUsers();
                            } catch (err) { toast.error(getErrorMessage(err)); }
                          }}
                          title="Toggle Premium"
                          className="p-2 text-dark-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors"
                        >
                          <RiVipCrownLine />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden divide-y divide-dark-800">
            {users.map((user) => (
              <div
                key={user._id}
                onClick={() => navigate(`/admin/users/${user._id}`)}
                className="p-4 hover:bg-dark-800/40 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-brand-400 text-sm font-bold">{getInitials(user.name)}</span>
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{user.name}</p>
                      <p className="text-dark-500 text-xs">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      user.role === 'admin'   ? 'bg-red-500/10 text-red-400' :
                      user.role === 'trainer' ? 'bg-blue-500/10 text-blue-400' :
                      'bg-dark-700 text-dark-300'
                    }`}>
                      {user.role === 'trainer' ? '🏋️ Trainer' : user.role}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${user.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{user.isActive ? 'Active' : 'Banned'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-dark-400">
                  <span className="flex items-center gap-1"><RiRunLine className="text-orange-400" />{user.workoutCount} workouts</span>
                  <span className="flex items-center gap-1"><RiRestaurantLine className="text-brand-400" />{Math.round(user.totalCaloriesIn).toLocaleString()} kcal</span>
                  <span>Joined {formatDate(user.createdAt, 'MMM yyyy')}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-dark-800">
              <span className="text-dark-500 text-sm">
                {(page - 1) * 15 + 1}–{Math.min(page * 15, pagination.total)} of {pagination.total} users
              </span>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40">Previous</button>
                <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete User"
        message="This permanently deletes the user and ALL their workouts, nutrition logs, and progress data. Cannot be undone."
        confirmText="Delete User"
      />
    </div>
  );
};

export default AdminUsers;
