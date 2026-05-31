import type { Resource, CostRecommendation } from '@helios-cloud/core';
import {
  getEC2MonthlyCost,
  getNextSmallerInstanceType,
} from '../models/pricing.js';

export interface EC2Metrics {
  resourceId: string;
  avgCpuPercent: number;
  maxCpuPercent: number;
  avgNetworkInMbps: number;
  avgNetworkOutMbps: number;
  avgMemoryPercent?: number;
  idleDays: number;
}

export function analyzeEC2Instances(
  resources: Resource[],
  metrics: EC2Metrics[],
  idleThresholdDays: number,
  confidenceThreshold: number,
): CostRecommendation[] {
  const recommendations: CostRecommendation[] = [];
  const metricsMap = new Map(metrics.map(m => [m.resourceId, m]));

  for (const resource of resources) {
    if (resource.type !== 'ec2:instance' || resource.status !== 'active') continue;

    const instanceType = resource.metadata['instanceType'] as string | undefined;
    if (!instanceType) continue;

    const m = metricsMap.get(resource.id);
    const currentCost = getEC2MonthlyCost(instanceType, resource.region);

    if (!m) {
      if (currentCost > 0) {
        recommendations.push(buildTaggingRecommendation(resource, currentCost));
      }
      continue;
    }

    if (m.idleDays >= idleThresholdDays) {
      const confidence = Math.min(0.95, 0.7 + (m.idleDays - idleThresholdDays) * 0.01);
      if (confidence >= confidenceThreshold) {
        recommendations.push({
          resourceId: resource.id,
          resourceType: resource.type,
          region: resource.region,
          action: 'terminate',
          currentConfig: instanceType,
          recommendedConfig: 'none (terminate)',
          currentMonthlyCost: currentCost,
          projectedMonthlyCost: 0,
          monthlySavings: currentCost,
          annualSavings: currentCost * 12,
          confidenceScore: confidence,
          rationale: `Instance has been idle for ${m.idleDays} days (CPU avg: ${m.avgCpuPercent.toFixed(1)}%)`,
          effort: 'low',
          risk: 'medium',
          implementationSteps: [
            'Create AMI snapshot before termination',
            `Run: aws ec2 terminate-instances --instance-ids ${resource.id}`,
            'Update any load balancer target groups',
          ],
        });
        continue;
      }
    }

    if (m.avgCpuPercent < 20 && m.maxCpuPercent < 40) {
      const smallerType = getNextSmallerInstanceType(instanceType);
      if (smallerType) {
        const newCost = getEC2MonthlyCost(smallerType, resource.region);
        const savings = currentCost - newCost;
        if (savings > 10) {
          const confidence = calculateRightsizingConfidence(m);
          if (confidence >= confidenceThreshold) {
            recommendations.push({
              resourceId: resource.id,
              resourceType: resource.type,
              region: resource.region,
              action: 'rightsize',
              currentConfig: instanceType,
              recommendedConfig: smallerType,
              currentMonthlyCost: currentCost,
              projectedMonthlyCost: newCost,
              monthlySavings: savings,
              annualSavings: savings * 12,
              confidenceScore: confidence,
              rationale: `Average CPU utilization is ${m.avgCpuPercent.toFixed(1)}%, max is ${m.maxCpuPercent.toFixed(1)}%. Downsize to ${smallerType}.`,
              effort: 'medium',
              risk: 'low',
              implementationSteps: [
                'Create snapshot/AMI of current instance',
                'Stop instance during maintenance window',
                `Run: aws ec2 modify-instance-attribute --instance-id ${resource.id} --instance-type ${smallerType}`,
                'Start instance and validate application health',
                'Monitor for 24h before finalizing',
              ],
            });
          }
        }
      }
    }

    if (m.avgCpuPercent > 85 || m.maxCpuPercent > 95) {
      const savingsPlansRecommendation = buildSavingsPlanRecommendation(resource, currentCost);
      recommendations.push(savingsPlansRecommendation);
    }
  }

  return recommendations;
}

function calculateRightsizingConfidence(m: EC2Metrics): number {
  let confidence = 0.5;
  if (m.avgCpuPercent < 10) confidence += 0.25;
  else if (m.avgCpuPercent < 20) confidence += 0.15;
  if (m.maxCpuPercent < 30) confidence += 0.15;
  else if (m.maxCpuPercent < 50) confidence += 0.08;
  if (m.avgMemoryPercent !== undefined && m.avgMemoryPercent < 40) confidence += 0.1;
  return Math.min(0.97, confidence);
}

function buildTaggingRecommendation(resource: Resource, currentCost: number): CostRecommendation {
  return {
    resourceId: resource.id,
    resourceType: resource.type,
    region: resource.region,
    action: 'schedule',
    currentConfig: resource.metadata['instanceType'] as string,
    recommendedConfig: 'schedule:off-hours',
    currentMonthlyCost: currentCost,
    projectedMonthlyCost: currentCost * 0.4,
    monthlySavings: currentCost * 0.6,
    annualSavings: currentCost * 0.6 * 12,
    confidenceScore: 0.75,
    rationale: 'No CloudWatch metrics available. Consider scheduling off-hours shutdown.',
    effort: 'low',
    risk: 'low',
    implementationSteps: [
      'Install CloudWatch agent to collect metrics',
      'Use AWS Instance Scheduler or Lambda to stop/start on schedule',
    ],
  };
}

function buildSavingsPlanRecommendation(resource: Resource, currentCost: number): CostRecommendation {
  const committedCost = currentCost * 0.63;
  return {
    resourceId: resource.id,
    resourceType: resource.type,
    region: resource.region,
    action: 'savings-plan',
    currentConfig: 'on-demand',
    recommendedConfig: '1-year-savings-plan',
    currentMonthlyCost: currentCost,
    projectedMonthlyCost: committedCost,
    monthlySavings: currentCost - committedCost,
    annualSavings: (currentCost - committedCost) * 12,
    confidenceScore: 0.9,
    rationale: 'Instance is running at high utilization. A 1-year Savings Plan saves ~37%.',
    effort: 'low',
    risk: 'low',
    implementationSteps: [
      'Review AWS Cost Explorer Savings Plans recommendations',
      'Purchase Compute Savings Plan via AWS console or CLI',
    ],
  };
}
