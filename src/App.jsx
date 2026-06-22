import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import InputScreen from './components/InputScreen';
import HomeScreen from './components/HomeScreen';
import ResultsScreen from './components/ResultsScreen';
import HistoryScreen from './components/HistoryScreen';
import ProfileScreen from './components/ProfileScreen';
import VotingScreen from './components/VotingScreen';
import PlannerScreen from './components/PlannerScreen';
import SmartCartModal from './components/SmartCartModal';
import UpgradeModal from './components/UpgradeModal';
import { logMoodSearch, clearImageSession } from './services/foodybud';
import { getCartCount } from './services/groceryCart';
import { getMockUserState } from './services/freemium';
import { ShieldCheck } from 'lucide-react';



function AppContent() {
  const [showCart, setShowCart] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [showUpgradeNav, setShowUpgradeNav] = useState(false);
  const [userState, setUserState] = useState(getMockUserState());
  
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    const savedTheme = window.localStorage.getItem('foodyBud_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem('foodyBud_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (location.pathname === '/') {
      clearImageSession();
    }
  }, [location.pathname]);

  useEffect(() => {
    const updateCart = () => setCartCount(getCartCount());
    updateCart();
    window.addEventListener('foodybud-cart-update', updateCart);
    return () => window.removeEventListener('foodybud-cart-update', updateCart);
  }, []);

  useEffect(() => {
    const handleStateUpdate = () => {
      setUserState(getMockUserState());
    };
    window.addEventListener('foodybud-user-state-update', handleStateUpdate);
    return () => window.removeEventListener('foodybud-user-state-update', handleStateUpdate);
  }, []);

  const handleSearch = (searchParams) => {
    logMoodSearch({ mood: searchParams?.mood, cuisine: searchParams?.cuisine });
    return true;
  };

  const navItems = [
    { path: '/profile?tab=pantry', label: 'Pantry (Free)', icon: '🧺' },
    { path: '/planner', label: 'Meal Planner', icon: '▦' },
    { action: () => setShowCart(true), label: 'Split-Cart', icon: '🛒' },
    { action: () => setShowUpgradeNav(true), label: 'Upgrade ($4.99)', icon: '⚡' },
  ];

  return (
    <div className="min-h-screen bg-base text-text-primary font-sans flex flex-col relative overflow-x-hidden app-wrapper">

      <header className="sticky top-0 z-40 border-b border-border-subtle bg-overlay/90 backdrop-blur-xl">
        <div className="container py-4">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              className="flex items-center gap-3 text-left"
              onClick={() => navigate('/')}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-text-inverse shadow-brand" style={{ background: 'var(--gradient-brand)' }}>
                <span className="font-display text-xl leading-none">🍴</span>
              </div>
              <div>
                <div className="font-display text-2xl font-semibold tracking-tight text-text-primary">FoodyBud</div>
                <div className="text-xs uppercase tracking-[0.35em] text-text-tertiary">Halal Diaspora Meal Planner</div>
              </div>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                style={{
                  width: '44px',
                  height: '26px',
                  borderRadius: 'var(--radius-full)',
                  background: theme === 'dark' ? 'var(--gradient-brand)' : 'var(--border-default)',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'var(--transition-base)'
                }}
              >
                <span style={{
                  position: 'absolute',
                  top: '3px',
                  left: theme === 'dark' ? '21px' : '3px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'white',
                  transition: 'var(--transition-spring)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px'
                }}>
                  {theme === 'dark' ? '🌙' : '☀️'}
                </span>
              </button>
              
              <button onClick={() => navigate('/profile?tab=pantry')} className="btn btn-secondary btn-sm hidden md:inline-flex">
                Pantry (Free)
              </button>
              <button onClick={() => navigate('/planner')} className="btn btn-secondary btn-sm hidden md:inline-flex">
                Meal Planner
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm relative hidden md:inline-flex"
                onClick={() => setShowCart(true)}
              >
                🛒 Split-Cart
                {cartCount > 0 ? (
                  <span className="absolute -top-2 -right-2 bg-success text-text-inverse text-xs rounded-full px-2 py-0.5">
                    {cartCount}
                  </span>
                ) : null}
              </button>
              <button onClick={() => setShowUpgradeNav(true)} className="btn btn-primary btn-sm hidden md:inline-flex gap-1 items-center">
                ⚡ Upgrade ($4.99)
              </button>
              
              {/* Mobile cart trigger indicator */}
              <button
                type="button"
                className="btn btn-secondary btn-sm md:hidden relative"
                onClick={() => setShowCart(true)}
              >
                🛒
                {cartCount > 0 ? (
                  <span className="absolute -top-2 -right-2 bg-success text-text-inverse text-xs rounded-full px-2 py-0.5">
                    {cartCount}
                  </span>
                ) : null}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto pb-24 md:pb-8">
        {new URLSearchParams(location.search).get('vote') ? (
          <VotingScreen />
        ) : null}
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/search" element={<InputScreen onSearch={handleSearch} />} />
          <Route path="/results" element={<ResultsScreen />} />
          <Route path="/history" element={<HistoryScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/planner" element={<PlannerScreen />} />
        </Routes>
      </main>

      <nav className="bottom-nav">
        {navItems.map((item) => {
          const active = item.path ? (item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path.split('?')[0])) : false;
          return (
            <button
              key={item.label}
              type="button"
              className={`nav-item ${active ? 'active' : ''}`}
              onClick={() => {
                if (item.action) item.action();
                else navigate(item.path);
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {showCart ? (
        <SmartCartModal onClose={() => setShowCart(false)} />
      ) : null}

      {showUpgradeNav ? (
        <UpgradeModal onClose={() => setShowUpgradeNav(false)} />
      ) : null}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
