import React, { useEffect, useMemo, useState } from 'react';
import ChefMode from './ChefMode';
import { createPortal } from 'react-dom';
import { X, Play, Share2, Loader2 } from 'lucide-react';
import { getDishImage, deriveFlavorTags, getActiveProfileId, getDishRatings, saveDishRating } from '../services/foodybud';
import { getIngredientSubstitutes } from '../services/gemini';

const parseFraction = (value) => {
  if (!value) return null;
  const text = String(value).trim();
  if (text.includes(' ')) {
    const parts = text.split(' ');
    return parts.reduce((sum, part) => sum + (parseFraction(part) || 0), 0);
  }
  if (text.includes('/')) {
    const [num, den] = text.split('/').map(Number);
    if (!den) return null;
    return num / den;
  }
  const num = Number(text);
  return Number.isFinite(num) ? num : null;
};

const formatQuantity = (value) => {
  if (!Number.isFinite(value)) return '';
  const rounded = Math.round(value * 100) / 100;
  return String(rounded).replace(/\.00$/, '');
};

const scaleIngredientText = (text, ratio) => {
  const raw = String(text || '').trim();
  if (!raw) return raw;
  if (raw.includes(' - ')) {
    const [name, qtyPart] = raw.split(' - ');
    const qtyMatch = qtyPart.match(/(\d+(?:\.\d+)?|\d+\s+\d+\/\d+|\d+\/\d+)\s*(.*)/i);
    if (!qtyMatch) return raw;
    const qty = parseFraction(qtyMatch[1]);
    if (!qty) return raw;
    const scaled = formatQuantity(qty * ratio);
    return `${name} - ${scaled} ${qtyMatch[2] || ''}`.trim();
  }
  const match = raw.match(/^(\d+(?:\.\d+)?|\d+\s+\d+\/\d+|\d+\/\d+)\s*(.*)$/i);
  if (!match) return raw;
  const qty = parseFraction(match[1]);
  if (!qty) return raw;
  const scaled = formatQuantity(qty * ratio);
  return `${scaled} ${match[2] || ''}`.trim();
};

