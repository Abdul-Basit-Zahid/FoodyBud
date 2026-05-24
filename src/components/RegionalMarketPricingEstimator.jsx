import React, { useMemo, useState } from 'react';
import { BadgeDollarSign, MapPin } from 'lucide-react';

const REGIONS = [
  { id: 'karachi', label: 'Karachi' },
  { id: 'lahore', label: 'Lahore' },
  { id: 'dubai', label: 'Dubai' },
  { id: 'london', label: 'London' },
];

const PRICE_TIERS = {
  low: { label: 'Low Cost', className: 'bg-success-light text-success border-success' },
  mid: { label: 'Premium', className: 'bg-warning-light text-warning border-warning' },
  high: { label: 'Luxury', className: 'bg-error-light text-error border-error' },
};

const RECIPES = [
  { id: 'rp-1', title: 'Desi Chili Chicken', estimate: 12, tier: 'mid' },
  { id: 'rp-2', title: 'Market Veg Curry', estimate: 8, tier: 'low' },
  { id: 'rp-3', title: 'Seafood Citrus Platter', estimate: 22, tier: 'high' },
];

export default function RegionalMarketPricingEstimator() {
  const [region, setRegion] = useState(REGIONS[0].id);
  const [budget, setBudget] = useState('15');

  const filtered = useMemo(() => {
    const max = Number(budget || 0);
    if (!max) return RECIPES;
    return RECIPES.filter((recipe) => recipe.estimate <= max);
  }, [budget]);

  return (
    <section className="bg-surface rounded-3xl border border-border-subtle p-6">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-text-tertiary font-bold">Market Pricing</p>
        <h2 className="text-2xl font-display font-black text-text-primary">Regional Cost Estimator</h2>
        <p className="text-sm text-text-secondary">Estimate dinner tiers based on local prices.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-surface-2 border border-border-subtle rounded-2xl p-4">
          <label className="text-xs text-text-tertiary">Region</label>
          <div className="flex items-center gap-2 mt-2">
            <MapPin className="w-4 h-4 text-brand" />
            <select
              className="input flex-1"
              value={region}
              onChange={(event) => setRegion(event.target.value)}
            >
              {REGIONS.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="bg-surface-2 border border-border-subtle rounded-2xl p-4">
          <label className="text-xs text-text-tertiary">Group Budget Cap</label>
          <div className="flex items-center gap-2 mt-2">
            <BadgeDollarSign className="w-4 h-4 text-brand" />
            <input
              className="input flex-1 font-mono"
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
            />
          </div>
          <p className="text-xs text-text-tertiary mt-2">Only show dinners under the group cap.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {filtered.map((recipe) => (
          <div key={recipe.id} className="bg-surface-2 border border-border-subtle rounded-2xl p-4">
            <div className="aspect-food-card rounded-xl bg-surface-3 border border-border-subtle" />
            <h3 className="mt-4 text-lg font-display font-bold text-text-primary">{recipe.title}</h3>
            <div className="mt-3 flex items-center justify-between">
              <span className="font-mono text-text-primary">${recipe.estimate}</span>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${PRICE_TIERS[recipe.tier].className}`}>
                {PRICE_TIERS[recipe.tier].label}
              </span>
            </div>
            <p className="text-xs text-text-tertiary mt-2">Region: {region}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
