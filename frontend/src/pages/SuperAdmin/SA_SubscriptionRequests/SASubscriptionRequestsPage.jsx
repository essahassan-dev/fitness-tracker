import React, { useState, useEffect } from 'react';
import { RiCheckLine, RiCloseLine, RiInformationLine, RiRefreshLine } from 'react-icons/ri';
import { superAdminAPI } from '../../../services/api';
import StatusBadge from '../shared/StatusBadge';
import { SkeletonTable } from '../shared/SkeletonKPI';
import toast from 'react-hot-toast';

const ActionModal = ({ request, type, onClose, onDone }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if ((type === 'reject' || type === 'info') && !text.trim()) return toast.error('Please provide a message');
    setLoading(true);
    try {
      if (type === 'approve') await superAdminAPI.approveRequest(request._id);
      else if (type === 'reject') await superAdminAPI.rejectRequest(request._id, { reason: text });
      else await superAdminAPI.requestMoreInfo(request._id, { message: text });
      toast.success(type === 'approve' ? 'Request approved!' : type === 'reject' ? 'Request rejected' : 'Info requested');
      onDone();
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
    finally { setLoading(false); }
  };

  const titles = { approve: 'Approve Subscription', reject: 'Reject Request', info: 'Request More Information' };
  const colors = { approve: 'bg-green-500 hover:bg-green-600 text-white', reject: 'bg-red-500 hover:bg-red-600 text-white', info: 'bg-purple-500 hover:bg-purple-600 text-white' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background:'#0d1424', border:'1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-white font-bold">{titles[type]}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="rounded-xl p-4 space-y-2" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Business</span>
              <span className="text-white font-medium">{request.business?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Plan</span>
              <span className="text-slate-200">{request.requestedPlan?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Price</span>
              <span className="text-slate-200">${request.requestedPlan?.price}/{request.requestedPlan?.billingInterval}</span>
            </div>
          </div>
          {(type === 'reject' || type === 'info') && (
            <div>
              <label className="text-slate-400 text-xs font-semibold block mb-1.5">{type === 'reject' ? 'REJECTION REASON' : 'MESSAGE'}</label>
              <textarea value={text} onChange={e=>setText(e.target.value)} rows={3}
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-sm outline-none resize-none focus:border-purple-500/50"
                placeholder={type === 'reject' ? 'Reason for rejection...' : 'What additional info do you need?'} />
            </div>
          )}
          {type === 'approve' && (
            <p className="text-green-400 text-sm bg-green-400/8 border border-green-400/20 rounded-xl px-4 py-3">
              Approving will activate this plan for the business and create a payment record.
            </p>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-slate-400 border border-white/10 hover:text-white hover:bg-white/5 transition-all">Cancel</button>
            <button onClick={submit} disabled={loading}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${colors[type]}`}>
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : titles[type]}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SASubscriptionRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [action, setAction]     = useState(null); // { type, request }
  const [filter, setFilter]     = useState('pending');

  const load = async () => {
    setLoading(true);
    try {
      const r = await superAdminAPI.listRequests({ status: filter });
      setRequests(r.data.data || []);
    } catch { toast.error('Failed to load requests'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '—';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Subscription Requests</h1>
          <p className="text-slate-500 text-sm mt-0.5">Review and action plan upgrade requests from businesses</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-white bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-all">
          <RiRefreshLine /> Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        {['all','pending','approved','rejected','info-requested'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${filter===s ? 'bg-purple-600/40 border border-purple-500/40 text-white' : 'text-slate-500 hover:text-white bg-white/[0.03] border border-white/[0.07]'}`}>
            {s === 'all' ? 'All' : s.replace('-',' ')}
          </button>
        ))}
      </div>

      {loading ? <SkeletonTable rows={5} cols={5} /> : requests.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="font-medium text-white mb-1">No requests found</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border:'1px solid rgba(255,255,255,0.07)' }}>
          <div className="grid grid-cols-12 gap-3 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600"
            style={{ background:'rgba(255,255,255,0.02)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
            <div className="col-span-3">Business</div>
            <div className="col-span-2">Current Plan</div>
            <div className="col-span-2">Requested Plan</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1">Date</div>
            <div className="col-span-3 text-right">Actions</div>
          </div>
          {requests.map((req, i) => (
            <div key={req._id} className="grid grid-cols-12 gap-3 px-5 py-4 items-center hover:bg-white/[0.02] transition-colors"
              style={{ borderBottom: i < requests.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div className="col-span-3">
                <p className="text-white text-sm font-medium">{req.business?.name || '—'}</p>
                <p className="text-slate-500 text-xs">{req.business?.adminUser?.email || ''}</p>
              </div>
              <div className="col-span-2"><p className="text-slate-400 text-sm">{req.currentPlan?.name || 'Free'}</p></div>
              <div className="col-span-2"><p className="text-purple-400 text-sm font-medium">{req.requestedPlan?.name || '—'}</p></div>
              <div className="col-span-1"><StatusBadge status={req.status} /></div>
              <div className="col-span-1"><p className="text-slate-500 text-xs">{fmtDate(req.requestedAt)}</p></div>
              <div className="col-span-3 flex items-center justify-end gap-1.5">
                {req.status === 'pending' && (
                  <>
                    <button onClick={() => setAction({ type:'approve', request: req })}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-green-400 border border-green-400/20 bg-green-400/8 hover:bg-green-400/15 transition-colors">
                      <RiCheckLine /> Approve
                    </button>
                    <button onClick={() => setAction({ type:'info', request: req })}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-purple-400 border border-purple-400/20 bg-purple-400/8 hover:bg-purple-400/15 transition-colors">
                      <RiInformationLine /> Info
                    </button>
                    <button onClick={() => setAction({ type:'reject', request: req })}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-400 border border-red-400/20 bg-red-400/8 hover:bg-red-400/15 transition-colors">
                      <RiCloseLine /> Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {action && <ActionModal request={action.request} type={action.type} onClose={() => setAction(null)} onDone={() => { setAction(null); load(); }} />}
    </div>
  );
};

export default SASubscriptionRequestsPage;
