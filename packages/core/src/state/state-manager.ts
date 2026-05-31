import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { Resource } from '../types/resource.js';
import { ResourceGraph } from '../graph/resource-graph.js';
import { StateError } from '../errors/index.js';

export interface StateSnapshot {
  id: string;
  version: number;
  createdAt: Date;
  resources: Resource[];
  checksum: string;
}

export interface StateStore {
  snapshots: StateSnapshot[];
  currentVersion: number;
  lastUpdated: Date;
  accountId: string;
  provider: string;
}

export class StateManager {
  private store: StateStore | null = null;
  private graph: ResourceGraph = new ResourceGraph();
  private readonly stateFilePath: string;

  constructor(
    private readonly accountId: string,
    private readonly provider: string,
    stateDir = '.helios/state',
  ) {
    this.stateFilePath = join(stateDir, `${provider}-${accountId}.json`);
  }

  async load(): Promise<void> {
    if (!existsSync(this.stateFilePath)) {
      this.store = {
        snapshots: [],
        currentVersion: 0,
        lastUpdated: new Date(),
        accountId: this.accountId,
        provider: this.provider,
      };
      return;
    }

    try {
      const raw = await readFile(this.stateFilePath, 'utf-8');
      const parsed = JSON.parse(raw) as StateStore;
      parsed.lastUpdated = new Date(parsed.lastUpdated);
      parsed.snapshots = parsed.snapshots.map(s => ({
        ...s,
        createdAt: new Date(s.createdAt),
      }));
      this.store = parsed;
      this.rebuildGraph();
    } catch (err) {
      throw new StateError('Failed to load state file', {
        path: this.stateFilePath,
        error: String(err),
      });
    }
  }

  async save(): Promise<void> {
    if (!this.store) throw new StateError('State not loaded');

    await mkdir(dirname(this.stateFilePath), { recursive: true });
    this.store.lastUpdated = new Date();
    await writeFile(this.stateFilePath, JSON.stringify(this.store, null, 2), 'utf-8');
  }

  async snapshot(resources: Resource[]): Promise<StateSnapshot> {
    if (!this.store) throw new StateError('State not loaded');

    const snap: StateSnapshot = {
      id: uuidv4(),
      version: this.store.currentVersion + 1,
      createdAt: new Date(),
      resources,
      checksum: this.computeChecksum(resources),
    };

    this.store.snapshots.push(snap);
    this.store.currentVersion = snap.version;

    if (this.store.snapshots.length > 100) {
      this.store.snapshots = this.store.snapshots.slice(-100);
    }

    for (const r of resources) {
      this.graph.addResource(r);
    }

    await this.save();
    return snap;
  }

  getCurrentResources(): Resource[] {
    if (!this.store || this.store.snapshots.length === 0) return [];
    const latest = this.store.snapshots[this.store.snapshots.length - 1];
    return latest?.resources ?? [];
  }

  getSnapshot(version: number): StateSnapshot | undefined {
    return this.store?.snapshots.find(s => s.version === version);
  }

  getPreviousSnapshot(): StateSnapshot | undefined {
    const snaps = this.store?.snapshots ?? [];
    return snaps.length >= 2 ? snaps[snaps.length - 2] : undefined;
  }

  getDiff(
    prev: StateSnapshot,
    curr: StateSnapshot,
  ): { added: Resource[]; removed: Resource[]; modified: Resource[] } {
    const prevMap = new Map(prev.resources.map(r => [r.id, r]));
    const currMap = new Map(curr.resources.map(r => [r.id, r]));

    const added = curr.resources.filter(r => !prevMap.has(r.id));
    const removed = prev.resources.filter(r => !currMap.has(r.id));
    const modified = curr.resources.filter(r => {
      const old = prevMap.get(r.id);
      return old && JSON.stringify(old) !== JSON.stringify(r);
    });

    return { added, removed, modified };
  }

  getGraph(): ResourceGraph {
    return this.graph;
  }

  private rebuildGraph(): void {
    const resources = this.getCurrentResources();
    for (const r of resources) {
      this.graph.addResource(r);
    }
  }

  private computeChecksum(resources: Resource[]): string {
    const str = JSON.stringify(resources.map(r => r.id).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }
}
