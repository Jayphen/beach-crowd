# Configuration Files

This directory contains configuration files for beaches, database schema, and test data.

## Files

### beaches-config.json
Beach and webcam configuration defining:
- Beach metadata (name, location, coordinates)
- Webcam sources and URLs
- Beach-specific settings

**Usage:**
```javascript
const config = require('./config/beaches-config.json');
const bondi = config.beaches.find(b => b.id === 'bondi');
```

### schema.sql
D1 database schema definition including:
- `beaches` table - Beach metadata
- `beach_snapshots` table - Crowd snapshot data
- `webcams` table - Webcam source information
- Indexes and constraints

**Usage:**
```bash
# Initialize database
npm run d1:init

# Or manually
wrangler d1 execute beach-crowd-db --file=./config/schema.sql
```

### test-data.sql
Sample test data for development and testing:
- Sample beach records
- Historical snapshot data
- Webcam configurations

**Usage:**
```bash
# Load test data
wrangler d1 execute beach-crowd-db --file=./config/test-data.sql
```

## Modifying Configuration

When adding new beaches:
1. Add beach entry to `beaches-config.json`
2. Add corresponding records to `schema.sql` if needed
3. Update `test-data.sql` with sample data
4. Run `npm run d1:seed` to update the database
