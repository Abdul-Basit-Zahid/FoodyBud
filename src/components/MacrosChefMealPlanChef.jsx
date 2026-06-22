import React, { useMemo, useState, useEffect } from 'react';
import { CalendarDays, ListChecks, Lock, Moon, Sun, Droplets, Sparkles } from 'lucide-react';
import { getMockUserState, checkAccess } from '../services/freemium';
import UpgradeModal from './UpgradeModal';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const RECIPES = [
  { id: 'mc-1', title: 'High-Protein Bowl', protein: 45, carbs: 40, fats: 18, ingredients: ['chicken', 'rice', 'spinach'] },
  { id: 'mc-2', title: 'Fiber-Packed Lentils', protein: 28, carbs: 55, fats: 10, ingredients: ['lentils', 'tomato', 'cumin'] },
  { id: 'mc-3', title: 'Lean Turkey Skillet', protein: 38, carbs: 20, fats: 12, ingredients: ['turkey', 'zucchini', 'garlic'] },
];

const SUHOOR_RECIPES = [
  { id: 'suhoor-1', title: 'Banana & Chia Oats Bowl (Slow Casein)', protein: 22, carbs: 65, fats: 14, ingredients: ['oats', 'banana', 'chia seeds', 'milk', 'dates'] },
  { id: 'suhoor-2', title: 'Greek Yogurt Protein Parfait (Hydrating)', protein: 32, carbs: 40, fats: 8, ingredients: ['greek yogurt', 'honey', 'walnuts', 'berries', 'dates'] },
  { id: 'suhoor-3', title: 'Avocado & Egg slow-release toast', protein: 26, carbs: 35, fats: 20, ingredients: ['eggs', 'avocado', 'whole wheat bread', 'olive oil'] },
];

const IFTAR_RECIPES = [
  { id: 'iftar-1', title: 'Lentil Soup & Grilled Chicken Kebab', protein: 48, carbs: 35, fats: 12, ingredients: ['lentils', 'chicken breast', 'lemon', 'dates', 'soup stock'] },
  { id: 'iftar-2', title: 'Dates Fructose Spike & Grilled Fish', protein: 42, carbs: 45, fats: 10, ingredients: ['fish fillet', 'dates', 'quinoa', 'orange', 'olive oil'] },
  { id: 'iftar-3', title: 'Digestible Chickpea & Lamb Stew', protein: 46, carbs: 50, fats: 15, ingredients: ['lamb', 'chickpeas', 'tomatoes', 'spices', 'dates'] },
];

const STORAGE_KEY = 'foodybud_fasting_plan';

const loadPlan = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : null;
    return parsed && parsed.days ? parsed : null;
  } catch {
    return null;
  }
};

