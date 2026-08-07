import React, { useState, useEffect } from 'react';
import { RiRefreshLine, RiCheckLine } from 'react-icons/ri';
import { superAdminAPI } from '../../../services/api';
import StatusBadge from '../shared/StatusBadge';
import { SkeletonTable, SkeletonKPI } from '../shared/SkeletonKPI';
import ConfirmDialog from '../shared/ConfirmDialog';
import ExportButton from '../shared/ExportButton';
import DateRangeFilter from '../shared/DateRangeFilter';
import toast from 'react-hot-toast';

const SAPaymentsPage = () => {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [range, setRange]       = useState({});
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage]         = useState(1);
  const [refundTarget, setRefundTarget] = useState(null);
  const [refundLoading, setRefundLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await superAdminAPI.listPayments({ page, limit: 20, status: statusFilter, ...range });
      setData(r.data);
    } catch { toast.error('Failed to load payments'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, statusFilter, range]);

  const handleRefund = async () => {
    setRefundLoading(true);
    try {
      await superAdminAPI.refundPayment(refundTarget._id, { reason: 'Manual refund by super admin' });
      toast.success('Payment refunded');
      setRefundTarget(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setRefundLoading(false); }
  };

  const handleExport = async (fmt) => {
    try {
      const r = await superAdminAPI.exportPayments({ ...range, status: statusFilter, format: fmt });
      const blob = new Blob([r.data], { type: fmt === 'csv' ? 'text/csv' : 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a'); a.href = url; a.download = `payments.${fmt}`; a.click();
    } catch { toast.error('Export failed'); }
  };

  const summary = data?.summary || {};
  const payments = data?.data || [];
  const pagination = data?.pagination || {};
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Payments</h1>
          <p className="text-slate-500 text-sm mt-0.5">Platform-wide transaction history and revenue</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-white bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-all">
            <RiRefreshLine />
          </button>
          <ExportButton onExport={handleExport} formats={['csv']} />
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Revenue',   value: `$${(summary.totalRevenue||0).toFixed(2)}`,   color:'#fbbf24' },
          { label: 'Monthly Revenue', value: `$${(summary.monthlyRevenue||0).toFixed(2)}`, color:'#fb923c' },
          { label: 'Yearly Revenue',  value: `$${(summary.yearlyRevenue||0).toFixed(2)}`,  color:'#f59e0b' },
          { label: 'Pending',         value: summary.pendingCount   || 0, color:'#facc15' },
          { label: 'Completed',       value: summary.completedCount || 0, color:'#4ade80' },
          { label: 'Failed',          value: summary.failedCount    || 0, color:'#f87171' },
        ].map(k => (
          <div key={k.label} className="rounded-2xl p-4" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
            {loading ? <div className="h-4 w-full rounded bg-white/10 animate-pulse" /> : (
              <>
                <p className="text-xl font-black mb-0.5" style={{ color:k.color }}>{k.value}</p>
                <p className="text-slate-500 text-xs">{k.label}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <DateRangeFilter onChange={r => { setRange(r); setPage(1); }} />
        <div className="flex items-center gap-1">
          {['all','pending','completed','failed','refunded'].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${statusFilter===s ? 'bg-purple-600/40 border border-purple-500/40 text-white' : 'text-slate-500 hover:text-white bg-white/[0.03] border border-white/[0.07]'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? <SkeletonTable rows={8} cols={6} /> : payments.length === 0 ? (
        <div className="text-center py-16 text-slate-500"><p className="font-medium text-white">No payments found</p></div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border:'1px solid rgba(255,255,255,0.07)' }}>
          <div className="grid grid-cols-12 gap-3 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600"
            style={{ background:'rgba(255,255,255,0.02)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
            <div className="col-span-3">Business</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-2">Plan</div>
            <div className="col-span-1">Method</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1">Date</div>
            <div className="col-span-2 text-right">Action</div>
          </div>
          {payments.map((p, i) => (
            <div key={p._id} className="grid grid-cols-12 gap-3 px-5 py-4 items-center hover:bg-white/[0.02] transition-colors"
              style={{ borderBottom: i < payments.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div className="col-span-3"><p className="text-white text-sm">{p.business?.name || '—'}</p></div>
              <div className="col-span-2"><p className="text-green-400 font-semibold text-sm">${p.amount} <span className="text-slate-500 font-normal">{p.currency}</span></p></div>
              <div className="col-span-2"><p className="text-slate-300 text-sm">{p.plan?.name || '—'}</p></div>
              <div className="col-span-1"><p className="text-slate-400 text-xs capitalize">{p.paymentMethod || '—'}</p></div>
              <div className="col-span-1"><StatusBadge status={p.status} /></div>
              <div className="col-span-1"><p className="text-slate-500 text-xs">{fmtDate(p.createdAt)}</p></div>
              <div className="col-span-2 flex justify-end">
                {p.status === 'completed' && (
                  <button onClick={() => setRefundTarget(p)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-orange-400 border border-orange-400/20 bg-orange-400/8 hover:bg-orange-400/15 transition-colors">
                    Refund
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="px-3 py-1.5 rounded-lg text-sm text-slate-400 border border-white/10 hover:text-white hover:bg-white/5 disabled:opacity-40 transition-all">Prev</button>
          <span className="text-slate-500 text-sm">Page {page} of {pagination.pages}</span>
          <button onClick={() => setPage(p => Math.min(pagination.pages,p+1))} disabled={page===pagination.pages} className="px-3 py-1.5 rounded-lg text-sm text-slate-400 border border-white/10 hover:text-white hover:bg-white/5 disabled:opacity-40 transition-all">Next</button>
        </div>
      )}

      <ConfirmDialog isOpen={!!refundTarget} onClose={() => setRefundTarget(null)} onConfirm={handleRefund}
        title="Refund Payment" confirmLabel="Refund" loading={refundLoading}
        message={`Refund $${refundTarget?.amount} for ${refundTarget?.business?.name}?`}
        confirmClassName="bg-orange-500 hover:bg-orange-600 text-white" />
    </div>
  );
};

export default SAPaymentsPage;
