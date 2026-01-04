import { authFetch } from './auth';

// ============================================
// Types
// ============================================

export enum MealType {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack',
}

export interface Nutrients {
  sodium?: number;      // mg
  potassium?: number;   // mg
  phosphorus?: number;  // mg
  protein?: number;     // g
  calories?: number;
}

export interface Meal {
  _id: string;
  userId: string;
  mealType: MealType;
  name: string;
  description?: string;
  nutrients: Nutrients;
  servingSize?: string;
  imageUrl?: string;
  aiAnalyzed?: boolean;
  loggedAt: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Daily limits for renal diet
export const DAILY_LIMITS = {
  sodium: 2000,      // mg
  potassium: 2500,   // mg
  phosphorus: 1000,  // mg
  protein: 50,       // g
} as const;

// Input types
export interface CreateMealInput {
  mealType: MealType;
  name: string;
  description?: string;
  nutrients?: Nutrients;
  servingSize?: string;
  imageUrl?: string;
  loggedAt?: string;
  notes?: string;
}

export interface UpdateMealInput {
  mealType?: MealType;
  name?: string;
  description?: string;
  nutrients?: Partial<Nutrients>;
  servingSize?: string;
  imageUrl?: string;
  loggedAt?: string;
  notes?: string;
}

export interface GetMealsParams {
  from?: string;
  to?: string;
  mealType?: MealType;
  limit?: number;
  offset?: number;
}

// Response types
export interface MealsResponse {
  meals: Meal[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface DailyTotals {
  sodium: number;
  potassium: number;
  phosphorus: number;
  protein: number;
  calories: number;
}

export interface DailyLimits {
  sodium: number;
  potassium: number;
  phosphorus: number;
  protein: number;
}

export interface PercentOfLimit {
  sodium: number;
  potassium: number;
  phosphorus: number;
  protein: number;
}

export interface MealsByType {
  breakfast: Meal[];
  lunch: Meal[];
  dinner: Meal[];
  snack: Meal[];
}

export interface TodayMealsResponse {
  date: string;
  totalMeals: number;
  totals: DailyTotals;
  dailyLimits: DailyLimits;
  percentOfLimit: PercentOfLimit;
  mealsByType: MealsByType;
  meals: Meal[];
}

export interface DailyBreakdownEntry {
  sodium: number;
  potassium: number;
  phosphorus: number;
  protein: number;
  calories: number;
  mealCount: number;
}

export interface DaysOverLimit {
  sodium: number;
  potassium: number;
  phosphorus: number;
}

export interface NutrientSummary {
  period: string;
  daysWithData: number;
  totalMeals: number;
  dailyAverages: DailyTotals;
  dailyLimits: DailyLimits;
  daysOverLimit: DaysOverLimit;
  dailyBreakdown: Record<string, DailyBreakdownEntry>;
}

// ============================================
// AI Analysis Types
// ============================================

export interface AnalyzeMealInput {
  image?: string;      // base64 string
  imageUrl?: string;   // URL to image
  mimeType?: string;   // e.g., 'image/jpeg'
}

export interface NutrientEstimate {
  sodium: number;
  potassium: number;
  phosphorus: number;
  protein: number;
  calories: number;
}

export interface MealAnalysisResult {
  foodItems: string[];
  estimatedNutrients: NutrientEstimate;
  warnings: string[];
  recommendations: string[];
  confidence: number;
}

// ============================================
// Reference Data Types
// ============================================

export interface DietGuideline {
  limit: string;
  tips: string[];
}

export interface DietReferenceResponse {
  dailyLimits: DailyLimits;
  highRiskFoods: HighRiskFood[];
  kidneyFriendlyFoods: KidneyFriendlyFood[];
  guidelines: {
    potassium: DietGuideline;
    sodium: DietGuideline;
    phosphorus: DietGuideline;
  };
}

export interface HighRiskFood {
  name: string;
  category: string;
  nutrient: string;
  amount: string;
}

export interface KidneyFriendlyFood {
  name: string;
  category: string;
  benefits: string;
}

// ============================================
// Meal CRUD
// ============================================

/**
 * Log a new meal with nutrients
 * POST /api/v1/nutri-audit/meals
 *
 * @example
 * await createMeal({
 *   mealType: MealType.LUNCH,
 *   name: 'Grilled Chicken Breast',
 *   nutrients: {
 *     sodium: 150,
 *     potassium: 350,
 *     phosphorus: 200,
 *     protein: 30
 *   },
 *   servingSize: '4 oz'
 * });
 */
export async function createMeal(data: CreateMealInput): Promise<Meal> {
  const result = await authFetch('/nutri-audit/meals', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data.meal;
}

/**
 * List meals with optional filters
 * GET /api/v1/nutri-audit/meals
 *
 * @param params - Filter options
 * @param params.from - Start date (ISO string)
 * @param params.to - End date (ISO string)
 * @param params.mealType - Filter by meal type
 * @param params.limit - Max results (default 50)
 * @param params.offset - Pagination offset
 */
export async function getMeals(params: GetMealsParams = {}): Promise<MealsResponse> {
  const searchParams = new URLSearchParams();

  if (params.from) searchParams.append('from', params.from);
  if (params.to) searchParams.append('to', params.to);
  if (params.mealType) searchParams.append('mealType', params.mealType);
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.offset) searchParams.append('offset', params.offset.toString());

  const queryString = searchParams.toString();
  const endpoint = queryString ? `/nutri-audit/meals?${queryString}` : '/nutri-audit/meals';

  const result = await authFetch(endpoint);
  return {
    meals: result.data.meals,
    pagination: result.meta?.pagination,
  };
}

/**
 * Get a specific meal by ID
 * GET /api/v1/nutri-audit/meals/:mealId
 */
export async function getMeal(mealId: string): Promise<Meal> {
  const result = await authFetch(`/nutri-audit/meals/${mealId}`);
  return result.data.meal;
}

/**
 * Update a meal
 * PATCH /api/v1/nutri-audit/meals/:mealId
 */
export async function updateMeal(mealId: string, data: UpdateMealInput): Promise<Meal> {
  const result = await authFetch(`/nutri-audit/meals/${mealId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return result.data.meal;
}

/**
 * Delete a meal
 * DELETE /api/v1/nutri-audit/meals/:mealId
 */
export async function deleteMeal(mealId: string): Promise<void> {
  await authFetch(`/nutri-audit/meals/${mealId}`, {
    method: 'DELETE',
  });
}

// ============================================
// Today & Summary Endpoints
// ============================================

/**
 * Get today's meals with daily totals and limit percentages
 * GET /api/v1/nutri-audit/meals/today
 *
 * Returns:
 * - All meals grouped by type
 * - Daily totals for each nutrient
 * - Percentage of daily limits consumed
 */
export async function getTodayMeals(): Promise<TodayMealsResponse> {
  const result = await authFetch('/nutri-audit/meals/today');
  return result.data;
}

/**
 * Get nutrient summary over a period
 * GET /api/v1/nutri-audit/meals/summary?days=7
 *
 * @param days - Number of days to include (default 7, max 90)
 * @returns Daily averages, days over limit, and daily breakdown
 */
export async function getNutrientSummary(days: number = 7): Promise<NutrientSummary> {
  const result = await authFetch(`/nutri-audit/meals/summary?days=${days}`);
  return result.data;
}

// ============================================
// AI Analysis Endpoints
// ============================================

/**
 * Analyze a meal image for renal diet compliance
 * POST /api/v1/nutri-audit/analyze
 *
 * Requires Basic plan or higher. Uses AI usage limit.
 *
 * @param data - Either base64 image or image URL
 * @returns Analysis with nutrient estimates, warnings, recommendations
 */
export async function analyzeMeal(data: AnalyzeMealInput): Promise<MealAnalysisResult> {
  const result = await authFetch('/nutri-audit/analyze', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data;
}

/**
 * Analyze meal from base64 image
 */
export async function analyzeMealImage(
  base64Image: string,
  mimeType: string = 'image/jpeg'
): Promise<MealAnalysisResult> {
  return analyzeMeal({ image: base64Image, mimeType });
}

/**
 * Analyze meal from URL
 */
export async function analyzeMealFromUrl(imageUrl: string): Promise<MealAnalysisResult> {
  return analyzeMeal({ imageUrl });
}

// ============================================
// Reference Data Endpoints
// ============================================

/**
 * Get renal diet reference information
 * GET /api/v1/nutri-audit/reference
 *
 * Returns daily limits, guidelines, and food lists
 */
export async function getDietReference(): Promise<DietReferenceResponse> {
  const result = await authFetch('/nutri-audit/reference');
  return result.data;
}

/**
 * Get list of high-risk foods for renal patients
 * GET /api/v1/nutri-audit/high-risk-foods
 */
export async function getHighRiskFoods(): Promise<HighRiskFood[]> {
  const result = await authFetch('/nutri-audit/high-risk-foods');
  return result.data;
}

/**
 * Get list of kidney-friendly foods
 * GET /api/v1/nutri-audit/kidney-friendly-foods
 */
export async function getKidneyFriendlyFoods(): Promise<KidneyFriendlyFood[]> {
  const result = await authFetch('/nutri-audit/kidney-friendly-foods');
  return result.data;
}

// ============================================
// Text-based Food Analysis (with DB caching)
// ============================================

export interface NutrientLevel {
  amount: number;
  unit: string;
  level: 'low' | 'moderate' | 'high' | 'very_high';
  dailyLimitPercent: number;
  warning?: string;
}

export interface FoodItem {
  name: string;
  portion: string;
  potassium: NutrientLevel;
  sodium: NutrientLevel;
  phosphorus: NutrientLevel;
  protein: NutrientLevel;
  renalRisk: 'safe' | 'caution' | 'avoid';
  notes?: string;
}

export interface NutriAuditResult {
  success: boolean;
  mealDescription: string;
  overallRisk: 'safe' | 'caution' | 'high_risk';
  foods: FoodItem[];
  totals: {
    potassium: NutrientLevel;
    sodium: NutrientLevel;
    phosphorus: NutrientLevel;
    protein: NutrientLevel;
  };
  recommendations: string[];
  alternatives: string[];
  disclaimer: string;
  fromCache?: boolean;
}

export interface CachedFood {
  _id: string;
  name: string;
  normalizedName: string;
  portion: string;
  potassium: NutrientLevel;
  sodium: NutrientLevel;
  phosphorus: NutrientLevel;
  protein?: NutrientLevel;
  renalRisk: 'safe' | 'caution' | 'avoid';
  notes?: string;
  source: 'openai' | 'manual' | 'usda';
  searchCount: number;
  lastSearchedAt: string;
  createdAt: string;
}

/**
 * Analyze food by text description (with DB caching)
 * POST /api/v1/nutri-audit/analyze-text
 *
 * If the food has been analyzed before, returns cached result from DB.
 * Otherwise, analyzes with AI and caches the result.
 */
export async function analyzeFoodByText(foodName: string): Promise<NutriAuditResult> {
  const result = await authFetch('/nutri-audit/analyze-text', {
    method: 'POST',
    body: JSON.stringify({ foodName }),
  });
  return result.data;
}

/**
 * Search cached foods in database
 * GET /api/v1/nutri-audit/search?q=banana&limit=10
 *
 * Searches the cached food database (no AI call).
 * Returns previously analyzed foods that match the query.
 */
export async function searchCachedFoods(query: string, limit: number = 10): Promise<{
  foods: CachedFood[];
  count: number;
}> {
  const result = await authFetch(`/nutri-audit/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  return result.data;
}

// ============================================
// Convenience Functions
// ============================================

/**
 * Quick log a meal with basic info
 */
export async function quickLogMeal(
  mealType: MealType,
  name: string,
  nutrients?: Nutrients,
  options?: { servingSize?: string; notes?: string; description?: string }
): Promise<Meal> {
  return createMeal({
    mealType,
    name,
    nutrients,
    ...options,
  });
}

/**
 * Get remaining daily allowances based on today's totals
 */
export async function getRemainingAllowances(): Promise<{
  sodium: number;
  potassium: number;
  phosphorus: number;
  protein: number;
}> {
  const today = await getTodayMeals();
  return {
    sodium: Math.max(0, today.dailyLimits.sodium - today.totals.sodium),
    potassium: Math.max(0, today.dailyLimits.potassium - today.totals.potassium),
    phosphorus: Math.max(0, today.dailyLimits.phosphorus - today.totals.phosphorus),
    protein: Math.max(0, today.dailyLimits.protein - today.totals.protein),
  };
}

/**
 * Check if a nutrient is over the daily limit
 */
export function isOverLimit(nutrient: keyof typeof DAILY_LIMITS, amount: number): boolean {
  return amount > DAILY_LIMITS[nutrient];
}

/**
 * Get percentage of daily limit for a nutrient
 */
export function getPercentOfLimit(nutrient: keyof typeof DAILY_LIMITS, amount: number): number {
  return Math.round((amount / DAILY_LIMITS[nutrient]) * 100);
}

/**
 * Get text color based on percentage of daily limit
 */
export function getLimitColor(percent: number): string {
  if (percent >= 100) return 'text-rose-500';
  if (percent >= 80) return 'text-amber-500';
  if (percent >= 60) return 'text-yellow-500';
  return 'text-emerald-500';
}

/**
 * Get background color based on percentage of daily limit
 */
export function getLimitBgColor(percent: number): string {
  if (percent >= 100) return 'bg-rose-500';
  if (percent >= 80) return 'bg-amber-500';
  if (percent >= 60) return 'bg-yellow-500';
  return 'bg-emerald-500';
}

/**
 * Get progress bar color based on percentage of daily limit
 */
export function getLimitProgressColor(percent: number): string {
  if (percent >= 100) return 'bg-gradient-to-r from-rose-500 to-rose-400';
  if (percent >= 80) return 'bg-gradient-to-r from-amber-500 to-amber-400';
  if (percent >= 60) return 'bg-gradient-to-r from-yellow-500 to-yellow-400';
  return 'bg-gradient-to-r from-emerald-500 to-emerald-400';
}

/**
 * Format nutrient value with unit
 */
export function formatNutrient(
  nutrient: keyof Nutrients,
  value: number | undefined
): string {
  if (value === undefined || value === null) return '--';

  switch (nutrient) {
    case 'sodium':
    case 'potassium':
    case 'phosphorus':
      return `${Math.round(value)}mg`;
    case 'protein':
      return `${Math.round(value)}g`;
    case 'calories':
      return `${Math.round(value)} cal`;
    default:
      return `${value}`;
  }
}

/**
 * Get meals by type for a specific day
 */
export async function getMealsByType(date?: string): Promise<MealsByType> {
  const params: GetMealsParams = {};

  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    params.from = startOfDay.toISOString();
    params.to = endOfDay.toISOString();
  }

  const { meals } = await getMeals(params);

  return {
    breakfast: meals.filter(m => m.mealType === MealType.BREAKFAST),
    lunch: meals.filter(m => m.mealType === MealType.LUNCH),
    dinner: meals.filter(m => m.mealType === MealType.DINNER),
    snack: meals.filter(m => m.mealType === MealType.SNACK),
  };
}

/**
 * Get meal type icon emoji
 */
export function getMealTypeIcon(mealType: MealType): string {
  switch (mealType) {
    case MealType.BREAKFAST:
      return '🌅';
    case MealType.LUNCH:
      return '☀️';
    case MealType.DINNER:
      return '🌙';
    case MealType.SNACK:
      return '🍎';
    default:
      return '🍽️';
  }
}

/**
 * Get meal type display name
 */
export function getMealTypeName(mealType: MealType): string {
  return mealType.charAt(0).toUpperCase() + mealType.slice(1);
}
