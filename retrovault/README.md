# 👾 RetroVault

> **Your retro gaming collection engine.**  
> Track what you own. Know what it's worth. Hunt smarter. Play more.

[![Version](https://img.shields.io/badge/version-2.0.0-22c55e?style=flat-square&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHRleHQgeT0iMjAiIGZvbnQtc2l6ZT0iMjAiPvCfm608L3RleHQ+PC9zdmc+)](CHANGELOG.md)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/license-private-red?style=flat-square)]()

---

RetroVault is a self-hosted, full-stack web app built for serious retro game collectors and flippers. It combines a personal game library manager with real market data, business analytics, field hunting tools, and a social layer — all wrapped in a custom 8-bit green phosphor aesthetic.

Built to run on your local network. No cloud required. No subscriptions. Your data stays on your machine.

---

## ✨ What It Does

### 🕹️ Collection Management
- Full game vault with per-copy tracking (condition, box, manual, cost, purchase date, source)
- 26,000+ title catalog across 14 retro platforms from NES to Switch
- Condition grades, digital flag, and CIB tracking
- Mobile card view and table view with sort, search, and filter
- Import from CSV — compatible with spreadsheets, CLZ Games, and custom exports
- Duplicate Detector: scan for multi-copy games and see their sellable value

### 💰 Business & Flipping
- **P&L Ledger** — log every buy and sell, track realized profit
- **Buy/Sell Scores** (1–100) on every game based on PriceCharting market data
- **Hot List** — auto-ranked flip opportunities by ROI × trend × multi-copy bonus
- **Flip Calculator** — net profit after eBay/Mercari/local fees and shipping
- **Target Radar** — watchlist with buy-below price alerts
- **Sourcing Analytics** — ROI breakdown by where you buy (Garage Sale vs eBay vs Convention, etc.)
- **Platform Market Report** — which platforms are trending up or down this month
- **Seasonal Calendar** — historically best months to buy and sell by platform

### 🔦 Field Tools
- **Field Mode** — mobile-optimized price checker with instant dupe alert and "Should I Buy?" decision engine
- **Negotiation Helper** — offer ladder with scenario presets (garage sale, convention, Facebook Marketplace, 1:1 deal)
- **Lot Calculator** — proportional cost allocation for bulk purchases
- **Convention Tracker** — real-time budget meter with per-purchase logging per event
- **eBay Listing Quality Checker** — 12-point checklist to maximize sale price

### 📊 Analytics & Insights
- Collection value dashboard with platform breakdown
- 30-day price history and trend analysis per game
- **Value History** — daily snapshot graph showing collection growth over time
- Insurance Valuation Report — printable document for insurance purposes
- Price alerts when watchlist items hit your target

### 🎮 Personal & Play
- **Play Log** — Currently Playing / Beaten / Backlog / Want to Play / Gave Up with 1–5 star ratings
- **Holy Grail Tracker** — priority-ranked wish list; mark items as FOUND when you score them
- **Collection Randomizer** — "What should I play tonight?" with animated picker
- **Completion Tiers** — Bronze → Platinum badges per platform based on % of catalog owned
- **Collection Milestones** — 25+ auto-computed achievements (first game, century club, etc.)
- **Achievement Codex** — 100+ achievements across 9 categories with rarity tiers

### 👥 Social & Critics
- Add critics (friends/co-collectors) who can favorite ⭐ and rate 👎 games
- VIBE column shows group consensus at a glance
- **Tags** — add metadata labels to any game or platform, searchable across the vault
- **@ Mentions** — send critic-specific notes on games they might care about
- **Friends Mode** — each critic gets a personalized view of the collection
- Critic Profile modal with stats, platform breakdown, and mention history

### 🌐 Discovery & Hunting
- **Gaming Events Calendar** — Eventbrite scraper + manual add; mark events as attending
- **Whatnot Tracker** — follow sellers, log scheduled streams with countdown
- **Local Deals** — Craigslist scraper matched against your watchlist and grail list
- **Reddit Alerts** — r/gameswap monitor for watchlist items being offered for sale/trade
- **Field Guide** — 8 chapters, 60+ principles from the retro hunting community (Chase After The Right Price, r/gamecollecting, and beyond)
- **Quote Banner** — 200+ quotes from game designers and hunting wisdom

### ⚙️ Platform
- **Scraper Control Center** — manage all scrapers from the UI (run, schedule, view logs)
- 8 scraper scripts: PriceCharting prices, Events, Reddit, Craigslist, PriceCharting trending, eBay sold, Whatnot, value snapshots
- **Standalone mode** — deploy as RetroVault with its own nav, or embed in Mission Control
- **Theme system** — 8 color palettes × 5 style themes, all live-switchable
- **Feature flags** — enable/disable entire feature groups; nav updates instantly
- **PWA support** — install to your phone home screen; Field Mode becomes a native-feel app
- **Global search** — search across all pages, games, grails, watchlist, and events
- **Keyboard shortcuts** — `?` for help, `/` to search, `g v` for Vault, etc.
- Optional password authentication with HMAC-signed sessions
- Public shareable collection URL with QR code generator
- Changelog at `/changelog`, auto-commit to GitHub on schedule

---

## 🚀 Getting Started

### Prerequisites
- Node.js 22+
- Git

### Install & Run

```bash
git clone git@github.com:apesch85/retrovault.git
cd retrovault/second-brain
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Configuration

Edit `data/app.config.json` or use the in-app Settings page (`/settings`) to configure:

| Setting | Default | Notes |
|---|---|---|
| `appName` | `RetroVault` | Displayed in nav/header |
| `standaloneMode` | `true` | `false` = Mission Control mode |
| `currency` | `$` | Any symbol |
| `plex.url` | — | Plex server URL for media integration |
| `scrapers.craigslistCity` | `portland` | City slug for Craigslist scraper |
| `auth.enabled` | `false` | Enable password protection |
| `features.*` | all `true` | Toggle feature groups on/off |

---

## 📋 Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start dev server (port 3000) |
| `npm run build` | Production build |
| `node scripts/bg-fetch.mjs` | Fetch PriceCharting prices for all owned games |
| `node scripts/scrape-events.mjs` | Scrape gaming events from Eventbrite |
| `node scripts/scrape-reddit.mjs` | Check r/gameswap for watchlist/grail matches |
| `node scripts/scrape-craigslist.mjs` | Scan local Craigslist for retro game deals |
| `node scripts/scrape-trending.mjs` | Fetch PriceCharting trending games |
| `node scripts/snapshot-value.mjs` | Record daily collection value snapshot |
| `node scripts/git-sync.mjs` | Commit and push any changes to GitHub |

### Recommended crontab

```cron
0 0 * * *    node /path/to/scripts/bg-fetch.mjs >> logs/bg-fetch.log 2>&1
0 1 * * *    node /path/to/scripts/snapshot-value.mjs >> logs/snapshot.log 2>&1
0 6 * * 1    node /path/to/scripts/scrape-events.mjs >> logs/events-scraper.log 2>&1
0 2 * * *    node /path/to/scripts/scrape-craigslist.mjs >> logs/craigslist-scraper.log 2>&1
0 */1 * * *  node /path/to/scripts/scrape-reddit.mjs >> logs/reddit-scraper.log 2>&1
0 */6 * * *  node /path/to/scripts/git-sync.mjs >> logs/git-sync.log 2>&1
```

---

## 🗂️ Data Files

All data lives in `data/` and is excluded from version control (except structure files):

| File | Contents |
|---|---|
| `inventory.json` | Full game catalog + market prices |
| `sales.json` / `acquisitions.json` | P&L transaction history |
| `watchlist.json` | Target Radar items |
| `grails.json` | Holy Grail wish list |
| `playlog.json` | Play Log entries |
| `favorites.json` | Critics + favorites/regrets |
| `tags.json` | Game/platform tags + @mentions |
| `events.json` | Gaming events calendar |
| `whatnot.json` | Whatnot sellers + streams |
| `app.config.json` | App-wide configuration |
| `value-history.json` | Daily collection value snapshots |
| `achievements-unlocked.json` | Manually unlocked achievements |

---

## 🏗️ Architecture

```
second-brain/
├── src/
│   ├── app/                    # Next.js App Router pages (50+ routes)
│   │   ├── api/                # REST API routes
│   │   └── [page]/page.tsx     # Page components
│   ├── components/             # Shared UI components
│   └── data/                   # Static data (achievements, quotes, themes, etc.)
├── scripts/                    # Node.js scraper + utility scripts
├── data/                       # Runtime data files (gitignored)
├── logs/                       # Script logs (gitignored)
└── public/                     # Static assets + PWA manifest
```

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS · Recharts · Node.js scrapers

---

## 📱 PWA Installation

RetroVault ships as a Progressive Web App. To install:

- **iOS**: Safari → Share → Add to Home Screen
- **Android**: Chrome → ⋮ → Add to Home Screen

Once installed, Field Mode works as a full-screen native-feeling app — perfect for garage sale hunting.

App shortcuts are pre-configured: **Field Mode**, **Vault**, and **Negotiate**.

---

## 📖 Field Guide

The built-in Field Guide (`/guide`) contains 60+ principles from experienced retro hunters covering:

- The Hunter's Mindset
- Understanding Pricing (eBay sold vs listed)  
- Buying Smart by scenario (garage sale, thrift, convention, 1:1)
- Negotiation tactics and offer ladders
- Selling for maximum return
- Spotting fakes and condition grading
- Building a collection with intent
- Essential community resources

---

## 🏆 Achievements

100+ achievements across 9 categories with 5 rarity tiers:

`Common` → `Uncommon` → `Rare` → `Epic` → `Legendary`

Categories: Collection · Business · Hunting · Platform · Personal · Social · Grind · Secret · Milestone

Secret achievements are hidden until unlocked through specific behaviors.

---

## 📋 Changelog

See [the full changelog](/src/data/changelog.ts) or browse `/changelog` in the app.

Current version: **v2.0.0** — 10 releases since initial launch covering 100+ features.

---

## 🤝 Contributing

This is a private project. If you've been given access and want to contribute:

1. Branch from `master`
2. Make your changes
3. `node scripts/git-sync.mjs` or `git commit && git push`

---

*Built with 👾 by [apesch85](https://github.com/apesch85) and Neo*
