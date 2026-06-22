export const DEFAULT_USER_STATE = {
  isPremium: false,
  generationsThisWeek: 2,
  maxFreeGenerations: 3
};

export const getMockUserState = () => {
  const stored = localStorage.getItem('foodybud_user_state');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {}
  }
  localStorage.setItem('foodybud_user_state', JSON.stringify(DEFAULT_USER_STATE));
  return DEFAULT_USER_STATE;
};

export const saveMockUserState = (state) => {
  localStorage.setItem('foodybud_user_state', JSON.stringify(state));
  window.dispatchEvent(new CustomEvent('foodybud-user-state-update'));
};

export const checkAccess = (featureName, userState) => {
  const state = userState || getMockUserState();
  
  if (state.isPremium) {
    return true;
  }
  
  // Premium features
  const premiumFeatures = ['halalifyEngine', 'nutritionistChat', 'splitCart', 'fastingMode'];
  if (premiumFeatures.includes(featureName)) {
    return false;
  }
  
  // Free features
  if (featureName === 'fridgeToPlate') {
    return state.generationsThisWeek < state.maxFreeGenerations;
  }
  
  if (featureName === 'groceryList') {
    return true;
  }
  
  return false;
};

export const getPricing = async () => {
  return { price: '$4.99', currency: 'USD', period: 'month' };
};
