# Repository Cleanup Plan

This document outlines the file organization structure for cleaning up the beach-crowd repository.

## Proposed Directory Structure

```
beach-crowd/
├── docs/                           # All documentation
│   ├── prd/
│   │   └── beach-monitor-PRD.md
│   ├── setup/
│   │   ├── cloudflare-setup.md
│   │   ├── SETUP-CLOUDFLARE-D1-R2.md
│   │   └── API-DEPLOYMENT.md
│   ├── features/
│   │   ├── YOLO-INTEGRATION-README.md
│   │   └── validation-plan.md
│   └── research/
│       └── webcam-urls.md
│
├── scripts/                        # Utility scripts (keep existing seed-beaches.js)
│   ├── scraping/
│   │   ├── scraper.js
│   │   ├── multi-beach-scraper.js
│   │   └── README-scraper.md
│   ├── data/
│   │   ├── generate-test-data.js
│   │   └── upload-to-cloudflare.js
│   └── testing/
│       ├── test-busyness-score.js
│       ├── test-integration.js
│       └── test-pixel-density-fallback.js
│
├── ml/                            # Machine learning / computer vision
│   ├── models/
│   │   └── yolov8m.pt
│   ├── scripts/
│   │   ├── yolo-detector.py
│   │   ├── pixel-density-analyzer.py
│   │   ├── yolo-integration.js
│   │   └── demo-busyness-score.js
│   ├── tests/
│   │   └── test-yolo.py
│   ├── README.md                  # Move TEST-YOLO-README.md here
│   └── venv/                      # Python virtual environment
│
├── config/                        # Configuration files
│   ├── beaches-config.json
│   ├── schema.sql
│   └── test-data.sql
│
├── test-data/                     # Test data and screenshots
│   └── screenshots/
│       ├── bondi_*.png
│       └── pixel_density_debug/
│
├── worker/                        # Cloudflare Workers (already exists)
│   ├── index.js
│   ├── lib/
│   └── routes/
│
├── src/                           # SvelteKit app (already exists)
│   ├── lib/
│   ├── routes/
│   ├── app.css
│   ├── app.d.ts
│   └── app.html
│
├── static/                        # Static assets (already exists)
│
├── README.md                      # Main README (keep in root)
├── package.json                   # Dependencies (keep in root)
├── package-lock.json              # Lock file (keep in root)
├── wrangler.toml                  # Cloudflare config (keep in root)
├── components.json                # shadcn config (keep in root)
├── svelte.config.js               # SvelteKit config (keep in root)
├── tsconfig.json                  # TypeScript config (keep in root)
├── vite.config.ts                 # Vite config (keep in root)
├── todolist.txt                   # Project todos (keep in root)
└── .gitignore                     # Git config (keep in root)
```

## Files to Move

### To docs/prd/
- beach-monitor-PRD.md

### To docs/setup/
- cloudflare-setup.md
- SETUP-CLOUDFLARE-D1-R2.md
- API-DEPLOYMENT.md

### To docs/features/
- YOLO-INTEGRATION-README.md
- validation-plan.md

### To docs/research/
- webcam-urls.md

### To scripts/scraping/
- scraper.js
- multi-beach-scraper.js
- README-scraper.md

### To scripts/data/
- generate-test-data.js
- upload-to-cloudflare.js

### To scripts/testing/
- test-busyness-score.js
- test-integration.js
- test-pixel-density-fallback.js

### To ml/models/
- yolov8m.pt

### To ml/scripts/
- yolo-detector.py
- pixel-density-analyzer.py
- yolo-integration.js
- demo-busyness-score.js

### To ml/tests/
- test-yolo.py

### To ml/ (rename)
- TEST-YOLO-README.md → README.md

### To ml/
- venv/ (entire directory)

### To config/
- beaches-config.json
- schema.sql
- test-data.sql

### To test-data/
- screenshots/ (entire directory)

## Files to Keep in Root
- README.md
- package.json
- package-lock.json
- wrangler.toml
- components.json
- svelte.config.js
- tsconfig.json
- vite.config.ts
- todolist.txt
- .npmrc
- .gitignore
- .dev.vars.example

## Directories to Keep As-Is
- worker/
- src/
- static/
- scripts/seed-beaches.js (already in scripts/)

## After Moving Files

1. Update all import paths in code files
2. Update README.md to reflect new structure
3. Add README.md files in major directories (docs/, scripts/, ml/) explaining their contents
4. Update .gitignore if needed
5. Test that all scripts still work with new paths
6. Commit with message: "chore: reorganize repository structure for better maintainability"

## Notes
- The /frontend directory appears to be a duplicate/old structure - verify if it's needed before removing
- All config files that need to be in root (wrangler.toml, package.json, etc.) stay in root
- Test data is separated from production code
- ML/Python code is isolated in its own directory
- Documentation is centralized and categorized
