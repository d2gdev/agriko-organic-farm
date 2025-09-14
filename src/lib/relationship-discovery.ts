// Relationship Discovery System - Automatically find connections between all entities
import { getSession } from './memgraph';
import { logger } from '@/lib/logger';

import neo4j from 'neo4j-driver';

// Neo4j type interfaces
interface Neo4jValue {
  toNumber?(): number;
  toString?(): string;
  toBoolean?(): boolean;
}

interface Neo4jNode {
  labels: string[];
  properties: Record<string, unknown>;
}

interface Neo4jRelationship {
  type: string;
  properties: Record<string, unknown>;
}

interface Neo4jPath {
  segments: Neo4jPathSegment[];
  end: Neo4jNode;
}

interface Neo4jRecord {
  get(key: string): Neo4jValue | Neo4jNode | Neo4jRelationship | Neo4jPath;
}

interface Neo4jPathSegment {
  start: Neo4jNode;
  relationship: Neo4jRelationship;
}

interface ConnectedEntity {
  type: string;
  id: string | number;
  name: string;
  properties: Record<string, unknown>;
}

// Helper functions for safe Neo4j record access
function getNodeFromRecord(record: Neo4jRecord, key: string): Neo4jNode {
  const value = record.get(key) as Neo4jNode;
  return value;
}

function getRelationshipFromRecord(record: Neo4jRecord, key: string): Neo4jRelationship {
  const value = record.get(key) as Neo4jRelationship;
  return value;
}

function getValueFromRecord(record: Neo4jRecord, key: string): Neo4jValue {
  const value = record.get(key) as Neo4jValue;
  return value;
}

function getPathFromRecord(record: Neo4jRecord, key: string): Neo4jPath {
  const value = record.get(key) as Neo4jPath;
  return value;
}

function getNumberFromValue(value: Neo4jValue | undefined): number {
  if (!value || typeof value.toNumber !== 'function') return 0;
  return value.toNumber();
}

function getStringProperty(properties: Record<string, unknown>, key: string, fallback: string = 'Unknown'): string {
  const value = properties[key];
  return typeof value === 'string' ? value : fallback;
}

function getStringOrNumberProperty(properties: Record<string, unknown>, key: string): string | number {
  const value = properties[key];
  return typeof value === 'string' || typeof value === 'number' ? value : 'Unknown';
}

// Interface for discovered relationships
export interface DiscoveredRelationship {
  source: {
    type: string;
    id: string | number;
    name: string;
  };
  target: {
    type: string;
    id: string | number;
    name: string;
  };
  relationship: {
    type: string;
    properties: Record<string, unknown>;
  };
  path: string;
  strength: number; // 0-1 scale
}

// Interface for complex relationship paths
export interface RelationshipPath {
  nodes: Array<{
    type: string;
    id: string | number;
    name: string;
  }>;
  relationships: Array<{
    type: string;
    properties: Record<string, unknown>;
  }>;
  strength: number; // Overall path strength
  explanation: string;
}

/**
 * Discover direct relationships for a given entity
 */
export async function discoverDirectRelationships(
  entityType: string,
  entityId: string | number,
  limit: number = 20
): Promise<DiscoveredRelationship[]> {
  const session = await getSession();
  
  try {
    // Query to find all direct relationships
    const query = `
      MATCH (source:${entityType} {${typeof entityId === 'number' ? 'id' : 'id'}: $entityId})-[rel]-(target)
      RETURN source, rel, target
      LIMIT $limit
    `;
    
    const result = await session.run(query, {
      entityId: typeof entityId === 'number' ? entityId : entityId,
      limit
    });
    
    return result.records.map((record: Neo4jRecord) => { // Fix the implicit any type
      const sourceNode = getNodeFromRecord(record, 'source');
      const relationshipNode = getRelationshipFromRecord(record, 'rel');
      const targetNode = getNodeFromRecord(record, 'target');
      
      const sourceProps = sourceNode.properties;
      const targetProps = targetNode.properties;
      
      return {
        source: {
          type: sourceNode.labels[0] ?? 'Unknown',
          id: getStringOrNumberProperty(sourceProps, 'id') !== 'Unknown' ? getStringOrNumberProperty(sourceProps, 'id') : getStringOrNumberProperty(sourceProps, 'name'),
          name: getStringProperty(sourceProps, 'name') !== 'Unknown' ? getStringProperty(sourceProps, 'name') : getStringProperty(sourceProps, 'title')
        },
        target: {
          type: targetNode.labels[0] ?? 'Unknown',
          id: getStringOrNumberProperty(targetProps, 'id') !== 'Unknown' ? getStringOrNumberProperty(targetProps, 'id') : getStringOrNumberProperty(targetProps, 'name'),
          name: getStringProperty(targetProps, 'name') !== 'Unknown' ? getStringProperty(targetProps, 'name') : getStringProperty(targetProps, 'title')
        },
        relationship: {
          type: relationshipNode.type,
          properties: relationshipNode.properties
        },
        path: `${getStringProperty(sourceProps, 'name') !== 'Unknown' ? getStringProperty(sourceProps, 'name') : getStringProperty(sourceProps, 'title')} -[${relationshipNode.type}]-> ${getStringProperty(targetProps, 'name') !== 'Unknown' ? getStringProperty(targetProps, 'name') : getStringProperty(targetProps, 'title')}`,
        strength: calculateRelationshipStrength(relationshipNode.properties)
      };
    });
  } catch (error) {
    logger.error(`❌ Failed to discover direct relationships for ${entityType}:${entityId}`, error as Record<string, unknown>);
    return [];
  } finally {
    await session.close();
  }
}

