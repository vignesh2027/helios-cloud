import type { Resource, DependencyEdge, ResourceFilter } from '../types/resource.js';

interface GraphNode {
  resource: Resource;
  inEdges: Set<string>;
  outEdges: Set<string>;
}

export class ResourceGraph {
  private nodes = new Map<string, GraphNode>();
  private edges: DependencyEdge[] = [];

  addResource(resource: Resource): void {
    const existing = this.nodes.get(resource.id);
    if (existing) {
      existing.resource = resource;
    } else {
      this.nodes.set(resource.id, {
        resource,
        inEdges: new Set(),
        outEdges: new Set(),
      });
    }
  }

  addEdge(edge: DependencyEdge): void {
    if (!this.nodes.has(edge.sourceId) || !this.nodes.has(edge.targetId)) {
      return;
    }
    this.edges.push(edge);
    this.nodes.get(edge.sourceId)!.outEdges.add(edge.targetId);
    this.nodes.get(edge.targetId)!.inEdges.add(edge.sourceId);
  }

  getResource(id: string): Resource | undefined {
    return this.nodes.get(id)?.resource;
  }

  getDependencies(resourceId: string): Resource[] {
    const node = this.nodes.get(resourceId);
    if (!node) return [];
    return [...node.outEdges]
      .map(id => this.nodes.get(id)?.resource)
      .filter((r): r is Resource => r !== undefined);
  }

  getDependents(resourceId: string): Resource[] {
    const node = this.nodes.get(resourceId);
    if (!node) return [];
    return [...node.inEdges]
      .map(id => this.nodes.get(id)?.resource)
      .filter((r): r is Resource => r !== undefined);
  }

  filter(filter: ResourceFilter): Resource[] {
    const results: Resource[] = [];
    for (const { resource: r } of this.nodes.values()) {
      if (filter.provider && r.provider !== filter.provider) continue;
      if (filter.region && r.region !== filter.region) continue;
      if (filter.accountId && r.accountId !== filter.accountId) continue;
      if (filter.status && r.status !== filter.status) continue;
      if (filter.type) {
        const types = Array.isArray(filter.type) ? filter.type : [filter.type];
        if (!types.includes(r.type)) continue;
      }
      if (filter.tags) {
        let tagMatch = true;
        for (const [k, v] of Object.entries(filter.tags)) {
          if (r.tags[k] !== v) { tagMatch = false; break; }
        }
        if (!tagMatch) continue;
      }
      if (filter.namePattern && r.name) {
        if (!new RegExp(filter.namePattern).test(r.name)) continue;
      }
      results.push(r);
    }
    return results;
  }

  getAll(): Resource[] {
    return [...this.nodes.values()].map(n => n.resource);
  }

  size(): number {
    return this.nodes.size;
  }

  edgeCount(): number {
    return this.edges.length;
  }

  topologicalSort(): Resource[] {
    const visited = new Set<string>();
    const result: Resource[] = [];

    const visit = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      const node = this.nodes.get(id);
      if (!node) return;
      for (const depId of node.outEdges) {
        visit(depId);
      }
      result.push(node.resource);
    };

    for (const id of this.nodes.keys()) {
      visit(id);
    }

    return result.reverse();
  }

  getOrphanedResources(): Resource[] {
    const orphans: Resource[] = [];
    for (const { resource, inEdges, outEdges } of this.nodes.values()) {
      if (inEdges.size === 0 && outEdges.size === 0) {
        orphans.push(resource);
      }
    }
    return orphans;
  }

  merge(other: ResourceGraph): void {
    for (const { resource } of other.nodes.values()) {
      this.addResource(resource);
    }
    for (const edge of other.edges) {
      this.addEdge(edge);
    }
  }

  toJSON(): { nodes: Resource[]; edges: DependencyEdge[] } {
    return { nodes: this.getAll(), edges: this.edges };
  }
}
