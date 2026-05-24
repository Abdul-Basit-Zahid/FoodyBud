import React, { useState } from 'react';
import { Shuffle } from 'lucide-react';

const INGREDIENTS = ['butter', 'garlic', 'chili flakes', 'cream', 'parsley'];

const SWAP_GROUPS = [
  {
    title: 'Direct Flavor Swap',
    items: [
      { name: 'ghee', ratio: '1:1', note: 'Richer toasted flavor.' },
      { name: 'olive oil', ratio: '3:4', note: 'Lighter, grassy finish.' },
    ],
  },
  {
    title: 'Texture Match',
    items: [
      { name: 'cream cheese', ratio: '1:1', note: 'Thicker, tangy body.' },
      { name: 'coconut cream', ratio: '1:1', note: 'Silky with slight sweetness.' },
    ],
  },
  {
    title: 'Common Pantry Alternative',
    items: [
      { name: 'yogurt + oil', ratio: '1:1', note: 'Balanced dairy replacement.' },
      { name: 'milk + cornstarch', ratio: '1:1', note: 'Restores thickness.' },
    ],
  },
];

export default function PanicSwapEngine() {
  const [activeIngredient, setActiveIngredient] = useState(null);

  return (
    <section className="bg-surface rounded-3xl border border-border-subtle p-6">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-text-tertiary font-bold">Panic Swap</p>
        <h2 className="text-2xl font-display font-black text-text-primary">Mid-Cook Substitution Engine</h2>
        <p className="text-sm text-text-secondary">Trigger swaps without breaking flow.</p>
      </div>

      <div className="space-y-3">
        {INGREDIENTS.map((item) => (
          <div key={item} className="flex items-center justify-between bg-surface-2 border border-border-subtle rounded-2xl px-4 py-3">
            <span className="text-sm font-semibold text-text-primary">{item}</span>
            <button
              type="button"
              onClick={() => setActiveIngredient(item)}
              className="btn btn-ghost btn-sm flex items-center gap-2"
            >
              <Shuffle className="w-4 h-4" /> Swap
            </button>
          </div>
        ))}
      </div>

      {activeIngredient ? (
        <div className="mt-6 bg-surface-3 border border-border-strong rounded-3xl p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-text-tertiary font-bold">Swapping</p>
              <h3 className="text-xl font-display font-black text-text-primary">{activeIngredient}</h3>
            </div>
            <button type="button" onClick={() => setActiveIngredient(null)} className="btn btn-ghost btn-sm">
              Close
            </button>
          </div>

          <div className="grid gap-4">
            {SWAP_GROUPS.map((group) => (
              <div key={group.title} className="bg-surface rounded-2xl border border-border-subtle p-4">
                <h4 className="text-sm font-semibold text-text-primary">{group.title}</h4>
                <div className="mt-3 space-y-2">
                  {group.items.map((swap) => (
                    <div key={swap.name} className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-text-primary">{swap.name}</div>
                        <div className="text-xs text-text-secondary">{swap.note}</div>
                      </div>
                      <div className="font-mono text-sm text-brand">{swap.ratio}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
