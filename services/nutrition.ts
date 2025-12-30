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
  nutrients: Nutrients;
  servingSize?: string;
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
} as const;

// Input types
export interface CreateMealInput {
  mealType: MealType;
  name: string;
  nutrients: Nutrients;
  servingSize?: string;
  loggedAt?: string;
  notes?: string;
}

export interface UpdateMealInput {
  mealType?: MealType;
  name?: string;
  nutrients?: Partial<Nutrients>;
  servingSize?: string;
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

export interface DailyPercentages {
  sodium: number;
  potassium: number;
  phosphorus: number;
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
  meals: Meal[];
  mealsByType: MealsByType;
  dailyTotals: DailyTotals;
  percentOfLimits: DailyPercentages;
}

export interface DailyBreakdown {
  date: string;
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
  days: number;
  dailyAverages: DailyTotals;
  daysOverLimit: DaysOverLimit;
  dailyBreakdown: DailyBreakdown[];
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
 * @param days - Number of days to include (default 7, max 30)
 * @returns Daily averages, days over limit, and daily breakdown
 */
export async function getNutrientSummary(days: number = 7): Promise<NutrientSummary> {
  const result = await authFetch(`/nutri-audit/meals/summary?days=${days}`);
  return result.data.summary;
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
  nutrients: Nutrients,
  options?: { servingSize?: string; notes?: string }
): Promise<Meal> {
  return createMeal({
    mealType,
    name,
    nutrients,
    ...options,
  });
}

/**
 * Get remaining daily allowances
 */
export async function getRemainingAllowances(): Promise<{
  sodium: number;
  potassium: number;
  phosphorus: number;
}> {
  const today = await getTodayMeals();
  return {
    sodium: Math.max(0, DAILY_LIMITS.sodium - today.dailyTotals.sodium),
    potassium: Math.max(0, DAILY_LIMITS.potassium - today.dailyTotals.potassium),
    phosphorus: Math.max(0, DAILY_LIMITS.phosphorus - today.dailyTotals.phosphorus),
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
 * Get color based on percentage of daily limit
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
 * Format nutrient value with unit
 */
export function formatNutrient(
  nutrient: keyof Nutrients,
  value: number | undefined
): string {
  if (value === undefined) return '--';

  switch (nutrient) {
    case 'sodium':
    case 'potassium':
    case 'phosphorus':
      return `${value}mg`;
    case 'protein':
      return `${value}g`;
    case 'calories':
      return `${value}`;
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
