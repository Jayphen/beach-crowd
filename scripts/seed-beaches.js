/**
 * Seed beaches data into Cloudflare D1
 * Run with: npm run d1:seed
 */

const fs = require('fs');
const path = require('path');

// Load beaches configuration
const config = JSON.parse(fs.readFileSync('./config/beaches-config.json', 'utf-8'));
const { beaches } = config;

/**
 * Generate SQL INSERT statements for beaches
 */
function generateBeachesSQL() {
  const now = Math.floor(Date.now() / 1000);
  const statements = [];

  for (const beach of beaches) {
    const webcamUrl = beach.webcams?.[0]?.url || '';
    const latitude = null; // Add if you have GPS coordinates
    const longitude = null;
    const beachArea = beach.visible_area_sqm || 5000;
    const active = beach.enabled ? 1 : 0;

    const sql = `INSERT OR REPLACE INTO beaches (id, name, location, webcam_url, latitude, longitude, beach_area_sqm, active, created_at)
VALUES ('${beach.id}', '${beach.name}', '${beach.location}', '${webcamUrl}', ${latitude}, ${longitude}, ${beachArea}, ${active}, ${now});`;

    statements.push(sql);
  }

  return statements.join('\n');
}

/**
 * Main function
 */
function main() {
  console.log('Generating beaches seed SQL...\n');

  const sql = generateBeachesSQL();
  const outputPath = path.join(__dirname, 'seed-beaches.sql');

  fs.writeFileSync(outputPath, sql);

  console.log('✅ Beaches seed SQL generated!');
  console.log(`📁 File: ${outputPath}\n`);
  console.log(`To seed the database, run:`);
  console.log(`  wrangler d1 execute beachwatch-db --file=${outputPath}`);
  console.log('');
  console.log('SQL Preview:');
  console.log('─'.repeat(60));
  console.log(sql);
  console.log('─'.repeat(60));
}

main();
