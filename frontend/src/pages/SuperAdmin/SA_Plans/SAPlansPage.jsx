import React, { useState, useEffect } from 'react';
import { RiAddLine, RiEditLine, RiDeleteBinLine, RiToggleLine, RiRefreshLine } from 'react-icons/ri';
import { superAdminAPI } from '../../../services/api';
import StatusBadge from '../shared/StatusBadge';
import ConfirmDialog from '../shared/ConfirmDialog';
import toast from 'react-hot-toast';

const PLAN_TYPES = ['Monthly','Yearly','Lifetime','Trial','Enterprise'];

const PlanFormModal = ({ plan, onClose, onSaved }) => {
  const [form, setForm] = useState(plan || {
    name:'', type:'Monthly', price:0, currency:'USD', billingInterval:'monthly',
    maxUsers:100, maxTrainers:10, storageLimitGB:5,
    features:{ aiEnabled:false, analyticsEnabled:false, whiteLabelEnabled:false, customDomain:false, apiAccess:false, emailNotifLimit:1000, pushNotifLimit:1000 },
    isEnabled:true,
  });
  const [loading, setLoading] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (plan?._id) await superAdminAPI.updatePlan(plan._id, form);
      else await superAdminAPI.createPlan(form);
      toast.success(`Plan ${plan ? 'updated' : 'created'}`);
      onSaved();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ background:'#0d1424', border:'1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0"
          style={{ background:'#0d1424' }}>
          <h2 className="text-white font-bold">{plan ? 'Edit Plan' : 'Create Plan'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">×</button>
        </div>
        <form onSubmit={save} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 text-xs font-semibold block mb-1.5">PLAN NAME</label>
              <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500/50" required />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-semibold block mb-1.5">TYPE</label>
              <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500/50">
                {PLAN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-xs font-semibold block mb-1.5">PRICE</label>
              <input type="number" value={form.price} onChange={e=>setForm(p=>({...p,price:Number(e.target.value)}))}
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500/50" />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-semibold block mb-1.5">BILLING</label>
              <select value={form.billingInterval} onChange={e=>setForm(p=>({...p,billingInterval:e.target.value}))}
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500/50">
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="once">Once (Lifetime)</option>
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-xs font-semibold block mb-1.5">MAX USERS</label>
              <input type="number" value={form.maxUsers} onChange={e=>setForm(p=>({...p,maxUsers:Number(e.target.value)}))}
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500/50" />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-semibold block mb-1.5">MAX TRAINERS</label>
              <input type="number" value={form.maxTrainers} onChange={e=>setForm(p=>({...p,maxTrainers:Number(e.target.value)}))}
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500/50" />
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-xs font-semibold block mb-2">FEATURES</label>
            <div className="grid grid-cols-2 gap-2">
              {['aiEnabled','analyticsEnabled','whiteLabelEnabled','customDomain','apiAccess'].map(f => (
                <label key={f} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.features?.[f] || false}
                    onChange={e=>setForm(p=>({...p,features:{...p.features,[f]:e.target.checked}}))} />
                  <span className="text-slate-300 text-xs capitalize">{f.replace(/([A-Z])/g,' $1').trim()}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-slate-400 border border-white/10 hover:text-white hover:bg-white/5 transition-all">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background:'linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (plan ? 'Update' : 'Create Plan')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SAPlansPage = () => {
  const [plans, setPlans]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editPlan, setEditPlan]   = useState(null);
  const [deletePlan, setDeletePlan] = useState(null);
  const [delLoading, setDelLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const r = await superAdminAPI.listPlans(); setPlans(r.data.data || []); }
    catch { toast.error('Failed to load plans'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggle = async (id) => {
    try { await superAdminAPI.togglePlan(id); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async () => {
    setDelLoading(true);
    try { await superAdminAPI.deletePlan(deletePlan._id); toast.success('Plan deleted'); load(); setDeletePlan(null); }
    catch (err) { toast.error(err.response?.data?.message || 'Cannot delete plan'); }
    finally { setDelLoading(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Subscription Plans</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage pricing plans and features</p>
        </div>
        <button onClick={() => { setEditPlan(null); setShowForm(true); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background:'linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
          <RiAddLine /> Create Plan
        </button>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_,i) => (
            <div key={i} className="h-48 rounded-2xl animate-pulse bg-white/[0.03] border border-white/7" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="font-medium text-white mb-1">No plans yet</p>
          <p className="text-sm">Create your first subscription plan</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(plan => (
            <div key={plan._id} className="rounded-2xl p-5 space-y-4"
              style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${plan.isEnabled ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.07)'}` }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white font-bold text-base">{plan.name}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{plan.type}</p>
                </div>
                <StatusBadge status={plan.isEnabled ? 'enabled' : 'disabled'} />
              </div>
              <div>
                <p className="text-2xl font-black text-purple-400">${plan.price}<span className="text-slate-500 text-sm font-normal">/{plan.billingInterval}</span></p>
              </div>
              <div className="space-y-1 text-xs text-slate-400">
                <p>Up to {plan.maxUsers} users · {plan.maxTrainers} trainers</p>
                <p>{plan.storageLimitGB}GB storage</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {plan.features?.aiEnabled && <span className="px-2 py-0.5 rounded-full bg-purple-400/10 border border-purple-400/20 text-purple-400">AI</span>}
                  {plan.features?.analyticsEnabled && <span className="px-2 py-0.5 rounded-full bg-blue-400/10 border border-blue-400/20 text-blue-400">Analytics</span>}
                  {plan.features?.whiteLabelEnabled && <span className="px-2 py-0.5 rounded-full bg-green-400/10 border border-green-400/20 text-green-400">White Label</span>}
                  {plan.features?.apiAccess && <span className="px-2 py-0.5 rounded-full bg-orange-400/10 border border-orange-400/20 text-orange-400">API</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                <button onClick={() => { setEditPlan(plan); setShowForm(true); }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                  <RiEditLine /> Edit
                </button>
                <button onClick={() => toggle(plan._id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                  <RiToggleLine /> {plan.isEnabled ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => setDeletePlan(plan)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-400/10 transition-colors ml-auto">
                  <RiDeleteBinLine /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && <PlanFormModal plan={editPlan} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
      <ConfirmDialog isOpen={!!deletePlan} onClose={() => setDeletePlan(null)} onConfirm={handleDelete}
        title="Delete Plan" confirmLabel="Delete Plan" loading={delLoading}
        message={`Delete "${deletePlan?.name}"? This will fail if any business has an active subscription.`}
        confirmClassName="bg-red-500 hover:bg-red-600 text-white" />
    </div>
  );
};

export default SAPlansPage;
