import React from 'react';
import { X, Check } from 'lucide-react';

export default function UpgradeModal({ pricing, onClose }) {
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
          <h2 className="text-3xl font-black mb-2 font-display">Unlock FoodyBud Pro</h2>
          <p className="text-text-secondary font-medium">You've hit your free searches for today.</p>
        </div>

        <div className="p-8">
          <div className="text-center mb-8">
            <span className="text-5xl font-black text-text-brand font-mono">{pricing.price}</span>
            <span className="text-text-tertiary font-bold uppercase tracking-wider text-sm ml-1">/{pricing.period}</span>
          </div>

          <ul className="space-y-4 mb-8">
            <li className="flex items-center gap-3 font-medium text-text-primary">
              <div className="bg-success-light p-1 rounded-full"><Check className="w-4 h-4 text-success" /></div>
              Unlimited meal searches
            </li>
            <li className="flex items-center gap-3 font-medium text-text-primary">
              <div className="bg-success-light p-1 rounded-full"><Check className="w-4 h-4 text-success" /></div>
              Advanced AI chef recipes
            </li>
            <li className="flex items-center gap-3 font-medium text-text-primary">
              <div className="bg-success-light p-1 rounded-full"><Check className="w-4 h-4 text-success" /></div>
              Save infinite favorites
            </li>
            <li className="flex items-center gap-3 font-medium text-text-primary">
              <div className="bg-success-light p-1 rounded-full"><Check className="w-4 h-4 text-success" /></div>
              No ads, ever
            </li>
          </ul>

          <button className="w-full btn btn-primary py-4 text-lg">
            Upgrade Now
          </button>

          <p className="text-center text-sm text-text-tertiary font-medium mt-4">
            Cancel anytime. No questions asked.
          </p>
        </div>
      </div>
    </div>
  );
}
