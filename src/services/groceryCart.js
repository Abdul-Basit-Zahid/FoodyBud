import { storage } from './foodybud';
const CART_KEY = 'smartCart';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY ?? '';

const emitCartUpdate = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('foodybud-cart-update'));
  }
};

const normalizeItem = (value) => String(value || '').trim().toLowerCase();

const getCartData = () => storage.get(CART_KEY, { items: [] });

const saveCartData = (data) => {
  storage.set(CART_KEY, data);
  emitCartUpdate();
};

const callDeepSeekMerge = async (ingredients = []) => {
  if (!DEEPSEEK_API_KEY) throw new Error('Missing DEEPSEEK_API_KEY');

  const prompt = `Merge these ingredient quantities into a clean shopping list, combining duplicates. Return JSON array of {item, quantity, unit} only.

Ingredients:
${ingredients.map((item) => `- ${item}`).join('\n')}`;

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a precise JSON API. Return only valid JSON with no extra text.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2
    })
  });

  if (!response.ok) {
    throw new Error(`API ${response.status}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content || '';
  return JSON.parse(text);
};

export const addToCart = async (ingredients = [], recipeName = '', servings = 1) => {
  const list = (ingredients || []).map((item) => String(item || '').trim()).filter(Boolean);
  if (!list.length) return getCart();

  let merged = [];
  try {
    merged = await callDeepSeekMerge(list);
  } catch {
    merged = list.map((item) => ({ item, quantity: '', unit: '' }));
  }

  const data = getCartData();
  const items = Array.isArray(data.items) ? [...data.items] : [];
  const existingKeys = new Set(items.map((item) => normalizeItem(item.item)));

  merged.forEach((entry) => {
    const key = normalizeItem(entry.item);
    if (!key || existingKeys.has(key)) return;
    items.push({
      id: `cart_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      item: entry.item,
      quantity: entry.quantity || '',
      unit: entry.unit || '',
      bought: false,
      source: recipeName,
      servings
    });
    existingKeys.add(key);
  });

  saveCartData({ items });
  return items;
};

export const getCart = () => getCartData().items || [];

export const getCartCount = () => getCart().length;

export const removeFromCart = (itemId) => {
  const data = getCartData();
  const items = (data.items || []).filter((item) => item.id !== itemId);
  saveCartData({ items });
  return items;
};

export const clearCart = () => {
  saveCartData({ items: [] });
  return [];
};

export const markBought = (itemId) => {
  const data = getCartData();
  const items = (data.items || []).map((item) => (
    item.id === itemId ? { ...item, bought: !item.bought } : item
  ));
  saveCartData({ items });
  return items;
};

export const getCartTotal = () => {
  return null;
};
