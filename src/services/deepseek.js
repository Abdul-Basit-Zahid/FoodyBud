import { getRemainingMacros, getTodayNutrition, getNutritionGoals, getPantryItems, getTasteProfile, storage } from './foodybud';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY ?? '';
const DISH_COUNT = 15;
const DEEPSEEK_TIMEOUT_MS = 60000;

// System-level Halal enforcement — injected into EVERY meal suggestion call
const HALAL_SYSTEM_MESSAGE = `You are a Halal meal planning assistant. This is a strict Islamic dietary compliance app.

ABSOLUTE RULES — NEVER VIOLATE:
1. ZERO pork or pork derivatives (no bacon, ham, lard, gelatin from pork, pepperoni, prosciutto, pancetta, chorizo unless explicitly stated halal)
2. ZERO alcohol of any kind (no wine, beer, spirits, cooking wine, mirin, sake, rum extract, vanilla extract with alcohol)
3. ZERO blood or blood products
4. ZERO carnivorous animals or birds of prey
5. All meat must be from Halal-certified sources only
6. No non-Halal gelatin — use agar-agar or halal gelatin only
7. If a dish is traditionally made with haram ingredients, substitute with Halal alternatives and note it

If you are ever unsure whether an ingredient is Halal, EXCLUDE it. When in doubt, leave it out.`;

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
    kidsMode = false,
    kidsAgeRange = '',
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

  const kidsSystemText = kidsMode
    ? `The meal must be child-friendly for age range ${kidsAgeRange || '4-7'}. Avoid spicy ingredients, whole nuts, choking hazards. Suggest fun plating ideas. Include hidden vegetable techniques where possible. Keep steps simple enough for the child to help. All recipes strictly Halal.`
    : '';

  const kidsPromptText = kidsMode
    ? '\nKids meal mode is enabled. Add a funPlatingTip for each dish.'
    : '';

  const cuisineIsPakistani = cuisine?.toLowerCase().includes('desi') || cuisine?.toLowerCase().includes('pakistan');
  const isPKR = currency === 'PKR';

  const pricingGuide = isPKR
    ? `
PRICING REFERENCE — REALISTIC PAKISTANI MARKET PRICES (PKR):
Common ingredient prices in Pakistan (per kg/liter):
- Chicken: 350-500 PKR/kg
- Beef/Mutton: 700-1200 PKR/kg
- Rice (Basmati): 200-400 PKR/kg
- Onions/Tomatoes: 50-150 PKR/kg
- Cooking oil/ghee: 250-500 PKR/liter
- Spices (per pack): 30-100 PKR
- Vegetables (potatoes, ladyfinger, etc): 40-120 PKR/kg
- Lentils (daal): 150-350 PKR/kg
- Yogurt: 100-200 PKR/kg
- Flour: 80-150 PKR/kg

Based on these prices, realistic meal costs:
- Simple home-cooked meal for 2: 300-600 PKR total
- Medium-complexity meal for 2: 600-1200 PKR total
- Elaborate meal with meat for 2: 1200-2500 PKR total
- Restaurant/order cost: typically 2-3x the cook cost

Use these real Pakistani market prices to calculate cookCost and orderCost accurately.`
    : '';

  const prompt = `You are a meal suggestion engine. Use the user's exact inputs to generate practical recipes that fit their situation.
User mood: ${mood}
Cuisine: ${cuisine}
Meal type: ${mealType}
Budget: ${budget} ${currency}
${historyText}${dietText}${leftoverText}${allergiesText}${chefStyleText}${householdText}${pantryText}${tasteText}${nutritionClause}${goalText}${kidsPromptText}
${pricingGuide}
STRICT HALAL REQUIREMENT — THIS IS NON-NEGOTIABLE:
- ALL recipes must be 100% Halal. Zero exceptions.
- FORBIDDEN ingredients: pork, bacon, ham, lard, pepperoni, prosciutto, alcohol, wine, beer, cooking wine, mirin, sake, blood, non-halal gelatin, carnivorous animals.
- If a dish name sounds like it may contain haram ingredients (e.g. carbonara, bolognese with wine), make a Halal-certified version and note the substitution.
- Make the dishes HIGHLY DIVERSE and unique. DO NOT REPEAT STANDARD RECIPES. Dig deep into rare, regional, or highly creative culinary combinations. No two dishes should be similar. KEEP ALL TEXT INCREDIBLY CONCISE TO PREVENT API TIMEOUTS.
- Use leftover ingredients when provided.
- Keep the recipes practical and realistic.

Respond only in JSON with this exact structure:
{
  "dishes": [
    {
      "name": "dish name",
      "cookCost": estimated cost in user's currency as number — MUST be realistic for the currency/country,
      "orderCost": estimated restaurant price as number,
      "time": "30 mins",
      "difficulty": "Easy/Medium/Hard",
      "ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity"],
      "macros": {
        "calories": 500,
        "protein": "30g",
        "carbs": "40g",
        "fats": "15g"
      },
      "portion": {
        "servings": 2,
        "perServingCalories": 450,
        "targetCalories": 450
      }
    }
  ],
  "cookSavings": estimated savings amount as number
}

Return exactly ${DISH_COUNT} dishes. Keep the JSON valid and concise.`;

  try {

    const parsed = await callDeepSeekJson(prompt, HALAL_SYSTEM_MESSAGE + (kidsSystemText ? ' ' + kidsSystemText : ''), { maxTokens: 8000, temperature: 0.95 });
    const uniqueDishes = ensureUniqueDishes(parsed?.dishes || []);
    if (!uniqueDishes.length) {
      const retryPrompt = `${prompt}\n\nThe previous response contained no usable dishes. Return the full JSON object again with ${DISH_COUNT} valid dishes and no extra text.`;
      const retryParsed = await callDeepSeekJson(retryPrompt, kidsSystemText, { maxTokens: 4000, temperature: 0.1, skipRepair: true });
      const retryUniqueDishes = ensureUniqueDishes(retryParsed?.dishes || []);
      if (!retryUniqueDishes.length) {
        throw new Error('Empty dish set from API');
      }
      const retryResult = {
        ...retryParsed,
        dishes: retryUniqueDishes.map((dish) => ({
          ...dish,
          funPlatingTip: dish.funPlatingTip || (kidsMode ? 'Make a smiley face with colorful veggies.' : ''),
          kidsMode: Boolean(kidsMode),
          kidsAgeRange: kidsMode ? kidsAgeRange : ''
        }))
      };
      return retryResult;
    }
    const result = {
      ...parsed,
      dishes: uniqueDishes.map((dish) => ({
        ...dish,
        funPlatingTip: dish.funPlatingTip || (kidsMode ? 'Make a smiley face with colorful veggies.' : ''),
        kidsMode: Boolean(kidsMode),
        kidsAgeRange: kidsMode ? kidsAgeRange : ''
      }))
    };
    return result;
  } catch (error) {
    console.error('DeepSeek API failed.', error);
    const message = String(error?.message || 'API error');
    const match = message.match(/API\s+(\d+)/i);
    const status = match ? Number(match[1]) : null;
    const errorType = status === 429 ? 'rate_limit' : 'api_error';

    return {
      dishes: [],
      cookSavings: 0,
      error: errorType,
      errorMessage: message,
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
    return await callDeepSeekJson(prompt);
  } catch (err) {
    console.error('Voice parse failed', err);
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

  const parsed = await callDeepSeekJson(prompt);
  return parsed.substitutes || [];
};

export const getDetailedChefSteps = async (dishName, cuisine, ingredients = [], steps = []) => {
  const ingredientList = ingredients.join(', ');
  const stepList = steps.map((s, i) => `${i + 1}. ${s}`).join('\n');

  const prompt = `You are an expert Halal culinary instructor writing a detailed, professional cooking guide for a home cook.

Dish: ${dishName}
Cuisine: ${cuisine}
Ingredients: ${ingredientList}

Original brief steps:
${stepList}

Expand EVERY step into a clear, professional instruction. For each step include:
- Exact heat level and timing with a visual/sensory cue
- The exact ingredients and quantities used in this step
- One key technique detail (e.g. stirring motion, temperature, texture signal)

IMPORTANT: Keep "instruction" to exactly 2 sentences. Be specific and practical — no filler.

Respond ONLY in JSON:
{
  "steps": [
    {
      "stepNumber": 1,
      "instruction": "Two sentences max — specific, practical, professional.",
      "stepIngredients": ["ingredient with quantity used in this step"],
      "timerSeconds": null or number of seconds if a timed step,
      "tip": "One short pro tip (under 15 words)",
      "classExplanation": "One sentence: why this step matters scientifically or technically",
      "phase": "prep or cook or plate"
    }
  ]
}

Return ALL ${steps.length} steps. Halal only. No filler text.`;

  const parsed = await callDeepSeekJson(prompt, '', { maxTokens: 5000, temperature: 0.3 });
  return parsed?.steps || [];
};

export const askNutritionist = async (messages = [], recipeContext = {}) => {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('Missing DEEPSEEK_API_KEY');
  }

  const recipeName = recipeContext?.name || recipeContext?.dishName || 'this recipe';
  const cuisine = recipeContext?.cuisine || 'General';
  const macros = recipeContext?.macros
    ? `${recipeContext.macros.calories || '—'} kcal, ${recipeContext.macros.protein || '—'} protein, ${recipeContext.macros.carbs || '—'} carbs, ${recipeContext.macros.fats || '—'} fats`
    : 'unknown';

  const systemPrompt = `You are a registered nutritionist AI assistant embedded in FoodyBud, a Halal meal planning app used by Muslim diaspora worldwide. The user is asking about: ${recipeName}, ${cuisine}, Macros: ${macros}. Answer concisely (2-4 sentences). Always consider Halal dietary requirements. If asked about substitutions, suggest only Halal options.`;

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.5
    })
  });

  if (!response.ok) {
    throw new Error(`API ${response.status}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || '';
};

const callDeepSeekJson = async (prompt, systemAddon = '', options = {}) => {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('Missing DEEPSEEK_API_KEY');
  }

  const systemMessage = systemAddon
    ? `You are a precise JSON API. Return only valid JSON with no extra text. ${systemAddon}`
    : 'You are a precise JSON API. Return only valid JSON with no extra text.';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEEPSEEK_TIMEOUT_MS);
  const maxTokens = options.maxTokens || 4000;
  const temperature = typeof options.temperature === 'number' ? options.temperature : 0.6;

  let response;
  try {
    response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt }
        ],
        temperature,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' }
      })
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('API timeout');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`API ${response.status}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content || '';
  try {
    return parseJsonPayload(text);
  } catch (error) {
    if (options.skipRepair) {
      throw error;
    }
    return repairJsonPayload(prompt, text, systemAddon, options);
  }
};

const repairJsonPayload = async (prompt, rawText, systemAddon = '', options = {}) => {
  const repairPrompt = `The following model output was meant to satisfy this request but is malformed or wrapped. Repair it into valid JSON only, preserving the intended content and schema.

Request:
${prompt}

Broken output:
${rawText}`;

  return callDeepSeekJson(repairPrompt, `${systemAddon} Repair malformed JSON and return only the corrected JSON.`, {
    ...options,
    temperature: 0.1,
    maxTokens: options.maxTokens || 4000,
    skipRepair: true,
  });
};

const parseJsonPayload = (text) => {
  if (!text) return null;

  const cleaned = String(text)
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '');

  try {
    return JSON.parse(cleaned);
  } catch {
    const candidate = extractJsonBlock(cleaned);
    if (candidate) return JSON.parse(candidate);
    throw new Error('Invalid JSON response');
  }
};

const extractJsonBlock = (text) => {
  const source = String(text || '');
  const openIndex = source.search(/[\[{]/);
  if (openIndex === -1) return null;

  const stack = [];
  let inString = false;
  let escaped = false;

  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{' || char === '[') {
      stack.push(char);
      continue;
    }

    if (char === '}' || char === ']') {
      const last = stack.pop();
      if (!last) return null;

      const isMatchingPair = (last === '{' && char === '}') || (last === '[' && char === ']');
      if (!isMatchingPair) return null;

      if (!stack.length) {
        return source.slice(openIndex, index + 1);
      }
    }
  }

  return null;
};

