# **Product Requirements Document (PRD)**

Project Name: BeachWatch (Working Title)  
Version: 1.0 (MVP Scope)  
Status: Draft  
Author: Lead Engineer / Founder  
Date: 2026-01-22
Last Updated: 2026-01-23

---

## **1. Executive Summary**

BeachWatch is a real-time beach crowd monitoring platform that helps beachgoers find quiet times to visit their favorite Sydney beaches.

**The Core Problem:** People waste time driving to the beach only to find it overcrowded. No existing service provides real-time crowd data for beaches.

**The Solution:** Automated webcam monitoring + computer vision to track beach occupancy. Users see live busyness scores and historical patterns to plan visits during quieter times.

**Why Now:** Post-COVID, people are more conscious about crowds. Sydney has 100+ beaches with public webcams, but no one aggregates this data.

---

## **2. Target Audience & Personas**

| Persona | Description | User Goal | Pain Point |
|---------|-------------|-----------|------------|
| **The "Quiet Seeker"** | 30-45, works remotely, values peace over peak times | Find a quiet beach for work breaks or reading | "I drive to Bondi and it's packed. Waste of 40 minutes." |
| **The "Family Planner"** | 35-50, young kids, needs space for setup | Find beaches with low density for family time | "Crowded beaches are stressful with toddlers. No room to set up." |
| **The "Morning Surfer"** | 20-40, surfer, flexible schedule | Check crowd levels before dawn patrol | "I want to know if it's worth driving to X beach vs Y beach." |
| **The "Tourist"** | Visiting Sydney, wants the "real" local beach experience | Avoid tourist traps, find hidden gems | "All guides say Bondi. I want a local spot that's less crowded." |

---

## **3. Product Principles**

1. **Instant Clarity** - User should know if beach is busy in <3 seconds
2. **Predictive, Not Just Reactive** - Show when beach will be quiet (not just current state)
3. **Visual First** - Live webcam + busyness overlay beats raw numbers
4. **Privacy-Aware** - No facial recognition, crowd density only
5. **Mobile-First** - 80% of users will check on their phone before leaving home

---

## **4. Core Features (MVP)**

### **4.1. Live Beach Monitor**
- **Input:** Public beach webcam URLs (5-10 Sydney beaches initially)
- **Process:** Screenshot every 10 minutes → computer vision analysis → busyness score (0-100)
- **Output:** Live view with busyness badge (Quiet / Moderate / Busy / Very Busy)

### **4.2. Historical Patterns**
- **7-Day Graph:** Busyness by hour for past week
- **"Best Time" Predictor:** "Typically quiet Mon-Fri before 10am"
- **Seasonal Trends:** Summer vs Winter patterns

### **4.3. Beach Comparison**
- **Side-by-Side View:** Compare 2-3 beaches at once
- **"Find Quiet Nearby":** If Bondi is busy, suggest Tamarama or Bronte

### **4.4. Alerts (Optional MVP Feature)**
- **"Notify Me When Quiet":** Push notification when busyness drops below threshold
- **Daily Digest:** "Best beach to visit today: Manly (quiet until 2pm)"

---

## **5. Technical Architecture**

### **5.1. Data Collection (Automated)**

**HLS Stream Capture (Preferred - Node.js + ffmpeg)**
- Direct frame capture from HLS video streams (e.g., ipcamlive.com)
- Much faster and more reliable than browser screenshots (~7-9 seconds per capture)
- No browser rendering issues, consistent quality
- Script: `scripts/scraping/hls-capture.js`

**Webcam Scraper (Fallback - Node.js + Playwright)**
- Headless browser visits webcam URLs
- Screenshot every 10 minutes
- Used when HLS stream URL not available
- Script: `scripts/scraping/multi-beach-scraper.js`

**Storage**
- Store in Cloudflare R2 (S3-compatible, no egress fees)

**Crowd Detection (Python + YOLOv8 with Image Slicing)**
- Model: Pre-trained YOLOv8m (person detection)
- **Image Slicing (SAHI-style):** Large beach images split into 640x640 overlapping tiles for small object detection
- Detects 5-8x more people than standard detection (58 vs 11 people on test images)
- Script: `ml/scripts/beach-detector.py`
- Input: Screenshot/frame
- Output: Person count → Busyness score (0-100 based on beach area)
- Fallback: Simple pixel density if ML fails (`ml/scripts/pixel-density-analyzer.py`)

**Data Storage (Cloudflare D1 + R2)**
- **D1 (SQLite-based):** Metadata and busyness scores
- **R2 (Object Storage):** Screenshot images (blob storage)

```sql
Table beach_snapshots {
  id: text primary key
  beach_id: text
  timestamp: integer (unix timestamp)
  image_url: text (R2 URL)
  person_count: integer
  busyness_score: integer (0-100)
  weather: text (optional)
}
```

**Why Cloudflare:**
- Workers + D1 + R2 all in same ecosystem (no cross-service latency)
- D1 binding in Workers = instant DB access
- R2 = S3-compatible but no egress fees

