import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeVolumesCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  paginateDescribeInstances,
  paginateDescribeVolumes,
  paginateDescribeSecurityGroups,
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

export class EC2Scanner {
  private readonly client: EC2Client;

  constructor(
    private readonly config: AwsClientConfig,
    private readonly accountId: string,
  ) {
    this.client = new EC2Client(config);
  }

  async scanInstances(): Promise<{ resources: Resource[]; edges: DependencyEdge[] }> {
    const resources: Resource[] = [];
    const edges: DependencyEdge[] = [];

    for await (const page of paginateDescribeInstances({ client: this.client }, {})) {
      for (const reservation of page.Reservations ?? []) {
        for (const instance of reservation.Instances ?? []) {
          if (!instance.InstanceId) continue;

          const resource: Resource = {
            id: instance.InstanceId,
            type: 'ec2:instance',
            provider: 'aws',
            region: this.config.region,
            accountId: this.accountId,
            arn: `arn:aws:ec2:${this.config.region}:${this.accountId}:instance/${instance.InstanceId}`,
            name: nameFromTags(instance.Tags),
            status: this.mapInstanceState(instance.State?.Name),
            tags: tagsToRecord(instance.Tags),
            metadata: {
              instanceType: instance.InstanceType,
              platform: instance.Platform ?? 'linux',
              privateIpAddress: instance.PrivateIpAddress,
              publicIpAddress: instance.PublicIpAddress,
              subnetId: instance.SubnetId,
              vpcId: instance.VpcId,
              imageId: instance.ImageId,
              launchTime: instance.LaunchTime,
              iamInstanceProfile: instance.IamInstanceProfile?.Arn,
              monitoring: instance.Monitoring?.State,
              ebsOptimized: instance.EbsOptimized,
            },
            createdAt: instance.LaunchTime,
          };

          resources.push(resource);

          if (instance.VpcId) {
            edges.push({
              sourceId: instance.InstanceId,
              targetId: instance.VpcId,
              type: 'contains',
            });
          }

          if (instance.SubnetId) {
            edges.push({
              sourceId: instance.InstanceId,
              targetId: instance.SubnetId,
              type: 'contains',
            });
          }

          for (const sg of instance.SecurityGroups ?? []) {
            if (sg.GroupId) {
              edges.push({
                sourceId: instance.InstanceId,
                targetId: sg.GroupId,
                type: 'network',
              });
            }
          }
        }
      }
    }

    return { resources, edges };
  }

  async scanVolumes(): Promise<{ resources: Resource[] }> {
    const resources: Resource[] = [];

    for await (const page of paginateDescribeVolumes({ client: this.client }, {})) {
      for (const volume of page.Volumes ?? []) {
        if (!volume.VolumeId) continue;

        resources.push({
          id: volume.VolumeId,
          type: 'ec2:volume',
          provider: 'aws',
          region: this.config.region,
          accountId: this.accountId,
          arn: `arn:aws:ec2:${this.config.region}:${this.accountId}:volume/${volume.VolumeId}`,
          name: nameFromTags(volume.Tags),
          status: volume.State === 'available' ? 'active' : volume.State === 'in-use' ? 'active' : 'stopped',
          tags: tagsToRecord(volume.Tags),
          metadata: {
            volumeType: volume.VolumeType,
            size: volume.Size,
            iops: volume.Iops,
            throughput: volume.Throughput,
            encrypted: volume.Encrypted,
            availabilityZone: volume.AvailabilityZone,
            attachments: volume.Attachments?.map(a => ({
              instanceId: a.InstanceId,
              device: a.Device,
              state: a.State,
            })),
          },
          createdAt: volume.CreateTime,
        });
      }
    }

    return { resources };
  }

  async scanSecurityGroups(): Promise<{ resources: Resource[] }> {
    const resources: Resource[] = [];

    for await (const page of paginateDescribeSecurityGroups({ client: this.client }, {})) {
      for (const sg of page.SecurityGroups ?? []) {
        if (!sg.GroupId) continue;

        const hasPublicIngress = sg.IpPermissions?.some(
          p => p.IpRanges?.some(r => r.CidrIp === '0.0.0.0/0') ||
               p.Ipv6Ranges?.some(r => r.CidrIpv6 === '::/0'),
        ) ?? false;

        resources.push({
          id: sg.GroupId,
          type: 'ec2:security-group',
          provider: 'aws',
          region: this.config.region,
          accountId: this.accountId,
          arn: `arn:aws:ec2:${this.config.region}:${this.accountId}:security-group/${sg.GroupId}`,
          name: sg.GroupName,
          status: 'active',
          tags: tagsToRecord(sg.Tags),
          metadata: {
            description: sg.Description,
            vpcId: sg.VpcId,
            hasPublicIngress,
            ingressRuleCount: sg.IpPermissions?.length ?? 0,
            egressRuleCount: sg.IpPermissionsEgress?.length ?? 0,
          },
        });
      }
    }

    return { resources };
  }

  private mapInstanceState(state?: string): Resource['status'] {
    switch (state) {
      case 'running': return 'active';
      case 'stopped': return 'stopped';
      case 'terminated': return 'terminated';
      case 'pending': return 'pending';
      default: return 'unknown';
    }
  }
}
