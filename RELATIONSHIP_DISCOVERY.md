# Relationship Discovery System

## Overview

The Relationship Discovery System is an advanced feature that automatically finds and explores connections between all entities in the knowledge graph, not just products. It extends the existing graph database capabilities to provide deeper insights into how different entities are related.

## Features

### 1. Direct Relationship Discovery
Find all direct relationships for any entity in the graph:
- Products containing specific ingredients
- Ingredients grown in specific regions
- Health benefits that treat specific conditions
- Products rich in specific nutrients

### 2. Multi-hop Path Discovery
Discover complex relationship paths between any two entities:
- How a product relates to a health condition through multiple intermediate entities
- Path explanations in human-readable format
- Path strength calculation

### 3. Connected Entities Finder
Find entities that share common relationships:
- Products connected through shared ingredients
- Ingredients connected through shared growing regions
- Health benefits connected through shared conditions

### 4. Transitive Relationship Discovery
Discover indirect relationships through intermediate entities:
- Products that treat conditions through shared health benefits
- Ingredients rich in nutrients through processing methods

### 5. Relationship Statistics
Get comprehensive statistics about all relationships in the graph:
- Count of each relationship type
- Strength distribution analysis
- Most common relationship patterns

## API Endpoints

### GET /api/graph/relationships

#### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| action | Yes | Type of relationship discovery: `direct`, `paths`, `connected`, `transitive`, `statistics` |
| sourceType | Yes (except statistics) | Source entity type: `Product`, `Ingredient`, `Region`, `Season`, `Condition`, `Nutrient`, `Category`, `HealthBenefit` |
| sourceId | Yes (except statistics) | Source entity ID or name |
| targetType | Yes (for paths) | Target entity type |
| targetId | Yes (for paths) | Target entity ID or name |
| relationshipTypes | Yes (for connected/transitive) | Comma-separated relationship types |
| maxHops | No (default: 3) | Maximum hops for path discovery |
| limit | No (default: 20) | Maximum number of results |

#### Example Requests

1. **Find direct relationships for a product:**
   ```
   GET /api/graph/relationships?action=direct&sourceType=Product&sourceId=1
   ```

2. **Find paths between a product and a health condition:**
   ```
   GET /api/graph/relationships?action=paths&sourceType=Product&sourceId=1&targetType=Condition&targetId=diabetes&maxHops=4
   ```

3. **Find entities connected to an ingredient:**
   ```
   GET /api/graph/relationships?action=connected&sourceType=Ingredient&sourceId=turmeric&relationshipTypes=CONTAINS,GROWN_IN
   ```

4. **Find transitive relationships:**
   ```
   GET /api/graph/relationships?action=transitive&sourceType=Product&sourceId=1&relationshipTypes=CONTAINS,TREATS
   ```

5. **Get relationship statistics:**
   ```
   GET /api/graph/relationships?action=statistics
   ```

## Usage Examples

### Admin Dashboard
The relationship explorer is integrated into the admin dashboard at `/admin/graph/explore`. This provides a user-friendly interface to explore relationships without needing to write API calls.

### Programmatic Usage
The relationship discovery functions can be imported and used directly in your code:

```typescript
import { 
  discoverDirectRelationships,
  discoverRelationshipPaths,
  findConnectedEntities,
  discoverTransitiveRelationships,
  getRelationshipStatistics
} from '@/lib/relationship-discovery';

// Find direct relationships for a product
const relationships = await discoverDirectRelationships('Product', 1);

// Find paths between entities
const paths = await discoverRelationshipPaths('Product', 1, 'Condition', 'diabetes');

// Find connected entities
const connected = await findConnectedEntities('Ingredient', 'turmeric', ['CONTAINS', 'GROWN_IN']);
```

## Relationship Types

The system recognizes the following relationship types:

- `BELONGS_TO` - Products belonging to categories
- `PROVIDES` - Products providing health benefits
- `CONTAINS` - Products containing ingredients
- `GROWN_IN` - Ingredients grown in regions
- `HARVESTED_IN` - Products harvested in seasons
- `TREATS` - Health benefits treating conditions
- `RICH_IN` - Ingredients rich in nutrients

## Strength Calculation

Each relationship has a calculated strength value (0-1) based on:

- Explicit strength properties
- Evidence levels (clinical, traditional, etc.)
- Quality ratings
- Effectiveness ratings
- Presence of contraindications or side effects

## Path Explanations

Multi-hop paths are automatically explained in human-readable format:
- "Product A contains Ingredient B, which is grown in Region C"
- "Ingredient A is rich in Nutrient B, which supports Health Benefit C"

## Performance Considerations

- Results are limited by default to prevent excessive computation
- Complex path queries may take longer with higher maxHops values
- Statistics queries aggregate data across the entire graph

## Extending the System

To add new relationship types or entity types:

1. Update the extended graph schema in `src/lib/extended-graph-schema.ts`
2. Add new relationship creation functions
3. Update the relationship discovery queries to recognize new types
4. Extend the UI components to handle new entity types

## Troubleshooting

### Common Issues

1. **No relationships found**: Ensure the graph is properly populated with data
2. **Slow queries**: Reduce maxHops or limit parameters for complex queries
3. **Connection errors**: Verify MemGraph is running and accessible

### Debugging

- Check the console logs for detailed error messages
- Use the statistics endpoint to verify relationship data exists
- Test with simple direct relationship queries first