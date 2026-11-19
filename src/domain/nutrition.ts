import { MealEntry, NutritionTarget } from './types';

export const macroKeys = ['protein', 'fat', 'carbs'] as const;
export const macroLabels = { protein: 'Protein', fat: 'Fat', carbs: 'Carbs' };
export const energyFactors = { protein: 4, fat: 9, carbs: 4 };
export function summarizeMeals(entries: MealEntry[], target: NutritionTarget | null) {
  const totals = { calories: 0, protein: 0, fat: 0, carbs: 0 };
  const missing = { calories: false, protein: false, fat: false, carbs: false };
  for (const entry of entries) for (const key of ['calories', ...macroKeys] as const) {
    if (entry[key] === null) missing[key] = true; else totals[key] += entry[key];
  }
  const remaining = target && !missing.calories ? target.calories - totals.calories : null;
  const macros = macroKeys.map(key => ({ key, grams: totals[key], partial: missing[key], target: target?.[key] ?? null,
    progressPercent: target && !missing[key] ? totals[key] / target[key] * 100 : null,
    eatenEnergyPercent: !missing[key] && !missing.calories && totals.calories > 0 ? totals[key] * energyFactors[key] / totals.calories * 100 : null,
    plannedEnergyPercent: target ? target[key] * energyFactors[key] / target.calories * 100 : null }));
  return { totals, missing, remaining, macros, partial: Object.values(missing).some(Boolean), count: entries.length };
}
