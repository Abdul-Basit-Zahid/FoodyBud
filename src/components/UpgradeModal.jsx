import React from 'react';
import { X, Check } from 'lucide-react';
import { getMockUserState, saveMockUserState } from '../services/freemium';

export default function UpgradeModal({ onClose }) {
  const handleUpgrade = () => {
    const userState = getMockUserState();
    userState.isPremium = true;
    saveMockUserState(userState);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-modal backdrop-blur-md animate-fade-in">
      <div className="bg-surface w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative border border-border-subtle">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-surface-2 hover:bg-surface-3 text-text-secondary p-2 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 text-center bg-gradient-to-br from-primary-light to-surface-2 border-b border-border-subtle">
          <h2 className="text-2xl font-black mb-2 font-display text-text-brand">Unlock the Ultimate Halal Diaspora Assistant</h2>
          <p className="text-text-secondary font-medium font-sans">Elevate your kitchen and your faith.</p>
        </div>

        <div className="p-8">
          <div className="text-center mb-8">
            <span className="text-5xl font-black text-text-brand font-mono">$4.99</span>
            <span className="text-text-tertiary font-bold uppercase tracking-wider text-sm ml-1">/month</span>
          </div>

          <ul className="space-y-4 mb-8">
            <li className="flex items-start gap-3 font-medium text-text-primary">
              <div className="bg-success-light p-1 rounded-full mt-0.5"><Check className="w-4 h-4 text-success" /></div>
              <div>
                <strong className="text-text-primary block text-left">Halal-ify Engine</strong>
                <span className="text-xs text-text-secondary block text-left">Instantly swap wine, bacon, and gelatin for authentic Halal alternatives.</span>
              </div>
            </li>
            <li className="flex items-start gap-3 font-medium text-text-primary">
              <div className="bg-success-light p-1 rounded-full mt-0.5"><Check className="w-4 h-4 text-success" /></div>
              <div>
                <strong className="text-text-primary block text-left">Diaspora Split-Cart</strong>
                <span className="text-xs text-text-secondary block text-left">Separate mainstream supermarket runs from Halal & ethnic grocer trips.</span>
              </div>
            </li>
            <li className="flex items-start gap-3 font-medium text-text-primary">
              <div className="bg-success-light p-1 rounded-full mt-0.5"><Check className="w-4 h-4 text-success" /></div>
              <div>
                <strong className="text-text-primary block text-left">Sunnah & Ramadan Fasting Planner</strong>
                <span className="text-xs text-text-secondary block text-left">Optimized Suhoor & Iftar windows weighting hydration and slow-release casein.</span>
              </div>
            </li>
          </ul>

          <button onClick={handleUpgrade} className="w-full btn btn-primary py-4 text-lg">
            Upgrade Now - $4.99/mo
          </button>

          <p className="text-center text-sm text-text-tertiary font-medium mt-4">
            Cancel anytime. No questions asked.
          </p>
        </div>
      </div>
    </div>
  );
}
