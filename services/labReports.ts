import { authFetch } from './auth';

// ============================================
// Lab Test Configuration
// ============================================

export enum LabTestCategory {
  KIDNEY_FUNCTION = 'kidney_function',
  ELECTROLYTES = 'electrolytes',
  BLOOD_COUNT = 'blood_count',
  IRON_STUDIES = 'iron_studies',
  DIALYSIS_ADEQUACY = 'dialysis_adequacy',
  OTHER = 'other',
}

export enum LabTestCode {
  // Kidney Function
  BUN = 'BUN',
  CREATININE = 'CREATININE',
  EGFR = 'EGFR',
  // Electrolytes
  POTASSIUM = 'POTASSIUM',
  SODIUM = 'SODIUM',
  PHOSPHORUS = 'PHOSPHORUS',
  CALCIUM = 'CALCIUM',
  BICARBONATE = 'BICARBONATE',
  // Blood Count
  HEMOGLOBIN = 'HEMOGLOBIN',
  HEMATOCRIT = 'HEMATOCRIT',
  WBC = 'WBC',
  PLATELETS = 'PLATELETS',
  // Iron Studies
  FERRITIN = 'FERRITIN',
  TSAT = 'TSAT',
  IRON = 'IRON',
  TIBC = 'TIBC',
  // Dialysis Adequacy
  KTV = 'KTV',
  URR = 'URR',
  // Other
  PTH = 'PTH',
  ALBUMIN = 'ALBUMIN',
  GLUCOSE = 'GLUCOSE',
  HBA1C = 'HBA1C',
  URIC_ACID = 'URIC_ACID',
  OTHER = 'OTHER',
}