/**
 * Discover multi-hop relationship paths between entities
 */
export async function discoverRelationshipPaths(
  sourceType: string,
  sourceId: string | number,
  targetType: string,
  targetId: string | number,
  maxHops: number = 3,
  limit: number = 10
): Promise<RelationshipPath[]> {
  const session = await getSession();
  
  try {
    // Query to find paths between source and target
    const query = `
      MATCH path = (source:${sourceType} {${typeof sourceId === 'number' ? 'id' : 'id'}: $sourceId})-[*1..${maxHops}]-(target:${targetType} {${typeof targetId === 'number' ? 'id' : 'id'}: $targetId})
      WITH path, 
           REDUCE(s = 0, r IN relationships(path) | s + CASE WHEN EXISTS(r.strength) THEN r.strength ELSE 0.5 END) AS totalStrength
      RETURN path, totalStrength
      ORDER BY totalStrength DESC
      LIMIT $limit
    `;
    
    const result = await session.run(query, {
      sourceId: typeof sourceId === 'number' ? sourceId : sourceId,
      targetId: typeof targetId === 'number' ? targetId : targetId,
      limit
    });
    
    return result.records.map(record => {
      const path = getPathFromRecord(record, 'path');
      const totalStrengthValue = getValueFromRecord(record, 'totalStrength');
      const totalStrength = getNumberFromValue(totalStrengthValue);
      
      // Extract nodes and relationships from the path
      const nodeProperties = path.segments.map((segment: Neo4jPathSegment) => segment.start.properties)
        .concat([path.end.properties]);
      
      const nodes = nodeProperties.map((nodeProps: Record<string, unknown>, index: number) => ({
        type: index < path.segments.length ? path.segments[index]?.start.labels[0] ?? 'Unknown' : path.end.labels[0] ?? 'Unknown',
        id: getStringOrNumberProperty(nodeProps, 'id') !== 'Unknown' ? getStringOrNumberProperty(nodeProps, 'id') : getStringOrNumberProperty(nodeProps, 'name'),
        name: getStringProperty(nodeProps, 'name') !== 'Unknown' ? getStringProperty(nodeProps, 'name') : getStringProperty(nodeProps, 'title')
      }));
      
      const relationships = path.segments.map((segment: Neo4jPathSegment) => ({
        type: segment.relationship.type,
        properties: segment.relationship.properties
      }));
      
      return {
        nodes,
        relationships,
        strength: totalStrength / Math.max(relationships.length, 1), // Normalize by path length
        explanation: generatePathExplanation(nodes, relationships)
      };
    });
  } catch (error) {
    logger.error(`❌ Failed to discover relationship paths from ${sourceType}:${sourceId} to ${targetType}:${targetId}`, error as Record<string, unknown>);
    return [];
  } finally {
    await session.close();
  }
}

/**
 * Find entities that are connected through shared relationships
 */