### **5.2. API (Cloudflare Workers)**

**Endpoints:**
- `GET /api/beaches` - List all monitored beaches
- `GET /api/beaches/:id/current` - Current busyness
- `GET /api/beaches/:id/history?range=7d` - Historical data
- `GET /api/beaches/compare?ids=bondi,manly` - Compare beaches

**Tech Stack:**
- Cloudflare Workers for serverless API
- Hono for routing (edge-native)
- Cloudflare D1 for database queries
- No cold starts, global edge deployment

### **5.3. Frontend (SvelteKit)**

**Pages:**
1. **Home:** Map of Sydney beaches with color-coded busyness
2. **Beach Detail:** Live webcam + graph + predictions
3. **Compare:** Side-by-side comparison

**Tech Stack:**
- SvelteKit (SSR + SPA)
- shadcn-svelte (UI component library)
- Tailwind CSS
- Chart.js or D3.js for graphs
- Cloudflare Pages deployment

### **5.4. Automation (Cron)**

**Tasks:**
- Every 10 minutes: Scrape webcams → analyze → store
- Every hour: Update predictions based on patterns
- Daily: Clean up old images (keep only samples)

---

## **6. MVP Scope (Phase 1: 4-6 Weeks)**

### **Week 1-2: Proof of Concept** ✅ COMPLETE
- [x] Find 5 Sydney beach webcam URLs (Bondi, Manly, Coogee, Bronte, Maroubra)
- [x] Build Playwright scraper to capture screenshots
- [x] **Bonus:** Discovered HLS stream capture method (faster, more reliable)
- [x] Store screenshots locally with timestamp

### **Week 3-4: Computer Vision** ✅ COMPLETE
- [x] Integrate YOLOv8 for person detection
- [x] **Bonus:** Image slicing for 5-8x better detection of distant people
- [x] Calculate busyness score algorithm (density-based)
- [x] Store data in Cloudflare D1 (SQLite) + R2 (images)

### **Week 5-6: Web App** ✅ COMPLETE
- [x] Build SvelteKit frontend with Tailwind CSS
- [x] **Bonus:** Custom "Sydney Surf Culture" design system
- [x] Show live busyness score + last captured image
- [x] Display 7-day historical graph
- [x] Beach comparison page
- [x] Interactive map with Leaflet

**MVP Launch Criteria:**
- 5 beaches monitored
- Live busyness score updates every 10 minutes
- 7-day historical data visible
- Mobile-responsive design

---

## **7. Future Features (Phase 2+)**

### **Phase 2: Enhanced Intelligence (Weeks 7-12)**
- Weather integration (sunny days = busier)
- Tide data correlation
- School holiday detection (crowd spikes)
- Machine learning to predict future busyness

### **Phase 3: Community & Alerts (Weeks 13-18)**
- User accounts
- Push notifications ("Bondi is quiet now!")
- User-submitted crowd reports (crowdsourced validation)
- Beach favorites/watchlist

### **Phase 4: Monetization (Weeks 19-24)**
- Premium: Unlimited alerts, advanced predictions
- B2B: Council dashboards for resource planning
- Advertising: Local beach clubs, surf shops

---

## **8. Success Metrics (KPIs)**

**Product Metrics:**
1. **Accuracy:** How often is the busyness score correct? (Target: 80%+ validated by user reports)
2. **Latency:** Time from webcam capture to data visible on site (Target: <2 minutes)
3. **Uptime:** % of time data is fresh (Target: 95%+)

**User Metrics:**
1. **Daily Active Users (DAU):** Target 500 users in Month 1, 2,000 by Month 3
2. **Return Rate:** % of users who return within 7 days (Target: 40%+)
3. **Session Duration:** Average time on site (Target: 2-3 minutes)

**Business Metrics:**
1. **Cost per Beach:** Scraping + analysis cost (Target: <$10/month per beach)
2. **Revenue (if monetized):** Premium subscriptions or ad revenue (Target: $500/month by Month 6)

---

## **9. Risks & Mitigations**

### **Risk 1: Webcam Access**
- **Problem:** Some webcams may block scrapers or require auth
- **Mitigation:** Start with open, stable cams. Build relationships with councils for API access.

### **Risk 2: ML Accuracy**
- **Problem:** Shadows, camera angles, weather affect person detection
- **Mitigation:** Train custom models per beach. Use fallback pixel density analysis.

### **Risk 3: Privacy Concerns**
- **Problem:** Users may worry about surveillance
- **Mitigation:** Clear privacy policy. No facial recognition. Aggregate crowd data only.

### **Risk 4: Low Adoption**
- **Problem:** Users don't trust the data or don't care
- **Mitigation:** Launch with 1-2 popular beaches (Bondi, Manly). Social proof via user reports.

---

## **10. Competitive Landscape**

**Direct Competitors:** None (niche is wide open)

**Indirect Competitors:**
- **Surfline:** Wave cams but no crowd data
- **Google Popular Times:** Retail only, not beaches
- **Local Council Webcams:** Static images, no analysis

