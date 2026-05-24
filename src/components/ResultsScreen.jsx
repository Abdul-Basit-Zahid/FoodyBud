import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getMealSuggestions } from '../services/gemini';
import RecipeModal from './RecipeModal';
import { addMealToPlan, clearImageSession, deriveFlavorTags, getDishImage, getMonday, getRestaurantImage, getTasteProfile, storage } from '../services/foodybud';

const SEASONAL_PAKISTAN = {
  0: ['citrus', 'orange', 'kinnow', 'spinach', 'carrot', 'cauliflower'],
  1: ['citrus', 'orange', 'kinnow', 'spinach', 'peas'],
  2: ['strawberry', 'peas', 'spinach', 'carrot'],
  3: ['mango', 'cucumber', 'mint', 'okra'],
  4: ['mango', 'okra', 'cucumber', 'melon'],
  5: ['mango', 'melon', 'eggplant', 'tomato'],
  6: ['mango', 'corn', 'cucumber', 'tomato'],
  7: ['corn', 'eggplant', 'tomato', 'okra'],
  8: ['apple', 'pomegranate', 'eggplant', 'tomato'],
  9: ['apple', 'pomegranate', 'spinach', 'carrot'],
  10: ['citrus', 'orange', 'spinach', 'carrot', 'cauliflower'],
  11: ['citrus', 'orange', 'kinnow', 'spinach', 'peas'],
};

