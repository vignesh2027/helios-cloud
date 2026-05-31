export const EC2_INSTANCE_PRICING_US_EAST_1: Record<string, number> = {
  't3.nano': 3.796,
  't3.micro': 7.59,
  't3.small': 15.18,
  't3.medium': 30.37,
  't3.large': 60.74,
  't3.xlarge': 121.47,
  't3.2xlarge': 242.94,
  'm5.large': 69.12,
  'm5.xlarge': 138.24,
  'm5.2xlarge': 276.48,
  'm5.4xlarge': 552.96,
  'm5.8xlarge': 1105.92,
  'm5.12xlarge': 1658.88,
  'm5.16xlarge': 2211.84,
  'm5.24xlarge': 3317.76,
  'c5.large': 62.05,
  'c5.xlarge': 124.10,
  'c5.2xlarge': 248.19,
  'c5.4xlarge': 496.38,
  'c5.9xlarge': 1116.86,
  'c5.18xlarge': 2233.73,
  'r5.large': 90.52,
  'r5.xlarge': 181.04,
  'r5.2xlarge': 362.08,
  'r5.4xlarge': 724.16,
  'r5.8xlarge': 1448.32,
  'r5.12xlarge': 2172.48,
  'r5.16xlarge': 2896.64,
  'r5.24xlarge': 4344.96,
  'p3.2xlarge': 2203.20,
  'p3.8xlarge': 8812.80,
  'p3.16xlarge': 17625.60,
};

export const RDS_INSTANCE_PRICING_US_EAST_1: Record<string, number> = {
  'db.t3.micro': 12.41,
  'db.t3.small': 24.82,
  'db.t3.medium': 49.64,
  'db.t3.large': 99.28,
  'db.m5.large': 115.92,
  'db.m5.xlarge': 231.84,
  'db.m5.2xlarge': 463.68,
  'db.m5.4xlarge': 927.36,
  'db.r5.large': 172.80,
  'db.r5.xlarge': 345.60,
  'db.r5.2xlarge': 691.20,
  'db.r5.4xlarge': 1382.40,
  'db.r5.8xlarge': 2764.80,
};

export function getEC2MonthlyCost(instanceType: string, region: string): number {
  const price = EC2_INSTANCE_PRICING_US_EAST_1[instanceType];
  if (!price) return 0;
  const regionMultiplier = region.startsWith('eu-') ? 1.15 : region.startsWith('ap-') ? 1.2 : 1.0;
  return price * regionMultiplier;
}

export function getRDSMonthlyCost(instanceClass: string, region: string): number {
  const price = RDS_INSTANCE_PRICING_US_EAST_1[instanceClass];
  if (!price) return 0;
  const regionMultiplier = region.startsWith('eu-') ? 1.15 : region.startsWith('ap-') ? 1.2 : 1.0;
  return price * regionMultiplier;
}

export function getNextSmallerInstanceType(instanceType: string): string | null {
  const familyMap: Record<string, string[]> = {
    m5: ['m5.large', 'm5.xlarge', 'm5.2xlarge', 'm5.4xlarge', 'm5.8xlarge', 'm5.12xlarge', 'm5.16xlarge', 'm5.24xlarge'],
    c5: ['c5.large', 'c5.xlarge', 'c5.2xlarge', 'c5.4xlarge', 'c5.9xlarge', 'c5.18xlarge'],
    r5: ['r5.large', 'r5.xlarge', 'r5.2xlarge', 'r5.4xlarge', 'r5.8xlarge', 'r5.12xlarge', 'r5.16xlarge', 'r5.24xlarge'],
    t3: ['t3.nano', 't3.micro', 't3.small', 't3.medium', 't3.large', 't3.xlarge', 't3.2xlarge'],
  };

  const family = instanceType.split('.')[0] ?? '';
  const familyList = familyMap[family];
  if (!familyList) return null;

  const idx = familyList.indexOf(instanceType);
  if (idx <= 0) return null;

  return familyList[idx - 1] ?? null;
}
