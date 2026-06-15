import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, CalendarDays, Flame, HeartPulse, Package, Settings2, Wallet } from 'lucide-react';
import {
  addPantryItem,
  callDeepSeek,
  deductFromBudget,
  generateWeeklyReport,
  getMoodHistory,
  getPantryItems,
  getNutritionGoals,
  getWeeklyProfileTotals,
  getWeeklyReportCards,
  getWeekKey,
  getTodayNutrition,
  getWeeklyBudget,
  getHouseholdProfiles,
  saveHouseholdProfiles,
  getActiveProfileId,
  setActiveProfileId,
  calculateTdee,
  getDailyCalorieTarget,
  openDB,
  ensureWeeklyNutritionReportCard,
  removePantryItem,
  saveNutritionGoals,
  saveWeeklyBudget,
  storage,
  updateStreak,
} from '../services/foodybud';

const ACHIEVEMENTS = [
  { id: 'streak_3', icon: '🔥', title: '3 Day Streak', desc: 'Cooked 3 days in a row', condition: (s) => s.current >= 3 },
  { id: 'streak_7', icon: '🔥🔥', title: 'Week Warrior', desc: 'Cooked 7 days in a row', condition: (s) => s.current >= 7 },
  { id: 'streak_30', icon: '👑', title: 'Monthly Chef', desc: 'Cooked 30 days in a row', condition: (s) => s.current >= 30 },
  { id: 'meals_10', icon: '👨‍🍳', title: 'Home Chef', desc: 'Cooked 10 meals total', condition: (s) => s.totalMealsCooked >= 10 },
  { id: 'meals_50', icon: '⭐', title: 'Kitchen Master', desc: 'Cooked 50 meals total', condition: (s) => s.totalMealsCooked >= 50 },
  { id: 'cuisines_5', icon: '🌍', title: 'Globe Taster', desc: 'Tried 5 cuisines', condition: (s) => (s.cuisinesCookedSet || []).length >= 5 },
];

const OFFLINE_PACK_META = 'offlinePackMeta';
const DIETS = ['Vegan', 'Vegetarian', 'Keto', 'Gluten-Free', 'High Protein'];
const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentary' },
  { id: 'light', label: 'Lightly active' },
  { id: 'moderate', label: 'Moderately active' },
  { id: 'active', label: 'Very active' },
  { id: 'athlete', label: 'Athlete' },
];
const OFFLINE_PACK_PROMPT = `
Generate exactly 20 complete Halal recipes covering these categories:
- 5 Quick meals (under 20 mins)
- 5 Desi/Pakistani classics
- 4 High-protein meals
- 3 Budget meals (under Rs. 300 ingredients)
- 3 Special occasion dishes

Respond ONLY in JSON:
{
  "recipes": [
    {
      "id": "unique_id",
      "name": "dish name",
      "category": "Quick/Desi/HighProtein/Budget/Special",
      "cuisine": "cuisine type",
      "time": "X mins",
      "difficulty": "Easy/Medium/Hard",
      "servings": number,
      "estimatedCost": number in PKR,
      "ingredients": ["ingredient - quantity"],
      "steps": [
        {
          "stepNumber": number,
          "instruction": "step text under 25 words",
          "timerSeconds": number or null,
          "tip": "string or null"
        }
      ],
      "macros": {
        "calories": number,
        "protein": "Xg",
        "carbs": "Xg",
        "fats": "Xg"
      },
      "tags": ["halal", "quick", "desi"]
    }
  ]
}

All recipes strictly Halal. Costs in PKR. Keep steps atomic and clear.
`;

