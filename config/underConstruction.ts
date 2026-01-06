/**
 * Under Construction / Coming Soon Configuration
 *
 * Configure which pages show "Coming Soon" or "Under Maintenance" overlays.
 * Can be controlled via environment variables for easy deployment control.
 */

export interface PageConfig {
  enabled: boolean;
  title?: string;
  message?: string;
  progress?: number; // 0-100
  expectedDate?: string; // e.g., "Q1 2025", "March 2025"
  mode?: 'coming-soon' | 'maintenance';
}

export interface UnderConstructionConfig {
  // Global maintenance mode - overrides all page settings
  globalMaintenance: boolean;
  globalMaintenanceMessage?: string;

  // Per-page configuration
  pages: Record<string, PageConfig>;
}

// Check environment variables for overrides
const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1';
};

// Default configuration
const defaultConfig: UnderConstructionConfig = {
  // Global maintenance mode (can be enabled via VITE_MAINTENANCE_MODE=true)
  globalMaintenance: getEnvBoolean('VITE_MAINTENANCE_MODE', false),
  globalMaintenanceMessage: import.meta.env.VITE_MAINTENANCE_MESSAGE ||
    'We are currently performing scheduled maintenance. Please check back soon.',

  pages: {
    // Public pages
    landing: { enabled: false },
    login: { enabled: false },
    register: { enabled: false },
    features: { enabled: false },
    pricing: { enabled: false },
    privacy: { enabled: false },
    terms: { enabled: false },

    // Dashboard pages
    dashboard: { enabled: false },
    sessions: { enabled: false },
    vitals: { enabled: false },
    symptoms: { enabled: false },
    fluidLog: { enabled: false },
    weightLog: { enabled: false },
    medications: { enabled: false },
    nutriScan: { enabled: false },
    labReports: { enabled: false },
    reports: { enabled: false },
    education: { enabled: false },
    reminders: { enabled: false },
    appointments: { enabled: false },
    settings: { enabled: false },
    profile: { enabled: false },
    subscription: { enabled: false },
  },
};

// Allow runtime configuration override
let currentConfig = { ...defaultConfig };

/**
 * Get the current configuration
 */
export const getConfig = (): UnderConstructionConfig => currentConfig;

/**
 * Update configuration at runtime
 * Useful for A/B testing or remote config
 */
export const updateConfig = (updates: Partial<UnderConstructionConfig>): void => {
  currentConfig = {
    ...currentConfig,
    ...updates,
    pages: {
      ...currentConfig.pages,
      ...(updates.pages || {}),
    },
  };
};

/**
 * Set a specific page's under construction status
 */
export const setPageStatus = (
  pageKey: string,
  config: Partial<PageConfig>
): void => {
  currentConfig.pages[pageKey] = {
    ...currentConfig.pages[pageKey],
    ...config,
  };
};

/**
 * Enable/disable global maintenance mode
 */
export const setMaintenanceMode = (
  enabled: boolean,
  message?: string
): void => {
  currentConfig.globalMaintenance = enabled;
  if (message) {
    currentConfig.globalMaintenanceMessage = message;
  }
};

/**
 * Check if a page is under construction or in maintenance
 */
export const isUnderConstruction = (pageKey: string): boolean => {
  // Global maintenance takes precedence
  if (currentConfig.globalMaintenance) {
    return true;
  }

  const pageConfig = currentConfig.pages[pageKey];
  return pageConfig?.enabled ?? false;
};

/**
 * Get page-specific configuration
 */
export const getPageConfig = (pageKey: string): PageConfig & { isGlobalMaintenance: boolean } => {
  const isGlobalMaintenance = currentConfig.globalMaintenance;

  if (isGlobalMaintenance) {
    return {
      enabled: true,
      mode: 'maintenance',
      message: currentConfig.globalMaintenanceMessage,
      isGlobalMaintenance: true,
    };
  }

  return {
    enabled: false,
    ...currentConfig.pages[pageKey],
    isGlobalMaintenance: false,
  };
};

// Legacy support - export page keys type
export type PageKey = keyof typeof defaultConfig.pages;

// Export for convenience
export const underConstructionPages = defaultConfig.pages;
