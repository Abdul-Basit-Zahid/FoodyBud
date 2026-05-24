const STORAGE_PREFIX = 'foodyBud_';

const MOOD_HISTORY_KEY = 'moodHistory';
const PANTRY_KEY = 'pantryItems';
const DISH_RATINGS_KEY = 'dishRatings';
const MEAL_PLAN_KEY = 'mealPlan';
const GROCERY_CHECKLIST_KEY = 'groceryChecklist';
const CUISINES_TRIED_KEY = 'cuisinesTried';
const WEEKLY_REPORT_CARDS_KEY = 'weeklyReportCards';

export const storage = {
  get(key, fallback = null) {
    try {
      const value = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    } catch {
      // ignore
    }
  },
};

const HOUSEHOLD_PROFILES_KEY = 'householdProfiles';
const ACTIVE_PROFILE_KEY = 'activeProfileId';

const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
};

export const getHouseholdProfiles = () => storage.get(HOUSEHOLD_PROFILES_KEY, []);

export const saveHouseholdProfiles = (profiles) => storage.set(HOUSEHOLD_PROFILES_KEY, profiles);

export const getActiveProfileId = () => storage.get(ACTIVE_PROFILE_KEY, null);

export const setActiveProfileId = (profileId) => storage.set(ACTIVE_PROFILE_KEY, profileId);

export const getActiveProfile = () => {
  const profiles = getHouseholdProfiles();
  const activeId = getActiveProfileId();
  return profiles.find((profile) => profile.id === activeId) || profiles[0] || null;
};

export const logMoodSearch = ({ mood, cuisine, timestamp = new Date().toISOString() }) => {
  if (!mood) return false;
  const history = storage.get(MOOD_HISTORY_KEY, []);
  const entry = { mood, cuisine: cuisine || 'Unknown', timestamp };
  const next = [entry, ...history].slice(0, 120);
  return storage.set(MOOD_HISTORY_KEY, next);
};

export const getMoodHistory = (limit = 30) => {
  const history = storage.get(MOOD_HISTORY_KEY, []);
  return history.slice(0, limit);
};

export const getPantryItems = () => storage.get(PANTRY_KEY, []);

export const savePantryItems = (items) => storage.set(PANTRY_KEY, items);

export const addPantryItem = (item) => {
  const trimmed = String(item || '').trim();
  if (!trimmed) return false;
  const items = getPantryItems();
  if (items.some((existing) => existing.toLowerCase() === trimmed.toLowerCase())) return false;
  return savePantryItems([trimmed, ...items]);
};

export const removePantryItem = (item) => {
  const items = getPantryItems().filter((existing) => existing !== item);
  return savePantryItems(items);
};

export const deriveFlavorTags = (dishName = '', ingredients = []) => {
  const text = `${dishName} ${ingredients.join(' ')}`.toLowerCase();
  const tags = new Set();
  if (/(chili|spicy|pepper|masala|harissa|sichuan)/.test(text)) tags.add('spicy');
  if (/(cream|butter|cheese|yogurt|korma|alfredo)/.test(text)) tags.add('creamy');
  if (/(lemon|lime|tamarind|vinegar|tangy|sumac)/.test(text)) tags.add('tangy');
  if (/(sweet|honey|jaggery|sugar|maple)/.test(text)) tags.add('sweet');
  if (/(smoke|smoky|grill|tandoor|bbq|charred)/.test(text)) tags.add('smoky');
  if (/(herb|mint|cilantro|coriander|basil|parsley)/.test(text)) tags.add('herby');
  return [...tags];
};

export const getDishRatings = () => storage.get(DISH_RATINGS_KEY, []);

export const saveDishRating = ({ name, cuisine, rating, tags = [] }) => {
  if (!name || !rating) return false;
  const list = getDishRatings();
  const key = `${name}__${cuisine || 'Food'}`;
  const next = list.filter((item) => item.key !== key);
  next.unshift({
    key,
    name,
    cuisine: cuisine || 'Food',
    rating,
    tags,
    ratedAt: new Date().toISOString(),
  });
  return storage.set(DISH_RATINGS_KEY, next.slice(0, 200));
};

