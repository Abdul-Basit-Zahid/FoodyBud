import { storage } from './foodybud';

const STORAGE_KEY = 'priceTracker';

const normalizeIngredient = (ingredient) => String(ingredient || '').trim().toLowerCase();

export const getPriceTrackerData = () => {
  return storage.get(STORAGE_KEY, { items: {}, alerts: {} });
};

const savePriceTrackerData = (data) => storage.set(STORAGE_KEY, data);

export const logPrice = (ingredient, price, currency, store, city, date = new Date().toISOString()) => {
  const key = normalizeIngredient(ingredient);
  if (!key || !Number.isFinite(price)) return false;

  const data = getPriceTrackerData();
  const items = data.items || {};
  const list = Array.isArray(items[key]) ? [...items[key]] : [];

  list.unshift({
    ingredient: String(ingredient || '').trim(),
    price,
    currency,
    store: String(store || '').trim(),
    city: String(city || '').trim(),
    date
  });

  items[key] = list.slice(0, 50);
  data.items = items;
  savePriceTrackerData(data);
  return true;
};

export const getPriceHistory = (ingredient) => {
  const key = normalizeIngredient(ingredient);
  const data = getPriceTrackerData();
  const list = Array.isArray(data.items?.[key]) ? [...data.items[key]] : [];
  return list.sort((a, b) => new Date(a.date) - new Date(b.date));
};

export const getAveragePrice = (ingredient, currency) => {
  const history = getPriceHistory(ingredient).filter((entry) => entry.currency === currency);
  const recent = history.slice(-10);
  if (!recent.length) return null;
  const sum = recent.reduce((acc, entry) => acc + Number(entry.price || 0), 0);
  return Math.round((sum / recent.length) * 100) / 100;
};

export const getCheapestStore = (ingredient) => {
  const history = getPriceHistory(ingredient);
  if (!history.length) return null;
  const latestCurrency = history[history.length - 1].currency;
  const filtered = history.filter((entry) => entry.currency === latestCurrency && entry.store);
  if (!filtered.length) return null;

  const grouped = filtered.reduce((acc, entry) => {
    const key = entry.store.toLowerCase();
    const current = acc[key] || { store: entry.store, total: 0, count: 0 };
    current.total += Number(entry.price || 0);
    current.count += 1;
    acc[key] = current;
    return acc;
  }, {});

  let cheapest = null;
  Object.values(grouped).forEach((group) => {
    const avg = group.count ? group.total / group.count : null;
    if (avg == null) return;
    if (!cheapest || avg < cheapest.avg) {
      cheapest = { store: group.store, avg };
    }
  });

  return cheapest ? cheapest.store : null;
};

export const getPriceAlert = (ingredient) => {
  const key = normalizeIngredient(ingredient);
  const data = getPriceTrackerData();
  return Boolean(data.alerts?.[key]);
};

export const setPriceAlert = (ingredient, enabled) => {
  const key = normalizeIngredient(ingredient);
  if (!key) return false;
  const data = getPriceTrackerData();
  const alerts = data.alerts || {};
  alerts[key] = Boolean(enabled);
  data.alerts = alerts;
  savePriceTrackerData(data);
  return true;
};
