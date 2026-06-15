import React, { useMemo, useState } from 'react';
import { clearCart, getCart, markBought, removeFromCart } from '../services/groceryCart';
import { categorizeIngredient } from './PlannerScreen';

export default function SmartCartModal({ onClose }) {
  const [refreshToken, setRefreshToken] = useState(0);
  const items = useMemo(() => getCart(), [refreshToken]);
  const [copied, setCopied] = useState(false);

  const grouped = useMemo(() => {
    return items.reduce((acc, item) => {
      const category = categorizeIngredient(item.item || '');
      acc[category] = acc[category] || [];
      acc[category].push(item);
      return acc;
    }, {});
  }, [items]);

  const refresh = () => setRefreshToken((value) => value + 1);

  const copyToClipboard = () => {
    const lines = items.map((item) => `- ${item.item} ${item.quantity ? `(${item.quantity} ${item.unit || ''})` : ''}`.trim());
    const text = `FoodyBud Grocery List\n\n${lines.join('\n')}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-modal backdrop-blur-md">
      <div className="w-full max-w-3xl bg-surface text-text-primary rounded-3xl p-6 shadow-2xl border border-border-subtle animate-scale-in">
        <div className="flex items-center justify-between gap-3 mb-4 border-b border-border-subtle pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-text-tertiary font-bold">Grocery List</p>
            <h3 className="text-2xl font-black font-display">{items.length} items</h3>
          </div>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary text-xl">✕</button>
        </div>

        {items.length === 0 ? (
          <div className="text-sm text-text-tertiary">Your cart is empty.</div>
        ) : (
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
            {Object.entries(grouped).map(([category, list]) => (
              <div key={category}>
                <div className="text-xs uppercase tracking-[0.2em] text-text-tertiary font-bold mb-2">{category}</div>
                <div className="space-y-2">
                  {list.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 rounded-2xl border border-border-subtle bg-surface-2 p-3">
                      <button
                        onClick={() => { markBought(item.id); refresh(); }}
                        className={`w-6 h-6 rounded-full border flex items-center justify-center ${item.bought ? 'bg-success text-text-inverse border-success' : 'border-border-default'}`}
                      >
                        {item.bought ? '✓' : ''}
                      </button>
                      <div className={`flex-1 text-sm ${item.bought ? 'line-through text-text-tertiary' : ''}`}>
                        {item.item}
                      </div>
                      {item.quantity ? <span className="badge badge-secondary">{item.quantity} {item.unit || ''}</span> : null}
                      <button onClick={() => { removeFromCart(item.id); refresh(); }} className="btn btn-ghost btn-sm">Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2 justify-between">
          <div className="flex flex-wrap gap-2">
            <button onClick={copyToClipboard} className="btn btn-primary">
              {copied ? '✓ Copied!' : '📋 Copy List'}
            </button>
          </div>
          <button onClick={() => { clearCart(); refresh(); }} className="btn btn-secondary">Clear List</button>
        </div>
      </div>
    </div>
  );
}
