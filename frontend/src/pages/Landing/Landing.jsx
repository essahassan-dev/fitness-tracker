import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  RiArrowRightLine, RiRunLine, RiRestaurantLine, RiTrophyLine,
  RiRobot2Line, RiBarChartLine, RiShieldCheckLine, RiMenuLine,
  RiCloseLine, RiCheckLine, RiFireLine, RiStarLine,
  RiSunLine, RiMoonLine, RiPlayCircleLine, RiArrowDownLine,
  RiFlashlightLine, RiUserLine, RiCalendarLine, RiQrCodeLine,
} from 'react-icons/ri';
import { useTheme } from '../../context/ThemeContext';
import Logo from '../../components/UI/Logo';

// ── Hooks ──────────────────────────────────────────────────────────────────────
const useCounter = (target, duration = 2000, start = false) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let s = null;
    const step = (ts) => {
      if (!s) s = ts;
      const p = Math.min((ts - s) / duration, 1);
      setCount(Math.floor(p * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
};

const useScrollReveal = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
};

// ── Sub-components ─────────────────────────────────────────────────────────────
const Reveal = ({ children, delay = 0, className = '' }) => {
  const [ref, visible] = useScrollReveal();
  return (
    <div ref={ref} className={className}
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s` }}>
      {children}
    </div>
  );
};

const FloatCard = ({ children, className = '', delay = 0 }) => (
  <div className={`animate-float ${className}`} style={{ animationDelay: `${delay}s`, animationDuration: '5s' }}>
    {children}
  </div>
);

// ── Data ────────────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: RiRunLine,         title: 'Smart Workouts',   desc: 'MET-based calorie burn, AI weekly plans, equipment-adaptive training programs.',  color: 'from-orange-500 to-red-500',    glow: 'rgba(249,115,22,0.2)' },
  { icon: RiRestaurantLine,  title: 'Nutrition AI',     desc: 'TDEE macro goals, diet plan recommendations, auto-logging with one tap.',        color: 'from-emerald-500 to-green-600', glow: 'rgba(16,185,129,0.2)' },
  { icon: RiTrophyLine,      title: 'Gamification',     desc: 'XP system, 15+ badges, leaderboards, streaks, and level-up progression.',       color: 'from-yellow-500 to-amber-500',  glow: 'rgba(245,158,11,0.2)' },
  { icon: RiRobot2Line,      title: 'FLEX AI Coach',    desc: 'Personal chatbot, progress predictions, workout insights — 24/7.',              color: 'from-purple-500 to-violet-600', glow: 'rgba(139,92,246,0.2)' },
  { icon: RiBarChartLine,    title: 'Deep Analytics',   desc: 'Strength trends, calorie balance, macro distribution, weekly summaries.',       color: 'from-blue-500 to-cyan-500',     glow: 'rgba(59,130,246,0.2)' },
  { icon: RiShieldCheckLine, title: 'Team System',      desc: 'Trainer panels, QR attendance, fee management, admin + super admin controls.',  color: 'from-brand-500 to-blue-600',    glow: 'rgba(59,130,246,0.2)' },
];

const STEPS = [
  { num: '01', icon: RiUserLine,      title: 'Create Your Profile',    desc: 'Set your goals, body stats, and fitness level. Takes 2 minutes.' },
  { num: '02', icon: RiFlashlightLine, title: 'Get Your AI Plan',      desc: 'FLEX AI generates a personalized weekly workout and diet plan instantly.' },
  { num: '03', icon: RiCalendarLine,  title: 'Follow & Track',         desc: 'Log workouts, meals, and attendance. Watch your stats update in real time.' },
  { num: '04', icon: RiTrophyLine,    title: 'Earn & Level Up',        desc: 'Gain XP, unlock badges, climb the leaderboard, and dominate your goals.' },
];

const TESTIMONIALS = [
  { name: 'Sarah M.',  role: 'Lost 15kg',       text: 'The AI recommendations changed everything. I finally understand what my body needs.',    avatar: 'SM', color: 'from-pink-500 to-rose-500' },
  { name: 'Ahmed K.',  role: 'Gained Muscle',   text: 'Weekly plans are insane. No more guessing at the gym. Just follow and grow.',           avatar: 'AK', color: 'from-blue-500 to-cyan-500' },
  { name: 'Zara H.',   role: 'Marathon Runner', text: 'FLEX AI coaching helped me shave 8 minutes off my marathon time. Unreal results.',      avatar: 'ZH', color: 'from-purple-500 to-indigo-500' },
  { name: 'Bilal R.',  role: 'Gym Owner',       text: 'The team system is a game changer — I manage 50+ clients with QR attendance and fees.', avatar: 'BR', color: 'from-orange-500 to-amber-500' },
];

// ── Main Component ─────────────────────────────────────────────────────────────
const Landing = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const [scrollPct, setScrollPct]   = useState(0);
  const [statsVisible, setStatsVisible] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [contactForm, setContactForm] = useState({ firstName:'', lastName:'', email:'', subject:'', message:'' });
  const [contactLoading, setContactLoading] = useState(false);
  const statsRef = useRef(null);

  const members  = useCounter(500,    2000, statsVisible);
  const workouts = useCounter(10000,  2200, statsVisible);
  const calories = useCounter(2500000,2500, statsVisible);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      setScrolled(window.scrollY > 60);
      setScrollPct(Math.min(100, (window.scrollY / (doc.scrollHeight - doc.clientHeight)) * 100));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Force smooth scroll behavior on mount
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => { document.documentElement.style.scrollBehavior = ''; };
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true); }, { threshold: 0.3 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial(p => (p + 1) % TESTIMONIALS.length), 4500);
    return () => clearInterval(t);
  }, []);

  const scrollTo = useCallback((id) => {
    setMobileOpen(false);
    // rAF ensures DOM is settled before scroll
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (!el) return;
      const y = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  }, []);

  const handleContact = async (e) => {
    e.preventDefault();
    if (!contactForm.email || !contactForm.message) { toast.error('Email and message required'); return; }
    setContactLoading(true);
    try {
      const res = await fetch('/api/ai/contact', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(contactForm) });
      const data = await res.json();
      toast.success(data.message || 'Message sent!');
      setContactForm({ firstName:'', lastName:'', email:'', subject:'', message:'' });
    } catch { toast.success('Message received! We will respond soon.'); }
    finally { setContactLoading(false); }
  };

  const dark = theme === 'dark';

  return (
    <div className={`min-h-screen ${dark ? 'bg-dark-950 text-white' : 'bg-slate-50 text-gray-900'}`}>

      {/* ── Global Styles ── */}
      <style>{`
        html { scroll-behavior: smooth; }
        body { overflow-x: hidden; }        @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes shimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulseDot { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.4);opacity:0.6} }
        @keyframes borderGlow { 0%,100%{box-shadow:0 0 20px rgba(59,130,246,0.3)} 50%{box-shadow:0 0 40px rgba(59,130,246,0.6)} }

        .animate-float    { animation: float 5s ease-in-out infinite; }
        .shimmer-text     { background: linear-gradient(90deg,#60a5fa 0%,#a78bfa 30%,#34d399 60%,#60a5fa 100%); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; animation:shimmer 5s linear infinite; }
        .animate-fadeUp   { animation: fadeUp 0.7s ease forwards; }
        .pulse-dot        { animation: pulseDot 2s ease infinite; }

        /* Nav Sign in hover */
        .nav-signin {
          position: relative;
          overflow: hidden;
          transition: color 0.3s ease;
        }
        .nav-signin::before {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0.06);
          border-radius: 8px;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s ease;
        }
        .nav-signin:hover::before { transform: scaleX(1); }

        /* Get Started Free nav btn */
        .nav-cta {
          position: relative;
          overflow: hidden;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          box-shadow: 0 0 20px rgba(59,130,246,0.25);
        }
        .nav-cta::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0.15);
          transform: translateY(100%);
          transition: transform 0.3s ease;
        }
        .nav-cta:hover::after { transform: translateY(0); }
        .nav-cta:hover { transform: translateY(-2px); box-shadow: 0 0 36px rgba(59,130,246,0.45); }
        .nav-link::after { content:''; position:absolute; bottom:-2px; left:50%; right:50%; height:2px; background:linear-gradient(90deg,#3b82f6,#60a5fa); border-radius:2px; transition:left 0.3s ease,right 0.3s ease; }
        .nav-link:hover::after { left:8px; right:8px; }

        /* Feature card hover */
        .feat-card { transition: transform 0.35s cubic-bezier(.22,.68,0,1.2), border-color 0.3s ease, box-shadow 0.35s ease; }
        .feat-card:hover { transform: translateY(-8px) scale(1.01); }

        /* Step card hover */
        .step-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .step-card:hover { transform: translateY(-6px); }

        .btn-glow { 
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          box-shadow: 0 0 24px rgba(59,130,246,0.3);
          position: relative;
          overflow: hidden;
        }
        .btn-glow::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 60%;
          height: 100%;
          background: linear-gradient(120deg, transparent, rgba(255,255,255,0.3), transparent);
          transform: skewX(-20deg);
          transition: left 0.5s ease;
        }
        .btn-glow:not(:disabled):hover::before { left: 150%; }
        .btn-glow:not(:disabled):hover { transform: translateY(-3px) scale(1.03); box-shadow: 0 0 50px rgba(59,130,246,0.6), 0 10px 30px rgba(0,0,0,0.3); }

        .btn-outline {
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .btn-outline::before {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0.1);
          transform: translateY(100%);
          transition: transform 0.3s cubic-bezier(.22,.68,0,1);
        }
        .btn-outline:hover::before { transform: translateY(0); }
        .btn-outline:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }

        /* Testimonial card */
        .testi-card { transition: transform 0.6s cubic-bezier(.22,.68,0,1), opacity 0.6s ease; }

        /* Glass */
        .glass-card { backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); }

        /* Icon box on hover fills with gradient */
        .icon-box { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .icon-box:hover { transform: scale(1.12) rotate(-4deg); box-shadow: 0 8px 24px rgba(59,130,246,0.4); }

        /* Stat card hover */
        .stat-hover { transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease; }
        .stat-hover:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.3); }
      `}</style>

      {/* ── Scroll progress bar ── */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-0.5 bg-transparent">
        <div className="h-full bg-gradient-to-r from-brand-500 via-blue-400 to-purple-500 transition-all duration-100"
          style={{ width: `${scrollPct}%` }} />
      </div>

      {/* ── Navbar ── */}
      <nav className={`fixed top-0.5 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? dark
            ? 'bg-dark-950/80 backdrop-blur-2xl border-b border-white/5 shadow-2xl shadow-black/20'
            : 'bg-white/80 backdrop-blur-2xl border-b border-gray-200 shadow-lg'
          : ''
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <Logo size="sm" textSize="text-xl" />

          <div className="hidden md:flex items-center gap-1">
            {[['Features','features'],['How it Works','how'],['About','about'],['Testimonials','testimonials'],['Contact','contact']].map(([label, id]) => (
              <button key={id} onClick={() => scrollTo(id)}
                className={`nav-link px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dark ? 'text-dark-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}>{label}</button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <button onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${dark ? 'text-dark-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}>
              {dark ? <RiSunLine className="text-lg" /> : <RiMoonLine className="text-lg" />}
            </button>
            <button onClick={() => navigate('/login')}
              className={`nav-signin nav-link px-4 py-2 rounded-lg text-sm font-medium transition-all ${dark ? 'text-dark-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
              Sign in
            </button>
            <button onClick={() => navigate('/register')}
              className="nav-cta bg-gradient-to-r from-brand-500 to-blue-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl">
              Get Started Free
            </button>
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)}
            className={`md:hidden p-2 rounded-lg ${dark ? 'text-dark-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
            {mobileOpen ? <RiCloseLine className="text-2xl" /> : <RiMenuLine className="text-2xl" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className={`md:hidden border-t px-6 py-5 space-y-1 glass-card ${dark ? 'bg-dark-950/95 border-white/5' : 'bg-white/95 border-gray-200'}`}>
            {[['Features','features'],['How it Works','how'],['About','about'],['Testimonials','testimonials'],['Contact','contact']].map(([label,id]) => (
              <button key={id} onClick={() => scrollTo(id)}
                className={`block w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${dark ? 'text-dark-300 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}>
                {label}
              </button>
            ))}
            <div className="flex gap-3 pt-3 border-t border-white/5">
              <button onClick={() => navigate('/login')} className={`flex-1 py-2.5 border rounded-xl text-sm ${dark ? 'border-dark-700 text-dark-300 hover:text-white' : 'border-gray-300 text-gray-600 hover:text-gray-900'}`}>Sign in</button>
              <button onClick={() => navigate('/register')} className="flex-1 py-2.5 bg-gradient-to-r from-brand-500 to-blue-600 rounded-xl text-white text-sm font-bold">Get Started</button>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 pointer-events-none">
          <div style={{ background:'radial-gradient(ellipse 90% 70% at 50% -10%, rgba(59,130,246,0.18) 0%, transparent 65%)' }} className="absolute inset-0" />
          <div style={{ background:'radial-gradient(ellipse at 85% 80%, rgba(139,92,246,0.1) 0%, transparent 50%)' }} className="absolute inset-0" />
          <div style={{ background:'radial-gradient(ellipse at 10% 90%, rgba(16,185,129,0.07) 0%, transparent 50%)' }} className="absolute inset-0" />
          {/* Animated dot grid */}
          <div className="absolute inset-0 opacity-[0.12]"
            style={{ backgroundImage:'radial-gradient(circle, rgba(148,163,184,0.6) 1px, transparent 1px)', backgroundSize:'36px 36px' }} />
          {/* Subtle horizontal lines */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage:'linear-gradient(0deg, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize:'100% 80px' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-2 gap-14 items-center">
          {/* Left — copy */}
          <div className="space-y-8 animate-fadeUp">
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2.5 bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold px-4 py-2 rounded-full backdrop-blur-sm">
              <span className="w-1.5 h-1.5 bg-brand-400 rounded-full pulse-dot" />
              Now with FLEX AI — your personal fitness coach
            </div>

            <div>
              <h1 className="text-6xl lg:text-7xl font-black leading-[0.95] mb-5">
                <span className={`block ${dark ? 'text-white' : 'text-gray-900'}`}>Track.</span>
                <span className="shimmer-text block">Improve.</span>
                <span className={`block ${dark ? 'text-white' : 'text-gray-900'}`}>Dominate.</span>
              </h1>
              <p className={`text-xl leading-relaxed max-w-lg ${dark ? 'text-dark-300' : 'text-gray-600'}`}>
                The only fitness platform combining AI coaching, gamification, and full gym management — built for people serious about results.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <button onClick={() => navigate('/register')}
                className="group btn-glow flex items-center gap-2.5 bg-gradient-to-r from-brand-500 to-blue-600 text-white font-bold px-8 py-4 rounded-2xl text-lg">
                Start Free Today
                <RiArrowRightLine className="group-hover:translate-x-1.5 transition-transform" />
              </button>
              <button onClick={() => scrollTo('how')}
                className={`btn-outline flex items-center gap-2 border font-semibold px-8 py-4 rounded-2xl text-lg ${dark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-700 shadow-sm'}`}>
                <RiPlayCircleLine className="text-brand-400" /> See How It Works
              </button>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-5">
              <div className="flex -space-x-2.5">
                {['MK','SA','RH','FA','ZH'].map((init, i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-dark-950 flex items-center justify-center text-xs font-bold text-white shadow-lg"
                    style={{ background: `hsl(${i * 55 + 200}, 65%, 45%)` }}>{init}</div>
                ))}
              </div>
              <div>
                <div className="flex gap-0.5 mb-0.5">
                  {[...Array(5)].map((_,i) => <span key={i} className="text-yellow-400 text-sm">★</span>)}
                </div>
                <p className={`text-xs ${dark ? 'text-dark-400' : 'text-gray-500'}`}>Loved by 500+ fitness enthusiasts</p>
              </div>
            </div>
          </div>

          {/* Right — floating mockup */}
          <div className="hidden lg:block relative h-[540px]">
            <FloatCard delay={0} className="absolute top-4 left-4 right-4 glass-card bg-dark-900/80 border border-white/10 rounded-3xl p-5 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <Logo size="sm" showText={false} />
                <div>
                  <p className="text-white font-bold text-sm">Today's Summary</p>
                  <p className="text-dark-400 text-xs">Monday · Chest Day</p>
                </div>
                <div className="ml-auto bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs px-2.5 py-1 rounded-lg font-semibold">Lvl 7</div>
              </div>
              <div className="grid grid-cols-3 gap-2.5 mb-4">
                {[['🔥','320 kcal','Burned'],['🥗','2,100','Calories'],['💪','85%','Goal']].map(([e,v,l])=>(
                  <div key={l} className="bg-dark-800/70 rounded-2xl p-3 text-center border border-white/5">
                    <p className="text-xl mb-0.5">{e}</p>
                    <p className="text-white font-bold text-sm">{v}</p>
                    <p className="text-dark-500 text-xs">{l}</p>
                  </div>
                ))}
              </div>
              <div className="bg-dark-800/60 rounded-2xl p-3 border border-white/5">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-dark-400">Weekly Progress</span>
                  <span className="text-brand-400 font-semibold">5 / 7 days</span>
                </div>
                <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-blue-500" style={{width:'71%'}}/>
                </div>
              </div>
            </FloatCard>

            <FloatCard delay={0.8} className="absolute bottom-24 -left-6 glass-card bg-dark-900/90 border border-yellow-500/25 rounded-2xl p-3.5 shadow-2xl flex items-center gap-3 w-56">
              <div className="w-10 h-10 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <RiTrophyLine className="text-yellow-400 text-lg"/>
              </div>
              <div>
                <p className="text-white text-xs font-bold">Badge Unlocked!</p>
                <p className="text-yellow-400 text-xs mt-0.5">7-Day Streak 🔥</p>
              </div>
            </FloatCard>

            <FloatCard delay={1.6} className="absolute bottom-6 right-2 glass-card bg-dark-900/90 border border-purple-500/25 rounded-2xl p-3.5 shadow-2xl w-60">
              <div className="flex items-center gap-2 mb-2">
                <RiRobot2Line className="text-purple-400"/>
                <span className="text-purple-400 text-xs font-bold">FLEX AI</span>
                <span className="ml-auto w-1.5 h-1.5 bg-green-400 rounded-full pulse-dot"/>
              </div>
              <p className="text-dark-300 text-xs leading-relaxed">"Increase protein by 20g today to hit your muscle gain target."</p>
            </FloatCard>

            <FloatCard delay={1.2} className="absolute top-2 right-2 bg-gradient-to-r from-brand-500 to-blue-600 rounded-2xl px-4 py-2.5 shadow-xl flex items-center gap-2">
              <RiFireLine className="text-white"/>
              <span className="text-white font-bold text-sm">+50 XP earned</span>
            </FloatCard>
          </div>
        </div>

        {/* Scroll cue */}
        <button onClick={() => scrollTo('stats')} className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-dark-600 hover:text-dark-400 transition-colors animate-bounce">
          <RiArrowDownLine className="text-xl" />
        </button>
      </section>

      {/* ── Stats ── */}
      <section id="stats" ref={statsRef} className={`py-20 border-y ${dark ? 'border-white/5 bg-white/[0.02]' : 'border-gray-200 bg-white'}`}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            {[
              { value: members,  suffix: '+',  label: 'Active Members',   color: 'text-brand-400',  bg: 'bg-brand-500/8' },
              { value: workouts, suffix: 'K+', label: 'Workouts Logged',  color: 'text-blue-400',   bg: 'bg-blue-500/8',  div: 1000 },
              { value: calories, suffix: 'M+', label: 'Calories Tracked', color: 'text-purple-400', bg: 'bg-purple-500/8',div: 1000000 },
            ].map(({ value, suffix, label, color, div }) => (
              <Reveal key={label}>
                <div className={`stat-hover rounded-2xl p-6 ${dark ? 'bg-dark-900 border border-dark-800 hover:border-dark-600' : 'bg-gray-50 border border-gray-200 hover:border-gray-300'}`}>
                  <p className={`text-5xl font-black ${color} mb-2`}>
                    {div ? (value / div).toFixed(1) : value.toLocaleString()}{suffix}
                  </p>
                  <p className={`text-sm ${dark ? 'text-dark-400' : 'text-gray-600'}`}>{label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <Reveal className="text-center mb-16">
            <p className="text-brand-400 text-xs font-bold tracking-[0.2em] uppercase mb-3">Everything You Need</p>
            <h2 className={`text-5xl font-black mb-4 ${dark ? 'text-white' : 'text-gray-900'}`}>Built Different</h2>
            <p className={`text-xl max-w-xl mx-auto ${dark ? 'text-dark-400' : 'text-gray-600'}`}>
              Not just another fitness app — a complete ecosystem designed to make you unstoppable.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, color, glow }, i) => (
              <Reveal key={title} delay={i * 0.08}>
                <div className={`feat-card group relative rounded-2xl p-6 overflow-hidden h-full ${
                  dark ? 'bg-dark-900 border border-dark-800 hover:border-brand-500/40' : 'bg-white border border-gray-200 hover:border-brand-400/40 shadow-sm'
                }`}
                  style={{ '--glow': glow }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 20px 50px ${glow}, 0 0 0 1px ${glow}`; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; }}>
                  {/* Glow blob */}
                  <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full blur-3xl opacity-0 group-hover:opacity-50 transition-opacity duration-500"
                    style={{ background: `radial-gradient(circle, ${glow}, transparent)` }} />
                  <div className={`icon-box w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon className="text-white text-xl" />
                  </div>
                  <h3 className={`font-bold text-lg mb-2 ${dark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
                  <p className={`text-sm leading-relaxed ${dark ? 'text-dark-400' : 'text-gray-600'}`}>{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how" className={`py-28 px-6 ${dark ? 'bg-white/[0.02] border-y border-white/5' : 'bg-gray-50 border-y border-gray-200'}`}>
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-16">
            <p className="text-blue-400 text-xs font-bold tracking-[0.2em] uppercase mb-3">Simple Process</p>
            <h2 className={`text-5xl font-black mb-4 ${dark ? 'text-white' : 'text-gray-900'}`}>Up & Running in Minutes</h2>
            <p className={`text-xl ${dark ? 'text-dark-400' : 'text-gray-600'}`}>Four steps from sign-up to your first tracked workout.</p>
          </Reveal>

          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-12 left-[calc(12.5%+24px)] right-[calc(12.5%+24px)] h-px bg-gradient-to-r from-brand-500/30 via-blue-500/50 to-purple-500/30" />

            <div className="grid md:grid-cols-4 gap-8">
              {STEPS.map(({ num, icon: Icon, title, desc }, i) => (
                <Reveal key={num} delay={i * 0.1}>
                  <div className="text-center">
                    <div className="relative inline-flex mb-5">
                      <div className={`step-card w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-lg ${
                        dark ? 'bg-dark-800 border border-dark-700 hover:border-brand-500/50' : 'bg-white border border-gray-200 hover:border-brand-400/50'
                      }`}>
                        <Icon className="text-brand-400 text-2xl" />
                      </div>
                      <span className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-brand-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-black shadow-lg">
                        {i + 1}
                      </span>
                    </div>
                    <h3 className={`font-bold text-base mb-2 ${dark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
                    <p className={`text-sm leading-relaxed ${dark ? 'text-dark-400' : 'text-gray-600'}`}>{desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal className="text-center mt-14">
            <button onClick={() => navigate('/register')}
              className="btn-glow inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-blue-600 text-white font-bold px-8 py-4 rounded-2xl">
              Get Started Free <RiArrowRightLine />
            </button>
          </Reveal>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-28 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Reveal>
            <p className="text-yellow-400 text-xs font-bold tracking-[0.2em] uppercase mb-3">Real Results</p>
            <h2 className={`text-5xl font-black mb-16 ${dark ? 'text-white' : 'text-gray-900'}`}>They Did It. You Can Too.</h2>
          </Reveal>

          <div className="relative min-h-[280px]">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className={`transition-all duration-700 ${i === activeTestimonial ? 'opacity-100 translate-y-0' : 'opacity-0 absolute inset-0 translate-y-6 pointer-events-none'}`}>
                <div className={`rounded-3xl p-10 max-w-2xl mx-auto glass-card ${dark ? 'bg-dark-900/80 border border-dark-700' : 'bg-white border border-gray-200 shadow-xl'}`}>
                  <div className="flex justify-center gap-1 mb-6">
                    {[...Array(5)].map((_,j) => <span key={j} className="text-yellow-400 text-xl">★</span>)}
                  </div>
                  <p className={`text-xl leading-relaxed mb-8 italic ${dark ? 'text-dark-100' : 'text-gray-700'}`}>"{t.text}"</p>
                  <div className="flex items-center justify-center gap-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${t.color} rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg`}>{t.avatar}</div>
                    <div className="text-left">
                      <p className={`font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{t.name}</p>
                      <p className="text-brand-400 text-sm">{t.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-2 mt-8">
            {TESTIMONIALS.map((_,i) => (
              <button key={i} onClick={() => setActiveTestimonial(i)}
                className={`h-2 rounded-full transition-all duration-300 ${i === activeTestimonial ? 'w-8 bg-brand-400' : `w-2 ${dark ? 'bg-dark-600' : 'bg-gray-300'}`}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" className={`py-28 px-6 border-y ${dark ? 'border-white/5 bg-white/[0.02]' : 'border-gray-200 bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <Reveal>
            <p className="text-brand-400 text-xs font-bold tracking-[0.2em] uppercase mb-3">About FitStack</p>
            <h2 className={`text-5xl font-black leading-tight mb-5 ${dark ? 'text-white' : 'text-gray-900'}`}>
              Built by Athletes,<br/><span className="shimmer-text">For Athletes.</span>
            </h2>
            <p className={`text-lg leading-relaxed mb-8 ${dark ? 'text-dark-300' : 'text-gray-600'}`}>
              FitStack was born from frustration — too many apps track numbers but don't actually help you improve.
              We combined sports science, AI, and gamification to create the platform we always wished existed.
            </p>
            <div className="space-y-3">
              {[
                { title: 'Science-Based',  desc: 'MET formula, Mifflin-St Jeor TDEE, BMI-based recommendations — real calculations.' },
                { title: 'AI-Powered',     desc: 'FLEX AI delivers personalized coaching, predictions, and insights around the clock.' },
                { title: 'Team-Ready',     desc: 'Trainer panels, QR attendance, fee tracking, and multi-role admin controls.' },
              ].map(({ title, desc }) => (
                <div key={title} className={`flex gap-4 p-4 rounded-2xl transition-all ${dark ? 'bg-dark-900 border border-dark-800 hover:border-dark-600' : 'bg-white border border-gray-200 hover:border-gray-300'}`}>
                  <div className="w-8 h-8 bg-brand-500/10 border border-brand-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <RiCheckLine className="text-brand-400 text-sm" />
                  </div>
                  <div>
                    <p className={`font-semibold mb-0.5 ${dark ? 'text-white' : 'text-gray-900'}`}>{title}</p>
                    <p className={`text-sm ${dark ? 'text-dark-400' : 'text-gray-600'}`}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className={`rounded-3xl p-8 mb-5 relative overflow-hidden ${dark ? 'bg-dark-900 border border-dark-800' : 'bg-white border border-gray-200 shadow-sm'}`}>
              <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/5 rounded-full blur-3xl" />
              <p className="text-brand-400 text-xs font-bold tracking-widest uppercase mb-3">Our Mission</p>
              <p className={`text-2xl font-black leading-tight mb-3 ${dark ? 'text-white' : 'text-gray-900'}`}>Make world-class fitness coaching accessible to everyone.</p>
              <p className={`text-sm leading-relaxed ${dark ? 'text-dark-400' : 'text-gray-600'}`}>Whether you're a beginner or elite athlete, FitStack adapts to your level and helps you reach goals you never thought possible.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { v:'2024',  l:'Founded',         c:'text-brand-400' },
                { v:'500+',  l:'Happy Users',      c:'text-blue-400' },
                { v:'15+',   l:'Badges to Earn',   c:'text-yellow-400' },
                { v:'4.9★',  l:'Average Rating',   c:'text-purple-400' },
              ].map(({ v, l, c }) => (
                <div key={l} className={`rounded-2xl p-5 text-center card-hover ${dark ? 'bg-dark-900 border border-dark-800 hover:border-dark-600' : 'bg-white border border-gray-200 shadow-sm'}`}>
                  <p className={`text-3xl font-black ${c} mb-1`}>{v}</p>
                  <p className={`text-sm ${dark ? 'text-dark-400' : 'text-gray-600'}`}>{l}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" className="py-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div style={{ background:'radial-gradient(ellipse 50% 60% at 80% 50%, rgba(139,92,246,0.07) 0%, transparent 70%)' }} className="absolute inset-0" />
        </div>
        <div className="max-w-7xl mx-auto relative grid lg:grid-cols-2 gap-16 items-start">
          <Reveal>
            <p className="text-purple-400 text-xs font-bold tracking-[0.2em] uppercase mb-3">Get In Touch</p>
            <h2 className={`text-5xl font-black leading-tight mb-5 ${dark ? 'text-white' : 'text-gray-900'}`}>
              Let's Talk<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-brand-400">Fitness.</span>
            </h2>
            <p className={`text-lg leading-relaxed mb-8 ${dark ? 'text-dark-300' : 'text-gray-600'}`}>
              Have a question, partnership idea, or just want to say hi? We usually respond within 24 hours.
            </p>
            <div className="space-y-3">
              {[
                { icon:'📧', title:'Email',   value:'hello@fitstack.app' },
                { icon:'💬', title:'Chat',    value:'Available in the app' },
                { icon:'🏢', title:'Office',  value:'Lahore, Pakistan' },
              ].map(({ icon, title, value }) => (
                <div key={title} className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${dark ? 'bg-dark-900 border border-dark-800 hover:border-dark-700' : 'bg-white border border-gray-200 hover:border-gray-300 shadow-sm'}`}>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${dark ? 'bg-dark-800 border border-dark-700' : 'bg-gray-50 border border-gray-200'}`}>{icon}</div>
                  <div>
                    <p className={`text-xs ${dark ? 'text-dark-500' : 'text-gray-400'}`}>{title}</p>
                    <p className={`font-semibold text-sm ${dark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className={`rounded-3xl p-8 relative overflow-hidden glass-card ${dark ? 'bg-dark-900/80 border border-dark-800' : 'bg-white border border-gray-200 shadow-xl'}`}>
              <div className="absolute top-0 left-0 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl" />
              <h3 className={`font-black text-2xl mb-6 ${dark ? 'text-white' : 'text-gray-900'}`}>Send a Message</h3>
              <form onSubmit={handleContact} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`text-xs font-medium block mb-1.5 ${dark ? 'text-dark-400' : 'text-gray-600'}`}>First Name</label>
                    <input value={contactForm.firstName} onChange={e=>setContactForm({...contactForm,firstName:e.target.value})} placeholder="John" className="input h-11 text-sm" />
                  </div>
                  <div>
                    <label className={`text-xs font-medium block mb-1.5 ${dark ? 'text-dark-400' : 'text-gray-600'}`}>Last Name</label>
                    <input value={contactForm.lastName} onChange={e=>setContactForm({...contactForm,lastName:e.target.value})} placeholder="Doe" className="input h-11 text-sm" />
                  </div>
                </div>
                <div>
                  <label className={`text-xs font-medium block mb-1.5 ${dark ? 'text-dark-400' : 'text-gray-600'}`}>Email Address</label>
                  <input type="email" value={contactForm.email} onChange={e=>setContactForm({...contactForm,email:e.target.value})} placeholder="you@example.com" className="input h-11 text-sm" required />
                </div>
                <div>
                  <label className={`text-xs font-medium block mb-1.5 ${dark ? 'text-dark-400' : 'text-gray-600'}`}>Subject</label>
                  <select value={contactForm.subject} onChange={e=>setContactForm({...contactForm,subject:e.target.value})} className="input h-11 text-sm">
                    <option value="">Select a topic</option>
                    <option>General Question</option>
                    <option>Partnership</option>
                    <option>Technical Support</option>
                    <option>Feature Request</option>
                  </select>
                </div>
                <div>
                  <label className={`text-xs font-medium block mb-1.5 ${dark ? 'text-dark-400' : 'text-gray-600'}`}>Message</label>
                  <textarea value={contactForm.message} onChange={e=>setContactForm({...contactForm,message:e.target.value})} placeholder="How can we help?" rows={4} className="textarea text-sm" required />
                </div>
                <button type="submit" disabled={contactLoading}
                  className="btn-glow w-full h-12 bg-gradient-to-r from-purple-500 to-brand-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                  {contactLoading
                    ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><span>Send Message</span><RiArrowRightLine /></>}
                </button>
              </form>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div style={{background:'radial-gradient(ellipse 70% 80% at 50% 50%, rgba(59,130,246,0.13) 0%, transparent 70%)'}} className="absolute inset-0"/>
          <div className="absolute inset-0 opacity-[0.08]" style={{backgroundImage:'radial-gradient(circle, rgba(148,163,184,0.5) 1px, transparent 1px)', backgroundSize:'30px 30px'}}/>
        </div>
        <Reveal className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs px-4 py-2 rounded-full mb-8">
            <span className="w-1.5 h-1.5 bg-brand-400 rounded-full pulse-dot"/>
            Join 500+ members transforming their lives
          </div>
          <h2 className={`text-6xl font-black mb-6 leading-tight ${dark ? 'text-white' : 'text-gray-900'}`}>
            Ready to<br/><span className="shimmer-text">Level Up?</span>
          </h2>
          <p className={`text-xl mb-10 ${dark ? 'text-dark-300' : 'text-gray-600'}`}>
            Free forever. No credit card. Setup in under 2 minutes.
          </p>
          <button onClick={() => navigate('/register')}
            className="group btn-glow inline-flex items-center gap-3 bg-gradient-to-r from-brand-500 to-blue-600 text-white font-black px-10 py-5 rounded-2xl text-xl">
            Start Your Journey
            <RiArrowRightLine className="group-hover:translate-x-2 transition-transform text-2xl"/>
          </button>
          <p className={`text-sm mt-5 ${dark ? 'text-dark-600' : 'text-gray-400'}`}>No credit card · Free forever · Takes 2 minutes</p>
        </Reveal>
      </section>

      {/* ── Footer ── */}
      <footer className={`border-t py-10 px-6 ${dark ? 'border-white/5' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" textSize="text-lg" />
          <p className={`text-sm ${dark ? 'text-dark-600' : 'text-gray-400'}`}>© {new Date().getFullYear()} FitStack. All rights reserved.</p>
          <div className="flex gap-6">
            {[['Login','/login'],['Register','/register'],['Pricing','/pricing']].map(([l,r]) => (
              <button key={l} onClick={() => navigate(r)}
                className={`text-sm transition-colors ${dark ? 'text-dark-500 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}>{l}</button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