// Lab test display configuration
export const LAB_TEST_CONFIG: Record<string, {
  name: string;
  unit: string;
  category: LabTestCategory;
  dialysisRange: { low: number; high: number };
  color: string;
  description: string;
}> = {
  [LabTestCode.BUN]: {
    name: 'BUN',
    unit: 'mg/dL',
    category: LabTestCategory.KIDNEY_FUNCTION,
    dialysisRange: { low: 20, high: 80 },
    color: 'purple',
    description: 'Blood Urea Nitrogen - measures kidney waste removal',
  },
  [LabTestCode.CREATININE]: {
    name: 'Creatinine',
    unit: 'mg/dL',
    category: LabTestCategory.KIDNEY_FUNCTION,
    dialysisRange: { low: 2, high: 15 },
    color: 'purple',
    description: 'Measures kidney filtration function',
  },
  [LabTestCode.EGFR]: {
    name: 'eGFR',
    unit: 'mL/min/1.73m²',
    category: LabTestCategory.KIDNEY_FUNCTION,
    dialysisRange: { low: 0, high: 15 },
    color: 'purple',
    description: 'Estimated Glomerular Filtration Rate',
  },
  [LabTestCode.POTASSIUM]: {
    name: 'Potassium',
    unit: 'mEq/L',
    category: LabTestCategory.ELECTROLYTES,
    dialysisRange: { low: 3.5, high: 5.5 },
    color: 'orange',
    description: 'Critical for heart and muscle function',
  },
  [LabTestCode.SODIUM]: {
    name: 'Sodium',
    unit: 'mEq/L',
    category: LabTestCategory.ELECTROLYTES,
    dialysisRange: { low: 135, high: 145 },
    color: 'blue',
    description: 'Fluid balance and nerve function',
  },
  [LabTestCode.PHOSPHORUS]: {
    name: 'Phosphorus',
    unit: 'mg/dL',
    category: LabTestCategory.ELECTROLYTES,
    dialysisRange: { low: 3.5, high: 5.5 },
    color: 'amber',
    description: 'Bone health and energy metabolism',
  },
  [LabTestCode.CALCIUM]: {
    name: 'Calcium',
    unit: 'mg/dL',
    category: LabTestCategory.ELECTROLYTES,
    dialysisRange: { low: 8.4, high: 10.2 },
    color: 'cyan',
    description: 'Bone health and muscle function',
  },
  [LabTestCode.BICARBONATE]: {
    name: 'Bicarbonate',
    unit: 'mEq/L',
    category: LabTestCategory.ELECTROLYTES,
    dialysisRange: { low: 22, high: 29 },
    color: 'teal',
    description: 'Blood pH balance',
  },
  [LabTestCode.HEMOGLOBIN]: {
    name: 'Hemoglobin',
    unit: 'g/dL',
    category: LabTestCategory.BLOOD_COUNT,
    dialysisRange: { low: 10.0, high: 12.0 },
    color: 'red',
    description: 'Oxygen-carrying capacity of blood',
  },
  [LabTestCode.HEMATOCRIT]: {
    name: 'Hematocrit',
    unit: '%',
    category: LabTestCategory.BLOOD_COUNT,
    dialysisRange: { low: 30, high: 36 },
    color: 'red',
    description: 'Percentage of red blood cells',
  },
  [LabTestCode.WBC]: {
    name: 'WBC',
    unit: 'K/uL',
    category: LabTestCategory.BLOOD_COUNT,
    dialysisRange: { low: 4.0, high: 11.0 },
    color: 'slate',
    description: 'White Blood Cells - immune function',
  },
  [LabTestCode.PLATELETS]: {
    name: 'Platelets',
    unit: 'K/uL',
    category: LabTestCategory.BLOOD_COUNT,
    dialysisRange: { low: 150, high: 400 },
    color: 'slate',
    description: 'Blood clotting function',
  },
  [LabTestCode.FERRITIN]: {
    name: 'Ferritin',
    unit: 'ng/mL',
    category: LabTestCategory.IRON_STUDIES,
    dialysisRange: { low: 200, high: 500 },
    color: 'emerald',
    description: 'Iron storage in the body',
  },
  [LabTestCode.TSAT]: {
    name: 'TSAT',
    unit: '%',
    category: LabTestCategory.IRON_STUDIES,
    dialysisRange: { low: 20, high: 50 },
    color: 'emerald',
    description: 'Transferrin Saturation - iron availability',
  },
  [LabTestCode.IRON]: {
    name: 'Iron',
    unit: 'mcg/dL',
    category: LabTestCategory.IRON_STUDIES,
    dialysisRange: { low: 50, high: 170 },
    color: 'emerald',
    description: 'Serum iron level',
  },
  [LabTestCode.TIBC]: {
    name: 'TIBC',
    unit: 'mcg/dL',
    category: LabTestCategory.IRON_STUDIES,
    dialysisRange: { low: 250, high: 370 },
    color: 'emerald',
    description: 'Total Iron Binding Capacity',
  },
  [LabTestCode.KTV]: {
    name: 'Kt/V',
    unit: '',
    category: LabTestCategory.DIALYSIS_ADEQUACY,
    dialysisRange: { low: 1.2, high: 2.0 },
    color: 'indigo',
    description: 'Dialysis adequacy measure',
  },
  [LabTestCode.URR]: {
    name: 'URR',
    unit: '%',
    category: LabTestCategory.DIALYSIS_ADEQUACY,
    dialysisRange: { low: 65, high: 100 },
    color: 'indigo',
    description: 'Urea Reduction Ratio',
  },
  [LabTestCode.PTH]: {
    name: 'PTH',
    unit: 'pg/mL',
    category: LabTestCategory.OTHER,
    dialysisRange: { low: 150, high: 600 },
    color: 'pink',
    description: 'Parathyroid Hormone - bone metabolism',
  },
  [LabTestCode.ALBUMIN]: {
    name: 'Albumin',
    unit: 'g/dL',
    category: LabTestCategory.OTHER,
    dialysisRange: { low: 3.5, high: 5.0 },
    color: 'violet',
    description: 'Nutritional status indicator',
  },
  [LabTestCode.GLUCOSE]: {
    name: 'Glucose',
    unit: 'mg/dL',
    category: LabTestCategory.OTHER,
    dialysisRange: { low: 70, high: 140 },
    color: 'yellow',
    description: 'Blood sugar level',
  },
  [LabTestCode.HBA1C]: {
    name: 'HbA1c',
    unit: '%',
    category: LabTestCategory.OTHER,
    dialysisRange: { low: 4.0, high: 7.0 },
    color: 'yellow',
    description: '3-month average blood sugar',
  },
  [LabTestCode.URIC_ACID]: {
    name: 'Uric Acid',
    unit: 'mg/dL',
    category: LabTestCategory.OTHER,
    dialysisRange: { low: 3.0, high: 8.0 },
    color: 'stone',
    description: 'Metabolic waste product',
  },
};

