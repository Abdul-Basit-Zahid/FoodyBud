import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Mic } from 'lucide-react';

const STEPS = [
  'Preheat the pan and toast spices until fragrant.',
  'Sear the protein until golden on both sides.',
  'Build the sauce and simmer until glossy.',
  'Finish with fresh herbs and serve hot.',
];

export default function KitchenModeDetailView() {
  const [currentStep, setCurrentStep] = useState(0);
  const [wakeLockStatus, setWakeLockStatus] = useState('idle');
  const [isActive, setIsActive] = useState(true);

  const totalSteps = STEPS.length;
  const activeStep = STEPS[currentStep] || '';

  useEffect(() => {
    let wakeLock;
    const requestWakeLock = async () => {
      try {
        if (!isActive || !('wakeLock' in navigator)) return;
        wakeLock = await navigator.wakeLock.request('screen');
        setWakeLockStatus('active');
        wakeLock.addEventListener('release', () => setWakeLockStatus('released'));
      } catch {
        setWakeLockStatus('blocked');
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock) {
        wakeLock.release();
      }
    };
  }, [isActive]);

  const goNext = () => setCurrentStep((value) => Math.min(totalSteps - 1, value + 1));
  const goPrev = () => setCurrentStep((value) => Math.max(0, value - 1));

  const stepLabel = useMemo(() => String(currentStep + 1).padStart(2, '0'), [currentStep]);

  return (
    <section className="bg-base rounded-3xl border border-border-subtle p-6 md:p-10">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-text-tertiary font-bold">Kitchen Mode</p>
          <h2 className="text-2xl md:text-3xl font-display font-black text-text-primary">Hands-Free Cooking</h2>
          <p className="text-sm text-text-secondary">
            Wake Lock: <span className="text-brand font-mono">{wakeLockStatus}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsActive((value) => !value)}
          className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
        >
          {isActive ? 'Keep Screen Awake' : 'Allow Sleep'}
        </button>
      </div>

      <div className="bg-surface rounded-3xl border border-border-subtle p-6 md:p-10">
        <div key={currentStep} className="animate-slide-up">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border-subtle flex items-center justify-center">
              <span className="text-3xl font-mono font-black text-brand">{stepLabel}</span>
            </div>
            <div>
              <p className="text-sm text-text-tertiary uppercase tracking-[0.2em] font-bold">Active Step</p>
              <p className="text-lg md:text-2xl font-sans font-semibold text-text-primary leading-relaxed">
                {activeStep}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-3 flex-wrap">
          <button type="button" onClick={goPrev} className="btn btn-secondary flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <button type="button" className="btn btn-ghost flex items-center gap-2">
            <Mic className="w-4 h-4" /> Voice Control
          </button>
          <button type="button" onClick={goNext} className="btn btn-primary flex items-center gap-2">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
