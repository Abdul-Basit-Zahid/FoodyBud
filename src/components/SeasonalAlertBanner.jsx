import React, { useEffect, useMemo, useState } from 'react';
import { storage } from '../services/foodybud';

const DISMISS_KEY = 'seasonalBannerDismissed';

const shouldShowBanner = () => {
  const record = storage.get(DISMISS_KEY, null);
  if (!record?.date) return true;
  const last = new Date(record.date).getTime();
  if (!Number.isFinite(last)) return true;
  const diffDays = (Date.now() - last) / 86400000;
  return diffDays >= 7;
};

export default function SeasonalAlertBanner({ ingredients = [], onSelect }) {
  const [visible, setVisible] = useState(false);
  const items = useMemo(() => [...new Set(ingredients)].slice(0, 6), [ingredients]);

  useEffect(() => {
    setVisible(shouldShowBanner());
  }, [ingredients.length]);

  if (!visible || items.length < 3) return null;

  const handleDismiss = () => {
    storage.set(DISMISS_KEY, { date: new Date().toISOString() });
    setVisible(false);
  };

  return (
    <div className="container mt-4">
      <div className="card bg-surface-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-text-primary">{ingredients.length} ingredients are in peak season near you this month:</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {items.map((item) => (
              <button
                key={item}
                onClick={() => onSelect?.(item)}
                className="chip"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <button onClick={handleDismiss} className="btn btn-ghost btn-sm">Dismiss</button>
      </div>
    </div>
  );
}
