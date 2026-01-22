# **Product Requirements Document (PRD)**

Project Name: BeachWatch (Working Title)  
Version: 1.0 (MVP Scope)  
Status: Draft  
Author: Lead Engineer / Founder  
Date: 2026-01-22

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

**Webcam Scraper (Node.js + Playwright)**
- Headless browser visits webcam URLs
- Screenshot every 10 minutes
- Store in Cloudflare R2 (S3-compatible, no egress fees)

**Crowd Detection (Python + YOLOv8)**
- Model: Pre-trained YOLOv8 (person detection)
- Input: Screenshot
- Output: Person count → Busyness score (0-100 based on beach area)
- Fallback: Simple pixel density if ML fails

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

### **Week 1-2: Proof of Concept**
- [ ] Find 5 Sydney beach webcam URLs (Bondi, Manly, Coogee, Bronte, Maroubra)
- [ ] Build Playwright scraper to capture screenshots
- [ ] Store screenshots locally with timestamp

### **Week 3-4: Computer Vision**
- [ ] Integrate YOLOv8 for person detection
- [ ] Calculate busyness score algorithm
- [ ] Store data in Cloudflare D1 (SQLite) + R2 (images)

### **Week 5-6: Web App**
- [ ] Build SvelteKit frontend with shadcn-svelte components and beach list
- [ ] Show live busyness score + last captured image
- [ ] Display 7-day historical graph

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

## **Appendix A: Beach Webcam Sources (Initial Research)**

| Beach | Webcam URL | Status | Notes |
|-------|------------|--------|-------|
| Bondi | Waverley Council | ✅ Public | High quality, reliable |
| Manly | Manly Surf School | ✅ Public | Good angle |
| Coogee | Coogee Surf Club | ✅ Public | Moderate quality |
| Bronte | Waverley Council | ✅ Public | Same source as Bondi |
| Maroubra | Randwick Council | ⚠️ TBD | Need to verify access |

---

**End of PRD**
