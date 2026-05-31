import type { Resource, CostRecommendation } from '@helios-cloud/core';

export interface LambdaMetrics {
  functionArn: string;
  invocationsPerMonth: number;
  avgDurationMs: number;
  maxDurationMs: number;
  memoryAllocatedMb: number;
  avgMemoryUsedMb: number;
  errorRate: number;
  lastInvokedAt?: Date;
}

const LAMBDA_PRICE_PER_GB_SECOND = 0.0000166667;
const LAMBDA_PRICE_PER_REQUEST = 0.0000002;

function computeLambdaMonthlyCost(metrics: LambdaMetrics): number {
  const gbSeconds = (metrics.memoryAllocatedMb / 1024) * (metrics.avgDurationMs / 1000) * metrics.invocationsPerMonth;
  return gbSeconds * LAMBDA_PRICE_PER_GB_SECOND + metrics.invocationsPerMonth * LAMBDA_PRICE_PER_REQUEST;
}

export function analyzeLambdaFunctions(
  resources: Resource[],
  metrics: LambdaMetrics[],
  idleThresholdDays: number,
): CostRecommendation[] {
  const recommendations: CostRecommendation[] = [];
  const metricsMap = new Map(metrics.map(m => [m.functionArn, m]));

  for (const resource of resources) {
    if (resource.type !== 'lambda:function') continue;

    const m = metricsMap.get(resource.id);
    if (!m) continue;

    const currentCost = computeLambdaMonthlyCost(m);

    const daysSinceInvoked = m.lastInvokedAt
      ? Math.floor((Date.now() - m.lastInvokedAt.getTime()) / (1000 * 60 * 60 * 24))
      : idleThresholdDays + 1;

    if (daysSinceInvoked >= idleThresholdDays || m.invocationsPerMonth === 0) {
      recommendations.push({
        resourceId: resource.id,
        resourceType: resource.type,
        region: resource.region,
        action: 'terminate',
        currentConfig: `${m.memoryAllocatedMb}MB`,
        recommendedConfig: 'none (delete)',
        currentMonthlyCost: currentCost,
        projectedMonthlyCost: 0,
        monthlySavings: currentCost,
        annualSavings: currentCost * 12,
        confidenceScore: 0.9,
        rationale: `Function has not been invoked in ${daysSinceInvoked} days`,
        effort: 'low',
        risk: 'low',
        implementationSteps: [
          'Verify the function is not needed',
          `Run: aws lambda delete-function --function-name ${resource.name}`,
        ],
      });
      continue;
    }

    if (m.avgMemoryUsedMb > 0 && m.memoryAllocatedMb > m.avgMemoryUsedMb * 2) {
      const optimalMb = nextLambdaMemorySize(Math.ceil(m.avgMemoryUsedMb * 1.4));
      if (optimalMb < m.memoryAllocatedMb) {
        const optimizedMetrics = { ...m, memoryAllocatedMb: optimalMb };
        const newCost = computeLambdaMonthlyCost(optimizedMetrics);
        const savings = currentCost - newCost;

        if (savings > 0.5) {
          recommendations.push({
            resourceId: resource.id,
            resourceType: resource.type,
            region: resource.region,
            action: 'rightsize',
            currentConfig: `${m.memoryAllocatedMb}MB`,
            recommendedConfig: `${optimalMb}MB`,
            currentMonthlyCost: currentCost,
            projectedMonthlyCost: newCost,
            monthlySavings: savings,
            annualSavings: savings * 12,
            confidenceScore: 0.88,
            rationale: `Average memory usage is ${m.avgMemoryUsedMb.toFixed(0)}MB but allocated ${m.memoryAllocatedMb}MB`,
            effort: 'low',
            risk: 'low',
            implementationSteps: [
              `Run: aws lambda update-function-configuration --function-name ${resource.name} --memory-size ${optimalMb}`,
              'Monitor for 24h to confirm stable performance',
            ],
          });
        }
      }
    }
  }

  return recommendations;
}

function nextLambdaMemorySize(target: number): number {
  const sizes = [128, 256, 512, 768, 1024, 1536, 2048, 3008, 4096, 5120, 6144, 7168, 8192, 9216, 10240];
  return sizes.find(s => s >= target) ?? 10240;
}
