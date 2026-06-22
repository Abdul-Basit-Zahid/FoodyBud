import React, { useMemo, useState, useEffect } from 'react';
import { clearCart, getCart, markBought, removeFromCart } from '../services/groceryCart';
import { categorizeIngredient } from './PlannerScreen';
import { getMockUserState, checkAccess } from '../services/freemium';
import UpgradeModal from './UpgradeModal';
import { Lock, ShoppingBag, Store } from 'lucide-react';

const isHalalEthnicItem = (itemName) => {
  const name = String(itemName || '').toLowerCase();
  const ethnicKeywords = [
    'halal', 'zabiha', 'kosher', 'meat', 'chicken', 'beef', 'mutton', 'lamb', 'sujuk',
    'masala', 'shan', 'tandoori', 'turmeric', 'cumin', 'coriander', 'lentils', 'daal',
    'ghee', 'agar', 'cardamom', 'clove', 'cinnamon', 'saffron', 'ginger', 'basmati',
    'pita', 'tahini', 'chickpeas', 'dates', 'rose water', 'korma', 'curry', 'rice'
  ];
  return ethnicKeywords.some(keyword => name.includes(keyword));
};

export default function SmartCartModal({ onClose }) {
  const [refreshToken, setRefreshToken] = useState(0);
  const items = useMemo(() => getCart(), [refreshToken]);
  const [copied, setCopied] = useState(false);
  const [userState, setUserState] = useState(getMockUserState());
  const [splitCartActive, setSplitCartActive] = useState(false);
  const [activeTab, setActiveTab] = useState('mainstream'); // 'mainstream' or 'halal'
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    const handleStateUpdate = () => {
      setUserState(getMockUserState());
    };
    window.addEventListener('foodybud-user-state-update', handleStateUpdate);
    return () => window.removeEventListener('foodybud-user-state-update', handleStateUpdate);
  }, []);

  const refresh = () => setRefreshToken((value) => value + 1);

  const handleToggleSplitCart = (e) => {
    const checked = e.target.checked;
    if (checked) {
      const hasAccess = checkAccess('splitCart', userState);
      if (!hasAccess) {
        setShowUpgradeModal(true);
        setSplitCartActive(false);
        return;
      }
    }
    setSplitCartActive(checked);
  };

  const mainstreamItems = useMemo(() => {
    return items.filter(item => !isHalalEthnicItem(item.item));
  }, [items]);

  const halalItems = useMemo(() => {
    return items.filter(item => isHalalEthnicItem(item.item));
  }, [items]);

  const activeItemsList = useMemo(() => {
    if (!splitCartActive) return items;
    return activeTab === 'mainstream' ? mainstreamItems : halalItems;
  }, [splitCartActive, activeTab, items, mainstreamItems, halalItems]);

  const grouped = useMemo(() => {
    return activeItemsList.reduce((acc, item) => {
      const category = categorizeIngredient(item.item || '');
      acc[category] = acc[category] || [];
      acc[category].push(item);
      return acc;
    }, {});
  }, [activeItemsList]);

  const copyToClipboard = () => {
    const listToCopy = splitCartActive 
      ? (activeTab === 'mainstream' ? mainstreamItems : halalItems) 
      : items;

    const lines = listToCopy.map((item) => `- ${item.item} ${item.quantity ? `(${item.quantity} ${item.unit || ''})` : ''}`.trim());
    const header = splitCartActive 
      ? `FoodyBud Split Cart - ${activeTab === 'mainstream' ? 'Mainstream Supermarket' : 'Halal & Ethnic Grocer'}`
      : 'FoodyBud Grocery List';

    const text = `${header}\n\n${lines.join('\n')}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-modal backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-3xl bg-surface text-text-primary rounded-3xl p-6 shadow-2xl border border-border-subtle animate-scale-in">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-border-subtle pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-text-tertiary font-bold">Diaspora Split-Cart</p>
            <h3 className="text-2xl font-black font-display mt-0.5">{items.length} Items Total</h3>
          </div>

          <div className="flex items-center gap-3">
            {/* Split Cart Toggle */}
            <div className="flex items-center gap-2 bg-surface-2 border border-border-subtle px-3 py-1.5 rounded-xl text-sm font-bold text-text-primary select-none">
              <input
                type="checkbox"
                id="splitCartToggle"
                checked={splitCartActive}
                onChange={handleToggleSplitCart}
                className="w-4 h-4 text-primary rounded focus:ring-primary border-border-subtle cursor-pointer"
              />
              <label htmlFor="splitCartToggle" className="flex items-center gap-1.5 cursor-pointer">
                🛒 Split by Store
                {!userState.isPremium && <Lock className="w-3.5 h-3.5 text-text-tertiary" />}
              </label>
            </div>
            
            <button onClick={onClose} className="text-text-tertiary hover:text-text-primary text-xl font-bold bg-surface-2 hover:bg-surface-3 p-1.5 rounded-full transition w-8 h-8 flex items-center justify-center">✕</button>
          </div>
        </div>

        {/* Store Tabs (rendered when Split-Cart is active) */}
        {splitCartActive && (
          <div className="flex gap-2 mb-4 bg-surface-2 p-1 rounded-2xl border border-border-subtle">
            <button
              onClick={() => setActiveTab('mainstream')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-base ${activeTab === 'mainstream' ? 'bg-surface text-text-brand shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
            >
              <ShoppingBag className="w-4 h-4" />
              Mainstream Supermarket ({mainstreamItems.length})
            </button>
            <button
              onClick={() => setActiveTab('halal')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-base ${activeTab === 'halal' ? 'bg-surface text-text-brand shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
            >
              <Store className="w-4 h-4" />
              Halal / Ethnic Grocer ({halalItems.length})
            </button>
          </div>
        )}

        {/* Items List */}
        {activeItemsList.length === 0 ? (
          <div className="text-sm text-text-tertiary py-8 text-center font-medium">
            {splitCartActive 
              ? `No items for this store type. Check the other tab!` 
              : 'Your cart is empty. Add ingredients from the planner.'}
          </div>
        ) : (
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
            {Object.entries(grouped).map(([category, list]) => (
              <div key={category}>
                <div className="text-xs uppercase tracking-[0.2em] text-text-tertiary font-bold mb-2">{category}</div>
                <div className="grid gap-2">
                  {list.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-surface-2 p-3 hover:shadow-card-hover transition-base">
                      <button
                        onClick={() => { markBought(item.id); refresh(); }}
                        className={`w-6 h-6 rounded-full border flex items-center justify-center transition-base ${item.bought ? 'bg-success text-text-inverse border-success' : 'border-border-strong bg-surface hover:border-text-secondary'}`}
                      >
                        {item.bought ? '✓' : ''}
                      </button>
                      <div className={`flex-1 text-sm font-semibold ${item.bought ? 'line-through text-text-tertiary' : 'text-text-primary'}`}>
                        {item.item}
                      </div>
                      {item.quantity ? <span className="badge badge-secondary">{item.quantity} {item.unit || ''}</span> : null}
                      <button onClick={() => { removeFromCart(item.id); refresh(); }} className="btn btn-ghost btn-sm text-xs hover:text-error">Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-6 flex flex-wrap gap-2 justify-between border-t border-border-subtle pt-4">
          <div className="flex flex-wrap gap-2">
            <button onClick={copyToClipboard} className="btn btn-primary">
              {copied ? '✓ Copied!' : '📋 Copy Tab List'}
            </button>
          </div>
          <button onClick={() => { clearCart(); refresh(); }} className="btn btn-secondary">Clear All List</button>
        </div>
      </div>

      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}
    </div>
  );
}
