# Entity Discovery System

The Entity Discovery System automatically identifies and extracts entities from various data sources to enrich the knowledge graph.

## Features

1. **Automatic Entity Discovery**
   - Discover entities from WooCommerce product data
   - Extract entities from existing graph relationships
   - Identify entities from text content
   - Deduplicate discovered entities
   - Confidence scoring for discovered entities

2. **Entity Types**
   - Products
   - Ingredients
   - Regions
   - Seasons
   - Health Conditions
   - Nutrients
   - Categories

3. **Discovery Sources**
   - Product names and descriptions
   - Product categories
   - Existing graph data
   - Text content analysis

## API Endpoints

### GET /api/graph/entities
Get entity discovery statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalEntities": 127,
    "byType": {
      "Product": 0,
      "Ingredient": 42,
      "Region": 18,
      "Season": 4,
      "Condition": 23,
      "Nutrient": 31,
      "Category": 9
    },
    "sources": {
      "product-categories": 9,
      "product-content": 25,
      "existing-graph": 93
    }
  }
}
```

### POST /api/graph/entities
Discover entities from various sources.

**Request Body:**
```json
{
  "action": "discover-from-products|discover-from-graph|discover-from-text|discover-all",
  "autoCreate": true,
  "content": "Optional text content for extraction"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "entities": [
      {
        "id": "ingredient:turmeric",
        "name": "Turmeric",
        "type": "Ingredient",
        "source": "product-content",
        "confidence": 0.7,
        "createdAt": "2023-05-15T10:30:00Z"
      }
    ],
    "count": 1,
    "created": {
      "success": true,
      "created": 1,
      "errors": []
    }
  }
}
```

## Integration with Relationship Discovery

The entity discovery functionality is also integrated with the relationship discovery API at `/api/graph/relationships` with the `discover-entities` action.

## UI Components

The entity discovery functionality is available in the admin dashboard under "Explore Relationships" where you can:
- Discover entities with one click
- View discovered entities with confidence scores
- Auto-create discovered entities in the graph database
- See statistics about entity types and sources

## Implementation Details

The system uses heuristic-based extraction techniques to identify potential entities:
- Pattern matching for common entity types
- Confidence scoring based on source reliability
- Deduplication to avoid duplicate entities
- Automatic creation of graph nodes for discovered entities

## Future Enhancements

- Machine learning-based entity recognition
- Integration with external knowledge bases
- Enhanced text processing with NLP techniques
- Custom entity type definitions
- Scheduled automatic discovery