export default function RecipeModal({ recipe, currency, searchContext, onClose, onSave }) {
  const buildRecipeImageUrl = () => {
    return recipe.imageUrl || getDishImage(recipe.name, recipe.cuisine || 'Food');
  };

  const recipeImageUrl = recipe.imageUrl || buildRecipeImageUrl();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const [ownedItems, setOwnedItems] = useState(new Set());
  const [chefMode, setChefMode] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const baseServings = recipe.portion?.servings || 2;
  const [servings, setServings] = useState(baseServings);
  const [rating, setRating] = useState(() => {
    const existing = getDishRatings().find((item) => item.name === recipe.name);
    return existing?.rating || 0;
  });
  const [substitutionTarget, setSubstitutionTarget] = useState(null);
  const [substitutionResults, setSubstitutionResults] = useState([]);
  const [substitutionLoading, setSubstitutionLoading] = useState(false);
  const profileIds = useMemo(() => {
    const fromContext = (searchContext?.householdProfiles || []).map((profile) => profile.id).filter(Boolean);
    if (fromContext.length) return fromContext;
    const active = getActiveProfileId();
    return active ? [active] : [];
  }, [searchContext]);

  const handleShareImage = async () => {
    try {
      setIsGeneratingImage(true);
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-surface-2').trim();
      ctx.fillRect(0, 0, 1080, 1920);
      
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = recipeImageUrl;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      
      ctx.drawImage(img, 0, 0, 1080, 1080);
      
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();
      ctx.font = 'bold 80px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(recipe.name, 540, 1250);
      
      if (recipe.macros) {
        ctx.font = 'bold 50px sans-serif';
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--brand-primary').trim();
        ctx.fillText(`${recipe.macros.calories} kcal | ${recipe.macros.protein} Prot`, 540, 1400);
      }
      
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim();
      ctx.font = '40px sans-serif';
      ctx.fillText("Cooked with FoodyBud 🍳", 540, 1800);
      
      const link = document.createElement('a');
      link.download = `${recipe.name}-FoodyBud.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error(err);
      alert("Failed to generate shareable image.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const recipeIngredients = recipe.groceryList || recipe.ingredients || [];
  const ratio = baseServings ? servings / baseServings : 1;
  const scaledIngredients = useMemo(() => recipeIngredients.map((item) => scaleIngredientText(item, ratio)), [recipeIngredients, ratio]);

  const toggleItem = (index) => {
    const newOwned = new Set(ownedItems);
    if (newOwned.has(index)) {
      newOwned.delete(index);
    } else {
      newOwned.add(index);
    }
    setOwnedItems(newOwned);
  };

  const handleOrderGroceries = () => {
    const itemsToBuy = scaledIngredients.filter((_, i) => !ownedItems.has(i));
    if (itemsToBuy.length === 0) {
      alert("You already have everything!");
      return;
    }
    const list = itemsToBuy.join('%0A- ');
    const message = `Hi! I need to order groceries for ${recipe.name}. Here is my list:%0A- ${list}`;
    window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  const handleRateDish = (value) => {
    const tags = deriveFlavorTags(recipe.name, recipeIngredients);
    saveDishRating({ name: recipe.name, cuisine: searchContext?.cuisine || recipe.cuisine, rating: value, tags });
    setRating(value);
  };

  const handleSubstitutes = async (ingredient) => {
    const cacheKey = `sub_${recipe.name}_${ingredient}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      setSubstitutionResults(JSON.parse(cached));
      setSubstitutionTarget(ingredient);
      return;
    }
    setSubstitutionTarget(ingredient);
    setSubstitutionLoading(true);
    try {
      const results = await getIngredientSubstitutes(ingredient, recipe.name, searchContext?.cuisine || recipe.cuisine);
      sessionStorage.setItem(cacheKey, JSON.stringify(results));
      setSubstitutionResults(results);
    } catch {
      setSubstitutionResults([]);
    } finally {
      setSubstitutionLoading(false);
    }
  };

  return createPortal(
    <div className="recipe-modal">
      <div className="recipe-modal-backdrop" onClick={onClose}></div>
      <div className="recipe-modal-sheet">
        <div className="sheet-handle"></div>
        
        {chefMode ? (
          <ChefMode recipe={{
            dishName: recipe.name || recipe.dishName || 'Recipe',
            totalTime: recipe.time || recipe.totalTime || '—',
            difficulty: recipe.difficulty || 'Medium',
            cuisine: searchContext?.cuisine || recipe.cuisine || 'Food',
            groceryList: recipe.groceryList || recipe.ingredients || [],
            prepSteps: (recipe.steps || []).map((s, i) => ({ stepNumber: i+1, instruction: s, stepIngredients: recipe.groceryList ? recipe.groceryList.slice(0,2) : [], timerSeconds: null, tip: null })),
            cookSteps: [],
            platingStep: null,
            savings: recipe.cookCost ? recipe.orderCost - recipe.cookCost : 0,
            totalCalories: recipe.macros ? recipe.macros.calories : null,
            macros: recipe.macros || null
          }} profileIds={profileIds} onClose={() => setChefMode(false)} />
        ) : (
          <>
            <div className="w-full relative" style={{ height: '220px' }}>
              <img 
                src={recipeImageUrl} 
                alt={recipe.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://images.unsplash.com/photo-1495521821757-a1efb6729352?q=80&w=1200&auto=format&fit=crop";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-modal via-modal to-transparent"></div>
              
              <div className="absolute top-4 right-4 flex gap-2">
                <button 
                  onClick={handleShareImage}
                  disabled={isGeneratingImage}
                  className="bg-surface hover:bg-surface-2 text-text-primary p-2 rounded-full transition disabled:opacity-50"
                >
                  {isGeneratingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
                </button>
                <button 
                  onClick={onClose}
                  className="bg-surface hover:bg-surface-2 text-text-primary p-2 rounded-full transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="absolute bottom-4 left-4 right-4 text-text-inverse flex justify-between items-end">
                <h2 className="font-display text-2xl font-bold leading-tight">{recipe.name}</h2>
                <button 
                  onClick={() => setChefMode(true)}
                  className="btn btn-primary px-6 shadow-lg flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" /> Chef Mode
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 pb-24 space-y-8">
              <div className="flex gap-4 mb-2 overflow-x-auto pb-2 scrollbar-hide">
                <div className="badge badge-brand flex-shrink-0">⏱️ {recipe.time}</div>
                <div className="badge badge-success flex-shrink-0">📊 {recipe.difficulty}</div>
                <div className="badge badge-warning flex-shrink-0">💰 {currency} {recipe.cookCost}</div>
              </div>

              {recipe.portion?.note ? (
                <div className="badge badge-brand">🎯 {recipe.portion.note}</div>
              ) : null}

              <div className="card bg-surface-2">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="text-sm font-semibold text-text-secondary">Serving size</div>
                    <div className="text-lg font-bold">{servings} servings</div>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={servings}
                    onChange={(e) => setServings(Number(e.target.value))}
                    className="w-full sm:w-48"
                  />
                </div>
              </div>

              {recipe.macros && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="badge badge-secondary">🔥 {recipe.macros.calories || '—'} kcal</div>
                  <div className="badge badge-secondary">🥩 {recipe.macros.protein || '—'} protein</div>
                  <div className="badge badge-secondary">🍚 {recipe.macros.carbs || '—'} carbs</div>
                  <div className="badge badge-secondary">🧈 {recipe.macros.fats || '—'} fats</div>
                </div>
              )}

              <div>
                <div className="flex justify-between items-baseline mb-4">
                  <h3 className="text-xl font-bold font-display">Ingredients</h3>
                  <button onClick={handleOrderGroceries} className="text-xs font-bold text-text-brand underline">Order Missings</button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {scaledIngredients.map((item, i) => {
                    const isOwned = ownedItems.has(i);
                    const name = item.split(' - ')[0];
                    return (
                      <div key={i} className="flex gap-2">
                        <button
                          onClick={() => toggleItem(i)}
                          className={`text-left p-2 rounded-xl border text-sm font-medium transition-all line-clamp-2 flex-1 ${
                            isOwned
                              ? 'bg-success-light border-success text-success opacity-70'
                              : 'bg-error-light border-error text-error'
                          }`}
                        >
                          {isOwned ? '✓ ' : '+ '}{item}
                        </button>
                        <button
                          onClick={() => handleSubstitutes(name)}
                          className="btn btn-ghost btn-sm"
                        >
                          Substitutes
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold font-display mb-4">Steps</h3>
                <div className="relative border-l-2 border-primary ml-3 pl-6 space-y-6">
                  {(recipe.steps || []).map((step, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[31px] top-0 w-6 h-6 rounded-full bg-primary text-text-inverse flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </div>
                      <p className="text-sm text-text-primary leading-relaxed">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card bg-surface-2">
                <div className="text-sm uppercase tracking-[0.2em] text-text-tertiary font-bold">Taste memory</div>
                <div className="text-lg font-bold mt-2">Rate this recipe</div>
                <div className="flex gap-2 mt-3">
                  {[1,2,3,4,5].map((value) => (
                    <button
                      key={value}
                      onClick={() => handleRateDish(value)}
                      className={`chip ${rating >= value ? 'active' : ''}`}
                    >
                      {rating >= value ? '★' : '☆'}
                    </button>
                  ))}
                </div>
                {rating ? <div className="text-xs text-text-tertiary mt-2">Saved. We will personalize future meals.</div> : null}
              </div>

            </div>
          </>
        )}
      </div>
      {substitutionTarget && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-modal backdrop-blur-md">
          <div className="w-full max-w-xl bg-surface text-text-primary rounded-3xl p-6 shadow-2xl border border-border-subtle animate-scale-in">
            <div className="flex items-center justify-between mb-4 border-b border-border-subtle pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-text-tertiary font-bold">Substitutes</p>
                <h3 className="text-2xl font-black font-display">{substitutionTarget}</h3>
              </div>
              <button onClick={() => setSubstitutionTarget(null)} className="text-text-tertiary hover:text-text-primary text-xl">✕</button>
            </div>
            {substitutionLoading ? (
              <div className="py-8 text-center font-medium text-text-tertiary flex flex-col items-center gap-3">
                <span className="text-3xl animate-spin">⏳</span>
                Finding halal alternatives...
              </div>
            ) : substitutionResults.length ? (
              <div className="space-y-3">
                {substitutionResults.map((item, index) => (
                  <div key={index} className="p-4 rounded-2xl bg-surface-2 border border-border-subtle">
                    <div className="font-bold text-text-brand">Option {index + 1}</div>
                    <div className="mt-1 font-bold">{item.substitute}</div>
                    <div className="text-sm font-medium text-text-secondary mt-1">{item.effect}</div>
                    <div className="text-xs font-bold text-warning mt-2">💡 {item.tip}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-text-tertiary">No substitutions found yet. Try again later.</div>
            )}
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
