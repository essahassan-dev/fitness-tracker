import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiCheckLine, RiCloseLine, RiFlashlightLine,
  RiShieldCheckLine, RiArrowLeftLine, RiTimeLine,
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import { upgradeAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../utils/helpers';
import PaymentModal from '../../components/UI/PaymentModal';

const FREE_FEATURES = [
  { text: 'Workout tracking',              included: true },
  { text: 'Basic dashboard',               included: true },
  { text: 'Exercise logging',              included: true },
  { text: 'Basic progress tracking',       included: true },
  { text: 'Limited recommendations',       included: true },
  { text: 'Advanced nutrition analytics',  included: false },
  { text: 'Macro & protein tracking',      included: false },
  { text: 'Smart diet plans',              included: false },
  { text: 'Calories burned analytics',     included: false },
  { text: 'Premium workout plans',         included: false },
  { text: 'Advanced analytics charts',     included: false },
  { text: 'Detailed progress reports',     included: false },
];

const PREMIUM_FEATURES = [
  { text: 'Everything in Free',            included: true },
  { text: 'Advanced nutrition analytics',  included: true },
  { text: 'Macro & protein tracking',      included: true },
  { text: 'Smart diet plans',              included: true },
  { text: 'Calories burned analytics',     included: true },
  { text: 'Premium workout plans',         included: true },
  { text: 'Advanced analytics charts',     included: true },
  { text: 'Personalized AI recommendations', included: true },
  { text: 'Goal tracking insights',        included: true },
  { text: 'Detailed progress reports',     included: true },
  { text: 'Priority support',              included: true },
];

const Pricing = () => {
  const { user, isPremium, loadUser } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState('monthly');
  const [showPayment, setShowPayment] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(null);

  const prices = {
    monthly: { amount: 9.99,  label: '/month' },
    yearly:  { amount: 79.99, label: '/year'  },
  };

  // Check if user has a pending request
  React.useEffect(() => {
    upgradeAPI.getMyRequest()
      .then((res) => { if (res.data.data?.status === 'PENDING') setPendingRequest(res.data.data); })
      .catch(() => {});
  }, []);

  const alreadyPremium = isPremium() || user?.role === 'admin';

  return (
    <div className="min-h-screen bg-dark-950 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-dark-400 hover:text-white transition-colors text-sm mb-8"
        >
          <RiArrowLeftLine /> Back
        </button>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
            <RiFlashlightLine /> FitStack Premium
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">
            Unlock Your Full Potential
          </h1>
          <p className="text-dark-400 text-lg max-w-xl mx-auto">
            Get advanced analytics, smart recommendations, full nutrition tracking, and personalized fitness insights.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {['monthly', 'yearly'].map((plan) => (
            <button
              key={plan}
              onClick={() => setSelected(plan)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                selected === plan
                  ? 'bg-brand-500 text-white'
                  : 'bg-dark-800 text-dark-400 hover:text-white'
              }`}
            >
              {plan.charAt(0).toUpperCase() + plan.slice(1)}
              {plan === 'yearly' && (
                <span className="ml-2 text-xs bg-brand-500/20 text-brand-400 px-1.5 py-0.5 rounded-full">Save 33%</span>
              )}
            </button>
          ))}
        </div>

        {/* Plans grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free Plan */}
          <div className="card border-dark-700">
            <div className="mb-6">
              <h2 className="text-white font-bold text-xl mb-1">Free</h2>
              <p className="text-dark-400 text-sm">Get started with the basics</p>
              <div className="mt-4">
                <span className="text-4xl font-bold text-white">$0</span>
                <span className="text-dark-400 text-sm ml-1">forever</span>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              {FREE_FEATURES.map(({ text, included }) => (
                <div key={text} className="flex items-center gap-3">
                  {included ? (
                    <RiCheckLine className="text-brand-400 flex-shrink-0" />
                  ) : (
                    <RiCloseLine className="text-dark-600 flex-shrink-0" />
                  )}
                  <span className={`text-sm ${included ? 'text-dark-300' : 'text-dark-600'}`}>{text}</span>
                </div>
              ))}
            </div>

            <button
              disabled
              className="w-full py-3 rounded-xl bg-dark-800 text-dark-400 font-semibold text-sm cursor-not-allowed"
            >
              {!alreadyPremium ? 'Current Plan' : 'Free Plan'}
            </button>
          </div>

          {/* Premium Plan */}
          <div className="card border-yellow-500/30 bg-gradient-to-b from-yellow-500/5 to-transparent relative overflow-hidden">
            {/* Popular badge */}
            <div className="absolute top-4 right-4">
              <span className="bg-yellow-500 text-dark-950 text-xs font-bold px-3 py-1 rounded-full">
                POPULAR
              </span>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-white font-bold text-xl">Premium</h2>
                <RiFlashlightLine className="text-yellow-400" />
              </div>
              <p className="text-dark-400 text-sm">Full access to everything</p>
              <div className="mt-4">
                <span className="text-4xl font-bold text-white">${prices[selected].amount}</span>
                <span className="text-dark-400 text-sm ml-1">{prices[selected].label}</span>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              {PREMIUM_FEATURES.map(({ text, included }) => (
                <div key={text} className="flex items-center gap-3">
                  <RiCheckLine className="text-yellow-400 flex-shrink-0" />
                  <span className="text-sm text-dark-300">{text}</span>
                </div>
              ))}
            </div>

            {alreadyPremium ? (
              <div className="w-full py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 font-semibold text-sm text-center flex items-center justify-center gap-2">
                <RiShieldCheckLine /> Active Premium
              </div>
            ) : pendingRequest ? (
              <div className="w-full py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-semibold text-sm text-center flex items-center justify-center gap-2">
                <RiTimeLine /> Request Pending Approval
              </div>
            ) : (
              <button
                onClick={() => setShowPayment(true)}
                className="w-full py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-dark-950 font-bold text-sm transition-all shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2"
              >
                <RiFlashlightLine /> Upgrade to Premium
              </button>
            )}

            <p className="text-dark-600 text-xs text-center mt-3">
              {selected === 'yearly' ? '365 days access' : '30 days access'} · Cancel anytime
            </p>
          </div>
        </div>

        {/* Feature comparison note */}
        <div className="mt-12 text-center">
          <p className="text-dark-500 text-sm">
            Submit your payment details — admin will verify and activate Premium within 24 hours.
          </p>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        plan={selected}
        amount={prices[selected].amount}
        onSuccess={() => setPendingRequest({ status: 'PENDING' })}
      />
    </div>
  );
};

export default Pricing;
