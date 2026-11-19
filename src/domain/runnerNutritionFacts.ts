export interface RunnerFact { id: string; title: string; body: string; sourceLabel: string; sourceUrl: string }

// General sports-science ranges from published research, kept as cited ranges rather than
// invented personalized numbers. Not medical advice.
export const runnerNutritionFacts: RunnerFact[] = [
  { id: 'carbs-per-hour', title: 'Carbs per hour of running',
    body: 'Research commonly cites about 30–90 g of carbs per hour, depending on run length and intensity. Marathoners who hit 60–90 g/hour were more likely to finish under 3 hours.',
    sourceLabel: 'Nutritional Intake and Timing of Marathon Runners (PMC, 2025)', sourceUrl: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11911277/' },
  { id: 'caffeine-timing', title: 'Caffeine before a run',
    body: 'A common effective dose is about 3–6 mg of caffeine per kg of body weight, roughly an hour before training. Responses vary, and smaller doses every 1–2 hours may also help.',
    sourceLabel: 'Caffeine and endurance research (review summary, 2025)', sourceUrl: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9890150/' },
  { id: 'hydration', title: 'Drinking during a run',
    body: 'The goal is to replace some of the fluid lost to sweat, not all of it — drinking too little or too much can both hurt performance. Real-world monitoring measured about 466±279 ml per hour, at the low end of the recommended range.',
    sourceLabel: 'Real-Time Observations of Food and Fluid Timing (Ultramarathon, PMC)', sourceUrl: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5946582/' },
];