export default function MacrosChefMealPlanChef() {
  const [userState, setUserState] = useState(getMockUserState());
  const [fastingMode, setFastingMode] = useState(false);
  const [plan, setPlan] = useState(loadPlan());
  const [targets, setTargets] = useState({ protein: 140, carbs: 220, fats: 60 });
  const [fastingTargets, setFastingTargets] = useState({ hydration: 3.0, hours: 16, protein: 130 });
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    const handleStateUpdate = () => {
      setUserState(getMockUserState());
    };
    window.addEventListener('foodybud-user-state-update', handleStateUpdate);
    return () => window.removeEventListener('foodybud-user-state-update', handleStateUpdate);
  }, []);

  const handleToggleFasting = (e) => {
    const checked = e.target.checked;
    if (checked) {
      const hasAccess = checkAccess('fastingMode', userState);
      if (!hasAccess) {
        setShowUpgradeModal(true);
        setFastingMode(false);
        return;
      }
    }
    setFastingMode(checked);
    setPlan(null); // force regenerations
  };

  const generatePlan = () => {
    let next;
    if (fastingMode) {
      next = {
        fasting: true,
        days: DAYS.map((day, index) => ({
          day,
          suhoor: SUHOOR_RECIPES[index % SUHOOR_RECIPES.length],
          iftar: IFTAR_RECIPES[index % IFTAR_RECIPES.length],
        })),
      };
    } else {
      next = {
        fasting: false,
        days: DAYS.map((day, index) => ({
          day,
          recipe: RECIPES[index % RECIPES.length],
        })),
      };
    }
    setPlan(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const groceryList = useMemo(() => {
    if (!plan) return [];
    let items = [];
    if (plan.fasting) {
      items = plan.days.flatMap((entry) => [
        ...(entry.suhoor?.ingredients || []),
        ...(entry.iftar?.ingredients || [])
      ]);
    } else {
      items = plan.days.flatMap((entry) => entry.recipe?.ingredients || []);
    }
    return [...new Set(items)];
  }, [plan]);

  return (
    <section className="bg-surface rounded-3xl border border-border-subtle p-6 shadow-md relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-border-subtle pb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-text-tertiary font-bold">Sunnah & Ramadan Fasting Planner</p>
          <h2 className="text-2xl font-display font-black text-text-primary mt-1">
            {fastingMode ? '🌙 Ramadan Fasting Planner' : 'Weekly Macro Scheduler'}
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            {fastingMode 
              ? 'Optimized Suhoor & Iftar meal windows weighting slow casein, hydration, and glucose spike.' 
              : 'Structured weekly meals bound to fitness targets.'}
          </p>
        </div>

        {/* Premium Fasting Toggle */}
        <div className="flex items-center gap-3 bg-surface-2 border border-border-subtle px-4 py-2.5 rounded-2xl self-start sm:self-auto">
          <label className="flex items-center gap-2.5 cursor-pointer text-sm font-bold text-text-primary select-none">
            <input
              type="checkbox"
              checked={fastingMode}
              onChange={handleToggleFasting}
              className="w-4 h-4 text-primary rounded focus:ring-primary border-border-subtle cursor-pointer"
            />
            <span className="flex items-center gap-1.5">
              🌙 Fasting Mode (Suhoor & Iftar)
              {!userState.isPremium && <Lock className="w-3.5 h-3.5 text-text-tertiary" />}
            </span>
          </label>
        </div>
      </div>

      {/* Target Metrics */}
      <div className="bg-surface-2 border border-border-subtle rounded-2xl p-5 mb-6">
        <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-4">
          <Droplets className="w-4 h-4 text-text-brand" />
          {fastingMode ? 'Ramadan Target Inputs' : 'Standard Fitness Targets'}
        </h3>
        {fastingMode ? (
          <div className="grid grid-cols-3 gap-3">
            <label className="text-xs font-bold text-text-secondary">
              Hydration (Liters)
              <input
                className="input mt-1.5 font-mono"
                type="number"
                step="0.1"
                value={fastingTargets.hydration}
                onChange={(event) => setFastingTargets((prev) => ({ ...prev, hydration: event.target.value }))}
              />
            </label>
            <label className="text-xs font-bold text-text-secondary">
              Fasting Hours
              <input
                className="input mt-1.5 font-mono"
                type="number"
                value={fastingTargets.hours}
                onChange={(event) => setFastingTargets((prev) => ({ ...prev, hours: event.target.value }))}
              />
            </label>
            <label className="text-xs font-bold text-text-secondary">
              Protein Target (g)
              <input
                className="input mt-1.5 font-mono"
                type="number"
                value={fastingTargets.protein}
                onChange={(event) => setFastingTargets((prev) => ({ ...prev, protein: event.target.value }))}
              />
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {['protein', 'carbs', 'fats'].map((key) => (
              <label key={key} className="text-xs font-bold text-text-secondary capitalize">
                {key}
                <input
                  className="input mt-1.5 font-mono"
                  value={targets[key]}
                  onChange={(event) => setTargets((prev) => ({ ...prev, [key]: event.target.value }))}
                />
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="mb-6 flex justify-start">
        <button type="button" onClick={generatePlan} className="btn btn-primary flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Generate Fasting Schedule
        </button>
      </div>

      {plan ? (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Weekly Schedule */}
          <div className="bg-surface-2 border border-border-subtle rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4 text-text-primary font-bold">
              <CalendarDays className="w-4 h-4 text-text-brand" /> Fasting Weekly Schedule
            </div>
            
            <div className="space-y-3">
              {plan.days.map((entry) => (
                <div key={entry.day} className="bg-surface rounded-2xl border border-border-subtle p-4 hover:shadow-card-hover transition-base">
                  <span className="text-sm font-bold text-text-brand uppercase tracking-wider block mb-2">{entry.day}</span>
                  {plan.fasting ? (
                    <div className="grid gap-2 text-xs">
                      <div className="flex items-center gap-2 bg-primary-light p-2 rounded-xl border border-border-subtle">
                        <Sun className="w-4 h-4 text-warning" />
                        <div>
                          <strong className="text-text-primary block">Suhoor Window:</strong>
                          <span className="text-text-secondary">{entry.suhoor?.title}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-success-light p-2 rounded-xl border border-border-subtle">
                        <Moon className="w-4 h-4 text-success" />
                        <div>
                          <strong className="text-text-primary block">Iftar Window:</strong>
                          <span className="text-text-secondary">{entry.iftar?.title}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text-primary">{entry.recipe?.title}</span>
                      <span className="text-xs bg-primary-light text-text-brand px-2 py-0.5 rounded-lg font-bold">Standard</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Grocery List */}
          <div className="bg-surface-2 border border-border-subtle rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4 text-text-primary font-bold">
              <ListChecks className="w-4 h-4 text-text-brand" /> Unified Fasting Grocery List
            </div>
            <div className="grid gap-2">
              {groceryList.map((item) => (
                <div key={item} className="flex items-center justify-between bg-surface rounded-xl border border-border-subtle px-3 py-2.5">
                  <span className="text-sm font-semibold text-text-primary capitalize">{item}</span>
                  <span className="text-xs font-mono font-bold text-success bg-success-light px-2 py-0.5 rounded-lg">
                    {plan.fasting ? 'fasting essential' : 'need'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-text-tertiary py-8 text-center font-medium border border-dashed border-border-subtle rounded-2xl">
          Generate a plan to view schedule and grocery list.
        </div>
      )}

      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}
    </section>
  );
}
