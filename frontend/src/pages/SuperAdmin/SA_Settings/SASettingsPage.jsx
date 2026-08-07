import React, { useState, useEffect } from 'react';
import { RiSettings3Line, RiCheckLine, RiAddLine, RiDeleteBinLine, RiFileCopyLine } from 'react-icons/ri';
import { superAdminAPI } from '../../../services/api';
import toast from 'react-hot-toast';

const Field = ({ label, value, onChange, type='text', placeholder='' }) => (
  <div>
    <label className="text-slate-400 text-xs font-semibold block mb-1.5 tracking-wide">{label}</label>
    <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500/50 transition-colors" />
  </div>
);

const Toggle = ({ label, checked, onChange, description }) => (
  <label className="flex items-start justify-between gap-4 cursor-pointer py-3 border-b border-white/5 last:border-0">
    <div>
      <p className="text-white text-sm font-medium">{label}</p>
      {description && <p className="text-slate-500 text-xs mt-0.5">{description}</p>}
    </div>
    <div onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full flex-shrink-0 transition-all relative cursor-pointer ${checked ? 'bg-purple-500' : 'bg-white/10'}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${checked ? 'left-5' : 'left-0.5'}`} />
    </div>
  </label>
);

const SaveBtn = ({ onClick, loading }) => (
  <button onClick={onClick} disabled={loading}
    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
    style={{ background:'linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
    {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><RiCheckLine /> Save</>}
  </button>
);

const BrandingTab = () => {
  const [form, setForm] = useState({ platformName:'FitStack', logoUrl:'', primaryColor:'#3b82f6' });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    superAdminAPI.getSetting('branding').then(r => { if (r.data.data?.value) setForm(r.data.data.value); }).catch(()=>{});
  }, []);
  const save = async () => {
    setSaving(true);
    try { await superAdminAPI.updateSetting('branding', { value: form }); toast.success('Branding saved'); }
    catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };
  return (
    <div className="space-y-4">
      <Field label="PLATFORM NAME" value={form.platformName} onChange={v=>setForm(p=>({...p,platformName:v}))} />
      <Field label="LOGO URL" value={form.logoUrl} onChange={v=>setForm(p=>({...p,logoUrl:v}))} placeholder="https://..." />
      <div>
        <label className="text-slate-400 text-xs font-semibold block mb-1.5">BRAND COLOR</label>
        <div className="flex items-center gap-3">
          <input type="color" value={form.primaryColor} onChange={e=>setForm(p=>({...p,primaryColor:e.target.value}))}
            className="w-12 h-10 rounded-xl cursor-pointer border-0 bg-transparent" />
          <span className="text-slate-300 text-sm font-mono">{form.primaryColor}</span>
        </div>
      </div>
      <div className="flex justify-end"><SaveBtn onClick={save} loading={saving} /></div>
    </div>
  );
};

const MaintenanceTab = () => {
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving]   = useState(false);
  useEffect(() => {
    superAdminAPI.getSetting('maintenance').then(r => { if (r.data.data?.value) setEnabled(!!r.data.data.value.enabled); }).catch(()=>{});
  }, []);
  const save = async () => {
    setSaving(true);
    try { await superAdminAPI.updateSetting('maintenance', { value: { enabled } }); toast.success(enabled ? 'Maintenance mode ON' : 'Maintenance mode OFF'); }
    catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };
  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4 bg-yellow-400/8 border border-yellow-400/20">
        <p className="text-yellow-400 text-sm font-semibold mb-1">Warning</p>
        <p className="text-slate-300 text-xs">Enabling maintenance mode will show a maintenance banner to all non-super-admin users.</p>
      </div>
      <Toggle label="Maintenance Mode" checked={enabled} onChange={setEnabled} description="Temporarily disable access for all non-admin users" />
      <div className="flex justify-end"><SaveBtn onClick={save} loading={saving} /></div>
    </div>
  );
};

const SmtpTab = () => {
  const [form, setForm]   = useState({ host:'', port:'587', user:'', from:'' });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  useEffect(() => {
    superAdminAPI.getSetting('smtp').then(r => { if (r.data.data?.value) setForm(r.data.data.value); }).catch(()=>{});
  }, []);
  const save = async () => {
    setSaving(true);
    try { await superAdminAPI.updateSetting('smtp', { value: form }); toast.success('SMTP saved'); }
    catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };
  const test = async () => {
    setTesting(true);
    try { await superAdminAPI.testSmtp(); toast.success('SMTP connection successful'); }
    catch (err) { toast.error(err.response?.data?.message || 'Connection failed'); }
    finally { setTesting(false); }
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="SMTP HOST"   value={form.host} onChange={v=>setForm(p=>({...p,host:v}))} placeholder="smtp.gmail.com" />
        <Field label="SMTP PORT"   value={form.port} onChange={v=>setForm(p=>({...p,port:v}))} type="number" />
        <Field label="SMTP USER"   value={form.user} onChange={v=>setForm(p=>({...p,user:v}))} placeholder="you@domain.com" />
        <Field label="FROM EMAIL"  value={form.from} onChange={v=>setForm(p=>({...p,from:v}))} placeholder="FitStack <no-reply@domain.com>" />
      </div>
      <div className="flex items-center gap-3 justify-end">
        <button onClick={test} disabled={testing}
          className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 border border-white/10 hover:text-white hover:bg-white/5 disabled:opacity-50 transition-all">
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
        <SaveBtn onClick={save} loading={saving} />
      </div>
    </div>
  );
};

const ApiKeysTab = () => {
  const [keys, setKeys]   = useState([]);
  const [label, setLabel] = useState('');
  const [newKey, setNewKey] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    superAdminAPI.getSetting('api_keys').then(r => { if (Array.isArray(r.data.data?.value)) setKeys(r.data.data.value); }).catch(()=>{});
  }, []);

  const create = async () => {
    if (!label.trim()) return toast.error('Enter a label');
    setLoading(true);
    try {
      const r = await superAdminAPI.createApiKey({ label });
      setNewKey(r.data.data);
      setLabel('');
      superAdminAPI.getSetting('api_keys').then(r => { if (Array.isArray(r.data.data?.value)) setKeys(r.data.data.value); }).catch(()=>{});
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  const revoke = async (id) => {
    try { await superAdminAPI.revokeApiKey(id); setKeys(prev => prev.map(k => k.id===id ? {...k,isActive:false} : k)); toast.success('Key revoked'); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-4">
      {newKey && (
        <div className="rounded-xl p-4 bg-green-400/8 border border-green-400/20">
          <p className="text-green-400 text-sm font-semibold mb-2">New API Key Created — Copy it now, it won't be shown again</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-green-300 text-xs font-mono bg-black/30 px-3 py-2 rounded-lg break-all">{newKey.plaintext}</code>
            <button onClick={() => { navigator.clipboard.writeText(newKey.plaintext); toast.success('Copied!'); }}
              className="p-2 text-green-400 hover:text-green-300"><RiFileCopyLine /></button>
          </div>
          <button onClick={() => setNewKey(null)} className="text-xs text-slate-500 hover:text-white mt-2 transition-colors">Dismiss</button>
        </div>
      )}
      <div className="flex gap-2">
        <input value={label} onChange={e=>setLabel(e.target.value)} placeholder="Key label (e.g. Mobile App)"
          className="flex-1 bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500/50" />
        <button onClick={create} disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
          style={{ background:'linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
          <RiAddLine /> Create Key
        </button>
      </div>
      <div className="space-y-2">
        {keys.map(k => (
          <div key={k.id} className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
            <div>
              <p className="text-white text-sm">{k.label}</p>
              <p className="text-slate-500 text-xs">{new Date(k.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold ${k.isActive ? 'text-green-400' : 'text-red-400'}`}>{k.isActive ? 'Active' : 'Revoked'}</span>
              {k.isActive && (
                <button onClick={() => revoke(k.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-red-400 border border-red-400/20 bg-red-400/8 hover:bg-red-400/15 transition-colors">
                  <RiDeleteBinLine /> Revoke
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TABS = [
  { id:'branding', label:'Branding', component: BrandingTab },
  { id:'smtp',     label:'SMTP',     component: SmtpTab },
  { id:'maintenance', label:'Maintenance', component: MaintenanceTab },
  { id:'api-keys', label:'API Keys', component: ApiKeysTab },
];

const SASettingsPage = () => {
  const [tab, setTab] = useState('branding');
  const Active = TABS.find(t => t.id === tab)?.component || BrandingTab;
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <RiSettings3Line className="text-purple-400 text-xl" />
        <div>
          <h1 className="text-xl font-bold text-white">Global Settings</h1>
          <p className="text-slate-500 text-sm mt-0.5">Platform-wide configuration</p>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-wrap bg-white/[0.03] rounded-xl p-1 border border-white/[0.07] w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab===t.id ? 'text-white bg-purple-600/40 border border-purple-500/40' : 'text-slate-500 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="rounded-2xl p-6" style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)' }}>
        <Active />
      </div>
    </div>
  );
};

export default SASettingsPage;
