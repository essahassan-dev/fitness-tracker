import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../../components/UI/Logo';
import {
  RiEyeLine, RiEyeOffLine, RiArrowLeftLine, RiArrowRightLine,
  RiCheckLine, RiFireLine, RiTrophyLine, RiCalendarLine,
  RiBarChartLine, RiShieldCheckLine, RiCloseLine, RiSunLine, RiMoonLine,
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getErrorMessage } from '../../utils/helpers';

const GOOGLE_AUTH_URL = `${import.meta.env.VITE_API_URL || ''}/api/auth/google`;

const PERKS = [
  { icon: RiFireLine,      text: 'Free forever — no credit card',     color: '#f97316' },
  { icon: RiTrophyLine,    text: 'Earn badges & climb leaderboards',  color: '#fbbf24' },
  { icon: RiBarChartLine,  text: 'Advanced analytics & progress',     color: '#60a5fa' },
  { icon: RiCalendarLine,  text: 'AI-generated 7-day workout plans',  color: '#34d399' },
];

const RULES = [
  { id:'R01', title:'No Harassment or Abusive Behaviour',  severity:'critical',
    description:'All users must treat others with respect. Harassment, verbal abuse, or threatening behaviour is strictly prohibited.' },
  { id:'R02', title:'Accurate Information Only',           severity:'severe',
    description:'Provide truthful information in your profile and communications. Misrepresentation will result in suspension.' },
  { id:'R03', title:'No Spam or Misuse of Platform',       severity:'warning',
    description:'Do not flood the system with repetitive requests or abuse any platform feature.' },
  { id:'R04', title:'Respect Privacy',                     severity:'critical',
    description:"Do not access or share another user's personal data, workout plans, or private information." },
  { id:'R05', title:'Admin Conduct Standards',             severity:'critical',
    description:'Admins must manage fairly. Favouritism, unauthorized data access, or privilege misuse is a violation.' },
  { id:'R06', title:'Payment Integrity',                   severity:'severe',
    description:'All payments must be legitimate. Fraudulent claims or fee tampering is prohibited.' },
  { id:'R07', title:'Fair Use of AI & Recommendations',    severity:'warning',
    description:'Do not misuse AI features to spread false health information or manipulate outputs.' },
  { id:'R08', title:'No Account Sharing',                  severity:'severe',
    description:'Each account is for a single individual. Sharing credentials or multiple accounts is not allowed.' },
  { id:'R09', title:'Trainer Professionalism',             severity:'critical',
    description:'Trainers must provide accurate, safe guidance and must not misuse access to client data.' },
  { id:'R10', title:'Terms of Service Compliance',         severity:'severe',
    description:"All users must comply with FitStack's full Terms of Service at all times." },
];

const SEV = {
  warning:  { label:'Warning',  cls:'text-yellow-400 bg-yellow-500/10 border-yellow-500/25' },
  severe:   { label:'Severe',   cls:'text-orange-400 bg-orange-500/10 border-orange-500/25' },
  critical: { label:'Critical', cls:'text-red-400 bg-red-500/10 border-red-500/25' },
};

