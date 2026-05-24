import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Loader2 } from 'lucide-react';
import { parseVoiceInput } from '../services/gemini';
import {
  getNutritionGoals,
  getTodayNutrition,
  getWeeklyBudget,
  getHouseholdProfiles,
  getActiveProfile,
  getDailyCalorieTarget,
  getMealCalorieTarget,
  storage
} from '../services/foodybud';

const MOODS = [
  { emoji: '😴', label: 'Tired', token: '--mood-tired' },
  { emoji: '😊', label: 'Happy', token: '--mood-happy' },
  { emoji: '😤', label: 'Stressed', token: '--mood-stressed' },
  { emoji: '🥱', label: 'Lazy', token: '--mood-lazy' },
  { emoji: '💪', label: 'Energetic', token: '--mood-energetic' },
  { emoji: '😢', label: 'Sad', token: '--mood-sad' },
  { emoji: '🎉', label: 'Celebratory', token: '--mood-celebratory' },
  { emoji: '🤤', label: 'Hungry', token: '--mood-hungry' }
];

const CUISINES = [
  'Desi/Pakistani', 'Indian', 'Chinese', 'Italian', 'Mexican', 'American', 'Middle Eastern', 'Thai', 'Continental'
];

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'];
const DIETS = ['Vegan', 'Vegetarian', 'Keto', 'Gluten-Free', 'High Protein'];
const CURRENCIES = ['PKR', 'USD', 'GBP', 'INR', 'AED'];
const TIME_LIMITS = ['15 mins', '30 mins', '1 hour', '2+ hours'];
const GOAL_MODES = [
  { id: 'deficit', label: 'Lose weight', hint: '-300 kcal/day' },
  { id: 'maintain', label: 'Maintain', hint: 'steady calories' },
  { id: 'surplus', label: 'Bulk up', hint: '+300 kcal/day' },
];

const CHEF_STYLES = [
  'Pakistani dhaba style',
  'Lahori street food style',
  'Turkish home cooking style',
  'Desi home kitchen',
  'Minimalist healthy',
  'None'
];

const PRESET_BUDGETS = {
  PKR: [200, 500, 1000, 2000],
  USD: [10, 25, 50, 100],
  GBP: [10, 20, 40, 80],
  INR: [200, 500, 1000, 2000],
  AED: [50, 100, 200, 400]
};

