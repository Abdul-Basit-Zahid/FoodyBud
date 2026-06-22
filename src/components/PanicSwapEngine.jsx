import React, { useState, useEffect } from 'react';
import { Shuffle, Loader2, Sparkles, Lock } from 'lucide-react';
import { getMockUserState, checkAccess } from '../services/freemium';
import { getHalalifySwap } from '../services/deepseek';
import UpgradeModal from './UpgradeModal';

const STANDARD_INGREDIENTS = ['butter', 'garlic', 'chili flakes', 'cream', 'parsley'];
const WESTERN_HARAM_INGREDIENTS = ['Red Wine', 'Pork / Pancetta', 'Gelatin', 'Alcohol-based Vanilla', 'Bacon'];

const STANDARD_SWAP_GROUPS = [
  {
    title: 'Direct Flavor Swap',
    items: [
      { name: 'ghee', ratio: '1:1', note: 'Richer toasted flavor.' },
      { name: 'olive oil', ratio: '3:4', note: 'Lighter, grassy finish.' },
    ],
  },
  {
    title: 'Texture Match',
    items: [
      { name: 'cream cheese', ratio: '1:1', note: 'Thicker, tangy body.' },
      { name: 'coconut cream', ratio: '1:1', note: 'Silky with slight sweetness.' },
    ],
  },
  {
    title: 'Common Pantry Alternative',
    items: [
      { name: 'yogurt + oil', ratio: '1:1', note: 'Balanced dairy replacement.' },
      { name: 'milk + cornstarch', ratio: '1:1', note: 'Restores thickness.' },
    ],
  },
];

export default function PanicSwapEngine() {
  const [userState, setUserState] = useState(getMockUserState());
  const [halalifyActive, setHalalifyActive] = useState(false);
  const [activeIngredient, setActiveIngredient] = useState(null);
  const [swapResults, setSwapResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    const handleStateUpdate = () => {
      setUserState(getMockUserState());
    };
    window.addEventListener('foodybud-user-state-update', handleStateUpdate);
    return () => window.removeEventListener('foodybud-user-state-update', handleStateUpdate);
  }, []);

  const handleToggleHalalify = (e) => {
    const checked = e.target.checked;
    if (checked) {
      const hasAccess = checkAccess('halalifyEngine', userState);
      if (!hasAccess) {
        setShowUpgradeModal(true);
        // keep toggle unchecked
        setHalalifyActive(false);
        return;
      }
    }
    setHalalifyActive(checked);
    setActiveIngredient(null);
    setSwapResults([]);
  };

  const handleSwap = async (ingredient) => {
    setActiveIngredient(ingredient);
    if (halalifyActive) {
      setLoading(true);
      try {
        const results = await getHalalifySwap(ingredient);
        setSwapResults(results);
      } catch (err) {
        setSwapResults([]);
      } finally {
        setLoading(false);
      }
    } else {
      // Standard swaps (Butter, Garlic, etc.)
      setSwapResults([]);
    }
  };

  const ingredientsList = halalifyActive ? WESTERN_HARAM_INGREDIENTS : STANDARD_INGREDIENTS;

  return (
    <section className="bg-surface rounded-3xl border border-border-subtle p-6 shadow-md relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-border-subtle pb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-text-tertiary font-bold">Swap Engine</p>
          <h2 className="text-2xl font-display font-black text-text-primary mt-1">
            {halalifyActive ? '⚡ Halal-ify Engine' : 'Mid-Cook Substitution Engine'}
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            {halalifyActive 
              ? 'Instantly swap Western haram items for authentic Halal alternatives.' 
              : 'Find quick pantry replacements mid-recipe.'}
          </p>
        </div>

        {/* Premium Toggle */}
        <div className="flex items-center gap-3 bg-surface-2 border border-border-subtle px-4 py-2.5 rounded-2xl self-start sm:self-auto">
          <label className="flex items-center gap-2.5 cursor-pointer text-sm font-bold text-text-primary select-none">
            <input
              type="checkbox"
              checked={halalifyActive}
              onChange={handleToggleHalalify}
              className="w-4 h-4 text-primary rounded focus:ring-primary border-border-subtle cursor-pointer"
            />
            <span className="flex items-center gap-1.5">
              ⚡ Halal-ify Western Recipe
              {!userState.isPremium && <Lock className="w-3.5 h-3.5 text-text-tertiary" />}
            </span>
          </label>
        </div>
      </div>

      <div className="grid gap-3">
        {ingredientsList.map((item) => (
          <div key={item} className="flex items-center justify-between bg-surface-2 border border-border-subtle rounded-2xl px-4 py-3 hover:shadow-card-hover transition-base">
            <span className="text-sm font-bold text-text-primary capitalize">{item}</span>
            <button
              type="button"
              onClick={() => handleSwap(item)}
              className="btn btn-secondary btn-sm flex items-center gap-2"
            >
              <Shuffle className="w-4 h-4" /> Swap
            </button>
          </div>
        ))}
      </div>

      {activeIngredient ? (
        <div className="mt-6 bg-surface-3 border border-border-strong rounded-3xl p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4 border-b border-border-subtle pb-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-text-tertiary font-bold">
                {halalifyActive ? 'Halal-ifying' : 'Swapping'}
              </p>
              <h3 className="text-xl font-display font-black text-text-brand flex items-center gap-2 mt-0.5">
                {halalifyActive && <Sparkles className="w-5 h-5 text-text-brand animate-pulse" />}
                {activeIngredient}
              </h3>
            </div>
            <button 
              type="button" 
              onClick={() => { setActiveIngredient(null); setSwapResults([]); }} 
              className="btn btn-ghost btn-sm"
            >
              Close
            </button>
          </div>

          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-3 text-text-secondary font-medium">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span>Consulting DeepSeek for Diaspora alternatives...</span>
            </div>
          ) : halalifyActive ? (
            <div className="grid gap-4">
              {swapResults.map((swap, index) => (
                <div key={index} className="bg-surface rounded-2xl border border-border-subtle p-4 hover:border-success-light transition-base">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-success uppercase tracking-wider">Halal Swap Option {index + 1}</div>
                      <div className="font-bold text-text-primary mt-1 text-lg">{swap.name || swap.substitute}</div>
                      <div className="text-sm text-text-secondary mt-1 font-medium">{swap.note || swap.effect}</div>
                    </div>
                    <div className="font-mono text-sm font-bold bg-success-light text-success px-2.5 py-1 rounded-xl">
                      {swap.ratio || '1:1'}
                    </div>
                  </div>
                </div>
              ))}
              {swapResults.length === 0 && (
                <div className="text-sm text-text-tertiary py-4 text-center">No substitutes returned. Try again.</div>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {STANDARD_SWAP_GROUPS.map((group) => (
                <div key={group.title} className="bg-surface rounded-2xl border border-border-subtle p-4">
                  <h4 className="text-sm font-semibold text-text-primary border-b border-border-subtle pb-2 mb-3">{group.title}</h4>
                  <div className="space-y-3">
                    {group.items.map((swap) => (
                      <div key={swap.name} className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold text-text-primary">{swap.name}</div>
                          <div className="text-xs text-text-secondary mt-0.5">{swap.note}</div>
                        </div>
                        <div className="font-mono text-sm font-bold text-text-brand bg-primary-light px-2.5 py-1 rounded-xl">{swap.ratio}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}
    </section>
  );
}
