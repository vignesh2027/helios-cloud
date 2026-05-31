import {
  RDSClient,
  paginateDescribeDBInstances,
  paginateDescribeDBClusters,
} from '@aws-sdk/client-rds';
import type { Resource, DependencyEdge } from '@helios-cloud/core';
import type { AwsClientConfig } from '../client.js';

export class RDSScanner {
  private readonly client: RDSClient;

  constructor(
    private readonly config: AwsClientConfig,
    private readonly accountId: string,
  ) {
    this.client = new RDSClient(config);
  }

  async scanInstances(): Promise<{ resources: Resource[]; edges: DependencyEdge[] }> {
    const resources: Resource[] = [];
    const edges: DependencyEdge[] = [];

    for await (const page of paginateDescribeDBInstances({ client: this.client }, {})) {
      for (const db of page.DBInstances ?? []) {
        if (!db.DBInstanceIdentifier || !db.DBInstanceArn) continue;

        const tagMap: Record<string, string> = {};
        for (const tag of db.TagList ?? []) {
          if (tag.Key && tag.Value) tagMap[tag.Key] = tag.Value;
        }

        resources.push({
          id: db.DBInstanceArn,
          type: 'rds:db-instance',
          provider: 'aws',
          region: this.config.region,
          accountId: this.accountId,
          arn: db.DBInstanceArn,
          name: db.DBInstanceIdentifier,
          status: db.DBInstanceStatus === 'available' ? 'active' : 'stopped',
          tags: tagMap,
          metadata: {
            engine: db.Engine,
            engineVersion: db.EngineVersion,
            instanceClass: db.DBInstanceClass,
            allocatedStorageGb: db.AllocatedStorage,
            multiAz: db.MultiAZ,
            storageEncrypted: db.StorageEncrypted,
            publiclyAccessible: db.PubliclyAccessible,
            deletionProtection: db.DeletionProtection,
            backupRetentionDays: db.BackupRetentionPeriod,
            endpoint: db.Endpoint?.Address,
            port: db.Endpoint?.Port,
            performanceInsightsEnabled: db.PerformanceInsightsEnabled,
            monitoringInterval: db.MonitoringInterval,
          },
          createdAt: db.InstanceCreateTime,
        });

        if (db.DBSubnetGroup?.VpcId) {
          edges.push({
            sourceId: db.DBInstanceArn,
            targetId: db.DBSubnetGroup.VpcId,
            type: 'contains',
          });
        }
      }
    }

    return { resources, edges };
  }

  async scanClusters(): Promise<{ resources: Resource[] }> {
    const resources: Resource[] = [];

    for await (const page of paginateDescribeDBClusters({ client: this.client }, {})) {
      for (const cluster of page.DBClusters ?? []) {
        if (!cluster.DBClusterIdentifier || !cluster.DBClusterArn) continue;

        const tagMap: Record<string, string> = {};
        for (const tag of cluster.TagList ?? []) {
          if (tag.Key && tag.Value) tagMap[tag.Key] = tag.Value;
        }

        resources.push({
          id: cluster.DBClusterArn,
          type: 'rds:db-cluster',
          provider: 'aws',
          region: this.config.region,
          accountId: this.accountId,
          arn: cluster.DBClusterArn,
          name: cluster.DBClusterIdentifier,
          status: cluster.Status === 'available' ? 'active' : 'stopped',
          tags: tagMap,
          metadata: {
            engine: cluster.Engine,
            engineVersion: cluster.EngineVersion,
            multiAz: cluster.MultiAZ,
            storageEncrypted: cluster.StorageEncrypted,
            deletionProtection: cluster.DeletionProtection,
            backupRetentionDays: cluster.BackupRetentionPeriod,
            endpoint: cluster.Endpoint,
            readerEndpoint: cluster.ReaderEndpoint,
            memberCount: cluster.DBClusterMembers?.length ?? 0,
          },
          createdAt: cluster.ClusterCreateTime,
        });
      }
    }

    return { resources };
  }
}
