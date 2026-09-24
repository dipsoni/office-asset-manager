import React, { useState } from 'react';
import { Lock, KeyRound, ShieldAlert, ArrowRight } from 'lucide-react';
import { api } from '../api';

export default function PinLockModal({ isLocked, onUnlock, ownerName }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  if (!isLocked) return null;

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (!pin) return;

    try {
      setVerifying(true);
      setError('');
      const res = await api.verifyPin(pin);
      if (res.valid) {
        onUnlock();
        setPin('');
      } else {
        setError('Incorrect PIN. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Verification error');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center shadow-inner">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            AssetVault Locked
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Welcome back, <span className="font-semibold text-slate-800 dark:text-slate-200">{ownerName || 'Deep'}</span>. Enter your PIN to access your personal asset inventory.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-600 text-xs font-semibold rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleUnlock} className="space-y-4">
          <input
            type="password"
            autoFocus
            maxLength={6}
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full text-center text-2xl font-mono tracking-widest py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white"
          />

          <button
            type="submit"
            disabled={verifying || !pin}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <span>{verifying ? 'Unlocking...' : 'Unlock System'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-[11px] text-slate-400">
          This system is running 100% locally on your computer.
        </p>
      </div>
    </div>
  );
}
