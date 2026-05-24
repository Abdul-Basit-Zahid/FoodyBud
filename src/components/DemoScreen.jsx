import React from 'react';
import ChaosBoxIntake from './ChaosBoxIntake';
import FridgeToPlate from './FridgeToPlate';
import GeneralistCustomRoute from './GeneralistCustomRoute';
import HomeGroupVotingCanvas from './HomeGroupVotingCanvas';
import KitchenModeDetailView from './KitchenModeDetailView';
import MacrosChefMealPlanChef from './MacrosChefMealPlanChef';
import NutritionStreaksGoals from './NutritionStreaksGoals';
import PanicSwapEngine from './PanicSwapEngine';
import RecipeRemixTracker from './RecipeRemixTracker';
import RegionalMarketPricingEstimator from './RegionalMarketPricingEstimator';
import ServingScalerConverter from './ServingScalerConverter';

export default function DemoScreen() {
  return (
    <div className="container py-8 space-y-8 screen-enter pb-24">
      <div className="card">
        <p className="text-xs uppercase tracking-[0.3em] text-text-tertiary font-bold">Demo Hub</p>
        <h1 className="text-3xl font-display font-black text-text-primary mt-2">FoodyBud Feature Lab</h1>
        <p className="text-sm text-text-secondary mt-2">All experimental modules in one place.</p>
      </div>

      <section id="home-group-voting">
        <HomeGroupVotingCanvas />
      </section>
      <section id="market-pricing">
        <RegionalMarketPricingEstimator />
      </section>
      <section id="kitchen-mode">
        <KitchenModeDetailView />
      </section>
      <section id="chaos-box">
        <ChaosBoxIntake />
      </section>
      <section id="fridge-to-plate">
        <FridgeToPlate />
      </section>
      <section id="panic-swap">
        <PanicSwapEngine />
      </section>
      <section id="serving-scaler">
        <ServingScalerConverter />
      </section>
      <section id="nutrition-streaks">
        <NutritionStreaksGoals />
      </section>
      <section id="macroschef">
        <MacrosChefMealPlanChef />
      </section>
      <section id="recipe-remix">
        <RecipeRemixTracker />
      </section>
      <section id="generalist-route">
        <GeneralistCustomRoute />
      </section>
    </div>
  );
}
