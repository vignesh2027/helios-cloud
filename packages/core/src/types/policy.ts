export type PolicySeverity = 'critical' | 'high' | 'medium' | 'low' | 'informational';
export type PolicyFramework =
  | 'cis-aws-1.4'
  | 'cis-aws-1.5'
  | 'soc2'
  | 'pci-dss-3.2'
  | 'hipaa'
  | 'nist-800-53'
  | 'custom';

export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  framework: PolicyFramework;
  section: string;
  severity: PolicySeverity;
  resourceTypes: string[];
  regoPolicy?: string;
  remediationGuidance: string;
  references: string[];
}

export interface PolicyViolation {
  ruleId: string;
  ruleName: string;
  resourceId: string;
  resourceType: string;
  region: string;
  severity: PolicySeverity;
  message: string;
  evidence: Record<string, unknown>;
  detectedAt: Date;
  remediationGuidance: string;
  autoRemediatable: boolean;
}

export interface ComplianceReport {
  framework: PolicyFramework;
  score: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  totalRules: number;
  passedRules: number;
  failedRules: number;
  skippedRules: number;
  violations: PolicyViolation[];
  evaluatedAt: Date;
  accountId: string;
  region: string;
}

export interface PolicyEvaluationOptions {
  framework: PolicyFramework | PolicyFramework[];
  accountId?: string;
  region?: string;
  resourceTypes?: string[];
  severity?: PolicySeverity[];
}
