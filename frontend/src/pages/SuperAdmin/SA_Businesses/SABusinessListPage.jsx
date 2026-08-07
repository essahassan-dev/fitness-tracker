import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiAddLine, RiRefreshLine, RiSearchLine, RiFilterLine, RiMoreLine, RiEyeLine, RiEditLine, RiDeleteBinLine, RiProhibitedLine, RiCheckLine } from 'react-icons/ri';
import { superAdminAPI } from '../../../services/api';
import StatusBadge from '../shared/StatusBadge';
import { SkeletonTable } from '../shared/SkeletonKPI';
import ConfirmDialog from '../shared/ConfirmDialog';
import ExportButton from '../shared/ExportButton';
import toast from 'react-hot-toast';

const SABusinessListPage = () => {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('all');
  const [page,   setPage]     = useState(1);
  const [confirm, setConfirm] = useState(null); // { type, business }
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await superAdminAPI.listBusinesses({ page, limit: 15, search, status });
      setBusinesses(res.data.data || []);
      setPagination(res.data.pagination || {});
    } catch { toast.error('Failed to load businesses'); }
    finally { setLoading(false); }
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  const handleSuspend = async () => {
    setActionLoading(true);
    try {
      await superAdminAPI.suspendBusiness(confirm.business._id, { reason: '' });
      toast.success(`${confirm.business.name} suspended`);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActionLoading(false); setConfirm(null); }
  };

  const handleActivate = async (id, name) => {
    try { await superAdminAPI.activateBusiness(id); toast.success(`${name} activated`); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await superAdminAPI.deleteBusiness(confirm.business._id);
      toast.success('Business deleted');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActionLoading(false); setConfirm(null); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Businesses</h1>
          <p className="text-slate-500 text-sm mt-0.5">{pagination.total || 0} total businesses on the platform</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-all">
            <RiRefreshLine /> Refresh
          </button>
          <ExportButton onExport={() => toast.success('Exporting...')} formats={['csv']} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-base" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm text-white placeholder-slate-600 outline-none bg-white/[0.04] border border-white/[0.08] focus:border-purple-500/40" />
        </div>
        {['all','active','suspended','trial','expired'].map(s => (
          <button key={s} onClick={() => { setStatus(s); setPage(1); }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${status === s ? 'bg-purple-600/40 border border-purple-500/40 text-white' : 'text-slate-500 hover:text-white bg-white/[0.03] border border-white/[0.07]'}`}>
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? <SkeletonTable rows={8} cols={6} /> : (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="grid grid-cols-12 gap-3 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600"
            style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="col-span-3">Business</div>
            <div className="col-span-2">Owner</div>
            <div className="col-span-2">Plan</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1">Users</div>
            <div className="col-span-1">Trainers</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          {businesses.length === 0 ? (
            <div className="text-center py-16 text-slate-600">
              <p className="font-medium text-white">No businesses found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : businesses.map((biz, i) => (
            <div key={biz._id} className="grid grid-cols-12 gap-3 px-5 py-4 items-center hover:bg-white/[0.02] transition-colors"
              style={{ borderBottom: i < businesses.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div className="col-span-3 flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                  style={{ background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.3)' }}>
                  {biz.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{biz.name || '—'}</p>
                  <p className="text-slate-500 text-xs truncate">{biz.city}{biz.country ? `, ${biz.country}` : ''}</p>
                </div>
              </div>
              <div className="col-span-2 min-w-0">
                <p className="text-slate-200 text-sm truncate">{biz.adminUser?.name || '—'}</p>
                <p className="text-slate-500 text-xs truncate">{biz.adminUser?.email}</p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-300 text-sm">{biz.currentPlan?.name || 'No plan'}</p>
                <p className="text-slate-500 text-xs">{biz.currentPlan?.type || ''}</p>
              </div>
              <div className="col-span-1"><StatusBadge status={biz.status} /></div>
              <div className="col-span-1"><p className="text-slate-300 text-sm">{biz.userCount || 0}</p></div>
              <div className="col-span-1"><p className="text-slate-300 text-sm">{biz.trainerCount || 0}</p></div>
              <div className="col-span-2 flex items-center justify-end gap-1.5">
                <button onClick={() => navigate(`/super-admin/businesses/${biz._id}`)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors" title="View">
                  <RiEyeLine />
                </button>
                {biz.status === 'active' ? (
                  <button onClick={() => setConfirm({ type: 'suspend', business: biz })}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-orange-400 hover:bg-orange-400/10 transition-colors" title="Suspend">
                    <RiProhibitedLine />
                  </button>
                ) : biz.status === 'suspended' ? (
                  <button onClick={() => handleActivate(biz._id, biz.name)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-green-400 hover:bg-green-400/10 transition-colors" title="Activate">
                    <RiCheckLine />
                  </button>
                ) : null}
                <button onClick={() => setConfirm({ type: 'delete', business: biz })}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors" title="Delete">
                  <RiDeleteBinLine />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-sm text-slate-400 border border-white/10 hover:text-white hover:bg-white/5 disabled:opacity-40 transition-all">Prev</button>
          <span className="text-slate-500 text-sm">Page {page} of {pagination.pages}</span>
          <button onClick={() => setPage(p => Math.min(pagination.pages, p+1))} disabled={page === pagination.pages}
            className="px-3 py-1.5 rounded-lg text-sm text-slate-400 border border-white/10 hover:text-white hover:bg-white/5 disabled:opacity-40 transition-all">Next</button>
        </div>
      )}

      <ConfirmDialog isOpen={confirm?.type === 'suspend'} onClose={() => setConfirm(null)} onConfirm={handleSuspend}
        title="Suspend Business" confirmLabel="Suspend" loading={actionLoading}
        message={`Are you sure you want to suspend "${confirm?.business?.name}"? The admin will be notified.`}
        confirmClassName="bg-orange-500 hover:bg-orange-600 text-white" />

      <ConfirmDialog isOpen={confirm?.type === 'delete'} onClose={() => setConfirm(null)} onConfirm={handleDelete}
        title="Delete Business" confirmLabel="Delete" loading={actionLoading}
        requireTyping="DELETE"
        message={`This will permanently delete "${confirm?.business?.name}" and all associated data. Type DELETE to confirm.`}
        confirmClassName="bg-red-500 hover:bg-red-600 text-white" />
    </div>
  );
};

export default SABusinessListPage;
