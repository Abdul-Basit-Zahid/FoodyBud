import { getExpandedRecipes } from './mockRecipes';
import { getRemainingMacros, getTodayNutrition, getNutritionGoals, getPantryItems, getTasteProfile } from './foodybud';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyBnvNm-F1vnM1BRANzV_HxLxqN3uilvalE';
const DISH_COUNT = 12;

const normalizeDishName = (name) => String(name || '').trim().toLowerCase();

const ensureUniqueDishes = (dishes = []) => {
  const seen = new Set();
  const unique = [];
  for (const dish of dishes) {
    const key = normalizeDishName(dish?.name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(dish);
  }

  return unique.slice(0, DISH_COUNT);
};

export const getMealSuggestions = async (mood, cuisine, budget, currency, diets = [], mealType = 'Dinner', leftovers = '', history = [], options = {}) => {
  const {
    chefStyle,
    goalMode = 'maintain',
    dailyTarget,
    mealTarget,
    householdProfiles = [],
    allergies = '',
  } = options || {};
  const historyText = history.length > 0
    ? `\nThe user has previously eaten: ${history.join(', ')}. Do not suggest these again.`
    : '';
    
  const dietText = diets.length > 0 
    ? `\nThe user has the following dietary preferences/restrictions: ${diets.join(', ')}.`
    : '';

  const leftoverText = leftovers.trim().length > 0
    ? `\nCRITICAL INGREDIENT REQUIREMENT: The user has the following leftovers/ingredients in their fridge: "${leftovers}". You MUST prioritize generating recipes that use these exact ingredients so nothing goes to waste.`
    : '';

  const allergiesText = allergies.trim().length > 0
    ? `\nSTRICT AVOID LIST: The user is allergic or wants to avoid: ${allergies}. Do not use these ingredients or close variants.`
    : '';

  const chefStyleText = chefStyle
    ? `\nGuest Chef Mode: Cook in the style of "${chefStyle}". Emphasize authentic techniques, spice profiles, and plating.`
    : '';

  const householdText = householdProfiles.length > 0
    ? `\nHousehold mode: Create dishes that satisfy everyone. Profiles: ${householdProfiles.map((p) => `${p.name || 'Member'} (diets: ${(p.diets || []).join(', ') || 'none'}, allergies: ${p.allergies || 'none'}, goal: ${p.goalMode || goalMode})`).join(' | ')}.`
    : '';

  const goalText = dailyTarget && mealTarget
    ? `\nGoal mode: ${goalMode}. Daily target: ${dailyTarget} kcal. Target this meal around ${mealTarget} kcal (plus/minus 10%). Provide portion guidance to hit the target.`
    : `\nGoal mode: ${goalMode}. If you can, keep calories reasonable for the goal.`;

  const remainingMacros = getRemainingMacros();
  const todayLog = getTodayNutrition().value;
  const nutritionGoals = getNutritionGoals();
  const pantryItems = getPantryItems();
  const tasteProfile = getTasteProfile();

  const pantryText = pantryItems.length > 0
    ? `\nPantry bias: The user already has these ingredients at home: ${pantryItems.join(', ')}. Whenever possible, prioritize dishes that use these items so they cook faster and cheaper.`
    : '';

  const tasteText = (tasteProfile.cuisines.length || tasteProfile.tags.length)
    ? `\nTaste memory: The user loved these cuisines (${tasteProfile.cuisines.join(', ') || 'none'}) and flavor tags (${tasteProfile.tags.join(', ') || 'none'}). Favor dishes that align with these tastes.`
    : '';

  const nutritionClause = (todayLog?.meals?.length || 0) > 0 ? `
The user has eaten today: ${todayLog.totals.calories} kcal, ${todayLog.totals.protein}g protein, ${todayLog.totals.carbs}g carbs, ${todayLog.totals.fats}g fats.
They still need: ${remainingMacros.calories} kcal, ${remainingMacros.protein}g protein, ${remainingMacros.carbs}g carbs, ${remainingMacros.fats}g fats.
Prioritize dishes that help them hit their remaining targets.
Label each dish with how well it fills their nutritional gap (percentage match).
` : `
If useful, balance the dish lightly toward the user's goals: ${nutritionGoals.calories} kcal, ${nutritionGoals.protein}g protein, ${nutritionGoals.carbs}g carbs, ${nutritionGoals.fats}g fats.
`;

  const prompt = `You are a meal suggestion engine. The user is feeling ${mood}, wants a ${cuisine} ${mealType}, and has a budget of ${budget} ${currency}.${historyText}${dietText}${leftoverText}${allergiesText}${chefStyleText}${householdText}${pantryText}${tasteText}${nutritionClause}${goalText}
CRITICAL REQUIREMENT: ALL recipes MUST be strictly Halal. Do not include any pork, bacon, alcohol, wine, beer, or non-halal ingredients. If a traditional recipe requires these, you must substitute them with a Halal alternative (e.g., beef bacon, sparkling water) or provide a different dish altogether. You MUST strictly adhere to this and any other dietary restrictions.
Generate exactly ${DISH_COUNT} different recipe options. All dish names must be unique. Provide detailed steps (6-10 steps) with clear, complete sentences, including timing and heat level when relevant.

Respond ONLY in JSON with this exact structure:
{
  "dishes": [
    {
      "name": "dish name",
      "cookCost": estimated cost in user's currency as number,
      "orderCost": estimated restaurant price as number,
      "time": "30 mins",
      "difficulty": "Easy/Medium/Hard",
      "ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity"],
      "steps": ["step 1", "step 2", "step 3"],
      "groceryList": ["item 1 - quantity", "item 2 - quantity"],
      "whyThisMood": "one sentence why this dish matches the mood",
      "macros": {
        "calories": 500,
        "protein": "30g",
        "carbs": "40g",
        "fats": "15g"
      },
      "portion": {
        "servings": 2,
        "perServingCalories": 450,
        "targetCalories": 450,
        "note": "Portioned for your daily goal."
      }
    }
  ],
  "cookSavings": estimated savings amount as number
}

Return exactly ${DISH_COUNT} dishes. All costs must be realistic for the user's region in ${currency}. Keep recipes simple and practical.`;

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    const parsed = JSON.parse(text);
    return {
      ...parsed,
      dishes: ensureUniqueDishes(parsed?.dishes || [])
    };
  } catch (error) {
    console.error("Gemini API failed.", error);
    const message = String(error?.message || 'API error');
    const match = message.match(/API\s+(\d+)/i);
    const status = match ? Number(match[1]) : null;
    const errorType = status === 429 ? 'rate_limit' : 'api_error';

    const cuisineRecipes = getExpandedRecipes(cuisine, 30);

    const rates = {
      'PKR': 1,
      'USD': 280,
      'GBP': 350,
      'INR': 3.4,
      'AED': 76
    };
    const conversionRate = rates[currency] || 280;
    const isHighProtein = diets.includes('High Protein');
    const isKeto = diets.includes('Keto');

    const shuffled = [...cuisineRecipes].sort(() => 0.5 - Math.random());
    const targetCalories = Number(mealTarget || 0) || null;
    const selectedDishes = ensureUniqueDishes(shuffled).map((dish) => {
      const mockCals = Math.floor(Math.random() * 400) + 300;
      const portionTarget = targetCalories || mockCals;
      return {
        ...dish,
        cookCost: Math.round(dish.cookCost / conversionRate),
        orderCost: Math.round(dish.orderCost / conversionRate),
        macros: {
          calories: mockCals,
          protein: isHighProtein ? '45g' : '20g',
          carbs: isKeto ? '8g' : '55g',
          fats: isKeto ? '40g' : '15g'
        },
        portion: {
          servings: 2,
          perServingCalories: Math.round(portionTarget / 2),
          targetCalories: portionTarget,
          note: dailyTarget ? `Portioned for your ${dailyTarget} kcal daily goal.` : 'Portioned for your goal.'
        }
      };
    });

    const mockSavings = selectedDishes[0]?.orderCost
      ? selectedDishes[0].orderCost - selectedDishes[0].cookCost
      : 0;

    return {
      dishes: selectedDishes,
      cookSavings: mockSavings,
      error: errorType
    };
  }
};

