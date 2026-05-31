import {
  S3Client,
  ListBucketsCommand,
  GetBucketLocationCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetBucketPolicyStatusCommand,
  GetBucketTaggingCommand,
  GetBucketLifecycleConfigurationCommand,
} from '@aws-sdk/client-s3';
import type { Resource } from '@helios-cloud/core';
import type { AwsClientConfig } from '../client.js';

export class S3Scanner {
  private readonly client: S3Client;

  constructor(
    private readonly config: AwsClientConfig,
    private readonly accountId: string,
  ) {
    this.client = new S3Client(config);
  }

  async scanBuckets(): Promise<{ resources: Resource[] }> {
    const resources: Resource[] = [];

    const { Buckets } = await this.client.send(new ListBucketsCommand({}));
    if (!Buckets) return { resources };

    await Promise.allSettled(
      Buckets.map(async bucket => {
        if (!bucket.Name) return;

        const [location, encryption, versioning, policyStatus, tags, lifecycle] =
          await Promise.allSettled([
            this.client.send(new GetBucketLocationCommand({ Bucket: bucket.Name })),
            this.client.send(new GetBucketEncryptionCommand({ Bucket: bucket.Name })),
            this.client.send(new GetBucketVersioningCommand({ Bucket: bucket.Name })),
            this.client.send(new GetBucketPolicyStatusCommand({ Bucket: bucket.Name })),
            this.client.send(new GetBucketTaggingCommand({ Bucket: bucket.Name })),
            this.client.send(new GetBucketLifecycleConfigurationCommand({ Bucket: bucket.Name })),
          ]);

        const region =
          location.status === 'fulfilled'
            ? (location.value.LocationConstraint ?? 'us-east-1')
            : this.config.region;

        const bucketTags: Record<string, string> = {};
        if (tags.status === 'fulfilled') {
          for (const tag of tags.value.TagSet ?? []) {
            if (tag.Key && tag.Value) bucketTags[tag.Key] = tag.Value;
          }
        }

        const isEncrypted =
          encryption.status === 'fulfilled' &&
          (encryption.value.ServerSideEncryptionConfiguration?.Rules?.length ?? 0) > 0;

        const isPublic =
          policyStatus.status === 'fulfilled' &&
          policyStatus.value.PolicyStatus?.IsPublic === true;

        const versioningEnabled =
          versioning.status === 'fulfilled' &&
          versioning.value.Status === 'Enabled';

        const lifecycleRules =
          lifecycle.status === 'fulfilled'
            ? lifecycle.value.Rules?.length ?? 0
            : 0;

        resources.push({
          id: `arn:aws:s3:::${bucket.Name}`,
          type: 's3:bucket',
          provider: 'aws',
          region,
          accountId: this.accountId,
          arn: `arn:aws:s3:::${bucket.Name}`,
          name: bucket.Name,
          status: 'active',
          tags: bucketTags,
          metadata: {
            isEncrypted,
            isPublic,
            versioningEnabled,
            lifecycleRules,
            creationDate: bucket.CreationDate,
          },
          createdAt: bucket.CreationDate,
        });
      }),
    );

    return { resources };
  }
}
