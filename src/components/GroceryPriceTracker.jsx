import React, { useMemo, useState } from 'react';
import { getAveragePrice, getCheapestStore, getPriceAlert, getPriceHistory, getPriceTrackerData, logPrice, setPriceAlert } from '../services/priceTracker';

const CURRENCIES = ['PKR', 'GBP', 'USD', 'AED', 'MYR', 'CAD'];

const formatDate = (value) => {
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
};

const normalizeIngredient = (ingredient) => String(ingredient || '').trim().toLowerCase();

const getLatestCurrency = (history, fallback) => {
  if (history.length) {
    return history[history.length - 1].currency || fallback;
  }
  return fallback;
};

const PriceChart = ({ entries, currency }) => {
  if (!entries.length) {
    return <div className="text-sm text-text-tertiary">No price history yet.</div>;
  }

  const maxValue = Math.max(...entries.map((entry) => entry.price || 0), 1);
  const count = entries.length;
  const barWidth = 100 / count;

  return (
    <div className="space-y-2">
      <svg viewBox="0 0 100 100" className="w-full h-28">
        {entries.map((entry, index) => {
          const height = Math.max(6, (Number(entry.price || 0) / maxValue) * 80);
          const x = index * barWidth + 4;
          const width = Math.max(barWidth - 6, 4);
          const y = 96 - height;
          return (
            <rect
              key={`${entry.date}-${index}`}
              x={x}
              y={y}
              width={width}
              height={height}
              rx="2"
              fill="var(--brand-primary)"
              opacity="0.85"
            />
          );
        })}
      </svg>
      <div className="flex items-center justify-between text-xs text-text-tertiary">
        <span>{entries[0] ? formatDate(entries[0].date) : ''}</span>
        <span>{currency}</span>
        <span>{entries[entries.length - 1] ? formatDate(entries[entries.length - 1].date) : ''}</span>
      </div>
    </div>
  );
};