// Category display configuration
export const CATEGORY_CONFIG: Record<LabTestCategory, {
  name: string;
  description: string;
  color: string;
}> = {
  [LabTestCategory.KIDNEY_FUNCTION]: {
    name: 'Kidney Function',
    description: 'Tests measuring how well your kidneys filter waste',
    color: 'purple',
  },
  [LabTestCategory.ELECTROLYTES]: {
    name: 'Electrolytes',
    description: 'Minerals essential for body function',
    color: 'orange',
  },
  [LabTestCategory.BLOOD_COUNT]: {
    name: 'Blood Count',
    description: 'Red and white blood cell measurements',
    color: 'red',
  },
  [LabTestCategory.IRON_STUDIES]: {
    name: 'Iron Studies',
    description: 'Iron levels and storage',
    color: 'emerald',
  },
  [LabTestCategory.DIALYSIS_ADEQUACY]: {
    name: 'Dialysis Adequacy',
    description: 'How well dialysis is removing waste',
    color: 'indigo',
  },
  [LabTestCategory.OTHER]: {
    name: 'Other',
    description: 'Additional important tests',
    color: 'slate',
  },
};

// ============================================
// Types
// ============================================

export interface LabResult {
  testName: string;
  testCode: string;
  value: number;
  unit: string;
  referenceRange: {
    low: number;
    high: number;
  };
  category: LabTestCategory;
  isAbnormal: boolean;
  abnormalDirection?: 'high' | 'low';
  notes?: string;
}

export interface LabReportAnalysis {
  summary: string;
  highlights: Array<{
    testName: string;
    status: 'normal' | 'high' | 'low' | 'critical';
    message: string;
  }>;
  concerns: string[];
  positives: string[];
  trends: Array<{
    testName: string;
    direction: 'improving' | 'worsening' | 'stable';
    description: string;
  }>;
  recommendations: string[];
  dialysisRelevance: string;
  disclaimer: string;
}