export async function findConnectedEntities(
  entityType: string,
  entityId: string | number,
  connectionTypes: string[] = [],
  limit: number = 20
): Promise<Array<{ entity: ConnectedEntity; connectionStrength: number; commonRelationships: string[] }>> {
  const session = await getSession();
  
  try {
    let query: string;
    const params: Record<string, unknown> = {
      entityId: typeof entityId === 'number' ? entityId : entityId,
      limit
    };
    
    if (connectionTypes.length > 0) {
      // Find entities connected through specific relationship types
      const relationshipPattern = connectionTypes.map(type => `[:${type}]`).join('|');
      query = `
        MATCH (source:${entityType} {${typeof entityId === 'number' ? 'id' : 'id'}: $entityId})-[rel:${relationshipPattern}]-(connected)
        WITH connected, COUNT(rel) as connectionCount, COLLECT(TYPE(rel)) as relTypes
        RETURN connected, connectionCount, relTypes
        ORDER BY connectionCount DESC
        LIMIT $limit
      `;
    } else {
      // Find all connected entities
      query = `
        MATCH (source:${entityType} {${typeof entityId === 'number' ? 'id' : 'id'}: $entityId})-[rel]-(connected)
        WITH connected, COUNT(rel) as connectionCount, COLLECT(TYPE(rel)) as relTypes
        RETURN connected, connectionCount, relTypes
        ORDER BY connectionCount DESC
        LIMIT $limit
      `;
    }
    
    const result = await session.run(query, params);
    
    return result.records.map(record => {
      const connectedNode = getNodeFromRecord(record, 'connected');
      const connectionCountValue = getValueFromRecord(record, 'connectionCount');
      const connectionCount = getNumberFromValue(connectionCountValue);
      const relTypesValue = getValueFromRecord(record, 'relTypes');
      
      const connected = connectedNode.properties;
      
      return {
        entity: {
          type: connectedNode.labels[0] ?? 'Unknown',
          id: getStringOrNumberProperty(connected, 'id') !== 'Unknown' ? getStringOrNumberProperty(connected, 'id') : getStringOrNumberProperty(connected, 'name'),
          name: getStringProperty(connected, 'name') !== 'Unknown' ? getStringProperty(connected, 'name') : getStringProperty(connected, 'title'),
          properties: connected
        },
        connectionStrength: connectionCount,
        commonRelationships: Array.isArray(relTypesValue) ? (relTypesValue as unknown[]).map(String) : []
      };
    });
  } catch (error) {
    logger.error(`❌ Failed to find connected entities for ${entityType}:${entityId}`, error as Record<string, unknown>);
    return [];
  } finally {
    await session.close();
  }
}

/**
 * Discover transitive relationships (A relates to B, B relates to C, therefore A relates to C)
 */
export async function discoverTransitiveRelationships(
  entityType: string,
  entityId: string | number,
  relationshipType: string,
  transitiveType: string,
  limit: number = 10
): Promise<DiscoveredRelationship[]> {
  const session = await getSession();
  
  try {
    const query = `
      MATCH (source:${entityType} {${typeof entityId === 'number' ? 'id' : 'id'}: $entityId})-[:${relationshipType}]->(intermediate)-[:${transitiveType}]->(target)
      WHERE source <> target
      RETURN source, intermediate, target
      LIMIT $limit
    `;
    
    const result = await session.run(query, {
      entityId: typeof entityId === 'number' ? entityId : entityId,
      limit
    });
    
    return result.records.map((record: Neo4jRecord) => { // Fix the implicit any type
      const sourceNode = getNodeFromRecord(record, 'source');
      const intermediateNode = getNodeFromRecord(record, 'intermediate');
      const targetNode = getNodeFromRecord(record, 'target');
      
      const sourceProps = sourceNode.properties;
      const intermediateProps = intermediateNode.properties;
      const targetProps = targetNode.properties;
      
      return {
        source: {
          type: sourceNode.labels[0] ?? 'Unknown',
          id: getStringOrNumberProperty(sourceProps, 'id') !== 'Unknown' ? getStringOrNumberProperty(sourceProps, 'id') : getStringOrNumberProperty(sourceProps, 'name'),
          name: getStringProperty(sourceProps, 'name') !== 'Unknown' ? getStringProperty(sourceProps, 'name') : getStringProperty(sourceProps, 'title')
        },
        target: {
          type: targetNode.labels[0] ?? 'Unknown',
          id: getStringOrNumberProperty(targetProps, 'id') !== 'Unknown' ? getStringOrNumberProperty(targetProps, 'id') : getStringOrNumberProperty(targetProps, 'name'),
          name: getStringProperty(targetProps, 'name') !== 'Unknown' ? getStringProperty(targetProps, 'name') : getStringProperty(targetProps, 'title')
        },
        relationship: {
          type: 'TRANSITIVE',
          properties: {}
        },
        path: `${getStringProperty(sourceProps, 'name') !== 'Unknown' ? getStringProperty(sourceProps, 'name') : getStringProperty(sourceProps, 'title')} -[${relationshipType}]-> ${getStringProperty(intermediateProps, 'name') !== 'Unknown' ? getStringProperty(intermediateProps, 'name') : getStringProperty(intermediateProps, 'title')} -[${transitiveType}]-> ${getStringProperty(targetProps, 'name') !== 'Unknown' ? getStringProperty(targetProps, 'name') : getStringProperty(targetProps, 'title')}`,
        strength: 0.7 // Default strength for transitive relationships
      };
    });
  } catch (error) {
    logger.error(`❌ Failed to discover transitive relationships for ${entityType}:${entityId}`, error as Record<string, unknown>);
    return [];
  } finally {
    await session.close();
  }
}

