import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getMealSuggestions } from '../services/deepseek';
import RecipeModal from './RecipeModal';
import SeasonalAlertBanner from './SeasonalAlertBanner';
import { addMealToPlan, deriveFlavorTags, getDishImage, getMonday, getTasteProfile, storage } from '../services/foodybud';
import { detectUserRegion, isIngredientInSeason } from '../services/seasonalIngredients';
import { addToCart } from '../services/groceryCart';

export default function ResultsScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [rawDishes, setRawDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [retryToken, setRetryToken] = useState(0);
  const [planNotice, setPlanNotice] = useState('');
  const [planTarget, setPlanTarget] = useState(null);
  const [planDay, setPlanDay] = useState('Mon');
  const [seasonalFilter, setSeasonalFilter] = useState('');
  const [duplicateGroups, setDuplicateGroups] = useState([]);
  const [duplicateSelections, setDuplicateSelections] = useState({});
  const [searchState, setSearchState] = useState(() => {
    const saved = storage.get('lastSearch', JSON.parse(localStorage.getItem('moodMealLastSearch') || 'null'));
    return location.state || saved;
  });
  const tasteProfile = useMemo(() => getTasteProfile(), []);
  const region = useMemo(() => detectUserRegion(), []);
  const month = new Date().getMonth();

  useEffect(() => {
    if (location.state) {
      setSearchState(location.state);
    }
  }, [location.state]);

  const buildDishImageUrl = (dishName, cuisine, index) => getDishImage(dishName, cuisine, index + 1);
  const formatOneDecimal = (value) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return '—';
    const rounded = Math.round(number * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  };
  const weekStartKey = getMonday(new Date()).toISOString();
  const dayKeys = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const isSeasonalDish = (dish) => {
    const list = [...(dish.ingredients || []), ...(dish.groceryList || [])].join(' ').toLowerCase();
    return isIngredientInSeason(list, region, month);
  };

  const matchesSeasonalFilter = (dish) => {
    if (!seasonalFilter) return true;
    const list = [...(dish.ingredients || []), ...(dish.groceryList || [])].join(' ').toLowerCase();
    return list.includes(seasonalFilter.toLowerCase());
  };

  const isTasteMatch = (dish) => {
    if (!tasteProfile.cuisines.length && !tasteProfile.tags.length) return false;
    if (tasteProfile.cuisines.includes(searchState?.cuisine || dish.cuisine)) return true;
    const tags = deriveFlavorTags(dish.name, dish.ingredients || dish.groceryList || []);
    return tags.some((tag) => tasteProfile.tags.includes(tag));
  };

  const getDayKey = () => {
    const day = new Date().getDay();
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day] || 'Mon';
  };

  const countKidHelperSteps = (steps = []) => {
    const regex = /(mix|pour|sprinkle|arrange|decorate)/i;
    return (steps || []).filter((step) => regex.test(step)).length;
  };

  const baseDishName = (name) => {
    const cleaned = String(name || '')
      .toLowerCase()
      .replace(/\([^)]*\)/g, '')
      .replace(/\b(spicy|extra|special|deluxe|classic|crispy|cheesy|masala|street|fusion|loaded|fried|grilled|roasted|smoky|tangy|sweet)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned;
  };

  const resolveDuplicates = (list) => {
    const grouped = {};
    list.forEach((dish) => {
      const key = baseDishName(dish.name);
      if (!key) return;
      grouped[key] = grouped[key] || [];
      grouped[key].push(dish);
    });

    const groups = Object.entries(grouped)
      .filter(([, items]) => items.length > 1)
      .map(([key, items]) => ({ key, items }));

    if (!groups.length) return { groups: [], resolved: list };

    const selectedKeys = {};
    groups.forEach((group) => {
      if (duplicateSelections[group.key]) { selectedKeys[group.key] = duplicateSelections[group.key]; } else {
        const shortest = [...group.items].sort((a, b) => a.name.length - b.name.length)[0];
        selectedKeys[group.key] = shortest.name;
      }
    });

    const resolved = list.filter((dish) => {
      const key = baseDishName(dish.name);
      if (!selectedKeys[key]) return true;
      return selectedKeys[key] === dish.name;
    });

    return { groups, resolved, selectedKeys };
  };

  useEffect(() => {
    if (!searchState) {
      navigate('/');
      return;
    }

    const { mood, cuisine, budget, currency, diets, mealType, leftovers, goalMode, chefStyle, allergies, dailyTarget, mealTarget, householdProfiles, kidsMode, kidsAgeRange } = searchState;
    
    const fetchMeals = async () => {
      try {
        const history = storage.get('history', ([] /* safe fallback */));
        
        const result = await getMealSuggestions(
          mood,
          cuisine,
          budget,
          currency,
          diets || [],
          mealType,
          leftovers || '',
          (Array.isArray(history) ? history : []).map(h => h.name),
          {
            goalMode,
            chefStyle,
            allergies,
            dailyTarget,
            mealTarget,
            householdProfiles: householdProfiles || [],
            kidsMode,
            kidsAgeRange,
          }
        );
        
        if (result && result.dishes) {
          // Build AI-generated image URLs (Pollinations.ai renders on demand when the browser loads the src)
          const withImages = result.dishes.map((dish, index) => ({
            ...dish,
            imageUrl: getDishImage(dish.name, cuisine, index)
          }));
          const { groups, resolved, selectedKeys } = resolveDuplicates(withImages);
          setDuplicateGroups(groups);
          setDuplicateSelections(selectedKeys || {});
          setRawDishes(withImages);
          result.dishes = resolved;
        }

        setData(result);
      } catch (err) {
        console.error("Failed to fetch meals:", err);
        setData({ dishes: [], cookSavings: 0, errorMessage: err.message });
      } finally {
        setLoading(false);
      }
    };

    fetchMeals();
  }, [searchState, navigate, retryToken]);

  const handleRetry = () => {
    setLoading(true);
    setRetryToken((value) => value + 1);
  };



  const handleSaveToHistory = (dish) => {
    const history = storage.get('history', ([] /* safe fallback */));
    const date = new Date().toLocaleDateString();
    history.unshift({ ...dish, dateEaten: date });
    storage.set('history', history.slice(0, 50));
  };

  const handlePlanMeal = (dish) => {
    setPlanTarget(dish);
    setPlanDay(getDayKey());
  };

  const confirmPlanMeal = () => {
    if (!planTarget) return;
    addMealToPlan(weekStartKey, planDay, {
      name: planTarget.name,
      cuisine: searchState?.cuisine || planTarget.cuisine || 'Food',
      groceryList: planTarget.groceryList || planTarget.ingredients || [],
    });
    setPlanNotice(`Added ${planTarget.name} to ${planDay}`);
    setTimeout(() => setPlanNotice(''), 2000);
    setPlanTarget(null);
    navigate('/planner');
  };

  const handleAddToCart = async (dish, e) => {
    e.stopPropagation();
    const list = dish.groceryList || dish.ingredients || [];
    await addToCart(list, dish.name || 'Meal', 2);
  };

  if (loading) {
    return (
      <div className="loading-screen w-full h-full">
        <div className="loading-plate">🍽️</div>
        <h2 className="font-display text-2xl font-bold">Whipping up something good...</h2>
      </div>
    );
  }

  if (!data || !data.dishes || !data.dishes.length) {
    const errorMessage = data?.error === 'rate_limit'
      ? 'DeepSeek rate limit hit. Please wait a minute and try again.'
      : data?.errorMessage || 'No dishes found. Try again in a moment or change your inputs.';
    return (
      <div className="container py-20 text-center">
        <h2 className="text-3xl font-black mb-4">No dishes found</h2>
        <p className="text-text-secondary mb-6">{errorMessage}</p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button onClick={handleRetry} className="btn btn-secondary">Try again</button>
          <button onClick={() => navigate('/')} className="btn btn-primary">Start over</button>
        </div>
      </div>
    );
  }

  const { dishes, cookSavings } = data;
  const filteredDishes = dishes.filter(matchesSeasonalFilter);
  const primaryDishes = filteredDishes.length ? filteredDishes : dishes;
  const currency = searchState.currency;
  const chatRecipe = selectedRecipe || primaryDishes?.[0] || null;

  const formatMacro = (value, suffix = 'g') => {
    if (value == null) return '—';
    const text = String(value);
    return text.match(/[a-zA-Z]/) ? text : `${text}${suffix}`;
  };

  return (
    <div className="screen-enter pb-24 w-full relative">
      {duplicateGroups.length ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-modal backdrop-blur-md">
          <div className="w-full max-w-2xl bg-surface text-text-primary rounded-3xl p-6 shadow-2xl border border-border-subtle animate-scale-in">
            <div className="flex items-center justify-between mb-4 border-b border-border-subtle pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-text-tertiary font-bold">Pick your version</p>
                <h3 className="text-2xl font-black font-display">We found similar dishes</h3>
              </div>
            </div>
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {duplicateGroups.map((group) => (
                <div key={group.key} className="card bg-surface-2">
                  <div className="text-sm font-semibold text-text-secondary mb-2">{group.key}</div>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((item) => (
                      <button
                        key={item.name}
                        onClick={() => setDuplicateSelections((prev) => ({ ...prev, [group.key]: item.name }))}
                        className={`chip ${duplicateSelections[group.key] === item.name ? 'active' : ''}`}
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  const { resolved } = resolveDuplicates(rawDishes || []);
                  setData((prev) => ({ ...prev, dishes: resolved }));
                  setDuplicateGroups([]);
                }}
                className="btn btn-primary"
              >
                Use selections
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <SeasonalAlertBanner
        ingredients={dishes.flatMap((dish) => {
          const list = [...(dish.ingredients || []), ...(dish.groceryList || [])];
          return list.filter((ingredient) => isIngredientInSeason(ingredient, region, month));
        })}
        onSelect={(ingredient) => {
          setSeasonalFilter((prev) => (prev?.toLowerCase() === ingredient.toLowerCase() ? '' : ingredient));
        }}
      />


      {planNotice ? (
        <div className="container mb-4">
          <div className="card bg-success-light border-success">
            <div className="text-sm font-semibold text-success">{planNotice}</div>
          </div>
        </div>
      ) : null}

      {searchState.dailyTarget && searchState.mealTarget ? (
        <div className="container mb-4">
          <div className="card bg-surface-2">
            <div className="text-sm text-text-secondary">Smart Portions</div>
            <div className="text-lg font-semibold text-text-primary">
              Target: {searchState.mealTarget} kcal this meal ({searchState.dailyTarget} kcal/day, {searchState.goalMode || 'maintain'} mode)
            </div>
          </div>
        </div>
      ) : null}



      <div className="results-split">
        {/* Cook Column */}
        <div className="grid grid-cols-1 gap-4">
          <div className="col-span-1">
            <div className="result-column-header cook-header">
              <span>🧑‍🍳</span> Your Meals
            </div>
          </div>
          {primaryDishes.length === 0 ? (
            <div className="col-span-1 card bg-surface-2 text-text-secondary">No dishes match the seasonal filter. Try another ingredient.</div>
          ) : null}
          {primaryDishes.map((dish, idx) => (
            <div 
              key={`cook-${idx}`} 
              className={`dish-card stagger-${(idx % 5) + 1}`}
              onClick={() => setSelectedRecipe(dish)}
            >
              <div className="dish-card-body">
                <h3 className="dish-name line-clamp-2">{dish.name}</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {isTasteMatch(dish) ? <span className="badge badge-premium">Based on your taste</span> : null}
                  {isSeasonalDish(dish) ? <span className="badge badge-success">Seasonal</span> : null}
                  {searchState?.kidsMode ? <span className="badge badge-success">Kid-friendly</span> : null}
                  {searchState?.kidsMode && countKidHelperSteps(dish.steps) > 0 ? (
                    <span className="badge badge-secondary">Helper steps: {countKidHelperSteps(dish.steps)}</span>
                  ) : null}
                </div>
                
                <div className="dish-meta">
                  <div className="dish-meta-item">⏱️ {dish.time}</div>
                  <div className="dish-meta-item">📊 {dish.difficulty}</div>
                </div>

                <div className="dish-meta">
                  <div className="dish-meta-item">🥩 P {formatMacro(dish.macros?.protein)}</div>
                  <div className="dish-meta-item">🍚 C {formatMacro(dish.macros?.carbs)}</div>
                  <div className="dish-meta-item">🧈 F {formatMacro(dish.macros?.fats)}</div>
                </div>

                {searchState?.kidsMode ? (
                  <div className="mt-3 text-sm text-text-secondary">
                    {dish.whyThisMood ? <div className="mb-1">{dish.whyThisMood}</div> : null}
                    {dish.funPlatingTip ? <div className="text-text-tertiary">🎨 {dish.funPlatingTip}</div> : null}
                  </div>
                ) : null}

                <div className="flex items-center justify-between mt-2">
                  <div className="dish-cost">{currency} {formatOneDecimal(dish.cookCost)}</div>
                  <div className="flex gap-2">
                    <button className="btn btn-sm btn-secondary" onClick={(e) => { e.stopPropagation(); handlePlanMeal(dish); }}>
                      Plan
                    </button>
                    <button className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); setSelectedRecipe(dish); }}>
                      Recipe
                    </button>
                    <button className="btn btn-sm btn-ghost" onClick={(e) => handleAddToCart(dish, e)}>
                      🛒
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>

      </div>

      {selectedRecipe && (
        <RecipeModal 
          recipe={selectedRecipe} 
          currency={currency}
          searchContext={searchState}
          onClose={() => setSelectedRecipe(null)} 
          onSave={() => handleSaveToHistory(selectedRecipe)}
        />
      )}

      {planTarget ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-modal backdrop-blur-md">
          <div className="w-full max-w-lg bg-surface text-text-primary rounded-3xl p-6 shadow-2xl border border-border-subtle animate-scale-in">
            <div className="flex items-center justify-between mb-4 border-b border-border-subtle pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-text-tertiary font-bold">Plan this meal</p>
                <h3 className="text-2xl font-black font-display">{planTarget.name}</h3>
              </div>
              <button onClick={() => setPlanTarget(null)} className="text-text-tertiary hover:text-text-primary text-xl">✕</button>
            </div>
            <div className="text-sm text-text-secondary mb-4">Choose a day for this meal.</div>
            <div className="flex flex-wrap gap-2 mb-6">
              {dayKeys.map((key) => (
                <button
                  key={key}
                  onClick={() => setPlanDay(key)}
                  className={`chip ${planDay === key ? 'active' : ''}`}
                >
                  {key}
                </button>
              ))}
            </div>
            <div className="flex gap-2 justify-end flex-wrap">
              <button onClick={() => setPlanTarget(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={confirmPlanMeal} className="btn btn-primary">Add to Planner</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