export const getTasteProfile = () => {
  const ratings = getDishRatings().filter((item) => Number(item.rating || 0) >= 4);
  const cuisines = new Map();
  const tags = new Map();
  ratings.slice(0, 80).forEach((item) => {
    cuisines.set(item.cuisine, (cuisines.get(item.cuisine) || 0) + 1);
    (item.tags || []).forEach((tag) => tags.set(tag, (tags.get(tag) || 0) + 1));
  });
  const topCuisines = [...cuisines.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name);
  const topTags = [...tags.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([name]) => name);
  return { cuisines: topCuisines, tags: topTags };
};

export const getCuisinesTried = () => storage.get(CUISINES_TRIED_KEY, []);

export const markCuisineTried = (cuisine) => {
  if (!cuisine) return false;
  const list = getCuisinesTried();
  if (list.includes(cuisine)) return false;
  const next = [...list, cuisine];
  storage.set(CUISINES_TRIED_KEY, next);
  updateAchievements();
  return true;
};

export const calculateBmr = (profile) => {
  const weight = Number(profile?.weightKg || 0);
  const height = Number(profile?.heightCm || 0);
  const age = Number(profile?.age || 0);
  if (!weight || !height || !age) return null;
  const isFemale = profile?.sex === 'female';
  return Math.round(10 * weight + 6.25 * height - 5 * age + (isFemale ? -161 : 5));
};

export const calculateTdee = (profile) => {
  const bmr = calculateBmr(profile);
  if (!bmr) return null;
  const factor = ACTIVITY_FACTORS[profile?.activity || 'moderate'] || ACTIVITY_FACTORS.moderate;
  return Math.round(bmr * factor);
};

export const getDailyCalorieTarget = (profile, goalMode = 'maintain') => {
  const tdee = calculateTdee(profile);
  if (!tdee) return null;
  const delta = goalMode === 'deficit' ? -300 : goalMode === 'surplus' ? 300 : 0;
  return Math.max(1200, tdee + delta);
};

export const getMealCalorieTarget = (dailyTarget, mealType = 'Dinner') => {
  if (!dailyTarget) return null;
  const ratios = {
    Breakfast: 0.25,
    Lunch: 0.3,
    Dinner: 0.35,
    Snack: 0.1,
    Dessert: 0.15,
  };
  const ratio = ratios[mealType] || 0.3;
  return Math.round(dailyTarget * ratio);
};

export const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const createEmptyWeekPlan = (weekStart) => ({
  weekStart,
  days: {
    Mon: [],
    Tue: [],
    Wed: [],
    Thu: [],
    Fri: [],
    Sat: [],
    Sun: [],
  },
});

export const getMealPlan = (weekStart = getMonday(new Date()).toISOString()) => {
  const plans = storage.get(MEAL_PLAN_KEY, {});
  return plans[weekStart] || createEmptyWeekPlan(weekStart);
};

export const saveMealPlan = (weekStart, plan) => {
  const plans = storage.get(MEAL_PLAN_KEY, {});
  const next = { ...plans, [weekStart]: plan };
  return storage.set(MEAL_PLAN_KEY, next);
};