/**
 * Get relationship statistics for the entire graph
 */
export async function getRelationshipStatistics(): Promise<{
  relationshipTypes: Array<{ type: string; count: number }>;
  strengthDistribution: Array<{ type: string; average: number; minimum: number; maximum: number }>;
}> {
  const session = await getSession();
  
  try {
    // Get counts for all relationship types
    const relationshipCounts = await session.run(`
      MATCH ()-[r]->()
      RETURN TYPE(r) as relationshipType, COUNT(r) as count
      ORDER BY count DESC
    `);
    
    // Get average connection strength by type
    const strengthStats = await session.run(`
      MATCH ()-[r]->()
      WHERE EXISTS(r.strength)
      RETURN TYPE(r) as relationshipType, AVG(r.strength) as avgStrength, MIN(r.strength) as minStrength, MAX(r.strength) as maxStrength
      ORDER BY avgStrength DESC
    `);
    
    return {
      relationshipTypes: relationshipCounts.records.map(record => {
        const relationshipTypeValue = getValueFromRecord(record, 'relationshipType');
        const countValue = getValueFromRecord(record, 'count');
        return {
          type: typeof relationshipTypeValue === 'string' ? relationshipTypeValue : String(relationshipTypeValue),
          count: getNumberFromValue(countValue)
        };
      }),
      strengthDistribution: strengthStats.records.map(record => {
        const relationshipTypeValue = getValueFromRecord(record, 'relationshipType');
        const avgStrengthValue = getValueFromRecord(record, 'avgStrength');
        const minStrengthValue = getValueFromRecord(record, 'minStrength');
        const maxStrengthValue = getValueFromRecord(record, 'maxStrength');
        return {
          type: typeof relationshipTypeValue === 'string' ? relationshipTypeValue : String(relationshipTypeValue),
          average: getNumberFromValue(avgStrengthValue),
          minimum: getNumberFromValue(minStrengthValue),
          maximum: getNumberFromValue(maxStrengthValue)
        };
      })
    };
  } catch (error) {
    logger.error('❌ Failed to get relationship statistics', error as Record<string, unknown>);
    return { relationshipTypes: [], strengthDistribution: [] };
  } finally {
    await session.close();
  }
}

/**
 * Discover all possible relationships in the graph
 */
export async function discoverAllRelationships(limit: number = 100): Promise<Array<{
  source: { type: string; name: string };
  relationship: string;
  target: { type: string; name: string };
  properties: Record<string, unknown>;
}>> {
  const session = await getSession();
  try {
    const result = await session.run(`
      MATCH (a)-[r]->(b)
      RETURN 
        labels(a)[0] as sourceType,
        a.name as sourceName,
        type(r) as relationshipType,
        labels(b)[0] as targetType,
        b.name as targetName,
        r
      ORDER BY rand()
      LIMIT $limit
    `, {
      limit: limit
    });

    return result.records.map(record => {
      const sourceTypeValue = getValueFromRecord(record, 'sourceType');
      const sourceNameValue = getValueFromRecord(record, 'sourceName');
      const relationshipTypeValue = getValueFromRecord(record, 'relationshipType');
      const targetTypeValue = getValueFromRecord(record, 'targetType');
      const targetNameValue = getValueFromRecord(record, 'targetName');
      const relationshipNode = getRelationshipFromRecord(record, 'r');
      
      return {
        source: {
          type: typeof sourceTypeValue === 'string' ? sourceTypeValue : String(sourceTypeValue),
          name: typeof sourceNameValue === 'string' ? sourceNameValue : String(sourceNameValue)
        },
        relationship: typeof relationshipTypeValue === 'string' ? relationshipTypeValue : String(relationshipTypeValue),
        target: {
          type: typeof targetTypeValue === 'string' ? targetTypeValue : String(targetTypeValue),
          name: typeof targetNameValue === 'string' ? targetNameValue : String(targetNameValue)
        },
        properties: relationshipNode.properties
      };
    });
  } catch (error) {
    logger.error('❌ Failed to discover all relationships:', error as Record<string, unknown>);
    return [];
  } finally {
    await session.close();
  }
}

