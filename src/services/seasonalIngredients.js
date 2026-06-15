const SEASONAL_MAP = {
  'Pakistan/South Asia': {
    0: ['kinnow', 'orange', 'spinach', 'cauliflower', 'carrot', 'peas'],
    1: ['orange', 'kinnow', 'spinach', 'peas', 'cauliflower'],
    2: ['strawberry', 'peas', 'spinach', 'carrot', 'radish'],
    3: ['mango', 'cucumber', 'mint', 'okra', 'apricot'],
    4: ['mango', 'okra', 'cucumber', 'melon', 'tomato'],
    5: ['mango', 'melon', 'eggplant', 'tomato', 'corn'],
    6: ['mango', 'corn', 'cucumber', 'tomato', 'okra'],
    7: ['corn', 'eggplant', 'tomato', 'okra', 'guava'],
    8: ['apple', 'pomegranate', 'eggplant', 'tomato', 'pear'],
    9: ['apple', 'pomegranate', 'spinach', 'carrot', 'cauliflower'],
    10: ['citrus', 'orange', 'spinach', 'carrot', 'cauliflower'],
    11: ['citrus', 'orange', 'kinnow', 'spinach', 'peas']
  },
  'UK/Europe': {
    0: ['kale', 'leek', 'cabbage', 'carrot', 'parsnip'],
    1: ['leek', 'cabbage', 'carrot', 'parsnip', 'purple sprouting'],
    2: ['asparagus', 'spring onion', 'spinach', 'radish', 'peas'],
    3: ['asparagus', 'peas', 'spinach', 'rhubarb', 'spring onion'],
    4: ['strawberry', 'peas', 'spinach', 'broccoli', 'new potato'],
    5: ['strawberry', 'courgette', 'tomato', 'cucumber', 'pepper'],
    6: ['tomato', 'cucumber', 'pepper', 'berries', 'sweetcorn'],
    7: ['tomato', 'sweetcorn', 'apple', 'plum', 'courgette'],
    8: ['apple', 'pear', 'plum', 'pumpkin', 'mushroom'],
    9: ['pumpkin', 'squash', 'mushroom', 'leek', 'kale'],
    10: ['kale', 'leek', 'cabbage', 'parsnip', 'carrot'],
    11: ['kale', 'leek', 'cabbage', 'parsnip', 'clementine']
  },
  'UAE/Gulf': {
    0: ['date', 'citrus', 'spinach', 'cauliflower', 'carrot'],
    1: ['date', 'citrus', 'spinach', 'cauliflower', 'lettuce'],
    2: ['strawberry', 'cucumber', 'mint', 'lettuce', 'tomato'],
    3: ['cucumber', 'mint', 'tomato', 'eggplant', 'okra'],
    4: ['mango', 'okra', 'tomato', 'eggplant', 'melon'],
    5: ['mango', 'melon', 'tomato', 'cucumber', 'pepper'],
    6: ['melon', 'cucumber', 'tomato', 'corn', 'date'],
    7: ['fig', 'date', 'eggplant', 'tomato', 'okra'],
    8: ['pomegranate', 'fig', 'eggplant', 'tomato', 'grape'],
    9: ['pomegranate', 'citrus', 'spinach', 'carrot', 'cauliflower'],
    10: ['citrus', 'spinach', 'carrot', 'cauliflower', 'broccoli'],
    11: ['citrus', 'date', 'spinach', 'carrot', 'cauliflower']
  },
  'North America': {
    0: ['kale', 'carrot', 'sweet potato', 'cabbage', 'pear'],
    1: ['kale', 'carrot', 'cabbage', 'parsnip', 'citrus'],
    2: ['asparagus', 'spinach', 'radish', 'peas', 'mushroom'],
    3: ['asparagus', 'peas', 'spinach', 'strawberry', 'spring onion'],
    4: ['strawberry', 'broccoli', 'peas', 'tomato', 'cucumber'],
    5: ['tomato', 'cucumber', 'zucchini', 'corn', 'berry'],
    6: ['tomato', 'corn', 'zucchini', 'peach', 'berry'],
    7: ['tomato', 'corn', 'pepper', 'peach', 'plum'],
    8: ['apple', 'pear', 'pumpkin', 'squash', 'mushroom'],
    9: ['pumpkin', 'squash', 'sweet potato', 'pear', 'apple'],
    10: ['kale', 'sweet potato', 'cabbage', 'carrot', 'citrus'],
    11: ['citrus', 'kale', 'cabbage', 'carrot', 'pear']
  },
  'Southeast Asia': {
    0: ['pineapple', 'papaya', 'spinach', 'cabbage', 'carrot'],
    1: ['pineapple', 'papaya', 'cucumber', 'spinach', 'okra'],
    2: ['mango', 'pineapple', 'cucumber', 'okra', 'eggplant'],
    3: ['mango', 'papaya', 'cucumber', 'eggplant', 'mint'],
    4: ['mango', 'banana', 'okra', 'eggplant', 'spinach'],
    5: ['mango', 'banana', 'corn', 'cucumber', 'tomato'],
    6: ['banana', 'corn', 'tomato', 'cucumber', 'papaya'],
    7: ['banana', 'papaya', 'tomato', 'eggplant', 'okra'],
    8: ['dragon fruit', 'pineapple', 'okra', 'eggplant', 'spinach'],
    9: ['guava', 'pineapple', 'spinach', 'cabbage', 'carrot'],
    10: ['guava', 'pineapple', 'spinach', 'cabbage', 'okra'],
    11: ['pineapple', 'papaya', 'spinach', 'cabbage', 'carrot']
  }
};

export const detectUserRegion = () => {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale || navigator.language || '';
  const region = locale.split('-')[1] || '';
  const code = region.toUpperCase();

  switch (code) {
    case 'PK':
    case 'IN':
    case 'BD':
    case 'LK':
      return 'Pakistan/South Asia';
    case 'GB':
    case 'IE':
    case 'FR':
    case 'DE':
    case 'IT':
    case 'ES':
    case 'NL':
    case 'SE':
    case 'NO':
    case 'DK':
      return 'UK/Europe';
    case 'AE':
    case 'SA':
    case 'QA':
    case 'KW':
    case 'OM':
    case 'BH':
      return 'UAE/Gulf';
    case 'MY':
    case 'ID':
    case 'SG':
    case 'TH':
    case 'PH':
      return 'Southeast Asia';
    case 'US':
    case 'CA':
    default:
      return 'North America';
  }
};

export const getSeasonalIngredients = (region, month = new Date().getMonth()) => {
  const data = SEASONAL_MAP[region] || SEASONAL_MAP['North America'];
  return data?.[month] || [];
};

export const isIngredientInSeason = (ingredient, region, month = new Date().getMonth()) => {
  const list = getSeasonalIngredients(region, month);
  const text = String(ingredient || '').toLowerCase();
  return list.some((item) => text.includes(String(item).toLowerCase()));
};
