import React, { useMemo, useState } from 'react';

const BASE_SERVINGS = 2;
const INGREDIENTS = [
  { name: 'chicken breast', amount: 12, unit: 'oz' },
  { name: 'olive oil', amount: 2, unit: 'tbsp' },
  { name: 'basmati rice', amount: 8, unit: 'oz' },
  { name: 'oven temp', amount: 400, unit: 'F' },
];

const convertToMetric = (item) => {
  if (item.unit === 'oz') return { ...item, amount: item.amount * 28.35, unit: 'g' };
  if (item.unit === 'lbs') return { ...item, amount: item.amount * 0.45, unit: 'kg' };
  if (item.unit === 'F') return { ...item, amount: ((item.amount - 32) * 5) / 9, unit: 'C' };
  return item;
};

const convertToImperial = (item) => {
  if (item.unit === 'g') return { ...item, amount: item.amount / 28.35, unit: 'oz' };
  if (item.unit === 'kg') return { ...item, amount: item.amount / 0.45, unit: 'lbs' };
  if (item.unit === 'C') return { ...item, amount: (item.amount * 9) / 5 + 32, unit: 'F' };
  return item;
};

const formatNumber = (value) => {
  const rounded = Math.round(value * 10) / 10;
  return Number.isFinite(rounded) ? rounded.toString() : '0';
};

export default function ServingScalerConverter() {
  const [servings, setServings] = useState(BASE_SERVINGS);
  const [unitMode, setUnitMode] = useState('imperial');

  const scaledIngredients = useMemo(() => {
    const multiplier = servings / BASE_SERVINGS;
    return INGREDIENTS.map((item) => ({
      ...item,
      amount: item.amount * multiplier,
    }));
  }, [servings]);

  const convertedIngredients = useMemo(() => {
    if (unitMode === 'metric') return scaledIngredients.map(convertToMetric);
    return scaledIngredients.map(convertToImperial);
  }, [scaledIngredients, unitMode]);

  return (
    <section className="bg-surface rounded-3xl border border-border-subtle p-6">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-text-tertiary font-bold">Scaler</p>
        <h2 className="text-2xl font-display font-black text-text-primary">Dynamic Serving Converter</h2>
        <p className="text-sm text-text-secondary">Scale servings and switch between units.</p>
      </div>

      <div className="bg-surface-2 border border-border-subtle rounded-2xl p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-text-tertiary uppercase tracking-[0.2em] font-bold">Servings</p>
            <div className="text-3xl font-mono font-black text-brand">{servings}</div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setUnitMode('imperial')}
              className={`btn btn-sm ${unitMode === 'imperial' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Imperial
            </button>
            <button
              type="button"
              onClick={() => setUnitMode('metric')}
              className={`btn btn-sm ${unitMode === 'metric' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Metric
            </button>
          </div>
        </div>
        <input
          type="range"
          min="1"
          max="12"
          value={servings}
          onChange={(event) => setServings(Number(event.target.value))}
          className="w-full mt-4"
        />
      </div>

      <div className="mt-6 grid gap-3">
        {convertedIngredients.map((item) => (
          <div key={item.name} className="flex items-center justify-between bg-surface-2 border border-border-subtle rounded-2xl px-4 py-3">
            <span className="text-sm font-semibold text-text-primary">{item.name}</span>
            <span className="font-mono text-sm text-text-primary">
              {formatNumber(item.amount)} {item.unit}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