/**
 * Calculate relationship strength based on properties
 */
function calculateRelationshipStrength(properties: Record<string, unknown>): number {
  // If explicit strength is provided, use it
  if (properties.strength !== undefined) {
    const strength = typeof properties.strength === 'number' ? properties.strength : 0.5;
    return Math.max(0, Math.min(1, strength));
  }
  
  // Otherwise, calculate based on common properties
  let strength = 0.5; // Default medium strength
  
  // Increase strength for positive indicators
  if (properties.evidenceLevel === 'clinical' || properties.evidenceLevel === 'proven') {
    strength += 0.3;
  } else if (properties.evidenceLevel === 'traditional') {
    strength += 0.1;
  }
  
  if (properties.quality === 'excellent' || properties.quality === 'premium') {
    strength += 0.2;
  } else if (properties.quality === 'good') {
    strength += 0.1;
  }
  
  if (properties.effectiveness === 'proven' || properties.effectiveness === 'clinical') {
    strength += 0.3;
  } else if (properties.effectiveness === 'traditional') {
    strength += 0.1;
  }
  
  // Decrease strength for negative indicators
  if (properties.sideEffects && Array.isArray(properties.sideEffects) && properties.sideEffects.length > 0) {
    strength -= 0.1;
  }
  
  if (properties.contraindications && Array.isArray(properties.contraindications) && properties.contraindications.length > 0) {
    strength -= 0.2;
  }
  
  // Ensure strength is between 0 and 1
  return Math.max(0, Math.min(1, strength));
}

/**
 * Generate human-readable explanation for a relationship path
 */
function generatePathExplanation(
  nodes: Array<{ type: string; id: string | number; name: string }>,
  relationships: Array<{ type: string; properties: Record<string, unknown> }>
): string {
  if (nodes.length < 2) return 'Direct relationship';
  
  const explanations: string[] = [];
  
  for (let i = 0; i < relationships.length; i++) {
    const source = nodes[i];
    const target = nodes[i + 1];
    const rel = relationships[i];
    
    if (!source || !target || !rel) continue;
    
    switch (rel.type) {
      case 'CONTAINS':
        explanations.push(`${source.name} contains ${target.name}`);
        break;
      case 'GROWN_IN':
        explanations.push(`${source.name} is grown in ${target.name}`);
        break;
      case 'HARVESTED_IN':
        explanations.push(`${source.name} is harvested in ${target.name}`);
        break;
      case 'TREATS':
        explanations.push(`${source.name} treats ${target.name}`);
        break;
      case 'RICH_IN':
        explanations.push(`${source.name} is rich in ${target.name}`);
        break;
      case 'BELONGS_TO':
        explanations.push(`${source.name} belongs to ${target.name}`);
        break;
      case 'PROVIDES':
        explanations.push(`${source.name} provides ${target.name}`);
        break;
      default:
        explanations.push(`${source.name} is ${rel.type.toLowerCase()} ${target.name}`);
    }
  }
  
  return explanations.join(', which means ');
}

/**
 * Wrapper function for findConnectedEntities to match API route expectations
 */
export async function findConnectedEntitiesWrapper(
  sourceId: string | number,
  sourceType: string,
  limit: number = 20
): Promise<Array<{ entity: ConnectedEntity; connectionStrength: number; commonRelationships: string[] }>> {
  return findConnectedEntities(sourceType, sourceId, [], limit);
}

/**
 * Wrapper function for discoverDirectRelationships to match API route expectations
 */
export async function findDirectRelationships(
  sourceId: string | number,
  sourceType: string,
  targetType: string,
  limit: number = 20
): Promise<DiscoveredRelationship[]> {
  // For now, we'll implement a simple wrapper
  // A more complete implementation would find relationships between source and target types
  return discoverDirectRelationships(sourceType, sourceId, limit);
}

