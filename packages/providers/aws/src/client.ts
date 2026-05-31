import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import { fromNodeProviderChain, fromTemporaryCredentials } from '@aws-sdk/credential-providers';
import type { AwsCredentialIdentity, Provider } from '@aws-sdk/types';

export interface AwsClientOptions {
  region: string;
  accountId: string;
  roleArn?: string;
  externalId?: string;
  profile?: string;
  maxRetries?: number;
}

export interface AwsClientConfig {
  region: string;
  credentials: Provider<AwsCredentialIdentity>;
  maxAttempts: number;
}

export function buildClientConfig(opts: AwsClientOptions): AwsClientConfig {
  let credentials: Provider<AwsCredentialIdentity>;

  if (opts.roleArn) {
    credentials = fromTemporaryCredentials({
      masterCredentials: fromNodeProviderChain({ profile: opts.profile }),
      params: {
        RoleArn: opts.roleArn,
        RoleSessionName: `helios-scan-${opts.accountId}`,
        ExternalId: opts.externalId,
        DurationSeconds: 3600,
      },
      clientConfig: { region: opts.region },
    });
  } else {
    credentials = fromNodeProviderChain({ profile: opts.profile });
  }

  return {
    region: opts.region,
    credentials,
    maxAttempts: opts.maxRetries ?? 3,
  };
}

export async function getCurrentAccountId(region: string): Promise<string> {
  const sts = new STSClient({ region });
  const { Account } = await sts.send(new AssumeRoleCommand({
    RoleArn: 'arn:aws:iam::000000000000:role/dummy',
    RoleSessionName: 'helios-whoami',
  })).catch(async () => {
    const { STSClient: STS2, GetCallerIdentityCommand } = await import('@aws-sdk/client-sts');
    const client = new STS2({ region });
    return client.send(new GetCallerIdentityCommand({}));
  });
  return Account ?? 'unknown';
}