export default function ResultsScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [coords, setCoords] = useState(null);
  const [geoError, setGeoError] = useState(null);
  const [retryToken, setRetryToken] = useState(0);
  const [planNotice, setPlanNotice] = useState('');
  const [planTarget, setPlanTarget] = useState(null);
  const [planDay, setPlanDay] = useState('Mon');
  const [searchState, setSearchState] = useState(() => {
    const saved = storage.get('lastSearch', JSON.parse(localStorage.getItem('moodMealLastSearch') || 'null'));
    return location.state || saved;
  });
  const [favorites, setFavorites] = useState(() => {
    return storage.get('favorites', JSON.parse(localStorage.getItem('moodMealFavorites') || '[]')) || [];
  });
  const tasteProfile = useMemo(() => getTasteProfile(), []);

  useEffect(() => {
    if (location.state) {
      setSearchState(location.state);
    }
  }, [location.state]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGeoError('Location permission denied'),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    );
  }, []);

  const buildDishImageUrl = (dishName, cuisine, index) => getDishImage(`${dishName}-${index}`, cuisine);
  const buildCuisineImageUrl = (cuisine, index) => getRestaurantImage(`restaurant-${index}`, cuisine);
  const weekStartKey = getMonday(new Date()).toISOString();
  const dayKeys = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const isSeasonalDish = (dish) => {
    const month = new Date().getMonth();
    const seasonal = SEASONAL_PAKISTAN[month] || [];
    const list = [...(dish.ingredients || []), ...(dish.groceryList || [])].join(' ').toLowerCase();
    return seasonal.some((item) => list.includes(item));
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

  useEffect(() => {
    if (!searchState) {
      navigate('/');
      return;
    }

    clearImageSession();

    const { mood, cuisine, budget, currency, diets, mealType, leftovers, goalMode, chefStyle, allergies, dailyTarget, mealTarget, householdProfiles } = searchState;
    
    const fetchMeals = async () => {
      try {
        const history = storage.get('history', JSON.parse(localStorage.getItem('moodMealHistory') || '[]'));
        
        const result = await getMealSuggestions(
          mood,
          cuisine,
          budget,
          currency,
          diets || [],
          mealType,
          leftovers || '',
          history.map(h => h.name),
          {
            goalMode,
            chefStyle,
            allergies,
            dailyTarget,
            mealTarget,
            householdProfiles: householdProfiles || [],
          }
        );
        
        if (result && result.dishes) {
          result.dishes = result.dishes.map((dish, index) => ({
            ...dish,
            imageUrl: buildDishImageUrl(dish.name, cuisine, index)
          }));
        }

        setData(result);
      } catch (err) {
        console.error("Failed to fetch meals:", err);
        setData({ dishes: [], cookSavings: 0 });
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

  const buildMapsUrl = (dishName, cuisine) => {
    const query = `${dishName} ${cuisine} restaurant`;
    if (coords?.lat && coords?.lng) {
      return `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${coords.lat},${coords.lng},14z`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  const createVotingSession = (dishes) => {
    const sessionId = Math.random().toString(36).slice(2, 11);
    const session = {
      id: sessionId,
      dishes: dishes.slice(0, 3).map((dish) => ({ name: dish.name, time: dish.time, orderCost: dish.orderCost, votes: 0, voters: [] })),
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      createdBy: 'You',
    };
    storage.set(`vote_${sessionId}`, session);
    const shareUrl = `${window.location.origin}?vote=${sessionId}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(`🍽️ Help me decide tonight's dinner!\n\nVote here: ${shareUrl}\n\nExpires in 1 hour`)}`, '_blank', 'noopener,noreferrer');
  };

  const handleSaveToHistory = (dish) => {
    const history = storage.get('history', JSON.parse(localStorage.getItem('moodMealHistory') || '[]'));
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

  const toggleFavorite = (dish, e) => {
    e.stopPropagation();
    let newFavs;
    if (favorites.some(f => f.name === dish.name)) {
      newFavs = favorites.filter(f => f.name !== dish.name);
    } else {
      newFavs = [{ ...dish, dateAdded: new Date().toLocaleDateString() }, ...favorites];
    }
    setFavorites(newFavs);
    storage.set('favorites', newFavs);
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
      ? 'Gemini rate limit hit. Please wait a minute and try again.'
      : 'No dishes found. Try again in a moment or change your inputs.';
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
  const currency = searchState.currency;

  const formatMacro = (value, suffix = 'g') => {
    if (value == null) return '—';
    const text = String(value);
    return text.match(/[a-zA-Z]/) ? text : `${text}${suffix}`;
  };

  return (
    <div className="screen-enter pb-24 w-full relative">
      <div className="savings-banner">
        <div className="savings-banner-stat">
          <div className="value">{currency} {dishes[0].cookCost}</div>
          <div className="label">Cook Cost</div>
        </div>
        <div className="savings-divider"></div>
        <div className="savings-banner-stat">
          <div className="value text-success">{currency} {cookSavings}</div>
          <div className="label">Savings</div>
        </div>
        <div className="savings-divider"></div>
        <div className="savings-banner-stat">
          <div className="value opacity-80">{currency} {dishes[0].orderCost}</div>
          <div className="label">Order Cost</div>
        </div>
      </div>
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

      <div className="container mt-2">
        <button onClick={() => createVotingSession(dishes)} className="btn btn-secondary w-full mb-6">
          👪 Vote with Family
        </button>
      </div>

      <div className="results-split">
        {/* Cook Column */}
        <div className="flex flex-col gap-4">
          <div className="result-column-header cook-header">
            <span>🧑‍🍳</span> Cook It Yourself
          </div>
          {dishes.map((dish, idx) => (
            <div 
              key={`cook-${idx}`} 
              className={`dish-card stagger-${(idx % 5) + 1}`}
              onClick={() => setSelectedRecipe(dish)}
            >
              <div className="dish-card-image">
                <img 
                  src={dish.imageUrl} 
                  alt={dish.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop"; }}
                />
                <button 
                  onClick={(e) => toggleFavorite(dish, e)}
                  className="dish-heart"
                >
                  <span className={favorites.some(f => f.name === dish.name) ? 'text-error' : 'text-text-tertiary'}>
                    {favorites.some(f => f.name === dish.name) ? '❤️' : '🤍'}
                  </span>
                </button>
              </div>
              <div className="dish-card-body">
                <h3 className="dish-name line-clamp-2">{dish.name}</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {isTasteMatch(dish) ? <span className="badge badge-premium">Based on your taste</span> : null}
                  {isSeasonalDish(dish) ? <span className="badge badge-success">Seasonal</span> : null}
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

                <div className="flex items-center justify-between mt-2">
                  <div className="dish-cost">{currency} {dish.cookCost}</div>
                  <div className="flex gap-2">
                    <button className="btn btn-sm btn-secondary" onClick={(e) => { e.stopPropagation(); handlePlanMeal(dish); }}>
                      Plan
                    </button>
                    <button className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); setSelectedRecipe(dish); }}>
                      Recipe
                    </button>
                  </div>
                </div>
                {dish.orderCost != null ? (
                  <div className="mt-3 text-xs font-semibold text-success">
                    Save {currency} {Math.max(0, dish.orderCost - dish.cookCost)} by cooking · ~{currency} {Math.max(0, (dish.orderCost - dish.cookCost) * 4)} / month
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {/* Order Column */}
        <div className="flex flex-col gap-4">
          <div className="result-column-header order-header">
            <span>🗺️</span> Nearby Restaurants
          </div>
          {dishes.map((dish, idx) => (
            <div key={`order-${idx}`} className={`dish-card stagger-${(idx % 5) + 1}`}>
              <div className="dish-card-image" style={{ height: '120px' }}>
                <img 
                  src={buildCuisineImageUrl(searchState.cuisine, idx)}
                  alt="Restaurant"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="dish-card-body">
                <h3 className="dish-name line-clamp-1 text-lg">{dish.name}</h3>
                
                <div className="dish-meta">
                  <div className="dish-meta-item">📍 {coords ? 'Near you' : geoError ? 'Location off' : 'Searching nearby'}</div>
                  <div className="dish-meta-item">⭐ Google Maps</div>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="dish-cost" style={{ fontSize: 'var(--text-lg)' }}>{currency} {dish.orderCost}</div>
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveToHistory(dish);
                      window.open(buildMapsUrl(dish.name, searchState.cuisine), '_blank', 'noopener,noreferrer');
                    }}
                  >
                    View on Maps
                  </button>
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
