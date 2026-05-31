import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { parse as parseYaml } from 'yaml';
import { HeliosConfigSchema, type HeliosConfig } from './schema.js';
import { ConfigurationError } from '../errors/index.js';

export async function loadConfig(configPath: string): Promise<HeliosConfig> {
  if (!existsSync(configPath)) {
    return HeliosConfigSchema.parse({
      version: '1',
      providers: {
        aws: {
          regions: [process.env['AWS_REGION'] ?? 'us-east-1'],
          accounts: [{ id: process.env['AWS_ACCOUNT_ID'] ?? '000000000000' }],
        },
      },
    });
  }

  let raw: string;
  try {
    raw = await readFile(configPath, 'utf-8');
  } catch (err) {
    throw new ConfigurationError(`Failed to read config file: ${String(err)}`, 'configPath');
  }

  let parsed: unknown;
  try {
    parsed = parseYaml(raw);
  } catch (err) {
    throw new ConfigurationError(`Invalid YAML in config file: ${String(err)}`, 'configPath');
  }

  try {
    return HeliosConfigSchema.parse(parsed);
  } catch (err) {
    throw new ConfigurationError(`Invalid configuration: ${String(err)}`);
  }
}
