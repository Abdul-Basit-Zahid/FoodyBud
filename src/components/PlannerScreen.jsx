import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Send } from 'lucide-react';
import { addToCart } from '../services/groceryCart';
import {
  addMealToPlan,
  getGroceryChecklist,
  getMealPlan,
  getMonday,
  removeMealFromPlan,
  saveGroceryChecklist,
  storage,
} from '../services/foodybud';

const DAY_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const categorizeIngredient = (item) => {
  const text = item.toLowerCase();
  if (/(onion|tomato|potato|garlic|ginger|pepper|lettuce|spinach|cucumber|carrot|lemon|lime|herb|coriander|cilantro|mint)/.test(text)) return 'Produce';
  if (/(milk|cheese|yogurt|butter|cream|ghee)/.test(text)) return 'Dairy';
  if (/(chicken|beef|mutton|fish|paneer|egg|lentil|beans|tofu)/.test(text)) return 'Protein';
  if (/(rice|pasta|flour|bread|noodle|oil|sugar|salt)/.test(text)) return 'Pantry';
  if (/(spice|masala|cumin|paprika|chili|turmeric|cardamom|cinnamon|peppercorn)/.test(text)) return 'Spices';
  return 'Other';
};

export default function PlannerScreen() {
  const navigate = useNavigate();
  const [weekOffset, setWeekOffset] = useState(0);
  const [day, setDay] = useState('Mon');
  const [mealName, setMealName] = useState('');
  const [mealCuisine, setMealCuisine] = useState('');
  const [mealIngredients, setMealIngredients] = useState('');
  const [cartNotice, setCartNotice] = useState('');

  const weekStartDate = useMemo(() => {
    const monday = getMonday(new Date());
    return new Date(monday.getTime() + weekOffset * 7 * 86400000);
  }, [weekOffset]);

  const weekStartKey = weekStartDate.toISOString();
  const plan = useMemo(() => getMealPlan(weekStartKey), [weekStartKey]);
  const checklist = useMemo(() => getGroceryChecklist(weekStartKey), [weekStartKey]);

  const favorites = storage.get('favorites', []);
  const history = storage.get('history', []);

  const handleAddMeal = () => {
    if (!mealName.trim()) return;
    const ingredients = mealIngredients
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    addMealToPlan(weekStartKey, day, {
      name: mealName.trim(),
      cuisine: mealCuisine || 'General',
      groceryList: ingredients,
    });
    setMealName('');
    setMealCuisine('');
    setMealIngredients('');
  };

  const groceryList = useMemo(() => {
    const items = [];
    DAY_KEYS.forEach((key) => {
      (plan.days[key] || []).forEach((meal) => {
        const list = meal.groceryList || meal.ingredients || [];
        list.forEach((ingredient) => {
          if (ingredient) items.push(ingredient);
        });
      });
    });
    const grouped = items.reduce((acc, item) => {
      const category = categorizeIngredient(item);
      acc[category] = acc[category] || [];
      acc[category].push(item);
      return acc;
    }, {});
    return grouped;
  }, [plan]);

  const toggleChecklistItem = (item) => {
    const next = { ...checklist, [item]: !checklist[item] };
    saveGroceryChecklist(weekStartKey, next);
  };

  const handleShareList = () => {
    const lines = [];
    Object.keys(groceryList).forEach((category) => {
      lines.push(`*${category}*`);
      groceryList[category].forEach((item) => {
        lines.push(`- ${item}`);
      });
      lines.push('');
    });
    const text = lines.join('\n').trim();
    window.open(`https://wa.me/?text=${encodeURIComponent(`FoodyBud Grocery List\n\n${text}`)}`, '_blank', 'noopener,noreferrer');
  };

  const handleAddAllToCart = async () => {
    const allItems = Object.values(groceryList).flat();
    if (!allItems.length) return;
    await addToCart(allItems, 'Weekly Plan', 1);
    setCartNotice('Added to Smart Cart.');
    setTimeout(() => setCartNotice(''), 2000);
  };


  return (
    <div className="container py-8 screen-enter pb-24">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-text-secondary">Planner</p>
          <h1 className="text-3xl font-black font-display">Weekly Meal Plan</h1>
          <p className="text-sm text-text-secondary mt-1">Week of {weekStartDate.toLocaleDateString()}</p>
        </div>
        <button onClick={() => navigate('/profile')} className="btn btn-secondary btn-sm">Back</button>
      </div>

      <div className="planner-nav">
        <button className="btn btn-ghost" onClick={() => setWeekOffset((w) => w - 1)}>← Previous</button>
        <button className="btn btn-secondary" onClick={() => setWeekOffset(0)}>This Week</button>
        <button className="btn btn-ghost" onClick={() => setWeekOffset((w) => w + 1)}>Next →</button>
      </div>

      <div className="planner-grid">
        {DAY_KEYS.map((key) => (
          <div key={key} className="planner-day">
            <div className="planner-day-header">
              <span className="font-bold">{key}</span>
              <span className="text-xs text-text-tertiary">{new Date(new Date(weekStartDate).getTime() + DAY_KEYS.indexOf(key) * 86400000).toLocaleDateString()}</span>
            </div>
            <div className="space-y-2">
              {(plan.days[key] || []).length === 0 ? (
                <div className="text-xs text-text-tertiary">No meals planned.</div>
              ) : (
                plan.days[key].map((meal) => (
                  <div key={meal.id} className="planner-meal">
                    <div>
                      <div className="font-semibold">{meal.name}</div>
                      <div className="text-xs text-text-secondary">{meal.cuisine}</div>
                    </div>
                    <button onClick={() => removeMealFromPlan(weekStartKey, key, meal.id)} className="btn btn-ghost btn-sm">Remove</button>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="planner-form card mt-8">
        <h2 className="text-xl font-black font-display mb-4">Add a Meal</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-xs font-semibold text-text-secondary">
            Day
            <select value={day} onChange={(e) => setDay(e.target.value)} className="input mt-1">
              {DAY_KEYS.map((key) => <option key={key} value={key}>{key}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-text-secondary">
            Meal name
            <input value={mealName} onChange={(e) => setMealName(e.target.value)} className="input mt-1" placeholder="e.g., Chicken Karahi" />
          </label>
          <label className="text-xs font-semibold text-text-secondary">
            Cuisine
            <input value={mealCuisine} onChange={(e) => setMealCuisine(e.target.value)} className="input mt-1" placeholder="e.g., Desi/Pakistani" />
          </label>
          <label className="text-xs font-semibold text-text-secondary">
            Ingredients (comma separated)
            <input value={mealIngredients} onChange={(e) => setMealIngredients(e.target.value)} className="input mt-1" placeholder="onion, tomato, chicken" />
          </label>
        </div>
        <button onClick={handleAddMeal} className="btn btn-primary mt-4 flex items-center gap-2"><Plus className="w-4 h-4" /> Add to plan</button>

        {(favorites.length || history.length) ? (
          <div className="mt-6">
            <div className="text-xs uppercase tracking-[0.2em] text-text-tertiary font-bold mb-2">Quick add</div>
            <div className="flex gap-2 flex-wrap">
              {favorites.slice(0, 6).map((dish) => (
                <button
                  key={`fav-${dish.name}`}
                  onClick={() => addMealToPlan(weekStartKey, day, { name: dish.name, cuisine: dish.cuisine || 'Food', groceryList: dish.groceryList || dish.ingredients || [] })}
                  className="chip"
                >
                  ❤️ {dish.name}
                </button>
              ))}
              {history.slice(0, 6).map((dish) => (
                <button
                  key={`hist-${dish.name}`}
                  onClick={() => addMealToPlan(weekStartKey, day, { name: dish.name, cuisine: dish.cuisine || 'Food', groceryList: dish.groceryList || dish.ingredients || [] })}
                  className="chip"
                >
                  🕘 {dish.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="card mt-8">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-black font-display">Grocery List</h2>
            <p className="text-sm text-text-secondary">Auto-generated from your plan.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleAddAllToCart} className="btn btn-secondary btn-sm">Add all to Cart</button>
            <button onClick={handleShareList} className="btn btn-secondary btn-sm flex items-center gap-2">
            <Send className="w-4 h-4" /> Share on WhatsApp
            </button>
          </div>
        </div>
        {cartNotice ? <div className="text-xs text-text-tertiary mb-3">{cartNotice}</div> : null}

        {Object.keys(groceryList).length === 0 ? (
          <div className="text-sm text-text-tertiary">Add meals with ingredients to build a list.</div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groceryList).map(([category, items]) => (
              <div key={category}>
                <div className="text-xs uppercase tracking-[0.2em] text-text-tertiary font-bold mb-2">{category}</div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {items.map((item, index) => (
                    <div
                      key={`${category}-${index}`}
                      className={`pantry-item ${checklist[item] ? 'pantry-item-checked' : ''}`}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleChecklistItem(item);
                        }}
                        className="text-left"
                      >
                        {checklist[item] ? '✓' : '○'}
                      </button>
                      <span className="flex-1 text-left text-sm font-medium">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