export const addMealToPlan = (weekStart, dayKey, meal) => {
  const plan = getMealPlan(weekStart);
  const dayMeals = plan.days[dayKey] || [];
  plan.days[dayKey] = [...dayMeals, { ...meal, id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}` }];
  return saveMealPlan(weekStart, plan);
};

export const removeMealFromPlan = (weekStart, dayKey, mealId) => {
  const plan = getMealPlan(weekStart);
  plan.days[dayKey] = (plan.days[dayKey] || []).filter((meal) => meal.id !== mealId);
  return saveMealPlan(weekStart, plan);
};

export const getGroceryChecklist = (weekStart = getMonday(new Date()).toISOString()) => {
  const lists = storage.get(GROCERY_CHECKLIST_KEY, {});
  return lists[weekStart] || {};
};

export const saveGroceryChecklist = (weekStart, checklist) => {
  const lists = storage.get(GROCERY_CHECKLIST_KEY, {});
  return storage.set(GROCERY_CHECKLIST_KEY, { ...lists, [weekStart]: checklist });
};

export const clearImageSession = () => {
  storage.set('imageSession', { usedSeeds: [] });
};

export const getImageSession = () => storage.get('imageSession', { usedSeeds: [] });

export const getUniqueImage = (query, seed) => {
  const session = getImageSession();
  let finalSeed = seed;
  while (session.usedSeeds.includes(finalSeed)) {
    finalSeed += 1;
  }
  session.usedSeeds.push(finalSeed);
  storage.set('imageSession', session);
  return `https://source.unsplash.com/600x400/?${encodeURIComponent(query)}&sig=${finalSeed}`;
};

export const getDishImage = (dishName, cuisine) => {
  const query = `${dishName} ${cuisine} food`;
  const seed = [...`${dishName}`].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return getUniqueImage(query, seed);
};

export const getRestaurantImage = (restaurantName, cuisine) => {
  const query = `${cuisine} restaurant interior food`;
  const seed = [...`${restaurantName}`].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return getUniqueImage(query, seed);
};

export const getWeeklyBudget = () => {
  const currentMonday = getMonday(new Date()).toISOString();
  const existing = storage.get('groceryBudget', { total: 0, spent: 0, weekStart: currentMonday });
  if (existing.weekStart !== currentMonday) {
    existing.spent = 0;
    existing.weekStart = currentMonday;
    storage.set('groceryBudget', existing);
  }
  return existing;
};

export const saveWeeklyBudget = (total) => {
  const currentMonday = getMonday(new Date()).toISOString();
  const next = { total, spent: getWeeklyBudget().spent || 0, weekStart: currentMonday };
  storage.set('groceryBudget', next);
  return next;
};

export const deductFromBudget = (estimatedCost) => {
  const budget = getWeeklyBudget();
  const currentMonday = getMonday(new Date()).toISOString();
  if (budget.weekStart !== currentMonday) {
    budget.spent = 0;
    budget.weekStart = currentMonday;
  }
  budget.spent += Number(estimatedCost || 0);
  storage.set('groceryBudget', budget);
  return budget;
};

export const getNutritionGoals = () => storage.get('nutritionGoals', { calories: 2000, protein: 80, carbs: 250, fats: 65 });
export const saveNutritionGoals = (goals) => storage.set('nutritionGoals', goals);

export const getTodayNutrition = () => {
  const todayKey = `nutrition_${new Date().toDateString()}`;
  return { key: todayKey, value: storage.get(todayKey, { meals: [], totals: { calories: 0, protein: 0, carbs: 0, fats: 0 } }) };
};

export const logMealToNutrition = (meal, profileId = null) => {
  const { key, value } = getTodayNutrition();
  const next = {
    meals: [...value.meals, meal],
    totals: {
      calories: (value.totals.calories || 0) + Number(meal.calories || 0),
      protein: (value.totals.protein || 0) + Number(meal.protein || 0),
      carbs: (value.totals.carbs || 0) + Number(meal.carbs || 0),
      fats: (value.totals.fats || 0) + Number(meal.fats || 0),
    },
  };
  storage.set(key, next);
  const profileIds = Array.isArray(profileId) ? profileId : (profileId ? [profileId] : []);
  profileIds.forEach((id) => {
    const profileKey = `${key}_${id}`;
    const profileValue = storage.get(profileKey, { meals: [], totals: { calories: 0, protein: 0, carbs: 0, fats: 0 } });
    const nextProfile = {
      meals: [...profileValue.meals, meal],
      totals: {
        calories: (profileValue.totals.calories || 0) + Number(meal.calories || 0),
        protein: (profileValue.totals.protein || 0) + Number(meal.protein || 0),
        carbs: (profileValue.totals.carbs || 0) + Number(meal.carbs || 0),
        fats: (profileValue.totals.fats || 0) + Number(meal.fats || 0),
      },
    };
    storage.set(profileKey, nextProfile);
  });
  return next;
};

export const getRemainingMacros = () => {
  const goals = getNutritionGoals();
  const today = getTodayNutrition().value;
  return {
    calories: Math.max(0, goals.calories - (today.totals.calories || 0)),
    protein: Math.max(0, goals.protein - (today.totals.protein || 0)),
    carbs: Math.max(0, goals.carbs - (today.totals.carbs || 0)),
    fats: Math.max(0, goals.fats - (today.totals.fats || 0)),
  };
};

const updateAchievements = () => {
  const streak = storage.get('cookStreak', { current: 0, totalMealsCooked: 0, cuisinesCookedSet: [] });
  const cuisinesTried = getCuisinesTried();
  const next = new Set(storage.get('unlockedAchievements', []));
  if (streak.current >= 3) next.add('streak_3');
  if (streak.current >= 7) next.add('streak_7');
  if (streak.current >= 30) next.add('streak_30');
  if (streak.totalMealsCooked >= 10) next.add('meals_10');
  if (streak.totalMealsCooked >= 50) next.add('meals_50');
  if ((cuisinesTried.length || streak.cuisinesCookedSet?.length || 0) >= 5) next.add('cuisines_5');
  storage.set('unlockedAchievements', [...next]);
  return [...next];
};

export const updateStreak = (meal = null) => {
  const streak = storage.get('cookStreak', {
    current: 0,
    longest: 0,
    lastCookDate: null,
    totalMealsCooked: 0,
    totalSaved: 0,
    cuisinesCookedSet: [],
    quickMeals: 0,
  });

  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  if (streak.lastCookDate === today) return streak;
  if (streak.lastCookDate === yesterday) streak.current += 1;
  else streak.current = 1;

  streak.longest = Math.max(streak.current, streak.longest);
  streak.lastCookDate = today;
  streak.totalMealsCooked += 1;
  if (meal?.savedAmount) streak.totalSaved += Number(meal.savedAmount || 0);
  if (meal?.cuisine && !streak.cuisinesCookedSet.includes(meal.cuisine)) streak.cuisinesCookedSet.push(meal.cuisine);
  if (meal?.time && /^(1\d|[0-9])\s*mins?/i.test(meal.time)) streak.quickMeals += 1;

  storage.set('cookStreak', streak);
  updateAchievements();
  return streak;
};

export const getWeekKey = (date = new Date()) => {
  const d = new Date(date);
  const yearStart = new Date(Date.UTC(d.getFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + yearStart.getDay() + 1) / 7);
  return `week_${d.getFullYear()}_${weekNo}`;
};

export const getWeeklyProfileTotals = (weekKey = getWeekKey()) => {
  const weekData = storage.get(weekKey, {});
  return weekData.profileTotals || {};
};

export const getWeeklyReportCards = () => storage.get(WEEKLY_REPORT_CARDS_KEY, []);

const gradeFromRatio = (ratio) => {
  const score = Math.max(0, 1 - Math.abs(1 - ratio));
  if (score >= 0.95) return 'A';
  if (score >= 0.85) return 'B';
  if (score >= 0.75) return 'C';
  if (score >= 0.65) return 'D';
  return 'F';
};

export const ensureWeeklyNutritionReportCard = () => {
  const today = new Date();
  const day = today.getDay();
  if (day !== 1) return null;
  const currentWeekStart = getMonday(today);
  const lastWeekStart = getMonday(new Date(currentWeekStart.getTime() - 86400000 * 7));
  const lastWeekKey = getWeekKey(lastWeekStart);
  const existing = getWeeklyReportCards();
  if (existing.some((card) => card.weekKey === lastWeekKey)) return existing.find((card) => card.weekKey === lastWeekKey);

  const weekData = storage.get(lastWeekKey, { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFats: 0 });
  const goals = getNutritionGoals();
  const targets = {
    calories: (goals.calories || 0) * 7,
    protein: (goals.protein || 0) * 7,
    carbs: (goals.carbs || 0) * 7,
    fats: (goals.fats || 0) * 7,
  };
  const totals = {
    calories: weekData.totalCalories || 0,
    protein: weekData.totalProtein || 0,
    carbs: weekData.totalCarbs || 0,
    fats: weekData.totalFats || 0,
  };
  const grades = {
    calories: gradeFromRatio(targets.calories ? totals.calories / targets.calories : 0),
    protein: gradeFromRatio(targets.protein ? totals.protein / targets.protein : 0),
    carbs: gradeFromRatio(targets.carbs ? totals.carbs / targets.carbs : 0),
    fats: gradeFromRatio(targets.fats ? totals.fats / targets.fats : 0),
  };
  const card = {
    weekKey: lastWeekKey,
    weekOf: lastWeekStart.toLocaleDateString(),
    totals,
    targets,
    grades,
    generatedAt: new Date().toISOString(),
  };
  storage.set(WEEKLY_REPORT_CARDS_KEY, [card, ...existing].slice(0, 12));
  return card;
};

export const getMostFrequent = (items = []) => {
  const map = new Map();
  items.forEach(item => map.set(item, (map.get(item) || 0) + 1));
  let best = null;
  let bestCount = 0;
  for (const [key, count] of map.entries()) {
    if (count > bestCount) {
      best = key;
      bestCount = count;
    }
  }
  return best || '—';
};

export const getTopIngredients = (meals = []) => {
  const counts = new Map();
  meals.forEach(meal => {
    (meal.ingredients || []).forEach(ingredient => {
      const normalized = String(ingredient).split(' - ')[0].trim();
      counts.set(normalized, (counts.get(normalized) || 0) + 1);
    });
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name);
};

export const getAvgCookTime = (meals = []) => {
  if (!meals.length) return 0;
  const total = meals.reduce((sum, meal) => {
    const match = String(meal.cookTime || meal.time || '').match(/(\d+)/);
    return sum + (match ? Number(match[1]) : 0);
  }, 0);
  return Math.round(total / meals.length);
};

export const generateWeeklyReport = () => {
  const weekKey = getWeekKey();
  const weekData = storage.get(weekKey, {});
  return {
    weekOf: getMonday(new Date()).toLocaleDateString(),
    mealsCooked: weekData.meals || [],
    totalMealsCount: weekData.meals?.length || 0,
    totalCalories: weekData.totalCalories || 0,
    totalProtein: weekData.totalProtein || 0,
    totalCarbs: weekData.totalCarbs || 0,
    totalFats: weekData.totalFats || 0,
    totalSavedVsOrdering: weekData.totalSaved || 0,
    topCuisine: getMostFrequent(weekData.meals?.map(m => m.cuisine) || []),
    topIngredients: getTopIngredients(weekData.meals || []),
    streakStatus: storage.get('cookStreak', { current: 0, longest: 0 }),
    grocerySpent: getWeeklyBudget(),
    avgCookTime: getAvgCookTime(weekData.meals || []),
  };
};

export const logMealToWeek = (meal, profileIds = []) => {
  const weekKey = getWeekKey();
  const weekData = storage.get(weekKey, { meals: [], totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFats: 0, totalSaved: 0, profileTotals: {} });
  const macros = meal.macros || {};
  const calories = Number(macros.calories || meal.totalCalories || 0);
  const protein = Number(String(macros.protein || 0).replace(/[^\d]/g, '')) || 0;
  const carbs = Number(String(macros.carbs || 0).replace(/[^\d]/g, '')) || 0;
  const fats = Number(String(macros.fats || 0).replace(/[^\d]/g, '')) || 0;
  weekData.meals.push({
    name: meal.dishName,
    cuisine: meal.cuisine,
    calories,
    cookTime: meal.totalTime,
    savedAmount: meal.orderCost - meal.cookCost,
    cookedAt: new Date().toISOString(),
    ingredients: meal.ingredients || [],
  });
  weekData.totalCalories += calories;
  weekData.totalProtein += protein;
  weekData.totalCarbs += carbs;
  weekData.totalFats += fats;
  weekData.totalSaved += Number(meal.orderCost - meal.cookCost || 0);

  const profileList = Array.isArray(profileIds) && profileIds.length ? profileIds : [];
  if (profileList.length) {
    const perProfile = {
      calories: calories / profileList.length,
      protein: protein / profileList.length,
      carbs: carbs / profileList.length,
      fats: fats / profileList.length,
    };
    profileList.forEach((profileId) => {
      const current = weekData.profileTotals[profileId] || { calories: 0, protein: 0, carbs: 0, fats: 0 };
      weekData.profileTotals[profileId] = {
        calories: current.calories + perProfile.calories,
        protein: current.protein + perProfile.protein,
        carbs: current.carbs + perProfile.carbs,
        fats: current.fats + perProfile.fats,
      };
    });
  }
  storage.set(weekKey, weekData);
  return weekData;
};

export const openDB = (name, version) => new Promise((resolve, reject) => {
  const request = indexedDB.open(name, version);
  request.onupgradeneeded = (e) => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains('recipes')) db.createObjectStore('recipes');
    if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
    if (!db.objectStoreNames.contains('voting')) db.createObjectStore('voting');
  };
  request.onsuccess = (e) => resolve(e.target.result);
  request.onerror = () => reject(request.error);
});

export const callGemini = async (prompt) => {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyBnvNm-F1vnM1BRANzV_HxLxqN3uilvalE';
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });
  if (!response.ok) throw new Error('Gemini request failed');
  const data = await response.json();
  return JSON.parse(data.candidates[0].content.parts[0].text);
};