export interface LabReport {
  _id: string;
  userId: string;
  reportDate: string;
  labName?: string;
  orderingProvider?: string;
  results: LabResult[];
  notes?: string;
  aiAnalysis?: LabReportAnalysis;
  aiAnalyzedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLabReportData {
  reportDate?: string;
  labName?: string;
  orderingProvider?: string;
  results: Array<{
    testName: string;
    testCode: string;
    value: number;
    unit?: string;
    referenceRange?: { low: number; high: number };
    category?: LabTestCategory;
    notes?: string;
  }>;
  notes?: string;
}

export interface GetLabReportsParams {
  from?: string;
  to?: string;
  testCode?: string;
  category?: LabTestCategory;
  limit?: number;
  offset?: number;
}

export interface LabReportsResponse {
  reports: LabReport[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface LatestResult {
  testCode: string;
  testName: string;
  latestValue: number;
  unit: string;
  isAbnormal: boolean;
  abnormalDirection?: 'high' | 'low';
  referenceRange: { low: number; high: number };
  category: LabTestCategory;
  reportDate: string;
  reportId: string;
}

export interface LabTrendPoint {
  date: string;
  value: number;
  unit: string;
  isAbnormal: boolean;
  abnormalDirection?: 'high' | 'low';
  referenceRange: { low: number; high: number };
}

export interface LabTrendResult {
  testCode: string;
  testName: string;
  unit: string;
  data: LabTrendPoint[];
  statistics: {
    min: number;
    max: number;
    average: number;
    latest: number;
    trend: 'improving' | 'worsening' | 'stable';
  };
  referenceRange: { low: number; high: number };
}

export interface LabSummary {
  period: { start: string; end: string };
  totalReports: number;
  abnormalResults: number;
  testsSummary: Array<{
    testCode: string;
    testName: string;
    latest: number;
    unit: string;
    isAbnormal: boolean;
    abnormalDirection?: 'high' | 'low';
  }>;
}

export interface TrendAnalysis {
  analysis: string;
  trend: 'improving' | 'worsening' | 'stable';
}

// ============================================
// API Functions
// ============================================

/**
 * Create a new lab report
 * POST /api/v1/lab-reports
 */
export async function createLabReport(data: CreateLabReportData): Promise<LabReport> {
  const result = await authFetch('/lab-reports', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data.labReport;
}

/**
 * Get lab reports with optional filtering
 * GET /api/v1/lab-reports
 */
export async function getLabReports(params: GetLabReportsParams = {}): Promise<LabReportsResponse> {
  const searchParams = new URLSearchParams();

  if (params.from) searchParams.append('from', params.from);
  if (params.to) searchParams.append('to', params.to);
  if (params.testCode) searchParams.append('testCode', params.testCode);
  if (params.category) searchParams.append('category', params.category);
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.offset) searchParams.append('offset', params.offset.toString());

  const queryString = searchParams.toString();
  const endpoint = queryString ? `/lab-reports?${queryString}` : '/lab-reports';

  const result = await authFetch(endpoint);
  return {
    reports: result.data?.reports || [],
    pagination: result.meta?.pagination,
  };
}

/**
 * Get a single lab report by ID
 * GET /api/v1/lab-reports/:reportId
 */
export async function getLabReport(reportId: string): Promise<LabReport> {
  const result = await authFetch(`/lab-reports/${reportId}`);
  return result.data.report;
}

/**
 * Update a lab report
 * PATCH /api/v1/lab-reports/:reportId
 */
export async function updateLabReport(reportId: string, data: Partial<CreateLabReportData>): Promise<LabReport> {
  const result = await authFetch(`/lab-reports/${reportId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return result.data.report;
}

/**
 * Delete a lab report
 * DELETE /api/v1/lab-reports/:reportId
 */
export async function deleteLabReport(reportId: string): Promise<void> {
  await authFetch(`/lab-reports/${reportId}`, {
    method: 'DELETE',
  });
}

/**
 * Analyze a lab report with AI
 * POST /api/v1/lab-reports/:reportId/analyze
 */
export async function analyzeLabReport(reportId: string): Promise<LabReportAnalysis> {
  const result = await authFetch(`/lab-reports/${reportId}/analyze`, {
    method: 'POST',
  });
  return result.data.analysis;
}

/**
 * Get AI analysis of trends for a specific test
 * GET /api/v1/lab-reports/analyze-trends
 */
export async function analyzeTrends(testCode: string, days: number = 90): Promise<TrendAnalysis> {
  const result = await authFetch(`/lab-reports/analyze-trends?testCode=${testCode}&days=${days}`);
  return result.data;
}

/**
 * Get trend data for a specific test
 * GET /api/v1/lab-reports/trends/:testCode
 */
export async function getLabTrends(testCode: string, days: number = 90): Promise<LabTrendResult> {
  const result = await authFetch(`/lab-reports/trends/${testCode}?days=${days}`);
  return result.data;
}

/**
 * Get lab summary for a period
 * GET /api/v1/lab-reports/summary
 */
export async function getLabSummary(days: number = 30): Promise<LabSummary> {
  const result = await authFetch(`/lab-reports/summary?days=${days}`);
  return result.data;
}

/**
 * Get latest results for all tests
 * GET /api/v1/lab-reports/latest
 */
export async function getLatestResults(): Promise<LatestResult[]> {
  const result = await authFetch('/lab-reports/latest');
  return result.data.results;
}

/**
 * Get reference ranges
 * GET /api/v1/lab-reports/reference-ranges
 */
export async function getReferenceRanges(): Promise<Record<string, { low: number; high: number; unit: string; category: LabTestCategory }>> {
  const result = await authFetch('/lab-reports/reference-ranges');
  return result.data.referenceRanges;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get color for a test result based on status
 */
export function getResultColor(result: LabResult | LatestResult): string {
  if (!result.isAbnormal) return 'green';
  if (result.abnormalDirection === 'high') return 'red';
  return 'amber';
}

/**
 * Get status text for a result
 */
export function getResultStatus(result: LabResult | LatestResult): string {
  if (!result.isAbnormal) return 'Normal';
  if (result.abnormalDirection === 'high') return 'High';
  return 'Low';
}

/**
 * Calculate percentage within reference range
 */
export function calculatePercentage(value: number, low: number, high: number): number {
  const range = high - low;
  const position = value - low;
  return Math.round((position / range) * 100);
}

/**
 * Get common test presets for quick entry
 */
export function getCommonTestPresets(): Array<{
  name: string;
  tests: Array<{ testCode: string; testName: string }>;
}> {
  return [
    {
      name: 'Basic Panel',
      tests: [
        { testCode: LabTestCode.BUN, testName: 'BUN' },
        { testCode: LabTestCode.CREATININE, testName: 'Creatinine' },
        { testCode: LabTestCode.POTASSIUM, testName: 'Potassium' },
        { testCode: LabTestCode.SODIUM, testName: 'Sodium' },
      ],
    },
    {
      name: 'Complete Metabolic Panel',
      tests: [
        { testCode: LabTestCode.BUN, testName: 'BUN' },
        { testCode: LabTestCode.CREATININE, testName: 'Creatinine' },
        { testCode: LabTestCode.POTASSIUM, testName: 'Potassium' },
        { testCode: LabTestCode.SODIUM, testName: 'Sodium' },
        { testCode: LabTestCode.CALCIUM, testName: 'Calcium' },
        { testCode: LabTestCode.PHOSPHORUS, testName: 'Phosphorus' },
        { testCode: LabTestCode.GLUCOSE, testName: 'Glucose' },
        { testCode: LabTestCode.ALBUMIN, testName: 'Albumin' },
      ],
    },
    {
      name: 'CBC',
      tests: [
        { testCode: LabTestCode.HEMOGLOBIN, testName: 'Hemoglobin' },
        { testCode: LabTestCode.HEMATOCRIT, testName: 'Hematocrit' },
        { testCode: LabTestCode.WBC, testName: 'WBC' },
        { testCode: LabTestCode.PLATELETS, testName: 'Platelets' },
      ],
    },
    {
      name: 'Iron Panel',
      tests: [
        { testCode: LabTestCode.FERRITIN, testName: 'Ferritin' },
        { testCode: LabTestCode.TSAT, testName: 'TSAT' },
        { testCode: LabTestCode.IRON, testName: 'Iron' },
      ],
    },
    {
      name: 'Dialysis Adequacy',
      tests: [
        { testCode: LabTestCode.KTV, testName: 'Kt/V' },
        { testCode: LabTestCode.URR, testName: 'URR' },
      ],
    },
  ];
}

/**
 * Group results by category
 */
export function groupResultsByCategory(results: (LabResult | LatestResult)[]): Record<LabTestCategory, (LabResult | LatestResult)[]> {
  const grouped: Record<LabTestCategory, (LabResult | LatestResult)[]> = {
    [LabTestCategory.KIDNEY_FUNCTION]: [],
    [LabTestCategory.ELECTROLYTES]: [],
    [LabTestCategory.BLOOD_COUNT]: [],
    [LabTestCategory.IRON_STUDIES]: [],
    [LabTestCategory.DIALYSIS_ADEQUACY]: [],
    [LabTestCategory.OTHER]: [],
  };

  for (const result of results) {
    const category = result.category || LabTestCategory.OTHER;
    grouped[category].push(result);
  }

  return grouped;
}
