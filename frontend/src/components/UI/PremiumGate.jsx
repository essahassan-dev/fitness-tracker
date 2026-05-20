import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RiLockLine, RiFlashlightLine } from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';

// Wraps any content — blurs it and shows upgrade CTA if not premium
const PremiumGate = ({ children, feature = 'This feature', compact = false }) => {
  const { isPremium } = useAuth();
  const navigate = useNavigate();

  if (isPremium()) return children;

  if (compact) {
    return (
      <div className="relative">
        <div className="blur-sm pointer-events-none select-none opacity-50">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={() => navigate('/pricing')}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-dark-950 font-bold text-xs px-3 py-1.5 rounded-lg transition-all shadow-lg"
          >
            <RiLockLine /> Upgrade
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-yellow-500/20 bg-yellow-500/5 flex flex-col items-center justify-center py-12 text-center gap-4">
      <div className="w-14 h-14 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center justify-center">
        <RiLockLine className="text-yellow-400 text-2xl" />
      </div>
      <div>
        <p className="text-white font-semibold text-lg">{feature} is Premium</p>
        <p className="text-dark-400 text-sm mt-1 max-w-xs">
          Upgrade to Premium to unlock advanced analytics, smart recommendations, full nutrition tracking, and more.
        </p>
      </div>
      <button
        onClick={() => navigate('/pricing')}
        className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-dark-950 font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-yellow-500/20"
      >
        <RiFlashlightLine /> Upgrade to Premium
      </button>
    </div>
  );
};

export default PremiumGate;