/**
 * Find multi-hop relationship paths between entities
 */
export async function findMultiHopPaths(
  sourceId: string | number,
  sourceType: string,
  targetType: string,
  maxDepth: number = 3,
  limit: number = 10
): Promise<RelationshipPath[]> {
  const session = await getSession();
  
  try {
    logger.info('🔍 Finding multi-hop paths', { 
      sourceId, 
      sourceType, 
      targetType, 
      maxDepth 
    });

    // Use Cypher to find variable-length paths between entity types
    const query = `
      MATCH path = (source:${sourceType} {${typeof sourceId === 'number' ? 'id' : 'id'}: $sourceId})
                   -[*1..${maxDepth}]->
                   (target:${targetType})
      WHERE source <> target
      WITH path, 
           length(path) as pathLength,
           relationships(path) as rels,
           nodes(path) as pathNodes
      RETURN path, pathLength, rels, pathNodes
      ORDER BY pathLength ASC
      LIMIT $limit
    `;

    const result = await session.run(query, {
      sourceId: typeof sourceId === 'number' ? sourceId : sourceId,
      limit
    });

    const paths: RelationshipPath[] = [];

    for (const record of result.records) {
      try {
        const pathLength = getNumberFromValue(getValueFromRecord(record, 'pathLength'));
        const pathNodes = record.get('pathNodes') as Neo4jNode[];
        const rels = record.get('rels') as Neo4jRelationship[];

        // Convert path to our format
        const nodes = pathNodes.map(node => ({
          type: node.labels[0] ?? 'Unknown',
          id: getStringOrNumberProperty(node.properties, 'id'),
          name: getStringProperty(node.properties, 'name') ?? 
                getStringProperty(node.properties, 'title') ??
                `${node.labels[0] ?? 'Unknown'} ${getStringOrNumberProperty(node.properties, 'id')}`
        }));

        const relationships = rels.map(rel => ({
          type: rel.type,
          properties: rel.properties
        }));

        // Calculate path strength based on relationship types and path length
        const strength = calculatePathStrength(relationships, pathLength);

        // Generate explanation
        const explanation = generateSimplePathExplanation(nodes, relationships);

        paths.push({
          nodes,
          relationships,
          strength,
          explanation
        });

      } catch (error) {
        logger.warn('Error processing path record:', error as Record<string, unknown>);
        continue;
      }
    }

    logger.info(`✅ Found ${paths.length} multi-hop paths`);
    return paths;

  } catch (error) {
    logger.error('❌ Error finding multi-hop paths:', error as Record<string, unknown>);
    return []; // Add the missing return statement

  } finally {
    await session.close();
  }
}

/**
 * Find transitive relationships (A->B, B->C, therefore A->C)
 */
