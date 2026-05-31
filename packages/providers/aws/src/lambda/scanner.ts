import {
  LambdaClient,
  paginateListFunctions,
  GetFunctionConcurrencyCommand,
} from '@aws-sdk/client-lambda';
import type { Resource, DependencyEdge } from '@helios-cloud/core';
import type { AwsClientConfig } from '../client.js';

export class LambdaScanner {
  private readonly client: LambdaClient;

  constructor(
    private readonly config: AwsClientConfig,
    private readonly accountId: string,
  ) {
    this.client = new LambdaClient(config);
  }

  async scanFunctions(): Promise<{ resources: Resource[]; edges: DependencyEdge[] }> {
    const resources: Resource[] = [];
    const edges: DependencyEdge[] = [];

    for await (const page of paginateListFunctions({ client: this.client }, {})) {
      for (const fn of page.Functions ?? []) {
        if (!fn.FunctionName || !fn.FunctionArn) continue;

        resources.push({
          id: fn.FunctionArn,
          type: 'lambda:function',
          provider: 'aws',
          region: this.config.region,
          accountId: this.accountId,
          arn: fn.FunctionArn,
          name: fn.FunctionName,
          status: fn.State === 'Active' ? 'active' : fn.State === 'Inactive' ? 'stopped' : 'unknown',
          tags: {},
          metadata: {
            runtime: fn.Runtime,
            handler: fn.Handler,
            memorySizeMb: fn.MemorySize,
            timeoutSeconds: fn.Timeout,
            codeSize: fn.CodeSize,
            description: fn.Description,
            role: fn.Role,
            vpcConfig: fn.VpcConfig
              ? {
                  vpcId: fn.VpcConfig.VpcId,
                  subnetIds: fn.VpcConfig.SubnetIds,
                  securityGroupIds: fn.VpcConfig.SecurityGroupIds,
                }
              : null,
            environment: fn.Environment?.Variables
              ? Object.keys(fn.Environment.Variables)
              : [],
            lastModified: fn.LastModified,
            architectures: fn.Architectures,
            packageType: fn.PackageType,
          },
          updatedAt: fn.LastModified ? new Date(fn.LastModified) : undefined,
        });

        if (fn.VpcConfig?.VpcId) {
          edges.push({
            sourceId: fn.FunctionArn,
            targetId: fn.VpcConfig.VpcId,
            type: 'contains',
          });
        }

        for (const sgId of fn.VpcConfig?.SecurityGroupIds ?? []) {
          edges.push({
            sourceId: fn.FunctionArn,
            targetId: sgId,
            type: 'network',
          });
        }
      }
    }

    return { resources, edges };
  }
}
