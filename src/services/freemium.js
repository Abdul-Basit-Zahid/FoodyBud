export const checkUsageLimit = () => {
  const today = new Date().toISOString().split('T')[0];
  const usageStr = localStorage.getItem('foodyBud_usage') || localStorage.getItem('moodMealUsage');
  let usage = usageStr ? JSON.parse(usageStr) : { date: today, count: 0 };

  if (usage.date !== today) {
    usage = { date: today, count: 0 };
  }

  return usage;
};

export const incrementUsage = () => {
  const usage = checkUsageLimit();
  usage.count += 1;
  localStorage.setItem('foodyBud_usage', JSON.stringify(usage));
  return usage.count;
};

export const getPricing = async () => {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale || navigator.language || '';
  const region = locale.split('-')[1] || '';

  switch (region.toUpperCase()) {
    case 'PK': return { price: 'Rs. 299', currency: 'PKR', period: 'month' };
    case 'IN': return { price: '₹149', currency: 'INR', period: 'month' };
    case 'US':
    case 'GB':
    case 'DE':
    case 'FR':
    case 'IT':
    case 'ES':
    case 'NL':
    case 'CH':
    case 'SE':
    case 'NO':
    case 'DK':
    case 'FI': return { price: '$4.99', currency: 'USD', period: 'month' };
    case 'AE':
    case 'SA':
    case 'QA':
    case 'KW':
    case 'OM':
    case 'BH': return { price: '$3.49', currency: 'USD', period: 'month' };
    default: return { price: 'Rs. 299', currency: 'PKR', period: 'month' };
  }
};
