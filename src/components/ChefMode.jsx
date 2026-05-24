import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { callGemini, deriveFlavorTags, getDishRatings, logMealToNutrition, logMealToWeek, markCuisineTried, saveDishRating, storage, updateStreak } from '../services/foodybud';

export default function ChefMode({ recipe, profileIds = [], onClose }) {
  const [phase, setPhase] = useState('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timers, setTimers] = useState([]);
  const [completed, setCompleted] = useState(() => new Set());
  const [autoNarrate, setAutoNarrate] = useState(false);
  const [classMode, setClassMode] = useState(true);
  const [showWhy, setShowWhy] = useState(false);
  const [substitutionTarget, setSubstitutionTarget] = useState(null);
  const [substitutionResults, setSubstitutionResults] = useState([]);
  const [substitutionLoading, setSubstitutionLoading] = useState(false);
  const [substitutions, setSubstitutions] = useState(() => storage.get(`substitutions_${recipe.dishName}`, {}));
  const [ownedIngredients, setOwnedIngredients] = useState(() => storage.get(`owned_${recipe.dishName}`, {}));
  const [rating, setRating] = useState(() => {
    const existing = getDishRatings().find((item) => item.name === recipe.dishName);
    return existing?.rating || 0;
  });

  const startTimeRef = useRef(null);
  const endTimeRef = useRef(null);

  const steps = useMemo(() => {
    const collected = [];
    (recipe.prepSteps || []).forEach((step) => collected.push(step));
    (recipe.cookSteps || []).forEach((step) => collected.push(step));
    if (recipe.platingStep) {
      collected.push({
        stepNumber: collected.length + 1,
        instruction: recipe.platingStep.instruction,
        stepIngredients: [],
        timerSeconds: null,
        tip: recipe.platingStep.tip || null,
        classExplanation: recipe.platingStep.tip || 'Plating frames the dish and helps food look balanced and intentional.',
      });
    }
    if (collected.length > 0) return collected;
    return (recipe.steps || []).map((instruction, index) => ({
      stepNumber: index + 1,
      instruction,
      stepIngredients: recipe.groceryList ? recipe.groceryList.slice(0, 2) : [],
      timerSeconds: null,
      tip: null,
      classExplanation: 'This step keeps the recipe moving toward the final texture and flavor balance.',
    }));
  }, [recipe]);

  if (!recipe || (steps.length === 0 && phase !== 'done')) {
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-surface">
        <div className="text-center">
          <p className="text-xl font-bold mb-4">No recipe steps found.</p>
          <button onClick={onClose} className="btn btn-primary">Go Back</button>
        </div>
      </div>
    );
  }

  const totalSteps = steps.length;
  const currentStep = steps[currentIndex] || {};

  const parseTimers = (text) => {
    const results = [];
    const regex = /(\d+)\s*(hour|hr|hours|minute|min|minutes|second|sec|seconds)/ig;
    let match;
    while ((match = regex.exec(text))) {
      const value = Number(match[1]);
      const unit = match[2].toLowerCase();
      let seconds = value;
      if (unit.startsWith('min')) seconds = value * 60;
      if (unit.startsWith('hour') || unit === 'hr' || unit === 'hours') seconds = value * 3600;
      results.push(seconds);
    }
    return results;
  };

  const getStepIcon = (text) => {
    if (/\d+\s*(minute|min|second|sec|hour|hr)/i.test(text)) return '⏱️';
    if (/chop|cut|slice|dice|mince/i.test(text)) return '🔪';
    if (/stir|mix|whisk|beat/i.test(text)) return '🥄';
    if (/heat|fry|boil|simmer|bake/i.test(text)) return '🔥';
    if (/rest|cool|refrigerate|chill/i.test(text)) return '⏳';
    if (/add|pour|sprinkle/i.test(text)) return '✋';
    if (/serve|plate|garnish/i.test(text)) return '🍽️';
    return '👨‍🍳';
  };

  const getClassExplanation = (text) => {
    if (/salt|season/i.test(text)) return 'Salt helps moisture move out of food, which improves browning and deepens flavor.';
    if (/bloom|spice|oil/i.test(text)) return 'Blooming spices in fat releases aroma compounds, making the dish taste fuller.';
    if (/rest|cool/i.test(text)) return 'Resting lets juices redistribute so the final dish stays moist and tender.';
    if (/boil pasta|pasta water/i.test(text)) return 'Salted pasta water seasons from the inside and helps sauce cling to the noodles.';
    if (/sear|fry|heat/i.test(text)) return 'High heat triggers browning and creates savory complexity through the Maillard reaction.';
    return 'This step sets the texture and timing so the final dish stays balanced and easy to cook.';
  };

  const speak = (stepText, tipText) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const voices = window.speechSynthesis.getVoices() || [];
    const preferredVoice = voices.find((voice) => voice.name.includes('Google UK English Female') || voice.name.includes('Samantha') || voice.name.includes('Karen')) || voices[0];
    const utterance = new SpeechSynthesisUtterance(stepText);
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    utterance.onend = () => {
      if (tipText) {
        setTimeout(() => {
          const tipUtterance = new SpeechSynthesisUtterance(`Pro tip: ${tipText}`);
          if (preferredVoice) tipUtterance.voice = preferredVoice;
          tipUtterance.rate = 0.85;
          window.speechSynthesis.speak(tipUtterance);
        }, 1000);
      }
    };
    window.speechSynthesis.speak(utterance);
  };

  const playBell = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 1);
    } catch {
      // ignore audio failures
    }
  };

  const notifyTimerDone = () => {
    playBell();
    try {
      if (window.Notification && Notification.permission === 'granted') {
        new Notification('Timer done', { body: 'Your FoodyBud step is complete.' });
      } else if (window.alert) {
        window.alert('Timer done');
      }
    } catch {
      // ignore notification failures
    }
  };

  const loadSubstitutions = async (ingredient) => {
    const cacheKey = ingredient.toLowerCase().trim();
    const cached = storage.get(`sub_${cacheKey}`, null);
    if (cached?.substitutes) {
      setSubstitutionResults(cached.substitutes);
      return;
    }

    setSubstitutionLoading(true);
    try {
      const prompt = `
You are a Halal cooking substitution expert.

The cook is making: ${recipe.dishName} (${recipe.cuisine || 'General'} cuisine)
They don't have: ${ingredient}

Suggest exactly 3 Halal substitutes. Each must be a realistic kitchen alternative.

Respond ONLY in JSON:
{
  "original": "${ingredient}",
  "substitutes": [
    {
      "substitute": "exact replacement with quantity",
      "ratio": "how much to use relative to original",
      "effect": "how this changes the dish taste/texture",
      "confidence": "Perfect/Good/Acceptable",
      "tip": "one practical tip for using this substitute"
    }
  ],
  "generalTip": "one overall tip about substituting in this specific dish"
}

All substitutes must be strictly Halal. Prefer common pantry items.
`;
      const payload = await callGemini(prompt);
      const substitutes = payload?.substitutes || [
        { substitute: '1 cup yogurt + 1 tsp lemon juice', ratio: '1:1', effect: 'slightly tangier and lighter', confidence: 'Good', tip: 'Whisk before adding.' },
        { substitute: '2 tbsp cream + 1 tbsp water', ratio: '1:1', effect: 'richer and softer', confidence: 'Acceptable', tip: 'Add slowly to avoid splitting.' },
        { substitute: '½ cup coconut milk', ratio: '1:1', effect: 'adds sweetness and creaminess', confidence: 'Good', tip: 'Great in curries and marinades.' },
      ];
      const normalized = { original: ingredient, substitutes, generalTip: payload?.generalTip || 'Taste as you go when substituting ingredients.' };
      storage.set(`sub_${cacheKey}`, normalized);
      setSubstitutionResults(substitutes);
    } catch {
      setSubstitutionResults([
        { substitute: '1 cup yogurt + 1 tsp lemon juice', ratio: '1:1', effect: 'slightly tangier and lighter', confidence: 'Good', tip: 'Whisk before adding.' },
        { substitute: '2 tbsp cream + 1 tbsp water', ratio: '1:1', effect: 'richer and softer', confidence: 'Acceptable', tip: 'Add slowly to avoid splitting.' },
        { substitute: '½ cup coconut milk', ratio: '1:1', effect: 'adds sweetness and creaminess', confidence: 'Good', tip: 'Great in curries and marinades.' },
      ]);
    } finally {
      setSubstitutionLoading(false);
    }
  };

  const applySubstitution = (ingredientIndex, substituteText) => {
    const next = { ...substitutions, [currentIndex]: { ...(substitutions[currentIndex] || {}), [ingredientIndex]: substituteText } };
    setSubstitutions(next);
    storage.set(`substitutions_${recipe.dishName}`, next);
    setSubstitutionTarget(null);
  };

  const initTimers = (step) => {
    const detected = parseTimers(step?.instruction || '');
    const sourceTimers = detected.length > 0 ? detected : (step?.timerSeconds != null ? [step.timerSeconds] : []);
    setTimers(sourceTimers.map((seconds) => ({ initial: seconds, remaining: seconds, running: false })));
  };

  useEffect(() => {
    initTimers(currentStep);
  }, [currentIndex]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => prev.map((timer) => (timer.running && timer.remaining > 0 ? { ...timer, remaining: timer.remaining - 1 } : timer)));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    timers.forEach((timer, idx) => {
      if (timer.running && timer.remaining === 0) {
        setTimers((prev) => prev.map((item, timerIndex) => (timerIndex === idx ? { ...item, running: false } : item)));
        notifyTimerDone();
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      }
    });
  }, [timers]);

  useEffect(() => {
    if (phase === 'cooking' && !startTimeRef.current) {
      startTimeRef.current = Date.now();
    }
  }, [phase]);

  const markDoneAndNext = () => {
    setCompleted((prev) => new Set([...prev, currentIndex]));
    if (currentIndex < totalSteps - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      if (autoNarrate) speak(steps[nextIndex]?.instruction || '', steps[nextIndex]?.tip || null);
      return;
    }

    endTimeRef.current = Date.now();
    try {
      const meal = {
        dishName: recipe.dishName,
        cuisine: recipe.cuisine || 'Food',
        totalTime: recipe.totalTime,
        macros: recipe.macros || { calories: recipe.totalCalories || 0, protein: '0g', carbs: '0g', fats: '0g' },
        orderCost: recipe.orderCost || 0,
        cookCost: recipe.cookCost || 0,
        ingredients: steps.flatMap((step) => step.stepIngredients || []),
      };
      logMealToNutrition({
        calories: Number(meal.macros.calories || 0),
        protein: Number(String(meal.macros.protein || '0').replace(/[^\d]/g, '')) || 0,
        carbs: Number(String(meal.macros.carbs || '0').replace(/[^\d]/g, '')) || 0,
        fats: Number(String(meal.macros.fats || '0').replace(/[^\d]/g, '')) || 0,
        name: meal.dishName,
      }, profileIds);
      logMealToWeek(meal, profileIds);
      updateStreak({ savedAmount: meal.orderCost - meal.cookCost, cuisine: meal.cuisine, time: meal.totalTime });
      markCuisineTried(meal.cuisine);
    } catch {
      // ignore logging errors
    }

    setPhase('done');
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
    script.onload = () => {
      if (window.confetti) {
        const rootStyles = getComputedStyle(document.documentElement);
        const confettiColors = [
          rootStyles.getPropertyValue('--brand-primary').trim(),
          rootStyles.getPropertyValue('--brand-secondary').trim(),
          rootStyles.getPropertyValue('--success').trim(),
          rootStyles.getPropertyValue('--brand-accent').trim(),
        ].filter(Boolean);
        window.confetti({ particleCount: 150, spread: 70, colors: confettiColors, origin: { y: 0.6 } });
      }
    };
    document.head.appendChild(script);
  };

  const elapsedMins = () => {
    if (!startTimeRef.current) return 0;
    const end = endTimeRef.current || Date.now();
    return Math.round((end - startTimeRef.current) / 60000);
  };

  const progressPercent = totalSteps ? Math.round((Array.from(completed).length / totalSteps) * 100) : 0;

  if (phase === 'intro') {
    return createPortal(
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 text-text-primary bg-modal backdrop-blur-md">
        <div className="max-w-2xl w-full text-center bg-surface rounded-3xl p-10 shadow-2xl border border-border-subtle">
          <div className="text-6xl animate-pulse">👨‍🍳</div>
          <h2 className="mt-6 text-3xl font-black font-display">Let's Cook {recipe.dishName}</h2>
          <p className="mt-3 text-text-secondary">Estimated time: {recipe.totalTime} · {totalSteps} steps · {recipe.difficulty}</p>
          <button onClick={() => setPhase('cooking')} className="btn btn-primary btn-lg mt-8 shadow-brand animate-pulse">Begin Cooking</button>
        </div>
      </div>,
      document.body
    );
  }

  if (phase === 'done') {
    return createPortal(
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 text-text-primary bg-modal backdrop-blur-md">
        <div className="max-w-2xl w-full text-center bg-surface rounded-3xl p-10 shadow-2xl border border-border-subtle">
          <div className="text-6xl">🎉</div>
          <h2 className="mt-6 text-3xl font-black font-display">Your {recipe.dishName} is ready!</h2>
          <p className="mt-4 text-text-secondary">Cooked in: {elapsedMins()} mins · Calories: {recipe.totalCalories || recipe.macros?.calories || '—'}</p>
          <div className="mt-6">
            <div className="text-sm uppercase tracking-[0.2em] text-text-tertiary font-bold">Rate this meal</div>
            <div className="flex items-center justify-center gap-2 mt-3">
              {[1,2,3,4,5].map((value) => (
                <button
                  key={value}
                  onClick={() => {
                    const tags = deriveFlavorTags(recipe.dishName, recipe.groceryList || []);
                    saveDishRating({ name: recipe.dishName, cuisine: recipe.cuisine || 'Food', rating: value, tags });
                    setRating(value);
                  }}
                  className={`chip ${rating >= value ? 'active' : ''}`}
                >
                  {rating >= value ? '★' : '☆'}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-8 flex gap-3 justify-center flex-wrap">
            <button onClick={() => { if (onClose) onClose(); }} className="btn btn-secondary">Back to Home</button>
            <button onClick={() => setPhase('intro')} className="btn btn-primary">Cook Again</button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[150] bg-base text-text-primary overflow-auto">
      <div className="max-w-6xl mx-auto px-4 py-4 md:px-6 md:py-6">
        <div className="flex items-center justify-between gap-3 border-b border-border-subtle pb-4">
          <button onClick={() => { if (onClose) onClose(); }} className="text-sm font-bold text-text-tertiary">← Exit</button>
          <div className="text-center flex-1">
            <div className="font-black font-display text-lg">{recipe.dishName}</div>
            <div className="text-xs text-text-tertiary font-bold tracking-wider uppercase">{recipe.totalTime} · {totalSteps} steps</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => speak(currentStep.instruction || '', currentStep.tip || null)} className="chip bg-surface border-border">🔊</button>
            <button onClick={() => setAutoNarrate((value) => !value)} className={`chip ${autoNarrate ? 'chip-success' : 'bg-surface border-border'}`}>{autoNarrate ? 'Auto On' : 'Auto Off'}</button>
            <button onClick={() => setClassMode((value) => !value)} className={`chip ${classMode ? 'bg-primary text-text-inverse border-primary' : 'bg-surface border-border'}`}>🎓 Class</button>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-text-secondary font-bold uppercase tracking-widest mb-2">
            <span>Progress</span>
            <span>Step {currentIndex + 1} of {totalSteps}</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="mt-6 grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card bg-surface relative overflow-hidden">
            <div className="absolute right-4 top-2 text-[120px] opacity-[0.03] font-black leading-none">{String(currentIndex + 1).padStart(2, '0')}</div>
            <div className="relative z-10">
              <div className="text-sm uppercase tracking-[0.25em] text-text-tertiary font-bold mb-3">Step {currentIndex + 1}</div>
              <div className="flex items-start gap-3">
                <div className="text-3xl">{getStepIcon(currentStep.instruction || '')}</div>
                <h3 className="text-2xl md:text-3xl leading-tight font-display font-black text-text-primary">{currentStep.instruction}</h3>
              </div>

              <div className="mt-6 space-y-3">
                {timers.length === 0 && <div className="text-sm text-text-tertiary font-medium">No timer needed for this step.</div>}
                {timers.map((timer, timerIndex) => (
                  <div key={timerIndex} className="bg-surface-2 rounded-2xl p-4 border border-border-subtle">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-text-tertiary font-bold">Timer {timerIndex + 1}</div>
                        <div className="text-4xl font-black font-mono mt-1 text-text-brand">{Math.floor(timer.remaining / 60).toString().padStart(2, '0')}:{(timer.remaining % 60).toString().padStart(2, '0')}</div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {!timer.running ? (
                          <button onClick={() => setTimers((prev) => prev.map((item, idx) => (idx === timerIndex ? { ...item, running: true } : item)))} className="btn btn-primary">▶ Start</button>
                        ) : (
                          <button onClick={() => setTimers((prev) => prev.map((item, idx) => (idx === timerIndex ? { ...item, running: false } : item)))} className="btn btn-secondary">⏸ Pause</button>
                        )}
                        <button onClick={() => setTimers((prev) => prev.map((item, idx) => (idx === timerIndex ? { ...item, remaining: item.initial, running: false } : item)))} className="btn btn-ghost">↺ Reset</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {currentStep.tip && <div className="mt-6 p-4 rounded-2xl bg-primary-light border border-primary text-sm font-medium text-text-brand">💡 {currentStep.tip}</div>}

              <div className="mt-4 rounded-2xl border border-border-subtle overflow-hidden bg-surface-2">
                <button onClick={() => setShowWhy((value) => !value)} className="w-full text-left px-4 py-3 font-semibold flex items-center justify-between">
                  <span>Chef's Insight: Why do we do this?</span>
                  <span className="text-xs text-text-tertiary">🎓 Class Mode Active</span>
                </button>
                <div className="px-4 pb-4">
                  <p className="text-sm font-medium text-text-secondary">{getClassExplanation(currentStep.instruction || '')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card bg-surface">
              <div className="font-bold text-text-primary mb-3 font-display">🧂 This Step Needs</div>
              <ul className="space-y-2">
                {(currentStep.stepIngredients || []).map((ingredient, ingredientIndex) => {
                  const substituted = substitutions?.[currentIndex]?.[ingredientIndex];
                  const isOwned = ownedIngredients?.[currentIndex]?.[ingredientIndex];
                  return (
                    <li key={ingredientIndex} className={`flex items-center gap-2 rounded-xl px-3 py-2 border transition-base ${substituted ? 'bg-warning-light border-warning text-warning' : 'bg-surface-2 border-border-subtle'} ${isOwned ? 'opacity-60 text-text-tertiary' : ''}`}>
                      <button
                        onClick={() => {
                          setOwnedIngredients((prev) => {
                            const next = { ...prev, [currentIndex]: { ...(prev[currentIndex] || {}) } };
                            next[currentIndex][ingredientIndex] = !next[currentIndex][ingredientIndex];
                            storage.set(`owned_${recipe.dishName}`, next);
                            return next;
                          });
                        }}
                        className={`flex-1 text-left font-medium text-sm ${isOwned ? 'line-through' : ''}`}
                      >
                        {isOwned ? '✓' : '○'} {substituted || ingredient}
                      </button>
                      <button onClick={() => { setSubstitutionTarget({ ingredient, ingredientIndex }); loadSubstitutions(ingredient); }} className="text-sm hover:scale-110 transition-transform">🔄</button>
                    </li>
                  );
                })}
                {!(currentStep.stepIngredients || []).length && <li className="text-sm font-medium text-text-tertiary">No specific ingredients needed.</li>}
              </ul>
            </div>

            <div className="card bg-surface">
              <div className="font-bold text-text-primary mb-3 font-display">Coming up</div>
              <div className="space-y-3 text-sm text-text-secondary font-medium">
                {steps.slice(currentIndex + 1, currentIndex + 3).map((step, index) => (
                  <div key={index} className="opacity-70 bg-surface-2 border border-border-subtle p-3 rounded-2xl">
                    <span className="font-bold">Step {currentIndex + 2 + index}</span> · {step.instruction}
                  </div>
                ))}
                {currentIndex >= totalSteps - 1 && <div className="text-text-tertiary italic">No more steps</div>}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-border-subtle pt-4 flex-wrap pb-10">
          <button onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))} className="btn btn-secondary">◀ Previous</button>
          <button onClick={markDoneAndNext} className="btn btn-primary px-8 py-4">✓ Done → Next ▶</button>
        </div>
      </div>

      {substitutionTarget && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-modal backdrop-blur-md">
          <div className="w-full max-w-xl bg-surface text-text-primary rounded-3xl p-6 shadow-2xl border border-border-subtle animate-scale-in">
            <div className="flex items-center justify-between mb-4 border-b border-border-subtle pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-text-tertiary font-bold">Substituting</p>
                <h3 className="text-2xl font-black font-display">{substitutionTarget.ingredient}</h3>
              </div>
              <button onClick={() => setSubstitutionTarget(null)} className="text-text-tertiary hover:text-text-primary text-xl">✕</button>
            </div>
            {substitutionLoading ? (
              <div className="py-8 text-center font-medium text-text-tertiary flex flex-col items-center gap-3">
                <span className="text-3xl animate-spin">⏳</span>
                Finding halal alternatives...
              </div>
            ) : (
              <div className="space-y-3">
                {substitutionResults.map((item, index) => (
                  <div key={index} className="p-4 rounded-2xl bg-surface-2 border border-border-subtle">
                    <div className="font-bold text-text-brand">Option {index + 1}</div>
                    <div className="mt-1 font-bold">{item.substitute}</div>
                    <div className="text-sm font-medium text-text-secondary mt-1">{item.effect}</div>
                    <div className="text-xs font-bold text-warning mt-2">💡 {item.tip}</div>
                    <button onClick={() => applySubstitution(substitutionTarget.ingredientIndex, item.substitute)} className="mt-3 btn btn-secondary btn-sm">Use This →</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
