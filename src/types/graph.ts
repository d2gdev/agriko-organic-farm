// Graph database and relationship types

export interface GraphNode {
  id: string | number;
  labels: string[];
  properties: GraphNodeProperties;
}

export interface GraphNodeProperties {
  id?: string | number;
  name?: string;
  type?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface GraphRelationship {
  id: string | number;
  type: string;
  startNodeId: string | number;
  endNodeId: string | number;
  properties: GraphRelationshipProperties;
}

export interface GraphRelationshipProperties {
  strength?: number;
  weight?: number;
  confidence?: number;
  createdAt?: string;
  source?: string;
  [key: string]: unknown;
}

export interface GraphPath {
  nodes: GraphNode[];
  relationships: GraphRelationship[];
  length: number;
  totalWeight?: number;
}

export interface GraphStats {
  nodeCount: number;
  relationshipCount: number;
  nodeTypes: Array<{
    label: string;
    count: number;
  }>;
  relationshipTypes: Array<{
    type: string;
    count: number;
  }>;
  strongestConnections: Array<{
    source: string;
    target: string;
    strength: number;
  }>;
}

export interface ProductGraphNode extends GraphNode {
  properties: {
    id: number;
    name: string;
    slug: string;
    price?: number;
    categories?: string[];
    inStock?: boolean;
    featured?: boolean;
    description?: string;
  };
}

export interface HealthBenefitNode extends GraphNode {
  properties: {
    name: string;
    description: string;
    category?: string;
    scientificEvidence?: string;
    severity?: 'low' | 'medium' | 'high';
  };
}

export interface CategoryNode extends GraphNode {
  properties: {
    id: number;
    name: string;
    slug: string;
    parentId?: number;
    description?: string;
    productCount?: number;
  };
}

export interface RecommendationScore {
  productId: number;
  score: number;
  reasons: string[];
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface GraphQuery {
  query: string;
  parameters?: Record<string, unknown>;
  limit?: number;
  timeout?: number;
}

export interface GraphQueryResult<T = unknown> {
  records: T[];
  summary: {
    executionTime: number;
    recordCount: number;
    query: string;
  };
  error?: string;
}