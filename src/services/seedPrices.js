import { logPrice } from './priceTracker';
import { storage } from './foodybud';

const SEEDED_KEY = 'priceSeedComplete';

/**
 * Realistic Pakistani grocery prices (PKR) sourced from local sabzi mandi
 * and general store rates as of June 2026. Prices are per kg/liter/dozen
 * unless otherwise noted.
 */
const PAKISTANI_PRICES = [
  // --- Staples ---
  { ingredient: 'Basmati Rice', price: 280, store: 'Local Kiryana', city: 'Lahore' },
  { ingredient: 'Basmati Rice', price: 320, store: 'Carrefour', city: 'Lahore' },
  { ingredient: 'Basmati Rice', price: 260, store: 'Sabzi Mandi', city: 'Karachi' },
  { ingredient: 'Wheat Flour (Atta)', price: 110, store: 'Local Kiryana', city: 'Lahore' },
  { ingredient: 'Wheat Flour (Atta)', price: 120, store: 'Imtiaz', city: 'Karachi' },
  { ingredient: 'Sugar', price: 95, store: 'Local Kiryana', city: 'Lahore' },

  // --- Meats ---
  { ingredient: 'Chicken (whole)', price: 420, store: 'Chicken Shop', city: 'Lahore' },
  { ingredient: 'Chicken (breast)', price: 520, store: 'Chicken Shop', city: 'Lahore' },
  { ingredient: 'Chicken (leg piece)', price: 450, store: 'Meat Market', city: 'Karachi' },
  { ingredient: 'Beef (boneless)', price: 850, store: 'Halal Meat Shop', city: 'Lahore' },
  { ingredient: 'Beef (with bone)', price: 650, store: 'Halal Meat Shop', city: 'Lahore' },
  { ingredient: 'Mutton (leg)', price: 1800, store: 'Halal Meat Shop', city: 'Lahore' },
  { ingredient: 'Mutton (ribs)', price: 1600, store: 'Meat Market', city: 'Karachi' },
  { ingredient: 'Keema (minced beef)', price: 750, store: 'Halal Meat Shop', city: 'Lahore' },

  // --- Dairy ---
  { ingredient: 'Milk (fresh)', price: 160, store: 'Dairy Shop', city: 'Lahore' },
  { ingredient: 'Yogurt (dahi)', price: 130, store: 'Local Kiryana', city: 'Lahore' },
  { ingredient: 'Yogurt (dahi)', price: 150, store: 'Imtiaz', city: 'Karachi' },
  { ingredient: 'Butter (100g)', price: 180, store: 'Local Kiryana', city: 'Lahore' },
  { ingredient: 'Cream (200ml)', price: 150, store: 'Carrefour', city: 'Lahore' },
  { ingredient: 'Eggs (dozen)', price: 220, store: 'Local Kiryana', city: 'Lahore' },

  // --- Vegetables ---
  { ingredient: 'Potatoes', price: 55, store: 'Sabzi Mandi', city: 'Lahore' },
  { ingredient: 'Onions', price: 80, store: 'Sabzi Mandi', city: 'Lahore' },
  { ingredient: 'Tomatoes', price: 90, store: 'Sabzi Mandi', city: 'Lahore' },
  { ingredient: 'Ladyfinger (Bhindi)', price: 70, store: 'Sabzi Mandi', city: 'Lahore' },
  { ingredient: 'Spinach (Palak)', price: 40, store: 'Sabzi Mandi', city: 'Lahore' },
  { ingredient: 'Cauliflower', price: 80, store: 'Sabzi Mandi', city: 'Karachi' },
  { ingredient: 'Brinjal (Baingan)', price: 60, store: 'Sabzi Mandi', city: 'Lahore' },
  { ingredient: 'Green Peas', price: 120, store: 'Sabzi Mandi', city: 'Lahore' },
  { ingredient: 'Bitter Gourd (Karela)', price: 90, store: 'Sabzi Mandi', city: 'Karachi' },
  { ingredient: 'Pumpkin (Kaddu)', price: 50, store: 'Sabzi Mandi', city: 'Lahore' },

  // --- Fruits ---
  { ingredient: 'Bananas (dozen)', price: 100, store: 'Fruit Shop', city: 'Lahore' },
  { ingredient: 'Apples (kg)', price: 180, store: 'Fruit Shop', city: 'Lahore' },
  { ingredient: 'Mangoes (kg)', price: 150, store: 'Fruit Shop', city: 'Lahore' },
  { ingredient: 'Oranges (kg)', price: 120, store: 'Fruit Shop', city: 'Karachi' },

  // --- Lentils & Legumes ---
  { ingredient: 'Masoor Dal (Red Lentils)', price: 220, store: 'Local Kiryana', city: 'Lahore' },
  { ingredient: 'Moong Dal (Yellow Lentils)', price: 200, store: 'Local Kiryana', city: 'Lahore' },
  { ingredient: 'Chana Dal (Split Chickpeas)', price: 250, store: 'Local Kiryana', city: 'Lahore' },
  { ingredient: 'Chickpeas (Kabuli Chana)', price: 300, store: 'Local Kiryana', city: 'Lahore' },

  // --- Oils & Fats ---
  { ingredient: 'Cooking Oil (1L)', price: 380, store: 'Local Kiryana', city: 'Lahore' },
  { ingredient: 'Ghee (1kg)', price: 500, store: 'Local Kiryana', city: 'Lahore' },
  { ingredient: 'Olive Oil (500ml)', price: 650, store: 'Carrefour', city: 'Lahore' },

  // --- Spices ---
  { ingredient: 'Cumin Seeds (Zeera 100g)', price: 50, store: 'Spice Shop', city: 'Lahore' },
  { ingredient: 'Turmeric Powder (Haldi 100g)', price: 40, store: 'Spice Shop', city: 'Lahore' },
  { ingredient: 'Red Chili Powder (100g)', price: 60, store: 'Spice Shop', city: 'Lahore' },
  { ingredient: 'Coriander Powder (100g)', price: 35, store: 'Spice Shop', city: 'Lahore' },
  { ingredient: 'Garam Masala (50g)', price: 80, store: 'Spice Shop', city: 'Lahore' },
  { ingredient: 'Salt (1kg)', price: 30, store: 'Local Kiryana', city: 'Lahore' },

  // --- Condiments & Others ---
  { ingredient: 'Tomato Ketchup (500ml)', price: 180, store: 'Carrefour', city: 'Lahore' },
  { ingredient: 'Cooking Soda', price: 20, store: 'Local Kiryana', city: 'Lahore' },
  { ingredient: 'Vinegar (250ml)', price: 60, store: 'Local Kiryana', city: 'Lahore' },
  { ingredient: 'Lemon Juice (bottle)', price: 100, store: 'Local Kiryana', city: 'Lahore' },

  // --- Bread & Grains ---
  { ingredient: 'Roti (per piece)', price: 10, store: 'Tandoor Shop', city: 'Lahore' },
  { ingredient: 'Naan (per piece)', price: 25, store: 'Tandoor Shop', city: 'Lahore' },
  { ingredient: 'White Rice (broken)', price: 150, store: 'Local Kiryana', city: 'Karachi' },
  { ingredient: 'Oats (500g)', price: 250, store: 'Carrefour', city: 'Lahore' },
];

export const seedPakistaniPrices = () => {
  if (storage.get(SEEDED_KEY, false)) return false;

  const dates = [];
  const now = Date.now();
  for (let i = 0; i < 14; i++) {
    dates.push(new Date(now - i * 24 * 60 * 60 * 1000).toISOString());
  }

  PAKISTANI_PRICES.forEach((item, idx) => {
    // Log each item with 2-3 historical entries to build a price trend
    const entryCount = 2 + (idx % 2);
    for (let d = 0; d < entryCount && d < dates.length; d++) {
      // Add small daily fluctuation (±10%)
      const fluctuation = 0.9 + Math.random() * 0.2;
      const price = Math.round(item.price * fluctuation);
      logPrice(item.ingredient, price, 'PKR', item.store, item.city, dates[d]);
    }
  });

  storage.set(SEEDED_KEY, true);
  return true;
};
