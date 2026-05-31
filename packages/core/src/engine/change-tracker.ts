import type { Resource } from '../types/resource.js';
import { eventBus } from '../events/bus.js';

export class ChangeTracker {
  private readonly previous = new Map<string, Resource>();

  track(current: Resource[]): {
    added: Resource[];
    removed: Resource[];
    modified: Resource[];
  } {
    const currentMap = new Map(current.map(r => [r.id, r]));

    const added: Resource[] = [];
    const removed: Resource[] = [];
    const modified: Resource[] = [];

    for (const resource of current) {
      const prev = this.previous.get(resource.id);
      if (!prev) {
        added.push(resource);
        eventBus.emit('resource:discovered', { resource });
      } else if (this.hasChanged(prev, resource)) {
        modified.push(resource);
        eventBus.emit('resource:updated', { resource, previous: prev });
      }
    }

    for (const [id, prev] of this.previous) {
      if (!currentMap.has(id)) {
        removed.push(prev);
        eventBus.emit('resource:deleted', { resourceId: id, type: prev.type });
      }
    }

    this.previous.clear();
    for (const r of current) {
      this.previous.set(r.id, r);
    }

    return { added, removed, modified };
  }

  private hasChanged(prev: Resource, curr: Resource): boolean {
    return (
      prev.status !== curr.status ||
      JSON.stringify(prev.metadata) !== JSON.stringify(curr.metadata) ||
      JSON.stringify(prev.tags) !== JSON.stringify(curr.tags)
    );
  }

  reset(): void {
    this.previous.clear();
  }
}