**Why We Win:**
- First mover in beach crowd monitoring
- Automated + predictive vs manual checking
- Mobile-first UX vs desktop-only council sites

---

## **11. Monetization Strategy**

### **Free Tier (MVP)**
- 5 beaches
- Live busyness score
- 7-day historical data
- No ads initially (focus on growth)

### **Premium Tier ($4.99/month or $39/year)**
- Unlock all beaches (20+)
- Push notifications
- 30-day historical data
- Ad-free experience
- "Best time" predictions

### **B2B/API Access ($299/month)**
- Council dashboards for resource planning
- Tourism boards for visitor insights
- Surf schools for class scheduling

### **Advertising (Long-term)**
- Local beach clubs, cafes, surf shops
- "Sponsored beaches" (premium placement)

---

## **12. Development Timeline**

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| **Phase 1: MVP** | 6 weeks | 5 beaches, live monitoring, basic web app |
| **Phase 2: Intelligence** | 6 weeks | Weather integration, predictions, 10 more beaches |
| **Phase 3: Community** | 6 weeks | User accounts, alerts, favorites |
| **Phase 4: Monetization** | 6 weeks | Premium tier, B2B dashboards |

**Total: 6 months to full product**

---

## **13. Open Questions**

1. **Which 5 beaches for MVP?** (Bondi, Manly, Coogee, Bronte, Maroubra? Or diversify regions?)
2. **Busyness thresholds?** (What counts as "busy" vs "quiet"? Absolute count or % of beach capacity?)
3. **User validation?** (How do we verify ML accuracy? Crowdsource reports?)
4. **Brand name?** (BeachWatch, CrowdCast, QuietBeach, BeachRadar?)

---

## **14. Next Steps**

**Immediate (This Week):**
1. Research Sydney beach webcam URLs (find 10-15 candidates)
2. Test Playwright scraper on 1 beach (Bondi)
3. Validate YOLOv8 person detection accuracy

**Week 1-2:**
1. Build scraper for 5 beaches
2. Set up Cloudflare D1 database schema + R2 bucket
3. Store 1 week of data

**Week 3-4:**
1. Build SvelteKit frontend skeleton (Cloudflare Pages)
2. Display live busyness scores via Workers API
3. Create historical graph component (Chart.js)

**End of Month 1:**
- Soft launch to 50 beta users (friends, family, surf community)
- Collect feedback on accuracy and UX

---

## **Appendix A: Beach Webcam Sources (Verified)**

| Beach | Source | Type | HLS Stream URL | Status |
|-------|--------|------|----------------|--------|
| Bondi (South View) | North Bondi SLSC | HLS | `s116.ipcamlive.com/streams/745iknrb97qx4pnuh/stream.m3u8` | ✅ Working |
| Bondi (North View) | North Bondi SLSC | HLS | `s32.ipcamlive.com/streams/20y8mrlc1dowxgzvz/stream.m3u8` | ✅ Working |
| Manly | Manly Pacific Hotel | Web | `manlypacific.com.au/live-webcam/` | ⚠️ Needs HLS extraction |
| Coogee | Randwick Council | Web | `randwick.nsw.gov.au/.../beach-cams` | ⚠️ May be offline |
| Maroubra | Brasurf | Web | `brasurf.com.au/` | ⚠️ Needs HLS extraction |

**Discovery Process for HLS Streams:**
1. Visit webcam page (e.g., `northbondisurfclub.com/webcam/`)
2. Find iframe src with ipcamlive.com player alias
3. Fetch player page and extract stream ID
4. Construct HLS URL: `https://s{N}.ipcamlive.com/streams/{ID}/stream.m3u8`

---

## **Appendix B: Frontend Design**

**Design System: Sydney Surf Culture**
- Bold sunset gradient headers (coral → orange → gold → pink)
- Typography: Syne (display, 700-900 weight), Outfit (body)
- Warm color palette with ocean deep (#0A2540) as primary text
- Status colors: Quiet (teal #00D9A5), Moderate (gold #FFD93D), Busy (orange #FF8C42), Very Busy (red #FF4757)
- Glass morphism cards with warm shadows
- Animated wave divider between sections

---

## **Appendix C: ML Detection Performance**

| Method | Confidence | People Detected | Notes |
|--------|------------|-----------------|-------|
| Standard YOLO (0.5 conf) | High | ~6-11 | Misses distant figures |
| Standard YOLO (0.25 conf) | Medium | ~11-15 | Some improvement |
| **Image Slicing (0.15 conf)** | Low-Med | **52-58** | Best for beach webcams |

**Image Slicing Algorithm:**
1. Split 1920x1088 image into overlapping 640x640 tiles (25% overlap)
2. Run YOLO on each tile (small people appear larger relative to tile)
3. Merge detections back to original coordinates
4. Apply NMS (IoU 0.4) to remove duplicates
5. Also run full-image detection to catch larger/closer people

---

**End of PRD**