export async function findTransitiveRelationships(limit: number = 10): Promise<DiscoveredRelationship[]> {
  const session = await getSession();
  
  try {
    logger.info('🔍 Finding transitive relationships', { limit });

    // Find patterns where entities are transitively connected through intermediates
    const query = `
      MATCH (a)-[r1]->(b)-[r2]->(c)
      WHERE a <> c AND NOT (a)-[]->(c) // Ensure no direct relationship exists
      WITH a, c, count(*) as transitiveCount, 
           collect(distinct type(r1)) as rel1Types,
           collect(distinct type(r2)) as rel2Types,
           collect(distinct b) as intermediates
      WHERE transitiveCount >= 2 // At least 2 paths through different intermediates
      RETURN a, c, transitiveCount, rel1Types, rel2Types, intermediates
      ORDER BY transitiveCount DESC
      LIMIT $limit
    `;

    const result = await session.run(query, { limit });

    const relationships: DiscoveredRelationship[] = [];

    for (const record of result.records) {
      try {
        const sourceNode = getNodeFromRecord(record, 'a');
        const targetNode = getNodeFromRecord(record, 'c');
        const transitiveCount = getNumberFromValue(getValueFromRecord(record, 'transitiveCount'));
        const rel1Types = record.get('rel1Types') as string[];
        const rel2Types = record.get('rel2Types') as string[];
        const intermediates = record.get('intermediates') as Neo4jNode[];

        // Create a synthetic relationship representing the transitive connection
        const transitiveRelType = `TRANSITIVE_${rel1Types[0] ?? 'RELATED'}_${rel2Types[0] ?? 'TO'}`;
        
        const sourceProps = sourceNode.properties;
        const targetProps = targetNode.properties;

        // Calculate strength based on number of transitive paths
        const strength = Math.min(transitiveCount / 5, 1); // Normalize to 0-1

        // Create path description
        const intermediateNames = intermediates.slice(0, 3).map(node => 
          getStringProperty(node.properties, 'name') ?? 
          getStringProperty(node.properties, 'title') ??
          `${node.labels[0] ?? 'Entity'}`
        );
        
        const pathDescription = intermediateNames.length > 0 
          ? `through ${intermediateNames.join(', ')}${intermediates.length > 3 ? ` and ${intermediates.length - 3} others` : ''}`
          : 'through multiple intermediates';

        relationships.push({
          source: {
            type: sourceNode.labels[0] ?? 'Unknown',
            id: getStringOrNumberProperty(sourceProps, 'id'),
            name: getStringProperty(sourceProps, 'name') ?? 
                  (getStringProperty(sourceProps, 'title') ||
                  `${(sourceNode.labels[0] ?? 'Unknown')} ${getStringOrNumberProperty(sourceProps, 'id')}`)
          },
          target: {
            type: targetNode.labels[0] ?? 'Unknown',
            id: getStringOrNumberProperty(targetProps, 'id'),
            name: getStringProperty(targetProps, 'name') ?? 
                  (getStringProperty(targetProps, 'title') ||
                  `${(targetNode.labels[0] ?? 'Unknown')} ${getStringOrNumberProperty(targetProps, 'id')}`)
          },
          relationship: {
            type: transitiveRelType,
            properties: {
              transitiveCount,
              pathTypes: [...rel1Types, ...rel2Types],
              intermediateCount: intermediates.length
            }
          },
          path: pathDescription,
          strength
        });

      } catch (error) {
        logger.warn('Error processing transitive relationship record:', error as Record<string, unknown>);
        continue;
      }
    }

    logger.info(`✅ Found ${relationships.length} transitive relationships`);
    return relationships;

  } catch (error) {
    logger.error('❌ Error finding transitive relationships:', error as Record<string, unknown>);
    return [];
  } finally {
    await session.close();
  }
}

// Helper functions for path processing

function calculatePathStrength(relationships: Array<{type: string, properties: Record<string, unknown>}>, pathLength: number): number {
  // Base strength decreases with path length
  let strength = 1 / pathLength;
  
  // Boost strength for meaningful relationship types
  const strongRelationships = ['CONTAINS', 'PART_OF', 'SIMILAR_TO', 'CATEGORY_OF', 'INGREDIENT_OF'];
  const weakRelationships = ['TAGGED_WITH', 'REFERENCED_BY'];
  
  relationships.forEach(rel => {
    if (strongRelationships.includes(rel.type)) {
      strength *= 1.2;
    } else if (weakRelationships.includes(rel.type)) {
      strength *= 0.8;
    }
  });
  
  // Normalize to 0-1 range
  return Math.min(Math.max(strength, 0), 1);
}

function generateSimplePathExplanation(nodes: Array<{type: string, name: string}>, relationships: Array<{type: string}>): string {
  if (nodes.length < 2) return 'Direct connection';
  
  const pathSegments: string[] = [];
  
  for (let i = 0; i < relationships.length; i++) {
    const sourceNode = nodes[i];
    const targetNode = nodes[i + 1];
    const relationship = relationships[i];
    
    // Add null checks
    if (!sourceNode || !targetNode || !relationship) continue;
    
    const relationshipText = formatRelationshipType(relationship.type);
    pathSegments.push(`${sourceNode.name} ${relationshipText} ${targetNode.name}`);
  }
  
  return pathSegments.join(' → ');
}

function formatRelationshipType(relType: string): string {
  // Convert relationship types to readable format
  const typeMap: Record<string, string> = {
    'CONTAINS': 'contains',
    'PART_OF': 'is part of',
    'SIMILAR_TO': 'is similar to',
    'CATEGORY_OF': 'is in category',
    'INGREDIENT_OF': 'is ingredient of',
    'RELATED_TO': 'is related to',
    'TAGGED_WITH': 'is tagged with',
    'REFERENCED_BY': 'is referenced by'
  };
  
  return typeMap[relType] ?? relType.toLowerCase().replace(/_/g, ' ');
}

// Note: Functions are already exported individually above
