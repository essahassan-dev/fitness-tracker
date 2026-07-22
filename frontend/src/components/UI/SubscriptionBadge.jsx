import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RiFlashlightLine, RiLockLine } from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';

// Small badge shown next to username in sidebar / profile
export const PremiumBadge = () => (
  <span className="inline-flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold px-2 py-0.5 rounded-full">
    <RiFlashlightLine className="text-xs" /> PRO
  </span>
);

// Lock icon shown on premium features
export const PremiumLock = ({ onClick }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-medium px-2 py-0.5 rounded-full hover:bg-yellow-500/20 transition-colors"
  >
    <RiLockLine className="text-xs" /> Premium
  </button>
);

// Full subscription status card for profile/settings page
export const SubscriptionCard = () => {
  const { user, isPremium } = useAuth();
  const navigate = useNavigate();
  const sub = user?.subscription;
  const premium = isPremium();

  // Admin sees nothing — they have full access
  if (user?.role === 'admin') return null;

  const endDate = sub?.endDate ? new Date(sub.endDate) : null;
  const daysLeft = endDate
    ? Math.max(0, Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className={`card border ${premium ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-dark-700'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${premium ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-dark-800 border border-dark-700'}`}>
            <RiFlashlightLine className={premium ? 'text-yellow-400 text-lg' : 'text-dark-500 text-lg'} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-white font-semibold">{premium ? 'Premium Plan' : 'Free Plan'}</p>
              {premium && <PremiumBadge />}
            </div>
            <p className="text-dark-400 text-xs mt-0.5">
              {premium
                ? daysLeft !== null
                  ? `${daysLeft} days remaining · expires ${endDate?.toLocaleDateString()}`
                  : 'Active subscription'
                : 'Limited features'}
            </p>
          </div>
        </div>
        {!premium && (
          <button
            onClick={() => navigate('/pricing')}
            className="bg-yellow-500 hover:bg-yellow-400 text-dark-950 font-bold text-xs px-4 py-2 rounded-xl transition-all"
          >
            Upgrade
          </button>
        )}
      </div>

      {premium && (
        <div className="mt-4 pt-4 border-t border-yellow-500/10 grid grid-cols-3 gap-3 text-center">
          {[
            { label: 'Plan',    value: 'Premium' },
            { label: 'Status',  value: sub?.status || 'Active' },
            { label: 'Expires', value: endDate ? endDate.toLocaleDateString() : 'Never' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-dark-500 text-xs">{label}</p>
              <p className="text-white text-sm font-medium mt-0.5 capitalize">{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PremiumBadge;