export default function GroceryPriceTracker({ initialIngredient = '', onClose }) {
  const [refreshToken, setRefreshToken] = useState(0);
  const [ingredientInput, setIngredientInput] = useState(initialIngredient);
  const [priceInput, setPriceInput] = useState('');
  const [currency, setCurrency] = useState('PKR');
  const [storeInput, setStoreInput] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [selectedIngredient, setSelectedIngredient] = useState(initialIngredient);
  const [notice, setNotice] = useState('');

  const trackerData = useMemo(() => getPriceTrackerData(), [refreshToken]);
  const ingredientKeys = Object.keys(trackerData.items || {});

  const normalizedSelected = normalizeIngredient(selectedIngredient);
  const history = useMemo(() => {
    return selectedIngredient ? getPriceHistory(selectedIngredient) : [];
  }, [selectedIngredient, refreshToken]);

  const latestCurrency = getLatestCurrency(history, currency);
  const chartCurrency = latestCurrency || currency;
  const chartEntries = history
    .filter((entry) => entry.currency === chartCurrency)
    .slice(-10);

  const averagePrice = selectedIngredient
    ? getAveragePrice(selectedIngredient, chartCurrency)
    : null;

  const cheapestStore = selectedIngredient
    ? getCheapestStore(selectedIngredient)
    : null;

  const priceAlertEnabled = selectedIngredient
    ? getPriceAlert(selectedIngredient)
    : false;

  const handleLogPrice = () => {
    const ingredient = ingredientInput.trim();
    const price = Number(priceInput);
    if (!ingredient || !Number.isFinite(price)) {
      setNotice('Add an ingredient and a valid price.');
      return;
    }

    const averageBefore = getAveragePrice(ingredient, currency);
    logPrice(ingredient, price, currency, storeInput, cityInput);

    if (getPriceAlert(ingredient) && averageBefore != null && price > averageBefore * 1.2) {
      setNotice(`Heads up: this price is 20% above your average (${currency} ${averageBefore}).`);
    } else {
      setNotice('Saved.');
    }

    setIngredientInput(ingredient);
    setSelectedIngredient(ingredient);
    setPriceInput('');
    setRefreshToken((value) => value + 1);
  };

  const handleSelectIngredient = (ingredient) => {
    setSelectedIngredient(ingredient);
    setIngredientInput(ingredient);
    setNotice('');
  };

  const handleToggleAlert = () => {
    if (!selectedIngredient) return;
    setPriceAlert(selectedIngredient, !priceAlertEnabled);
    setRefreshToken((value) => value + 1);
  };

  const content = (
    <div className="w-full max-w-3xl bg-surface text-text-primary rounded-3xl p-6 shadow-2xl border border-border-subtle animate-scale-in">
      <div className="flex items-center justify-between gap-3 mb-4 border-b border-border-subtle pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-text-tertiary font-bold">Grocery Price Tracker</p>
          <h3 className="text-2xl font-black font-display">Track ingredient prices</h3>
        </div>
        {onClose ? (
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary text-xl">✕</button>
        ) : null}
      </div>

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
        <div className="space-y-5">
          <div className="card bg-surface-2">
            <div className="text-sm font-semibold text-text-secondary mb-3">Log a price</div>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="text-xs font-semibold text-text-secondary">
                Ingredient
                <input
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  className="input mt-1"
                  placeholder="e.g., basmati rice"
                />
              </label>
              <label className="text-xs font-semibold text-text-secondary">
                Price
                <input
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="input mt-1"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="250"
                />
              </label>
              <label className="text-xs font-semibold text-text-secondary">
                Currency
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="input mt-1"
                >
                  {CURRENCIES.map((code) => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold text-text-secondary">
                Store
                <input
                  value={storeInput}
                  onChange={(e) => setStoreInput(e.target.value)}
                  className="input mt-1"
                  placeholder="e.g., Carrefour"
                />
              </label>
              <label className="text-xs font-semibold text-text-secondary sm:col-span-2">
                City/Region
                <input
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  className="input mt-1"
                  placeholder="e.g., Dubai Marina"
                />
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <button onClick={handleLogPrice} className="btn btn-primary">Save price</button>
              {notice ? <span className="text-xs text-text-secondary">{notice}</span> : null}
            </div>
          </div>

          <div className="card bg-surface-2">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <div className="text-sm font-semibold text-text-secondary">Price history</div>
                <div className="text-lg font-bold">{selectedIngredient || 'Pick an ingredient'}</div>
              </div>
              {selectedIngredient ? (
                <button onClick={handleToggleAlert} className={`chip ${priceAlertEnabled ? 'active' : ''}`}>
                  Price alert {priceAlertEnabled ? 'On' : 'Off'}
                </button>
              ) : null}
            </div>

            {selectedIngredient ? (
              <>
                <PriceChart entries={chartEntries} currency={chartCurrency} />
                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  <div className="badge badge-secondary">Average: {averagePrice != null ? `${chartCurrency} ${averagePrice}` : '—'}</div>
                  <div className="badge badge-secondary">Cheapest store: {cheapestStore || '—'}</div>
                </div>
              </>
            ) : (
              <div className="text-sm text-text-tertiary">Select an ingredient to see trends.</div>
            )}
          </div>
        </div>

        <div className="card bg-surface-2 h-full">
          <div className="text-sm font-semibold text-text-secondary mb-3">Tracked ingredients</div>
          {ingredientKeys.length ? (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {ingredientKeys.map((ingredient) => {
                const historyList = getPriceHistory(ingredient);
                const latest = historyList[historyList.length - 1];
                const displayName = latest?.ingredient || ingredient;
                const avg = latest ? getAveragePrice(ingredient, latest.currency) : null;
                const cheapest = getCheapestStore(ingredient);

                return (
                  <button
                    key={ingredient}
                    onClick={() => handleSelectIngredient(displayName)}
                    className={`w-full text-left p-3 rounded-2xl border transition ${normalizeIngredient(displayName) === normalizedSelected ? 'border-primary bg-surface' : 'border-border-subtle bg-surface-3'}`}
                  >
                    <div className="font-semibold">{displayName}</div>
                    <div className="text-xs text-text-tertiary mt-1">
                      Avg: {avg != null ? `${latest.currency} ${avg}` : '—'} · Cheapest: {cheapest || '—'}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-text-tertiary">No items tracked yet.</div>
          )}
        </div>
      </div>
    </div>
  );

  if (!onClose) return content;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-modal backdrop-blur-md">
      {content}
    </div>
  );
}
