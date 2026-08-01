import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../../components/UI/Logo';
import {
  RiEyeLine, RiEyeOffLine, RiArrowLeftLine, RiArrowRightLine,
  RiShieldCheckLine, RiTrophyLine, RiRobot2Line, RiFireLine,
  RiSunLine, RiMoonLine, RiRunLine, RiBarChartLine,
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getErrorMessage } from '../../utils/helpers';

const GOOGLE_AUTH_URL = `${import.meta.env.VITE_API_URL || ''}/api/auth/google`;

const STATS = [
  { value: '500+', label: 'Members',   color: '#60a5fa' },
  { value: '10K+', label: 'Workouts',  color: '#34d399' },
  { value: '4.9★', label: 'Rating',    color: '#fbbf24' },
];

const FEATURES = [
  { icon: RiRunLine,         text: 'AI-powered workout plans' },
  { icon: RiTrophyLine,      text: 'XP, badges & leaderboards' },
  { icon: RiRobot2Line,      text: 'FLEX AI personal coach' },
  { icon: RiBarChartLine,    text: 'Deep analytics & insights' },
];

const Login = () => {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex bg-[#020817]">
      <style>{`
        @keyframes authFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes authFadeIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes authPulse { 0%,100%{opacity:0.4;transform:scale(1)} 50%{opacity:0.7;transform:scale(1.05)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .auth-float { animation: authFloat 4s ease-in-out infinite; }
        .auth-fade  { animation: authFadeIn 0.6s ease forwards; }
        .auth-pulse { animation: authPulse 3s ease-in-out infinite; }
        .shimmer-text { background: linear-gradient(90deg,#60a5fa,#a78bfa,#34d399,#60a5fa); background-size:200%; -webkit-background-clip:text; -webkit-text-fill-color:transparent; animation:shimmer 4s linear infinite; }
        .input-auth {
          width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);
          color:white; border-radius:12px; padding:12px 16px; font-size:14px; outline:none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .input-auth::placeholder { color: rgba(148,163,184,0.6); }
        .input-auth:focus { border-color:rgba(96,165,250,0.6); box-shadow:0 0 0 3px rgba(59,130,246,0.12); background:rgba(255,255,255,0.07); }
        .google-btn { position:relative; overflow:hidden; transition: all 0.3s ease; }
        .google-btn::before { content:''; position:absolute; inset:0; background:rgba(255,255,255,0.06); transform:translateX(-100%); transition:transform 0.4s ease; }
        .google-btn:hover::before { transform:translateX(0); }
        .google-btn:hover { border-color:rgba(255,255,255,0.25) !important; transform:translateY(-1px); }
        .submit-btn { position:relative; overflow:hidden; transition: all 0.25s ease; }
        .submit-btn::before { content:''; position:absolute; top:0; left:-100%; width:60%; height:100%; background:linear-gradient(120deg,transparent,rgba(255,255,255,0.25),transparent); transform:skewX(-20deg); transition:left 0.5s ease; }
        .submit-btn:not(:disabled):hover::before { left:150%; }
        .submit-btn:not(:disabled):hover { transform:translateY(-2px); box-shadow:0 8px 30px rgba(59,130,246,0.5); }
      `}</style>

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col">
        {/* Deep background */}
        <div className="absolute inset-0" style={{background:'linear-gradient(135deg, #0f1f3d 0%, #0a0f1e 50%, #020817 100%)'}}/>

        {/* Animated glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full auth-pulse"
          style={{background:'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)'}}/>
        <div className="absolute bottom-1/3 right-1/5 w-72 h-72 rounded-full auth-pulse"
          style={{background:'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', animationDelay:'1.5s'}}/>
        <div className="absolute top-2/3 left-1/3 w-48 h-48 rounded-full auth-pulse"
          style={{background:'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)', animationDelay:'0.8s'}}/>

        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.07]"
          style={{backgroundImage:'radial-gradient(circle, rgba(148,163,184,0.8) 1px, transparent 1px)', backgroundSize:'32px 32px'}}/>

        {/* Diagonal lines */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{backgroundImage:'repeating-linear-gradient(45deg, rgba(255,255,255,0.5) 0, rgba(255,255,255,0.5) 1px, transparent 0, transparent 50%)', backgroundSize:'20px 20px'}}/>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-10 justify-between">
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <Logo size="md" textSize="text-2xl" />
            <div className="flex items-center gap-2">
              <button onClick={toggleTheme} className="text-slate-400 hover:text-white p-2 rounded-xl transition-colors">
                {theme === 'dark' ? <RiSunLine className="text-lg"/> : <RiMoonLine className="text-lg"/>}
              </button>
              <button onClick={() => navigate('/home')}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors px-3 py-1.5 rounded-xl hover:bg-white/5">
                <RiArrowLeftLine/> Home
              </button>
            </div>
          </div>

          {/* Hero text */}
          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                <RiFireLine className="text-orange-400"/> The #1 AI Fitness Platform
              </div>
              <h1 className="text-5xl font-black leading-[0.95] mb-5">
                <span className="text-white block">Welcome</span>
                <span className="shimmer-text block">Back,</span>
                <span className="text-white block">Champion.</span>
              </h1>
              <p className="text-slate-400 text-base leading-relaxed max-w-sm">
                Your progress is waiting. Pick up right where you left off and keep pushing towards your goals.
              </p>
            </div>

            {/* Feature pills */}
            <div className="grid grid-cols-2 gap-3">
              {FEATURES.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 backdrop-blur-sm hover:bg-white/[0.07] transition-colors">
                  <div className="w-7 h-7 bg-brand-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="text-brand-400 text-sm"/>
                  </div>
                  <span className="text-slate-300 text-xs font-medium">{text}</span>
                </div>
              ))}
            </div>

            {/* Testimonial card */}
            <div className="auth-float bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 backdrop-blur-sm">
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_,i) => <span key={i} className="text-yellow-400 text-sm">★</span>)}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed italic mb-4">
                "FitStack completely changed my approach to fitness. The AI coaching feels like having a personal trainer 24/7."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{background:'linear-gradient(135deg, #3b82f6, #8b5cf6)'}}>AK</div>
                <div>
                  <p className="text-white text-sm font-semibold">Ahmed Khan</p>
                  <p className="text-slate-500 text-xs">Lost 12kg in 3 months</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-6">
            {STATS.map(({ value, label, color }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-black mb-0.5" style={{color}}>{value}</p>
                <p className="text-slate-500 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="w-full lg:w-[48%] flex items-center justify-center p-6 lg:p-12 relative"
        style={{background:'linear-gradient(160deg, #0d1424 0%, #020817 100%)'}}>

        {/* Subtle bg glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{background:'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.06) 0%, transparent 60%)'}}/>

        {/* Mobile top bar */}
        <div className="absolute top-4 left-4 right-4 lg:hidden flex items-center justify-between">
          <button onClick={() => navigate('/home')} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm bg-white/5 px-3 py-2 rounded-xl border border-white/10">
            <RiArrowLeftLine/> Home
          </button>
          <button onClick={toggleTheme} className="text-slate-400 hover:text-white p-2 rounded-xl bg-white/5 border border-white/10">
            {theme === 'dark' ? <RiSunLine className="text-lg"/> : <RiMoonLine className="text-lg"/>}
          </button>
        </div>

        <div className="w-full max-w-md auth-fade">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <Logo size="sm" showText={false}/>
            <span className="text-white font-black text-xl">Fit<span style={{color:'#60a5fa'}}>Stack</span></span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-black text-white mb-2">Sign in</h2>
            <p className="text-slate-400 text-sm">Continue your fitness journey</p>
          </div>

          {/* Google */}
          <a href={GOOGLE_AUTH_URL}
            className="google-btn w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl border border-white/10 bg-white/[0.04] text-white font-medium text-sm mb-5">
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
            <RiArrowRightLine className="ml-auto text-slate-500"/>
          </a>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{background:'linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)'}}/>
            <span className="text-slate-600 text-xs">or with email</span>
            <div className="flex-1 h-px" style={{background:'linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)'}}/>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-2 tracking-wide">EMAIL ADDRESS</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})}
                placeholder="you@example.com" className="input-auth h-12" required autoComplete="email"/>
            </div>
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-2 tracking-wide">PASSWORD</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm({...form, password:e.target.value})}
                  placeholder="••••••••" className="input-auth h-12 pr-11" required autoComplete="current-password"/>
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPw ? <RiEyeOffLine className="text-lg"/> : <RiEyeLine className="text-lg"/>}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="submit-btn w-full h-12 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{background:'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'}}>
              {loading
                ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                : <><span>Sign in to FitStack</span><RiArrowRightLine/></>}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              Create one free
            </Link>
          </p>

          {/* Security note */}
          <div className="flex items-center justify-center gap-2 mt-5">
            <RiShieldCheckLine className="text-slate-600 text-sm"/>
            <span className="text-slate-600 text-xs">256-bit SSL encrypted · Your data is safe</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
