import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { StateError } from '@helios-cloud/core';

export interface TerraformResource {
  address: string;
  type: string;
  name: string;
  provider: string;
  values: Record<string, unknown>;
  instances: Array<{
    attributes: Record<string, unknown>;
    dependencies?: string[];
  }>;
}

export interface TerraformStateFile {
  version: number;
  terraform_version: string;
  serial: number;
  lineage: string;
  resources: TerraformResource[];
}

export async function parseTerraformState(stateFilePath: string): Promise<TerraformStateFile> {
  if (!existsSync(stateFilePath)) {
    throw new StateError(`Terraform state file not found: ${stateFilePath}`, {
      path: stateFilePath,
    });
  }

  let raw: string;
  try {
    raw = await readFile(stateFilePath, 'utf-8');
  } catch (err) {
    throw new StateError(`Failed to read state file: ${String(err)}`, { path: stateFilePath });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new StateError(`Invalid JSON in state file: ${String(err)}`, { path: stateFilePath });
  }

  const state = parsed as TerraformStateFile;
  if (typeof state.version !== 'number' || !Array.isArray(state.resources)) {
    throw new StateError('Invalid Terraform state file format', { path: stateFilePath });
  }

  return state;
}

export function extractResourceId(resource: TerraformResource): string | undefined {
  const instance = resource.instances[0];
  if (!instance) return undefined;

  const attrs = instance.attributes;

  return (
    (attrs['arn'] as string | undefined) ??
    (attrs['id'] as string | undefined) ??
    (attrs['self_link'] as string | undefined)
  );
}

export function getStateResourcesByType(
  state: TerraformStateFile,
  resourceType: string,
): TerraformResource[] {
  return state.resources.filter(r => r.type === resourceType);
}

export function buildStateIndex(state: TerraformStateFile): Map<string, TerraformResource> {
  const index = new Map<string, TerraformResource>();
  for (const resource of state.resources) {
    const id = extractResourceId(resource);
    if (id) {
      index.set(id, resource);
    }
    index.set(resource.address, resource);
  }
  return index;
}
