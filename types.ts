
export enum DialysisType {
  HOME_HD = 'Home Hemodialysis',
  IN_CENTER_HD = 'In-Center Hemodialysis',
  CAPD = 'Peritoneal Dialysis (CAPD)',
  APD = 'Peritoneal Dialysis (APD)',
  PRE_DIALYSIS = 'Pre-Dialysis'
}

export enum MoodType {
  CALM = 'Calm',
  OKAY = 'Okay',
  LOW = 'Low',
  UNWELL = 'Unwell'
}

export enum VitalType {
  BLOOD_PRESSURE = 'Blood Pressure',
  HEART_RATE = 'Heart Rate',
  TEMPERATURE = 'Temperature',
  SPO2 = 'Oxygen Saturation'
}

export enum WeightContext {
  MORNING = 'morning',
  PRE_DIALYSIS = 'pre_dialysis',
  POST_DIALYSIS = 'post_dialysis'
}

export enum SymptomType {
  CRAMPING = 'cramping',
  NAUSEA = 'nausea',
  HEADACHE = 'headache',
  DIZZINESS = 'dizziness',
  FATIGUE = 'fatigue',
  SHORTNESS_OF_BREATH = 'shortness_of_breath',
  ITCHING = 'itching',
  CHEST_PAIN = 'chest_pain',
  LOW_BP = 'low_bp',
  MUSCLE_WEAKNESS = 'muscle_weakness',
  RESTLESS_LEGS = 'restless_legs',
  INSOMNIA = 'insomnia',
  OTHER = 'other'
}

export enum SubscriptionPlan {
  FREE = 'Free',
  BASIC = 'Basic',
  PREMIUM = 'Premium'
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  TRIALING = 'trialing',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  UNPAID = 'unpaid'
}

export enum BillingInterval {
  MONTH = 'month',
  YEAR = 'year'
}

export interface SubscriptionFeatures {
  advancedAnalytics: boolean;
  exportData: boolean;
  multipleProfiles: boolean;
  prioritySupport: boolean;
  customReminders: boolean;
  familySharing: boolean;
}

export interface DetailedSubscription {
  stripeSubscriptionId?: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  maxSessions: number | null;
  maxMedications: number | null;
  maxReports: number | null;
  features: SubscriptionFeatures;
  autoRenew: boolean;
  emailReceipts: boolean;
  billingEmail?: string;
}

export interface SessionEvent {
  id: string;
  time: string;
  type: 'vitals' | 'pain' | 'medication' | 'note';
  label: string;
  value: string | number;
  metadata?: any;
  eventNotes?: string;
}

export interface VitalLog {
  id: string;
  loggedAt: string;
  type: VitalType;
  value1: number;
  value2?: number;
  unit: string;
  sessionId?: string;
  notes?: string;
}

export interface MoodLog {
  id: string;
  time: string;
  type: MoodType;
}

export interface DialysisSession {
  id: string;
  type: DialysisType;
  startTime: string;
  endTime?: string;
  plannedDuration: number;
  actualDuration?: number;
  targetFluidRemoval?: number;
  fluidRemoved?: number;
  preWeight?: number;
  postWeight?: number;
  bloodPressure?: { sys: number; dia: number };
  symptoms: string[];
  notes: string;
  events?: SessionEvent[];
  status: 'active' | 'completed' | 'canceled';
}

export interface WeightLog {
  id: string;
  date: string;
  value: number;
  type: 'morning' | 'pre-dialysis' | 'post-dialysis';
}

export interface FluidIntake {
  id: string;
  time: string;
  amount: number;
  beverage: string;
}

export interface MealNutrients {
  sodium?: number;
  potassium?: number;
  phosphorus?: number;
  protein?: number;
}

export interface MealLog {
  id: string;
  time: string;
  name: string;
  nutrients: MealNutrients;
  isCustom: boolean;
  notes?: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  onDialysisDays: boolean;
  onNonDialysisDays: boolean;
}

export interface BPThresholds {
  normalSys: number;
  normalDia: number;
  elevatedSys: number;
  stage1Sys: number;
  stage1Dia: number;
  stage2Sys: number;
  stage2Dia: number;
}

export interface ReminderConfig {
  enabled: boolean;
  frequencyHours?: number;
  startTime: string;
  days?: string[];
}

export interface UserSettings {
  notifications: {
    fluidReminders: boolean;
    weightReminders: boolean;
    medicationAlerts: boolean;
    sessionStartReminders: boolean;
  };
  customReminders: {
    fluid: ReminderConfig;
    weight: ReminderConfig;
    medication: ReminderConfig;
    sessionStart: ReminderConfig;
    sessionEnd: ReminderConfig;
  };
  units: 'metric' | 'imperial';
  display: {
    compactMode: boolean;
    showAIInghts: boolean;
    theme: 'light' | 'dark';
  };
  bpThresholds: BPThresholds;
}

export interface CustomReportConfig {
  id: string;
  name: string;
  dataPoints: string[];
  dateRange: string;
  createdAt: string;
}

export interface UserProfile {
  name: string;
  email?: string;
  avatarUrl?: string;
  timeZone: string;
  dailyFluidLimit: number;
  weightGoal: number;
  preferredDialysisType: DialysisType;
  dialysisMode: 'home' | 'clinic' | 'none';
  isOnDialysis: boolean;
  dialysisStartDate?: string;
  dob?: string;
  gender?: string;
  height?: number;
  clinicName?: string;
  nephrologistName?: string;
  trackingPrefs: {
    weight: boolean;
    fluid: boolean;
    meds: boolean;
    symptoms: boolean;
    bp: boolean;
  };
  isOnboarded: boolean;
  settings: UserSettings;
  subscription: DetailedSubscription;
}
