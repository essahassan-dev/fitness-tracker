import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiUserLine, RiBuildingLine, RiArrowRightLine, RiCheckLine } from 'react-icons/ri';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/UI/Logo';
import toast from 'react-hot-toast';

const UseModeSelect = () => {
  const { updateUser, user } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(false);

  const handleContinue = async () => {
    if (!selected) return toast.error('Please select how you want to use FitStack');
    setLoading(true);
    try {
      const res = await authAPI.setUseMode(selected);
      updateUser(res.data.data);
      toast.success(selected === 'personal' ? 'Personal mode activated!' : 'Gym mode activated!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error('Failed to save preference');
    } finally {
      setLoading(false);
    }
  };

  const modes = [
    {
      id: 'personal',
      icon: RiUserLine,
      title: 'For Myself',
      subtitle: 'Personal fitness tracking',
      description: 'Track your workouts, nutrition, progress, and get AI-powered plans — no gym, no trainer, just you.',
      features: ['Workout tracking', 'Nutrition & diet', 'Progress charts', 'AI weekly plans', 'FLEX AI coach', 'Gamification & XP'],
      color: '#60a5fa',
      gradient: 'linear-gradient(135deg, rgba(96,165,250,0.15), rgba(15,23,42,0.8))',
      border: 'rgba(96,165,250,0.25)',
    },
    {
      id: 'gym',
      icon: RiBuildingLine,
      title: 'For the Gym',
      subtitle: 'Gym & team management',
      description: 'Full gym management with trainers, attendance QR, fee tracking, and admin controls.',
      features: ['Everything in Personal', 'QR Attendance', 'Trainer support', 'Fee management', 'Admin panel', 'Team collaboration'],
      color: '#a78bfa',
      gradient: 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(15,23,42,0.8))',
      border: 'rgba(167,139,250,0.25)',
    },
  ];

  return (
    <div className="min-h-screen bg-[#020817] flex flex-col items-center justify-center p-6">
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.6s ease forwards; }
        .mode-card { transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease; }
        .mode-card:hover { transform: translateY(-4px); }
      `}</style>

      <div className="w-full max-w-2xl fade-up">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Logo size="lg" textSize="text-3xl" />
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-white mb-3">
            Welcome, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-slate-400 text-base leading-relaxed">
            How are you planning to use FitStack? You can change this anytime from your profile.
          </p>
        </div>

        {/* Mode cards */}
        <div className="grid sm:grid-cols-2 gap-5 mb-8">
          {modes.map(mode => {
            const Icon    = mode.icon;
            const isSelected = selected === mode.id;
            return (
              <button key={mode.id} onClick={() => setSelected(mode.id)}
                className="mode-card relative text-left rounded-2xl p-6 outline-none"
                style={{
                  background:  isSelected ? mode.gradient : 'rgba(255,255,255,0.03)',
                  border:      `2px solid ${isSelected ? mode.color : 'rgba(255,255,255,0.08)'}`,
                  boxShadow:   isSelected ? `0 0 40px ${mode.color}30` : 'none',
                }}>
                {/* Check indicator */}
                {isSelected && (
                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: mode.color }}>
                    <RiCheckLine className="text-white text-sm" />
                  </div>
                )}

                {/* Icon */}
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: `${mode.color}18`, border: `1px solid ${mode.color}30` }}>
                  <Icon className="text-2xl" style={{ color: mode.color }} />
                </div>

                {/* Text */}
                <h3 className="text-white font-bold text-lg mb-1">{mode.title}</h3>
                <p className="text-xs font-semibold mb-3" style={{ color: mode.color }}>{mode.subtitle}</p>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">{mode.description}</p>

                {/* Features */}
                <ul className="space-y-1.5">
                  {mode.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-slate-300">
                      <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: `${mode.color}20` }}>
                        <RiCheckLine className="text-xs" style={{ color: mode.color }} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        {/* Continue button */}
        <button onClick={handleContinue} disabled={!selected || loading}
          className="w-full h-13 py-3.5 rounded-2xl text-base font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: selected
              ? `linear-gradient(135deg, ${modes.find(m=>m.id===selected)?.color}, ${selected==='personal'?'#2563eb':'#6d28d9'})`
              : 'rgba(255,255,255,0.06)',
            boxShadow: selected ? `0 0 30px ${modes.find(m=>m.id===selected)?.color}40` : 'none',
          }}>
          {loading
            ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><span>Continue to Dashboard</span><RiArrowRightLine /></>}
        </button>

        <p className="text-center text-slate-600 text-xs mt-4">
          You can switch modes anytime from your profile settings
        </p>
      </div>
    </div>
  );
};

export default UseModeSelect;
