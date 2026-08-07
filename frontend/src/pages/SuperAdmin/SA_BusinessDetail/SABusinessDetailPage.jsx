import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RiArrowLeftLine, RiProhibitedLine, RiCheckLine, RiDeleteBinLine } from 'react-icons/ri';
import { superAdminAPI } from '../../../services/api';
import StatusBadge from '../shared/StatusBadge';
import { SkeletonTable } from '../shared/SkeletonKPI';
import ConfirmDialog from '../shared/ConfirmDialog';
import toast from 'react-hot-toast';

const Section = ({ title, children, loading }) => (
  <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
    <div className="px-5 py-3.5 border-b border-white/7">
      <h3 className="text-white font-semibold text-sm">{title}</h3>
    </div>
    <div className="p-5">{loading ? <SkeletonTable rows={3} cols={3} /> : children}</div>
  </div>
);

const SABusinessDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleted, setDeleted] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await superAdminAPI.getBusinessDetail(id);
      setData(res.data.data);
    } catch (err) {
      if (err.response?.status === 410) setDeleted(true);
      else toast.error('Failed to load business details');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handleSuspend = async () => {
    setActionLoading(true);
    try { await superAdminAPI.suspendBusiness(id, {}); toast.success('Business suspended'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActionLoading(false); setConfirm(null); }
  };

  const handleActivate = async () => {
    try { await superAdminAPI.activateBusiness(id); toast.success('Business activated'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  if (deleted) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-white font-semibold text-lg mb-2">Business no longer exists</p>
      <p className="text-slate-500 text-sm mb-6">This business has been deleted from the platform.</p>
      <button onClick={() => navigate('/super-admin/businesses')} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-slate-400 border border-white/10 hover:text-white hover:bg-white/5 transition-all">
        <RiArrowLeftLine /> Back to Businesses
      </button>
    </div>
  );

  if (loading) return <SkeletonTable rows={10} cols={4} />;

  const biz    = data?.business;
  const stats  = data?.stats || {};
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }) : '—';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/super-admin/businesses')} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <RiArrowLeftLine className="text-lg" />
          </button>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black"
            style={{ background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.3)' }}>
            {biz?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{biz?.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <StatusBadge status={biz?.status} />
              <span className="text-slate-500 text-xs">{biz?.adminUser?.email}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {biz?.status === 'active' ? (
            <button onClick={() => setConfirm('suspend')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-orange-400 border border-orange-400/20 bg-orange-400/8 hover:bg-orange-400/15 transition-all">
              <RiProhibitedLine /> Suspend
            </button>
          ) : biz?.status === 'suspended' ? (
            <button onClick={handleActivate}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-green-400 border border-green-400/20 bg-green-400/8 hover:bg-green-400/15 transition-all">
              <RiCheckLine /> Activate
            </button>
          ) : null}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Trainers',  value: stats.trainerCount  || 0, color: '#34d399' },
          { label: 'Users',     value: stats.userCount     || 0, color: '#60a5fa' },
          { label: 'Workouts',  value: stats.workoutCount  || 0, color: '#a78bfa' },
          { label: 'Nutrition', value: stats.nutritionCount|| 0, color: '#fbbf24' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 text-center" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-2xl font-black mb-0.5" style={{ color: s.color }}>{s.value}</p>
            <p className="text-slate-500 text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Info & Subscription */}
      <div className="grid md:grid-cols-2 gap-5">
        <Section title="Business Information">
          <dl className="space-y-2.5">
            {[
              ['Owner',    biz?.adminUser?.name],
              ['Email',    biz?.adminUser?.email],
              ['Phone',    biz?.phone || '—'],
              ['Country',  biz?.country || '—'],
              ['City',     biz?.city || '—'],
              ['Website',  biz?.website || '—'],
              ['Registered', fmtDate(biz?.createdAt)],
            ].map(([k,v]) => (
              <div key={k} className="flex justify-between">
                <dt className="text-slate-500 text-sm">{k}</dt>
                <dd className="text-slate-200 text-sm font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section title="Subscription">
          <dl className="space-y-2.5">
            {[
              ['Plan',       biz?.currentPlan?.name || 'None'],
              ['Type',       biz?.currentPlan?.type || '—'],
              ['Status',     biz?.status],
              ['Start',      fmtDate(biz?.subscriptionStart)],
              ['Expires',    fmtDate(biz?.subscriptionEnd)],
              ['Trial',      biz?.isTrial ? 'Yes' : 'No'],
              ['Storage',    `${biz?.storageUsedMB || 0} MB`],
            ].map(([k,v]) => (
              <div key={k} className="flex justify-between">
                <dt className="text-slate-500 text-sm">{k}</dt>
                <dd className="text-slate-200 text-sm font-medium capitalize">{v}</dd>
              </div>
            ))}
          </dl>
        </Section>
      </div>

      {/* Trainers */}
      <Section title={`Trainers (${data?.trainers?.length || 0})`}>
        {!data?.trainers?.length ? <p className="text-slate-600 text-sm">No trainers assigned</p> : (
          <div className="space-y-2">
            {data.trainers.map(t => (
              <div key={t._id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-white text-sm font-medium">{t.name}</p>
                  <p className="text-slate-500 text-xs">{t.email}</p>
                </div>
                <StatusBadge status={t.isActive ? 'active' : 'suspended'} />
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Users */}
      <Section title={`Users (${data?.users?.length || 0})`}>
        {!data?.users?.length ? <p className="text-slate-600 text-sm">No users</p> : (
          <div className="space-y-2">
            {data.users.slice(0, 10).map(u => (
              <div key={u._id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-white text-sm font-medium">{u.name}</p>
                  <p className="text-slate-500 text-xs">{u.email}</p>
                </div>
                <span className="text-xs text-slate-400 capitalize">{u.subscription?.type || 'FREE'}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <ConfirmDialog isOpen={confirm === 'suspend'} onClose={() => setConfirm(null)} onConfirm={handleSuspend}
        title="Suspend Business" confirmLabel="Suspend" loading={actionLoading}
        message={`Suspend "${biz?.name}"? The admin will receive a notification.`}
        confirmClassName="bg-orange-500 hover:bg-orange-600 text-white" />
    </div>
  );
};

export default SABusinessDetailPage;
