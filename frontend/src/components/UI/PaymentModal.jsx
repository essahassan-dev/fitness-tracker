import React, { useState } from 'react';
import {
  RiCloseLine, RiBankCardLine, RiBankLine,
  RiSmartphoneLine, RiCheckLine, RiLockLine,
  RiFlashlightLine, RiTimeLine,
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import { upgradeAPI } from '../../services/api';
import { getErrorMessage } from '../../utils/helpers';

const METHODS = [
  { key: 'card',          label: 'Credit / Debit Card', icon: RiBankCardLine },
  { key: 'bank_transfer', label: 'Bank Transfer',       icon: RiBankLine },
  { key: 'easypaisa',     label: 'Easypaisa',           icon: RiSmartphoneLine },
  { key: 'jazzcash',      label: 'JazzCash',            icon: RiSmartphoneLine },
];

const PaymentModal = ({ isOpen, onClose, plan, amount, onSuccess }) => {
  const [method, setMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    cardHolder: '', cardLast4: '',
    bankName: '', accountName: '', transactionId: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation per method
    if (method === 'card' && (!form.cardHolder.trim() || !form.cardLast4.trim())) {
      toast.error('Please enter card holder name and last 4 digits');
      return;
    }
    if ((method === 'bank_transfer') && (!form.bankName.trim() || !form.transactionId.trim())) {
      toast.error('Please enter bank name and transaction ID');
      return;
    }
    if ((method === 'easypaisa' || method === 'jazzcash') && !form.transactionId.trim()) {
      toast.error('Please enter transaction ID');
      return;
    }

    setLoading(true);
    try {
      await upgradeAPI.submit({ plan, payment: { method, ...form } });
      toast.success('Request submitted! Admin will review and activate your Premium.');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl animate-slide-up max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <RiFlashlightLine className="text-yellow-400 text-lg" />
            <h2 className="text-white font-semibold">Upgrade to Premium</h2>
          </div>
          <button onClick={onClose} className="text-dark-400 hover:text-white p-1 rounded-lg hover:bg-dark-800 transition-colors">
            <RiCloseLine className="text-xl" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Plan summary */}
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold capitalize">{plan} Plan</p>
                  <p className="text-dark-400 text-xs mt-0.5">
                    {plan === 'yearly' ? '365 days access' : '30 days access'}
                  </p>
                </div>
                <p className="text-yellow-400 font-bold text-xl">${amount}</p>
              </div>
              <div className="flex items-center gap-1.5 mt-3 text-dark-500 text-xs">
                <RiTimeLine className="text-xs" />
                Activation within 24 hours after admin approval
              </div>
            </div>

            {/* Payment method */}
            <div>
              <label className="label">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {METHODS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMethod(key)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      method === key
                        ? 'bg-brand-500/10 border-brand-500/50 text-white'
                        : 'bg-dark-800/50 border-dark-700 text-dark-400 hover:text-white hover:border-dark-600'
                    }`}
                  >
                    <Icon className="text-base flex-shrink-0" />
                    <span className="truncate">{label}</span>
                    {method === key && <RiCheckLine className="text-brand-400 ml-auto flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Card fields */}
            {method === 'card' && (
              <div className="space-y-3">
                <div>
                  <label className="label">Card Holder Name</label>
                  <input
                    value={form.cardHolder}
                    onChange={(e) => setForm({ ...form, cardHolder: e.target.value })}
                    placeholder="Name on card"
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Last 4 Digits of Card</label>
                  <input
                    value={form.cardLast4}
                    onChange={(e) => setForm({ ...form, cardLast4: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    placeholder="1234"
                    maxLength={4}
                    className="input"
                    required
                  />
                  <p className="text-dark-600 text-xs mt-1 flex items-center gap-1">
                    <RiLockLine className="text-xs" /> We only store last 4 digits for verification
                  </p>
                </div>
              </div>
            )}

            {/* Bank transfer fields */}
            {method === 'bank_transfer' && (
              <div className="space-y-3">
                <div>
                  <label className="label">Bank Name</label>
                  <input
                    value={form.bankName}
                    onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                    placeholder="e.g. HBL, UBL, Meezan"
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Account Holder Name</label>
                  <input
                    value={form.accountName}
                    onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                    placeholder="Your account name"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Transaction ID / Reference</label>
                  <input
                    value={form.transactionId}
                    onChange={(e) => setForm({ ...form, transactionId: e.target.value })}
                    placeholder="Transaction reference number"
                    className="input"
                    required
                  />
                </div>
              </div>
            )}

            {/* Easypaisa / JazzCash */}
            {(method === 'easypaisa' || method === 'jazzcash') && (
              <div className="space-y-3">
                <div className="bg-dark-800/50 rounded-xl p-3 text-sm text-dark-400">
                  <p className="text-white font-medium mb-1">Send payment to:</p>
                  <p>Account: <span className="text-white">0300-0000000</span></p>
                  <p>Name: <span className="text-white">FitStack Premium</span></p>
                </div>
                <div>
                  <label className="label">Transaction ID</label>
                  <input
                    value={form.transactionId}
                    onChange={(e) => setForm({ ...form, transactionId: e.target.value })}
                    placeholder="Enter transaction ID after payment"
                    className="input"
                    required
                  />
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-dark-950 font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-dark-950/30 border-t-dark-950 rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                <><RiFlashlightLine /> Submit Upgrade Request</>
              )}
            </button>

            <p className="text-dark-600 text-xs text-center">
              Your request will be reviewed by admin. Premium activates within 24 hours of approval.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