const TermsModal = ({ onAccept, onClose }) => {
  const [agreed, setAgreed] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl flex flex-col max-h-[88vh] overflow-hidden"
        style={{background:'#0d1424', border:'1px solid rgba(255,255,255,0.1)'}}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:'linear-gradient(135deg,#3b82f6,#2563eb)'}}>
              <RiShieldCheckLine className="text-white text-sm"/>
            </div>
            <div>
              <h2 className="text-white font-bold text-base leading-none">Terms & Conditions</h2>
              <p className="text-slate-500 text-xs mt-0.5">FitStack Rules & Regulations</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 transition-colors">
            <RiCloseLine className="text-xl"/>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          <p className="text-slate-400 text-sm leading-relaxed mb-2">By creating a FitStack account, you agree to follow these rules. Violations may result in warnings, suspension, or permanent blacklisting.</p>
          {RULES.map(r => (
            <div key={r.id} className="rounded-xl p-4" style={{background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)'}}>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-blue-400"
                  style={{background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.2)'}}>{r.id}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-white font-semibold text-sm">{r.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${SEV[r.severity].cls}`}>{SEV[r.severity].label}</span>
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed">{r.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-white/10 flex-shrink-0 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div onClick={() => setAgreed(!agreed)}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer transition-all ${agreed ? 'bg-blue-500 border-blue-500' : 'bg-transparent border-slate-600 group-hover:border-slate-400'}`}>
              {agreed && <RiCheckLine className="text-white text-xs"/>}
            </div>
            <span className="text-slate-300 text-sm leading-relaxed">I have read and agree to all Rules & Regulations</span>
          </label>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm transition-colors">Cancel</button>
            <button onClick={() => { if(agreed) onAccept(); }} disabled={!agreed}
              className={`flex-1 h-10 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 transition-all ${agreed ? 'text-white' : 'text-slate-600 cursor-not-allowed'}`}
              style={agreed ? {background:'linear-gradient(135deg,#3b82f6,#2563eb)'} : {background:'rgba(255,255,255,0.04)'}}>
              <RiCheckLine/> Accept & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Register = () => {
  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [form, setForm]   = useState({ name:'', email:'', password:'', confirm:'' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const strength = (() => {
    const p = form.password; if (!p) return 0;
    let s=0;
    if (p.length>=6) s++; if (p.length>=10) s++;
    if (/[A-Z]/.test(p)) s++; if (/[0-9]/.test(p)) s++;
    return s;
  })();
  const strengthLabel = ['','Weak','Fair','Good','Strong'][strength];
  const strengthColor = ['','#ef4444','#eab308','#3b82f6','#22c55e'][strength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!termsAccepted) { toast.error('Please accept the Terms & Conditions'); return; }
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register({ name:form.name, email:form.email, password:form.password });
      toast.success('Account created! Welcome to FitStack.');
      navigate('/dashboard');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex bg-[#020817]">
      <style>{`
        @keyframes authFadeIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes authPulse  { 0%,100%{opacity:0.4;transform:scale(1)} 50%{opacity:0.7;transform:scale(1.05)} }
        @keyframes shimmer    { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .auth-fade  { animation: authFadeIn 0.6s ease forwards; }
        .auth-pulse { animation: authPulse 3s ease-in-out infinite; }
        .shimmer-text { background:linear-gradient(90deg,#60a5fa,#a78bfa,#34d399,#60a5fa); background-size:200%; -webkit-background-clip:text; -webkit-text-fill-color:transparent; animation:shimmer 4s linear infinite; }
        .input-auth { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:white; border-radius:12px; padding:11px 16px; font-size:14px; outline:none; transition:border-color 0.2s, box-shadow 0.2s, background 0.2s; }
        .input-auth::placeholder { color:rgba(148,163,184,0.5); }
        .input-auth:focus { border-color:rgba(96,165,250,0.6); box-shadow:0 0 0 3px rgba(59,130,246,0.1); background:rgba(255,255,255,0.07); }
        .google-btn { position:relative; overflow:hidden; transition:all 0.3s ease; }
        .google-btn::before { content:''; position:absolute; inset:0; background:rgba(255,255,255,0.06); transform:translateX(-100%); transition:transform 0.4s ease; }
        .google-btn:hover::before { transform:translateX(0); }
        .google-btn:hover { border-color:rgba(255,255,255,0.25)!important; transform:translateY(-1px); }
        .submit-btn { position:relative; overflow:hidden; transition:all 0.25s ease; }
        .submit-btn::before { content:''; position:absolute; top:0; left:-100%; width:60%; height:100%; background:linear-gradient(120deg,transparent,rgba(255,255,255,0.25),transparent); transform:skewX(-20deg); transition:left 0.5s ease; }
        .submit-btn:not(:disabled):hover::before { left:150%; }
        .submit-btn:not(:disabled):hover { transform:translateY(-2px); box-shadow:0 8px 30px rgba(59,130,246,0.5); }
      `}</style>

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col">
        <div className="absolute inset-0" style={{background:'linear-gradient(135deg,#0a1628 0%,#0d1a2e 50%,#020817 100%)'}}/>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full auth-pulse" style={{background:'radial-gradient(circle,rgba(59,130,246,0.15) 0%,transparent 70%)'}}/>
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full auth-pulse" style={{background:'radial-gradient(circle,rgba(139,92,246,0.1) 0%,transparent 70%)',animationDelay:'1s'}}/>
        <div className="absolute inset-0 opacity-[0.06]" style={{backgroundImage:'radial-gradient(circle,rgba(148,163,184,0.8) 1px,transparent 1px)',backgroundSize:'32px 32px'}}/>

        <div className="relative z-10 flex flex-col h-full p-10 justify-between">
          <div className="flex items-center justify-between">
            <Logo size="md" textSize="text-2xl"/>
            <div className="flex items-center gap-2">
              <button onClick={toggleTheme} className="text-slate-400 hover:text-white p-2 rounded-xl transition-colors">
                {theme==='dark'?<RiSunLine className="text-lg"/>:<RiMoonLine className="text-lg"/>}
              </button>
              <button onClick={() => navigate('/home')} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors">
                <RiArrowLeftLine/> Home
              </button>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
                <RiFireLine className="text-orange-400"/> Join 500+ Members
              </div>
              <h1 className="text-5xl font-black leading-[0.95] mb-5">
                <span className="text-white block">Start Your</span>
                <span className="shimmer-text block">Transformation</span>
                <span className="text-white block">Today.</span>
              </h1>
              <p className="text-slate-400 text-base leading-relaxed max-w-sm">
                Create your free account and get instant access to AI-powered fitness tools, personalized plans, and a community that pushes you forward.
              </p>
            </div>

            <div className="space-y-2.5">
              {PERKS.map(({ icon:Icon, text, color }) => (
                <div key={text} className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3 hover:bg-white/[0.06] transition-colors">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:`${color}18`, border:`1px solid ${color}30`}}>
                    <Icon className="text-sm" style={{color}}/>
                  </div>
                  <span className="text-slate-300 text-sm">{text}</span>
                  <RiCheckLine className="ml-auto text-slate-600 text-sm flex-shrink-0"/>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex -space-x-2.5">
                {['MK','SA','RH','FA'].map((init,i) => (
                  <div key={i} className="w-9 h-9 rounded-full border-2 border-[#020817] flex items-center justify-center text-xs font-bold text-white"
                    style={{background:`hsl(${i*60+200},65%,42%)`}}>{init}</div>
                ))}
              </div>
              <div>
                <div className="flex gap-0.5 mb-0.5">{[...Array(5)].map((_,i)=><span key={i} className="text-yellow-400 text-xs">★</span>)}</div>
                <p className="text-slate-500 text-xs">Joined this week</p>
              </div>
            </div>
          </div>

          <div className="flex gap-8">
            {[['Free','Forever'],['2 min','Setup'],['100%','Secure']].map(([v,l])=>(
              <div key={l}>
                <p className="text-white font-black text-xl">{v}</p>
                <p className="text-slate-500 text-xs">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="w-full lg:w-[48%] flex items-center justify-center p-6 lg:p-10 relative"
        style={{background:'linear-gradient(160deg,#0d1424 0%,#020817 100%)'}}>
        <div className="absolute inset-0 pointer-events-none" style={{background:'radial-gradient(ellipse at 50% 0%,rgba(59,130,246,0.06) 0%,transparent 60%)'}}/>

        <div className="absolute top-4 left-4 right-4 lg:hidden flex items-center justify-between">
          <button onClick={() => navigate('/home')} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm bg-white/5 px-3 py-2 rounded-xl border border-white/10">
            <RiArrowLeftLine/> Home
          </button>
          <button onClick={toggleTheme} className="text-slate-400 hover:text-white p-2 rounded-xl bg-white/5 border border-white/10">
            {theme==='dark'?<RiSunLine className="text-lg"/>:<RiMoonLine className="text-lg"/>}
          </button>
        </div>

        <div className="w-full max-w-md auth-fade">
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <Logo size="sm" showText={false}/>
            <span className="text-white font-black text-xl">Fit<span style={{color:'#60a5fa'}}>Stack</span></span>
          </div>

          <div className="mb-6">
            <h2 className="text-3xl font-black text-white mb-1.5">Create account</h2>
            <p className="text-slate-400 text-sm">Free forever. No credit card required.</p>
          </div>

          <a href={GOOGLE_AUTH_URL}
            className="google-btn w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl border border-white/10 bg-white/[0.04] text-white font-medium text-sm mb-5">
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign up with Google
            <RiArrowRightLine className="ml-auto text-slate-500"/>
          </a>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{background:'linear-gradient(to right,transparent,rgba(255,255,255,0.08),transparent)'}}/>
            <span className="text-slate-600 text-xs">or with email</span>
            <div className="flex-1 h-px" style={{background:'linear-gradient(to right,transparent,rgba(255,255,255,0.08),transparent)'}}/>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-1.5 tracking-wide">FULL NAME</label>
              <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="John Doe" className="input-auth h-11" required autoComplete="name"/>
            </div>
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-1.5 tracking-wide">EMAIL ADDRESS</label>
              <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@example.com" className="input-auth h-11" required autoComplete="email"/>
            </div>
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-1.5 tracking-wide">PASSWORD</label>
              <div className="relative">
                <input type={showPw?'text':'password'} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Min. 6 characters" className="input-auth h-11 pr-11" required autoComplete="new-password"/>
                <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPw?<RiEyeOffLine className="text-lg"/>:<RiEyeLine className="text-lg"/>}
                </button>
              </div>
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4].map(i=>(
                      <div key={i} className="h-1 flex-1 rounded-full transition-all" style={{background: i<=strength ? strengthColor : 'rgba(255,255,255,0.08)'}}/>
                    ))}
                  </div>
                  <p className="text-xs" style={{color: strengthColor || '#64748b'}}>{strengthLabel}</p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-1.5 tracking-wide">CONFIRM PASSWORD</label>
              <div className="relative">
                <input type={showPw?'text':'password'} value={form.confirm} onChange={e=>setForm({...form,confirm:e.target.value})} placeholder="Repeat password" className="input-auth h-11 pr-11" required autoComplete="new-password"/>
                {form.confirm && (
                  <div className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${form.password===form.confirm?'text-green-400':'text-red-400'}`}>
                    <RiCheckLine className="text-lg"/>
                  </div>
                )}
              </div>
            </div>

            {/* T&C */}
            <label className="flex items-start gap-3 cursor-pointer group pt-1">
              <div onClick={()=>setTermsAccepted(!termsAccepted)}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer transition-all ${termsAccepted?'bg-blue-500 border-blue-500':'bg-transparent border-slate-600 group-hover:border-slate-400'}`}>
                {termsAccepted && <RiCheckLine className="text-white text-xs"/>}
              </div>
              <span className="text-slate-400 text-sm leading-relaxed">
                I agree to the{' '}
                <button type="button" onClick={e=>{e.preventDefault();setShowTerms(true);}}
                  className="text-blue-400 hover:text-blue-300 underline underline-offset-2 font-medium transition-colors">
                  Terms & Conditions
                </button>
                {' '}and Rules & Regulations
              </span>
            </label>

            <button type="submit" disabled={loading||!termsAccepted}
              className="submit-btn w-full h-12 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{background: termsAccepted ? 'linear-gradient(135deg,#3b82f6 0%,#2563eb 100%)' : 'rgba(255,255,255,0.06)'}}>
              {loading
                ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                : <><span>Create Account</span><RiArrowRightLine/></>}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">Sign in</Link>
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <RiShieldCheckLine className="text-slate-600 text-sm"/>
            <span className="text-slate-600 text-xs">256-bit SSL encrypted · Your data is safe</span>
          </div>
        </div>
      </div>

      {showTerms && <TermsModal onAccept={()=>{setTermsAccepted(true);setShowTerms(false);}} onClose={()=>setShowTerms(false)}/>}
    </div>
  );
};

export default Register;
