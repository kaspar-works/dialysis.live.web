// Configure which pages show "Coming Soon" overlay
// Set to true to enable coming soon mode for that page

export const underConstructionPages = {
  dashboard: true,
  login: true,
  register: true,
  sessions: false,
  vitals: false,
  fluidLog: false,
  weightLog: false,
  medications: false,
  nutriScan: false,
  reports: false,
  education: false,
  settings: false,
  profile: false,
  pricing: false,
  features: false,
  subscription: false,
} as const;

export type PageKey = keyof typeof underConstructionPages;

export const isUnderConstruction = (page: PageKey): boolean => {
  return underConstructionPages[page] ?? false;
};