export const parseVoiceInput = async (transcript) => {
  const prompt = `You are a meal intent parser. The user has spoken the following message:
"${transcript}"

Extract their meal preferences from natural speech. People speak casually — handle incomplete sentences, Urdu/Hindi mixed words, slang, and vague descriptions.

Respond ONLY in JSON:
{
  "mood": "one of: Tired/Happy/Stressed/Lazy/Energetic/Sad/Celebratory/Hungry, or null",
  "cuisine": "one of: Desi/Pakistani/Indian/Chinese/Italian/Mexican/American/Middle Eastern/Thai/Continental/Any, or null",
  "budget": "number or null if not mentioned",
  "currency": "PKR/USD/INR/AED or null",
  "mealType": "one of: Breakfast/Lunch/Dinner/Snack/Dessert, or null"
}`;

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });
    
    if (!response.ok) throw new Error('API Error');
    
    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    return JSON.parse(text);
  } catch (err) {
    console.error("Voice parse failed", err);
    return null;
  }
};

export const getIngredientSubstitutes = async (ingredient, dishName = 'Recipe', cuisine = 'General') => {
  const prompt = `You are a Halal cooking substitution expert.

The cook is making: ${dishName} (${cuisine} cuisine)
They do not have: ${ingredient}

Suggest exactly 3 Halal substitutes. Each must be a realistic kitchen alternative.

Respond ONLY in JSON:
{
  "substitutes": [
    {
      "substitute": "exact replacement with quantity",
      "ratio": "how much to use relative to original",
      "effect": "how this changes the dish taste/texture",
      "confidence": "Perfect/Good/Acceptable",
      "tip": "one practical tip for using this substitute"
    }
  ]
}

All substitutes must be strictly Halal. Prefer common pantry items.`;

  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    })
  });

  if (!response.ok) throw new Error('API Error');
  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  const parsed = JSON.parse(text);
  return parsed.substitutes || [];
};