export default function InputScreen({ onSearch }) {
  const [mood, setMood] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [mealType, setMealType] = useState('Dinner');
  const [budget, setBudget] = useState('');
  const [currency, setCurrency] = useState('PKR');
  const [diets, setDiets] = useState([]);
  const [leftovers, setLeftovers] = useState('');
  const [timeLimit, setTimeLimit] = useState('');
  const [goalMode, setGoalMode] = useState('maintain');
  const [chefStyle, setChefStyle] = useState('None');
  const [chefStyleCustom, setChefStyleCustom] = useState('');
  const [useSmartPortions, setUseSmartPortions] = useState(true);
  const [householdMode, setHouseholdMode] = useState(false);
  const [householdIds, setHouseholdIds] = useState([]);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isParsingVoice, setIsParsingVoice] = useState(false);
  
  const weeklyBudget = getWeeklyBudget();
  const nutritionGoals = getNutritionGoals();
  const todayNutrition = getTodayNutrition().value;
  const householdProfiles = getHouseholdProfiles();
  const activeProfile = getActiveProfile();
  const budgetRemaining = Math.max(0, (weeklyBudget.total || 0) - (weeklyBudget.spent || 0));
  const calorieRemaining = Math.max(0, (nutritionGoals.calories || 0) - (todayNutrition.totals?.calories || 0));
  const selectedProfiles = householdMode
    ? householdProfiles.filter((profile) => householdIds.includes(profile.id))
    : activeProfile
      ? [activeProfile]
      : [];
  const effectiveProfile = useSmartPortions ? selectedProfiles[0] : null;
  const dailyTarget = effectiveProfile ? getDailyCalorieTarget(effectiveProfile, goalMode) : null;
  const mealTarget = dailyTarget ? getMealCalorieTarget(dailyTarget, mealType) : null;

  const navigate = useNavigate();

  useEffect(() => {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale || navigator.language || '';
    const region = locale.split('-')[1] || '';
    const country = region.toUpperCase();

    if (country === 'US' || country === 'CA') setCurrency('USD');
    else if (country === 'GB') setCurrency('GBP');
    else if (country === 'IN') setCurrency('INR');
    else if (country === 'AE' || country === 'SA') setCurrency('AED');
    else if (country === 'PK') setCurrency('PKR');
    else setCurrency('USD');
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!mood || !cuisine || !budget || !timeLimit) return;

    const profileDiets = selectedProfiles.flatMap((profile) => profile.diets || []);
    const allergies = selectedProfiles.map((profile) => profile.allergies).filter(Boolean).join(', ');
    const chefStyleText = chefStyle === 'None' ? '' : (chefStyle === 'Custom' ? chefStyleCustom : chefStyle);
    const mergedDiets = [...new Set([...(diets || []), ...profileDiets])];
    const searchPayload = {
      mood,
      cuisine,
      budget,
      currency,
      diets: mergedDiets,
      mealType,
      leftovers,
      timeLimit,
      goalMode,
      chefStyle: chefStyleText,
      allergies,
      dailyTarget,
      mealTarget,
      householdProfiles: selectedProfiles.map((profile) => ({
        id: profile.id,
        name: profile.name,
        diets: profile.diets || [],
        allergies: profile.allergies || '',
        goalMode: profile.goalMode || goalMode,
      })),
    };
    storage.set('lastSearch', searchPayload);
    const allowed = onSearch(searchPayload);
    if (allowed) {
      navigate('/results', { state: searchPayload });
    }
  };

  const handleSurprise = () => {
    const randomMood = MOODS[Math.floor(Math.random() * MOODS.length)].label;
    const randomCuisine = CUISINES[Math.floor(Math.random() * CUISINES.length)];
    const randomChefStyle = CHEF_STYLES[Math.floor(Math.random() * CHEF_STYLES.length)];
    const baseBudget = weeklyBudget.total ? Math.round((weeklyBudget.total || 0) / 7) : 500;
    const chefStyleText = randomChefStyle === 'None' ? '' : randomChefStyle;
    const searchPayload = {
      mood: randomMood,
      cuisine: randomCuisine,
      budget: String(Math.max(baseBudget, 200)),
      currency,
      diets: [],
      mealType: 'Dinner',
      leftovers: '',
      timeLimit: '30 mins',
      goalMode: 'maintain',
      chefStyle: chefStyleText,
      allergies: '',
      dailyTarget: null,
      mealTarget: null,
      householdProfiles: [],
    };
    storage.set('lastSearch', searchPayload);
    const allowed = onSearch(searchPayload);
    if (allowed) {
      navigate('/results', { state: searchPayload });
    }
  };

  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Chrome.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    setIsRecording(true);

    recognition.onresult = async (e) => {
      setIsRecording(false);
      setIsParsingVoice(true);
      const transcript = e.results[0][0].transcript;

      const parsed = await parseVoiceInput(transcript);
      if (parsed) {
        if (parsed.mood && MOODS.find(m => m.label.toLowerCase() === parsed.mood.toLowerCase())) {
          setMood(MOODS.find(m => m.label.toLowerCase() === parsed.mood.toLowerCase()).label);
        }
        if (parsed.cuisine && CUISINES.find(c => c.toLowerCase() === parsed.cuisine.toLowerCase())) {
          setCuisine(CUISINES.find(c => c.toLowerCase() === parsed.cuisine.toLowerCase()));
        }
        if (parsed.budget && !isNaN(parsed.budget)) setBudget(parsed.budget.toString());
        if (parsed.currency) setCurrency(parsed.currency);
        if (parsed.mealType) setMealType(parsed.mealType);
      }
      setIsParsingVoice(false);
    };

    recognition.onerror = () => {
      setIsRecording(false);
      setIsParsingVoice(false);
    };

    recognition.start();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="w-full screen-enter pb-20">
      <div className="w-full bg-gradient-to-b from-surface-2 via-base to-surface-3 pt-14 pb-8 rounded-b-3xl shadow-sm border-b border-border-subtle">
        <div className="container">
          <p className="text-base text-text-secondary">
            {getGreeting()}, Abdul 👋
          </p>
          <h1 className="mt-1 text-3xl font-display font-black text-text-primary">
            What are we cooking?
          </h1>

          <button
            type="button"
            onClick={startVoiceInput}
            disabled={isRecording || isParsingVoice}
            className={`w-full flex items-center justify-center gap-2 mt-6 py-3 rounded-xl border border-border bg-surface shadow-xs transition-base ${isRecording || isParsingVoice ? 'opacity-70' : 'opacity-100'}`}
          >
            {isParsingVoice ? <Loader2 className="w-5 h-5 animate-spin text-text-brand" /> : <Mic className={`w-5 h-5 ${isRecording ? 'animate-bounce text-text-brand' : 'text-text-tertiary'}`} />}
            <span className="text-sm font-medium text-text-secondary">
              {isRecording ? "Listening..." : isParsingVoice ? "Thinking..." : "Tap to Speak"}
            </span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="container mt-6 space-y-8">
        
        {/* Mood Selector */}
        <div>
          <h3 className="mb-3 text-lg font-semibold text-text-primary">Mood</h3>
          <div className="mood-grid">
            {MOODS.map(m => (
              <div
                key={m.label}
                onClick={() => setMood(m.label)}
                style={{ '--mood-color': `var(${m.token})`, '--mood-glow': `color-mix(in srgb, var(${m.token}) 30%, transparent)` }}
                className={`mood-card ${mood === m.label ? 'selected' : ''}`}
              >
                <span className="mood-emoji">{m.emoji}</span>
                <span className="mood-label">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cuisine Selector */}
        <div>
          <h3 className="mb-3 text-lg font-semibold text-text-primary px-4">Cuisine</h3>
          <div className="cuisine-scroll">
            {CUISINES.map(c => (
              <div
                key={c}
                onClick={() => setCuisine(c)}
                className={`cuisine-pill ${cuisine === c ? 'selected' : ''}`}
              >
                {c}
              </div>
            ))}
          </div>
        </div>

        {/* Time Limit Selector */}
        <div className="px-4">
          <h3 className="mb-3 text-lg font-semibold text-text-primary">Time</h3>
          <div className="time-options">
            {TIME_LIMITS.map((t, i) => (
              <div
                key={t}
                onClick={() => setTimeLimit(t)}
                className={`time-option ${timeLimit === t ? 'selected' : ''}`}
              >
                <span className="text-xl">{['⚡', '🕐', '🕑', '🕒'][i]}</span>
                <span className="text-xs font-semibold text-center">{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Budget Input */}
        <div className="px-4">
          <h3 className="mb-3 text-lg font-semibold text-text-primary">Budget</h3>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <select
                value={currency}
                onChange={(e) => {
                  setCurrency(e.target.value);
                  setBudget('');
                }}
                className="bg-transparent border-none text-text-secondary text-sm font-semibold outline-none appearance-none cursor-pointer pr-1"
              >
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="0"
              className="w-full bg-surface border-2 border-border rounded-xl py-4 pl-16 pr-4 font-mono text-2xl font-bold text-text-primary outline-none focus:border-primary transition-base shadow-sm"
              required
            />
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            {PRESET_BUDGETS[currency].map(amt => (
              <div
                key={amt}
                onClick={() => setBudget(amt.toString())}
                className="chip"
              >
                {currency} {amt}
              </div>
            ))}
          </div>
        </div>

        {/* Meal Type Selector (Hidden in new design, but requested to keep logic. Put it as pills) */}
        <div className="px-4">
          <h3 className="mb-3 text-sm font-semibold text-text-secondary uppercase tracking-widest">Meal Type</h3>
          <div className="flex flex-wrap gap-2">
            {MEAL_TYPES.map(m => (
              <div
                key={m}
                onClick={() => setMealType(m)}
                className={`chip ${mealType === m ? 'active' : ''}`}
              >
                {m}
              </div>
            ))}
          </div>
        </div>

        {/* Advanced Options */}
        <div className="px-4">
          <div className="card">
            <h3 className="mb-4 text-lg font-semibold text-text-primary">Advanced</h3>

            <div className="mb-5">
              <label className="input-label">Goal mode</label>
              <div className="flex flex-wrap gap-2">
                {GOAL_MODES.map((goal) => (
                  <button
                    type="button"
                    key={goal.id}
                    onClick={() => setGoalMode(goal.id)}
                    className={`chip ${goalMode === goal.id ? 'active' : ''}`}
                  >
                    {goal.label} <span className="text-xs opacity-70">{goal.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label className="input-label">Guest Chef Mode</label>
              <div className="flex flex-wrap gap-2">
                {CHEF_STYLES.map((style) => (
                  <button
                    type="button"
                    key={style}
                    onClick={() => setChefStyle(style)}
                    className={`chip ${chefStyle === style ? 'active' : ''}`}
                  >
                    {style}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setChefStyle('Custom')}
                  className={`chip ${chefStyle === 'Custom' ? 'active' : ''}`}
                >
                  Custom
                </button>
              </div>
              {chefStyle === 'Custom' ? (
                <input
                  value={chefStyleCustom}
                  onChange={(e) => setChefStyleCustom(e.target.value)}
                  placeholder="e.g., Karachi street food"
                  className="input mt-3"
                />
              ) : null}
            </div>

            <div className="mb-5">
              <label className="input-label">Smart portions</label>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="text-sm text-text-secondary">
                  {effectiveProfile
                    ? `${effectiveProfile.name || 'Profile'} target: ${dailyTarget || '—'} kcal/day, ~${mealTarget || '—'} kcal this meal.`
                    : 'Set up a profile in Dashboard to calculate portions.'}
                </div>
                <button
                  type="button"
                  onClick={() => setUseSmartPortions((value) => !value)}
                  className={`btn btn-sm ${useSmartPortions ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {useSmartPortions ? 'On' : 'Off'}
                </button>
              </div>
            </div>

            <div>
              <label className="input-label">Household mode</label>
              <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
                <div className="text-sm text-text-secondary">Use multiple profiles for one shared meal.</div>
                <button
                  type="button"
                  onClick={() => setHouseholdMode((value) => !value)}
                  className={`btn btn-sm ${householdMode ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {householdMode ? 'On' : 'Off'}
                </button>
              </div>
              {householdMode ? (
                <div className="flex flex-wrap gap-2">
                  {householdProfiles.length === 0 ? (
                    <div className="text-sm text-text-tertiary">Add household profiles in Dashboard.</div>
                  ) : (
                    householdProfiles.map((profile) => (
                      <button
                        type="button"
                        key={profile.id}
                        onClick={() => {
                          setHouseholdIds((prev) =>
                            prev.includes(profile.id)
                              ? prev.filter((id) => id !== profile.id)
                              : [...prev, profile.id]
                          );
                        }}
                        className={`chip ${householdIds.includes(profile.id) ? 'active' : ''}`}
                      >
                        {profile.name || 'Member'}
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="find-meal-btn"
          disabled={!mood || !cuisine || !budget || !timeLimit}
        >
          Find My Meal
        </button>
        <button
          type="button"
          onClick={handleSurprise}
          className="btn btn-secondary w-full mx-4"
        >
          ✨ Surprise Me
        </button>
      </form>

    </div>
  );
}