export default function ProfileScreen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [budgetDraft, setBudgetDraft] = useState('');
  const [nutritionDraft, setNutritionDraft] = useState(getNutritionGoals());
  const [budget, setBudget] = useState(getWeeklyBudget());
  const [todayNutrition, setTodayNutrition] = useState(getTodayNutrition().value);
  const [streak, setStreak] = useState(storage.get('cookStreak', { current: 0, longest: 0, totalMealsCooked: 0, totalSaved: 0, cuisinesCookedSet: [], quickMeals: 0 }));
  const [report, setReport] = useState(generateWeeklyReport());
  const [unlocked, setUnlocked] = useState(storage.get('unlockedAchievements', []));
  const [offlineMeta, setOfflineMeta] = useState(storage.get(OFFLINE_PACK_META, null));
  const [offlineRecipes, setOfflineRecipes] = useState([]);
  const [votingCount, setVotingCount] = useState(0);
  const [profiles, setProfiles] = useState(getHouseholdProfiles());
  const [activeProfileId, setActiveProfileIdState] = useState(getActiveProfileId());
  const [editingProfile, setEditingProfile] = useState(null);
  const [pantryItems, setPantryItems] = useState(getPantryItems());
  const [pantryDraft, setPantryDraft] = useState('');
  const [moodHistory, setMoodHistory] = useState(getMoodHistory());
  const [reportCard, setReportCard] = useState(null);
  const [reportCards, setReportCards] = useState(getWeeklyReportCards());

  const loadOfflineRecipes = async () => {
    try {
      const db = await openDB('FoodyBudOffline', 1);
      const tx = db.transaction(['recipes'], 'readonly');
      const store = tx.objectStore('recipes');
      const request = store.get('offlinePack');
      request.onsuccess = () => {
        const result = request.result;
        const recipes = Array.isArray(result?.recipes) ? result.recipes : (Array.isArray(result) ? result : []);
        setOfflineRecipes(recipes);
      };
    } catch {
      setOfflineRecipes([]);
    }
  };

  useEffect(() => {
    const refresh = () => {
      setBudget(getWeeklyBudget());
      setNutritionDraft(getNutritionGoals());
      setTodayNutrition(getTodayNutrition().value);
      setStreak(storage.get('cookStreak', { current: 0, longest: 0, totalMealsCooked: 0, totalSaved: 0, cuisinesCookedSet: [], quickMeals: 0 }));
      setReport(generateWeeklyReport());
      setUnlocked(storage.get('unlockedAchievements', []));
      setOfflineMeta(storage.get(OFFLINE_PACK_META, null));
      loadOfflineRecipes();
      setProfiles(getHouseholdProfiles());
      setActiveProfileIdState(getActiveProfileId());
      setPantryItems(getPantryItems());
      setMoodHistory(getMoodHistory());
      setReportCard(ensureWeeklyNutritionReportCard());
      setReportCards(getWeeklyReportCards());
    };
    refresh();
    const onStorage = () => refresh();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const budgetRemaining = Math.max(0, (budget.total || 0) - (budget.spent || 0));
  const budgetPercent = budget.total ? Math.max(0, Math.min(100, Math.round((budgetRemaining / budget.total) * 100))) : 0;
  
  const remainingMacros = useMemo(() => {
    const goals = nutritionDraft || { calories: 0, protein: 0, carbs: 0, fats: 0 };
    return {
      calories: Math.max(0, goals.calories - (todayNutrition.totals?.calories || 0)),
      protein: Math.max(0, goals.protein - (todayNutrition.totals?.protein || 0)),
      carbs: Math.max(0, goals.carbs - (todayNutrition.totals?.carbs || 0)),
      fats: Math.max(0, goals.fats - (todayNutrition.totals?.fats || 0)),
    };
  }, [nutritionDraft, todayNutrition]);

  const saveBudget = () => {
    const value = Number(budgetDraft);
    if (!Number.isFinite(value) || value <= 0) return;
    saveWeeklyBudget(value);
    setBudget(getWeeklyBudget());
    setBudgetDraft('');
  };

  const saveGoals = () => {
    saveNutritionGoals({
      calories: Number(nutritionDraft.calories || 0),
      protein: Number(nutritionDraft.protein || 0),
      carbs: Number(nutritionDraft.carbs || 0),
      fats: Number(nutritionDraft.fats || 0),
    });
    setNutritionDraft(getNutritionGoals());
  };

  const handlePantryAdd = () => {
    if (!pantryDraft.trim()) return;
    addPantryItem(pantryDraft.trim());
    setPantryItems(getPantryItems());
    setPantryDraft('');
  };

  const handlePantryRemove = (item) => {
    removePantryItem(item);
    setPantryItems(getPantryItems());
  };

  const weeklyProfileTotals = useMemo(() => getWeeklyProfileTotals(getWeekKey()), [profiles, report]);

  const familyMacroRows = useMemo(() => {
    return profiles.map((profile) => {
      const totals = weeklyProfileTotals[profile.id] || { calories: 0, protein: 0, carbs: 0, fats: 0 };
      const dailyTarget = getDailyCalorieTarget(profile, profile.goalMode || 'maintain') || 0;
      const weeklyTarget = dailyTarget * 7;
      const macroRatio = {
        protein: nutritionDraft.protein && nutritionDraft.calories ? nutritionDraft.protein / nutritionDraft.calories : 0.04,
        carbs: nutritionDraft.carbs && nutritionDraft.calories ? nutritionDraft.carbs / nutritionDraft.calories : 0.12,
        fats: nutritionDraft.fats && nutritionDraft.calories ? nutritionDraft.fats / nutritionDraft.calories : 0.03,
      };
      return {
        profile,
        totals,
        targets: {
          calories: weeklyTarget,
          protein: weeklyTarget * macroRatio.protein,
          carbs: weeklyTarget * macroRatio.carbs,
          fats: weeklyTarget * macroRatio.fats,
        },
      };
    });
  }, [profiles, weeklyProfileTotals, nutritionDraft]);

  const moodInsights = useMemo(() => {
    if (!moodHistory.length) return [];
    const comfortCuisines = new Set(['Desi/Pakistani', 'Italian', 'Middle Eastern']);
    const dayMap = {};
    const moodCount = {};
    moodHistory.forEach((entry) => {
      const date = new Date(entry.timestamp);
      const day = date.toLocaleDateString(undefined, { weekday: 'long' });
      dayMap[day] = dayMap[day] || { total: 0, comfort: 0, cuisines: {} };
      dayMap[day].total += 1;
      if (comfortCuisines.has(entry.cuisine)) dayMap[day].comfort += 1;
      dayMap[day].cuisines[entry.cuisine] = (dayMap[day].cuisines[entry.cuisine] || 0) + 1;
      moodCount[entry.mood] = (moodCount[entry.mood] || 0) + 1;
    });
    const topMood = Object.entries(moodCount).sort((a, b) => b[1] - a[1])[0]?.[0];
    const comfortDay = Object.entries(dayMap).find(([, value]) => value.total >= 3 && value.comfort / value.total >= 0.6);
    const topCuisine = Object.entries(dayMap).map(([day, value]) => {
      const top = Object.entries(value.cuisines).sort((a, b) => b[1] - a[1])[0];
      return top ? `${day}s lean ${top[0]}` : null;
    }).filter(Boolean)[0];

    const insights = [];
    if (comfortDay) insights.push(`You usually crave comfort food on ${comfortDay[0]}s.`);
    if (topMood) insights.push(`Your most common mood lately is ${topMood}.`);
    if (topCuisine) insights.push(topCuisine);
    return insights.slice(0, 3);
  }, [moodHistory]);

  const moodNutritionInsight = useMemo(() => {
    if (moodHistory.length < 14) return null;
    const nutritionByDate = {};
    Object.keys(localStorage).forEach((key) => {
      if (!key.startsWith('foodyBud_nutrition_')) return;
      if (key.includes('_p_')) return;
      const payload = storage.get(key.replace('foodyBud_', ''), null);
      const dateKey = key.replace('foodyBud_nutrition_', '');
      if (payload?.totals) nutritionByDate[dateKey] = payload.totals;
    });
    const dailyProtein = Object.values(nutritionByDate).map((day) => day.protein || 0);
    if (dailyProtein.length < 14) return null;
    const avgProtein = dailyProtein.reduce((sum, val) => sum + val, 0) / dailyProtein.length;
    const highProteinDays = new Set(Object.entries(nutritionByDate)
      .filter(([, totals]) => (totals.protein || 0) >= avgProtein)
      .map(([date]) => date));
    const moodCounts = {};
    moodHistory.forEach((entry) => {
      const dateKey = new Date(entry.timestamp).toDateString();
      if (highProteinDays.has(dateKey)) {
        moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
      }
    });
    const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (!topMood) return null;
    return `On higher-protein days you search for ${topMood.toLowerCase()} meals more often.`;
  }, [moodHistory]);

  const getAchievementProgress = (achievement) => {
    const progress = achievement.condition(streak) ? 100 : Math.min(100, (streak.current / 7) * 100);
    return Math.round(progress);
  };

  const budgetHistory = useMemo(() => {
    return Object.keys(localStorage)
      .filter((key) => key.startsWith('foodyBud_week_'))
      .slice(-8)
      .map((key) => {
        const item = storage.get(key.replace('foodyBud_', ''), null);
        return { key, item };
      })
      .filter(Boolean);
  }, [budget, report]);

  const downloadOfflinePack = async () => {
    try {
      const recipes = await callDeepSeek(OFFLINE_PACK_PROMPT);
      const db = await openDB('FoodyBudOffline', 1);
      const tx = db.transaction(['recipes', 'meta'], 'readwrite');
      tx.objectStore('recipes').put(recipes, 'offlinePack');
      tx.objectStore('meta').put({ downloadedAt: new Date().toISOString(), count: 20, storageUsed: '~180KB' }, 'packMeta');
      storage.set(OFFLINE_PACK_META, { downloadedAt: new Date().toISOString(), count: 20, storageUsed: '~180KB' });
      setOfflineMeta(storage.get(OFFLINE_PACK_META, null));
      await loadOfflineRecipes();
    } catch {
      storage.set(OFFLINE_PACK_META, { downloadedAt: new Date().toISOString(), count: 20, storageUsed: '~180KB' });
      setOfflineMeta(storage.get(OFFLINE_PACK_META, null));
    }
  };

  const markVoteSession = () => setVotingCount((c) => c + 1);

  const startNewProfile = () => {
    if (profiles.length >= 6) return;
    setEditingProfile({
      id: `p_${Date.now()}`,
      name: '',
      age: '',
      heightCm: '',
      weightKg: '',
      sex: 'male',
      activity: 'moderate',
      diets: [],
      allergies: '',
      goalMode: 'maintain',
    });
  };

  const saveProfile = () => {
    if (!editingProfile?.name?.trim()) return;
    const next = profiles.some((p) => p.id === editingProfile.id)
      ? profiles.map((p) => (p.id === editingProfile.id ? editingProfile : p))
      : [...profiles, editingProfile];
    setProfiles(next);
    saveHouseholdProfiles(next);
    if (!activeProfileId) {
      setActiveProfileId(editingProfile.id);
      setActiveProfileIdState(editingProfile.id);
    }
    setEditingProfile(null);
  };

  const removeProfile = (profileId) => {
    const next = profiles.filter((p) => p.id !== profileId);
    setProfiles(next);
    saveHouseholdProfiles(next);
    if (activeProfileId === profileId) {
      const replacement = next[0]?.id || null;
      setActiveProfileId(replacement);
      setActiveProfileIdState(replacement);
    }
  };

  const setActive = (profileId) => {
    setActiveProfileId(profileId);
    setActiveProfileIdState(profileId);
  };

  return (
    <div className="container py-8 screen-enter pb-24">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-8 border-b border-border-subtle pb-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-text-secondary">Profile</p>
          <h1 className="text-3xl font-black font-display">Your FoodyBud Dashboard</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/planner')}>Planner</button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/explore')}>Cuisine Explorer</button>
        </div>
      </div>

      <div className="profile-tabs">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`chip ${activeTab === 'dashboard' ? 'active' : ''}`}
        >
          Dashboard
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pantry')}
          className={`chip ${activeTab === 'pantry' ? 'active' : ''}`}
        >
          Pantry
        </button>
      </div>

      {activeTab === 'dashboard' ? (

      <div className="bento-grid">


        {/* Nutrition */}
        <div className="bento-tile">
          <div className="flex items-center gap-3 mb-4"><HeartPulse className="text-text-brand" /><h2 className="text-2xl font-black font-display">Nutrition</h2></div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {['calories','protein','carbs','fats'].map((key) => (
              <label key={key} className="text-xs font-semibold capitalize text-text-secondary">
                {key}
                <input value={nutritionDraft[key]} onChange={(e) => setNutritionDraft((prev) => ({ ...prev, [key]: e.target.value }))} className="input py-2 px-3 mt-1" />
              </label>
            ))}
          </div>
          <div className="flex justify-between items-center">
            <div className="text-sm text-text-secondary">Remaining: {remainingMacros.calories} kcal</div>
            <button onClick={saveGoals} className="btn btn-secondary btn-sm">Save</button>
          </div>
        </div>

        {/* Streaks */}
        <div className="bento-tile md:col-span-2">
          <div className="flex items-center gap-3 mb-4"><Flame className="text-text-brand" /><h2 className="text-2xl font-black font-display">Streak & Achievements</h2></div>
          
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center mb-6">
            <div className="flex-shrink-0 text-center">
              <div className="text-5xl font-black text-text-brand font-mono">{streak.current}</div>
              <p className="text-xs text-text-secondary uppercase tracking-wider font-bold">Days</p>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <span className="chip">Longest: {streak.longest}</span>
              <span className="chip">Meals: {streak.totalMealsCooked}</span>
              <span className="chip">Saved: Rs. {streak.totalSaved}</span>
            </div>
          </div>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {ACHIEVEMENTS.map((a) => {
              const isUnlocked = unlocked.includes(a.id) || a.condition(streak);
              return (
                <div key={a.id} className={`p-3 rounded-2xl border transition-base ${isUnlocked ? 'bg-success-light border-success text-success animate-scale-in' : 'bg-surface-2 border-border opacity-60'}`}>
                  <div className="font-bold flex items-center gap-2">{a.icon} {a.title}</div>
                  <div className="text-xs mt-1 font-medium">{a.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Week Report */}
        <div className="bento-tile md:col-span-2">
          <div className="flex items-center gap-3 mb-4"><BarChart3 className="text-text-brand" /><h2 className="text-2xl font-black font-display">This Week in Food</h2></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-5">
            <div className="p-4 rounded-2xl bg-surface-2 border border-border-subtle">
              <div className="text-text-tertiary text-xs uppercase tracking-wider mb-1 font-bold">Cooked</div>
              <div className="font-bold text-lg">{report.totalMealsCount}</div>
            </div>
            <div className="p-4 rounded-2xl bg-surface-2 border border-border-subtle">
              <div className="text-text-tertiary text-xs uppercase tracking-wider mb-1 font-bold">Saved</div>
              <div className="font-bold text-lg text-text-brand">Rs. {report.totalSavedVsOrdering}</div>
            </div>
            <div className="p-4 rounded-2xl bg-surface-2 border border-border-subtle">
              <div className="text-text-tertiary text-xs uppercase tracking-wider mb-1 font-bold">Top Cuisine</div>
              <div className="font-bold text-lg line-clamp-1">{report.topCuisine || '-'}</div>
            </div>
            <div className="p-4 rounded-2xl bg-surface-2 border border-border-subtle">
              <div className="text-text-tertiary text-xs uppercase tracking-wider mb-1 font-bold">Avg Time</div>
              <div className="font-bold text-lg">{report.avgCookTime || 0}m</div>
            </div>
          </div>
        </div>

        {/* Your Patterns */}
        <div className="bento-tile">
          <div className="flex items-center gap-3 mb-4"><CalendarDays className="text-text-brand" /><h2 className="text-2xl font-black font-display">Your Patterns</h2></div>
          {moodInsights.length === 0 ? (
            <p className="text-sm text-text-tertiary">Keep searching meals to unlock insights.</p>
          ) : (
            <div className="space-y-2 text-sm text-text-secondary">
              {moodInsights.map((insight, index) => (
                <div key={index} className="card-ghost p-3">{insight}</div>
              ))}
            </div>
          )}
        </div>

        {/* Weekly Nutrition Report Card */}
        <div className="bento-tile">
          <div className="flex items-center gap-3 mb-4"><HeartPulse className="text-text-brand" /><h2 className="text-2xl font-black font-display">Weekly Report Card</h2></div>
          {(reportCard || reportCards[0]) ? (
            <div className="report-card">
              {Object.entries((reportCard || reportCards[0]).grades || {}).map(([key, grade]) => (
                <div key={key} className="report-grade">
                  <span className="label">{key}</span>
                  <span className="value">{grade}</span>
                </div>
              ))}
              <div className="text-xs text-text-tertiary mt-3">Week of {(reportCard || reportCards[0]).weekOf}</div>
            </div>
          ) : (
            <p className="text-sm text-text-tertiary">Your report card is generated every Monday.</p>
          )}
        </div>

        {/* Family Nutrition Dashboard */}
        <div className="bento-tile md:col-span-2">
          <div className="flex items-center gap-3 mb-4"><BarChart3 className="text-text-brand" /><h2 className="text-2xl font-black font-display">Family Nutrition Dashboard</h2></div>
          {profiles.length === 0 ? (
            <p className="text-sm text-text-tertiary">Add household profiles to see aggregate macros.</p>
          ) : (
            <div className="space-y-4">
              {familyMacroRows.map((row) => (
                <div key={row.profile.id} className="card">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-text-primary">{row.profile.name}</div>
                    <div className="text-xs text-text-secondary">Weekly targets</div>
                  </div>
                  <div className="macro-grid">
                    {['calories', 'protein', 'carbs', 'fats'].map((key) => {
                      const value = row.totals[key] || 0;
                      const target = row.targets[key] || 1;
                      const percent = Math.min(100, Math.round((value / target) * 100));
                      return (
                        <div key={key}>
                          <div className="macro-label">{key}</div>
                          <div className="macro-bar">
                            <div className="macro-fill" style={{ width: `${percent}%` }} />
                          </div>
                          <div className="macro-value">{Math.round(value)} / {Math.round(target)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mood vs Nutrition Correlation */}
        {moodNutritionInsight ? (
          <div className="bento-tile">
            <div className="flex items-center gap-3 mb-4"><HeartPulse className="text-text-brand" /><h2 className="text-2xl font-black font-display">Mood vs Nutrition</h2></div>
            <p className="text-sm text-text-secondary">{moodNutritionInsight}</p>
          </div>
        ) : null}

        {/* Household Profiles */}
        <div className="bento-tile md:col-span-2">
          <div className="flex items-center gap-3 mb-4"><Package className="text-text-brand" /><h2 className="text-2xl font-black font-display">Household Profiles</h2></div>
          <p className="text-sm text-text-secondary mb-4">Create up to 6 profiles. Smart portions and household mode use these.</p>

          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            {profiles.length === 0 ? (
              <div className="text-sm text-text-tertiary">No profiles yet. Add your first profile below.</div>
            ) : (
              profiles.map((profile) => {
                const tdee = calculateTdee(profile);
                const goalTarget = getDailyCalorieTarget(profile, profile.goalMode || 'maintain');
                return (
                  <div key={profile.id} className="card">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-text-primary">{profile.name}</div>
                      {activeProfileId === profile.id ? <span className="badge badge-success">Active</span> : null}
                    </div>
                    <div className="text-xs text-text-secondary mb-2">
                      {profile.goalMode || 'maintain'} · {tdee ? `${tdee} kcal TDEE` : 'TDEE not set'}
                    </div>
                    <div className="text-xs text-text-secondary mb-3">
                      Target: {goalTarget || '—'} kcal/day
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button className="btn btn-secondary btn-sm" onClick={() => setActive(profile.id)}>Set active</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditingProfile(profile)}>Edit</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => removeProfile(profile.id)}>Remove</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold">{editingProfile ? 'Edit Profile' : 'Add Profile'}</div>
              <button className="btn btn-secondary btn-sm" onClick={startNewProfile} disabled={profiles.length >= 6}>New Profile</button>
            </div>

            {editingProfile ? (
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="text-xs font-semibold text-text-secondary">
                  Name
                  <input className="input mt-1" value={editingProfile.name} onChange={(e) => setEditingProfile((prev) => ({ ...prev, name: e.target.value }))} />
                </label>
                <label className="text-xs font-semibold text-text-secondary">
                  Age
                  <input type="number" className="input mt-1" value={editingProfile.age} onChange={(e) => setEditingProfile((prev) => ({ ...prev, age: e.target.value }))} />
                </label>
                <label className="text-xs font-semibold text-text-secondary">
                  Height (cm)
                  <input type="number" className="input mt-1" value={editingProfile.heightCm} onChange={(e) => setEditingProfile((prev) => ({ ...prev, heightCm: e.target.value }))} />
                </label>
                <label className="text-xs font-semibold text-text-secondary">
                  Weight (kg)
                  <input type="number" className="input mt-1" value={editingProfile.weightKg} onChange={(e) => setEditingProfile((prev) => ({ ...prev, weightKg: e.target.value }))} />
                </label>
                <label className="text-xs font-semibold text-text-secondary">
                  Sex
                  <select className="input mt-1" value={editingProfile.sex} onChange={(e) => setEditingProfile((prev) => ({ ...prev, sex: e.target.value }))}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </label>
                <label className="text-xs font-semibold text-text-secondary">
                  Activity
                  <select className="input mt-1" value={editingProfile.activity} onChange={(e) => setEditingProfile((prev) => ({ ...prev, activity: e.target.value }))}>
                    {ACTIVITY_LEVELS.map((level) => (
                      <option key={level.id} value={level.id}>{level.label}</option>
                    ))}
                  </select>
                </label>

                <div className="sm:col-span-2">
                  <div className="text-xs font-semibold text-text-secondary mb-2">Diets</div>
                  <div className="flex flex-wrap gap-2">
                    {DIETS.map((diet) => (
                      <button
                        type="button"
                        key={diet}
                        onClick={() => setEditingProfile((prev) => {
                          const has = prev.diets?.includes(diet);
                          const next = has ? prev.diets.filter((d) => d !== diet) : [...(prev.diets || []), diet];
                          return { ...prev, diets: next };
                        })}
                        className={`chip ${editingProfile.diets?.includes(diet) ? 'active' : ''}`}
                      >
                        {diet}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="text-xs font-semibold text-text-secondary sm:col-span-2">
                  Allergies / Avoid
                  <input className="input mt-1" value={editingProfile.allergies} onChange={(e) => setEditingProfile((prev) => ({ ...prev, allergies: e.target.value }))} placeholder="e.g., peanuts, shellfish" />
                </label>

                <label className="text-xs font-semibold text-text-secondary sm:col-span-2">
                  Goal mode
                  <select className="input mt-1" value={editingProfile.goalMode} onChange={(e) => setEditingProfile((prev) => ({ ...prev, goalMode: e.target.value }))}>
                    <option value="deficit">Lose weight</option>
                    <option value="maintain">Maintain</option>
                    <option value="surplus">Bulk up</option>
                  </select>
                </label>

                <div className="flex gap-2 sm:col-span-2">
                  <button className="btn btn-primary btn-sm" onClick={saveProfile}>Save Profile</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditingProfile(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-text-tertiary">Select a profile to edit or create a new one.</div>
            )}
          </div>
        </div>
        
        {/* Offline Pack */}
        <div className="bento-tile">
          <div className="flex items-center gap-3 mb-4"><Package className="text-text-brand" /><h2 className="text-2xl font-black font-display">Offline Pack</h2></div>
          {offlineMeta ? (
            <div>
              <p className="mb-2 font-bold text-success">✓ {offlineMeta.count} recipes ready</p>
              <p className="text-xs text-text-secondary mb-4">Updated: {new Date(offlineMeta.downloadedAt).toLocaleDateString()}</p>
              <button onClick={downloadOfflinePack} className="btn btn-secondary btn-sm w-full">Update Pack</button>
            </div>
          ) : (
            <div>
              <p className="mb-4 text-sm text-text-secondary">20 Halal recipes available offline</p>
              <button onClick={downloadOfflinePack} className="btn btn-primary btn-sm w-full">Download Pack</button>
            </div>
          )}
        </div>

        {/* Debug */}
        <div className="bento-tile">
          <div className="flex items-center gap-3 mb-4"><Settings2 className="text-text-brand" /><h2 className="text-2xl font-black font-display">Quick Actions</h2></div>
          <div className="space-y-2">
            <button onClick={() => { const next = deductFromBudget(400); setBudget(next); }} className="btn btn-ghost btn-sm w-full justify-start text-xs">Simulate Groceries</button>
            <button onClick={() => { updateStreak({ savedAmount: 0, cuisine: 'Desi/Pakistani', time: '20 mins' }); setStreak(storage.get('cookStreak')); }} className="btn btn-ghost btn-sm w-full justify-start text-xs">Simulate Cooked Meal</button>
          </div>
        </div>

      </div>
      ) : (
        <div className="pantry-section">
          <div className="card mb-6">
            <h2 className="text-2xl font-black font-display mb-4">Ingredient Pantry</h2>
            <p className="text-sm text-text-secondary mb-4">Keep track of what you have so FoodyBud prioritizes these ingredients.</p>
            <div className="flex flex-wrap gap-2">
              <input
                value={pantryDraft}
                onChange={(e) => setPantryDraft(e.target.value)}
                className="input flex-1 min-w-[200px]"
                placeholder="e.g., tomatoes, yogurt, garlic"
              />
              <button onClick={handlePantryAdd} className="btn btn-primary">Add</button>
            </div>
          </div>

          {pantryItems.length === 0 ? (
            <div className="card text-sm text-text-tertiary">Your pantry is empty. Add ingredients to get smarter suggestions.</div>
          ) : (
            <div className="pantry-grid">
              {pantryItems.map((item) => (
                <div key={item} className="pantry-item">
                  <span>{item}</span>
                  <button onClick={() => handlePantryRemove(item)} className="btn btn-ghost btn-sm">Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
