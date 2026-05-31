import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInternetGatewaysCommand,
  paginateDescribeVpcs,
  paginateDescribeSubnets,
} from '@aws-sdk/client-ec2';
import type { Resource, DependencyEdge } from '@helios-cloud/core';
import type { AwsClientConfig } from '../client.js';

function tagsToRecord(tags?: { Key?: string; Value?: string }[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const tag of tags ?? []) {
    if (tag.Key && tag.Value) result[tag.Key] = tag.Value;
  }
  return result;
}

function nameFromTags(tags?: { Key?: string; Value?: string }[]): string | undefined {
  return tags?.find(t => t.Key === 'Name')?.Value;
}

export class VPCScanner {
  private readonly client: EC2Client;

  constructor(
    private readonly config: AwsClientConfig,
    private readonly accountId: string,
  ) {
    this.client = new EC2Client(config);
  }

  async scanVpcs(): Promise<{ resources: Resource[]; edges: DependencyEdge[] }> {
    const resources: Resource[] = [];
    const edges: DependencyEdge[] = [];

    for await (const page of paginateDescribeVpcs({ client: this.client }, {})) {
      for (const vpc of page.Vpcs ?? []) {
        if (!vpc.VpcId) continue;

        resources.push({
          id: vpc.VpcId,
          type: 'ec2:vpc',
          provider: 'aws',
          region: this.config.region,
          accountId: this.accountId,
          arn: `arn:aws:ec2:${this.config.region}:${this.accountId}:vpc/${vpc.VpcId}`,
          name: nameFromTags(vpc.Tags),
          status: vpc.State === 'available' ? 'active' : 'pending',
          tags: tagsToRecord(vpc.Tags),
          metadata: {
            cidrBlock: vpc.CidrBlock,
            isDefault: vpc.IsDefault,
            dhcpOptionsId: vpc.DhcpOptionsId,
            instanceTenancy: vpc.InstanceTenancy,
            additionalCidrBlocks: vpc.CidrBlockAssociationSet?.map(a => a.CidrBlock),
          },
        });
      }
    }

    return { resources, edges };
  }

  async scanSubnets(): Promise<{ resources: Resource[]; edges: DependencyEdge[] }> {
    const resources: Resource[] = [];
    const edges: DependencyEdge[] = [];

    for await (const page of paginateDescribeSubnets({ client: this.client }, {})) {
      for (const subnet of page.Subnets ?? []) {
        if (!subnet.SubnetId) continue;

        resources.push({
          id: subnet.SubnetId,
          type: 'ec2:subnet',
          provider: 'aws',
          region: this.config.region,
          accountId: this.accountId,
          arn: subnet.SubnetArn,
          name: nameFromTags(subnet.Tags),
          status: subnet.State === 'available' ? 'active' : 'pending',
          tags: tagsToRecord(subnet.Tags),
          metadata: {
            cidrBlock: subnet.CidrBlock,
            availabilityZone: subnet.AvailabilityZone,
            availableIpAddressCount: subnet.AvailableIpAddressCount,
            mapPublicIpOnLaunch: subnet.MapPublicIpOnLaunch,
            defaultForAz: subnet.DefaultForAz,
          },
        });

        if (subnet.VpcId) {
          edges.push({
            sourceId: subnet.SubnetId,
            targetId: subnet.VpcId,
            type: 'contains',
          });
        }
      }
    }

    return { resources, edges };
  }
}
