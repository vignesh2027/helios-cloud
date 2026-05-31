export type CostAction =
  | 'rightsize'
  | 'terminate'
  | 'schedule'
  | 'reserve'
  | 'savings-plan'
  | 'storage-tier'
  | 'delete-snapshot';

export interface CostRecommendation {
  resourceId: string;
  resourceType: string;
  region: string;
  action: CostAction;
  currentConfig: string;
  recommendedConfig: string;
  currentMonthlyCost: number;
  projectedMonthlyCost: number;
  monthlySavings: number;
  annualSavings: number;
  confidenceScore: number;
  rationale: string;
  effort: 'low' | 'medium' | 'high';
  risk: 'low' | 'medium' | 'high';
  implementationSteps: string[];
}

export interface CostSummary {
  totalMonthlyCost: number;
  totalAnnualCost: number;
  potentialMonthlySavings: number;
  potentialAnnualSavings: number;
  savingsPercentage: number;
  recommendations: CostRecommendation[];
  byProvider: Record<string, number>;
  byRegion: Record<string, number>;
  byResourceType: Record<string, number>;
  trend: CostTrendPoint[];
}

export interface CostTrendPoint {
  date: string;
  amount: number;
  provider: string;
}

export interface BudgetAlert {
  id: string;
  name: string;
  threshold: number;
  currentSpend: number;
  forecastedSpend: number;
  period: 'daily' | 'monthly' | 'quarterly';
  alertChannels: string[];
  triggered: boolean;
}
