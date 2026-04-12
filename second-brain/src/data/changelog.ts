export type ChangelogEntry = {
  version: string;
  date: string;
  title: string;
  type: "feature" | "fix" | "improvement" | "breaking";
  changes: { category: string; items: string[] }[];
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.0.0",
    date: "2026-04-09",
    title: "Initial Release — Mission Control",
    type: "feature",
    changes: [
      { category: "Foundation", items: [
        "Next.js app scaffolded with 8-bit green-phosphor aesthetic",
        "Collapsible sidebar navigation with icon-only collapsed mode",
        "Memory Bank (journal) powered by MEMORY.md markdown parsing",
        "Plex media integration for Movies, TV, and Music with IMDb/Last.fm links",
      ]},
      { category: "Game Inventory", items: [
        "Full game vault with 26,980 titles across 14 platforms from Google Sheets",
        "Per-copy tracking: condition, box/manual, cost, purchase date",
        "Platform filter, sort, search, and paginated table view",
        "Mobile card view toggle",
        "CRUD operations: add, edit, remove games and copies",
        "Digital game flag (excluded from business calculations)",
      ]},
      { category: "Price Data", items: [
        "PriceCharting scraper: dual-strategy (direct URL + fuzzy search fallback)",
        "Background midnight cron for automated price fetching",
        "Sequel guard: penalizes mismatched sequel tokens",
        "Buy/Sell scores (1-100) with 30-day trend weighting",
        "Daily price history per game (YYYY-MM-DD keyed)",
        "Market Timing Indicators in Price Detail Modal",
        "Fetch lock system: UI pauses background cron during manual fetches",
      ]},
    ],
  },
  {
    version: "1.1.0",
    date: "2026-04-09",
    title: "Business & Analytics Layer",
    type: "feature",
    changes: [
      { category: "P&L System", items: [
        "P&L Ledger with sales log, acquisitions log, summary KPIs",
        "Unified AddAssetModal: platform dropdown sorted by release year, game title autocomplete",
        "Logging a purchase syncs to Vault inventory automatically",
      ]},
      { category: "Analytics", items: [
        "Analytics dashboard with collection value, platform breakdown",
        "Pie charts and bar charts via Recharts",
        "Per-platform performance metrics",
      ]},
      { category: "Market Tools", items: [
        "Target Radar (watchlist) with buy-below price alerts and BUY NOW indicator",
        "Lot Calculator: proportional cost allocation for bulk purchases",
        "Nostalgia Score column (computed from fans/copies/rating/hold time)",
        "VIBE column (⭐/👎/⚖️ based on critic consensus)",
      ]},
    ],
  },
  {
    version: "1.2.0",
    date: "2026-04-09",
    title: "Social & Collection Features",
    type: "feature",
    changes: [
      { category: "Critics System", items: [
        "Favorites ⭐ / Regrets 👎 per person",
        "Critic Profile modal with platform breakdown and positivity score",
        "People Manager for adding/editing/removing critics",
        "Favorite-person filter in Vault",
      ]},
      { category: "Collection Showcase", items: [
        "Showcase page: visual gallery with 1-5 stars, rarity, completion status",
        "Console Codex modals with CPU/RAM/library stats and daily rotating trivia",
        "Collection Goals page: priority system (1/2/3), per-platform progress bars",
      ]},
      { category: "UX", items: [
        "Codex modal (Player's Guide + Technical Manual tabs)",
        "Demo Mode: 8-step guided tour with overlay",
        "Tooltips system with localStorage toggle",
        "PriceDetailModal shared component with price breakdown and trends",
        "PlatformButton shared component",
      ]},
    ],
  },
  {
    version: "1.3.0",
    date: "2026-04-11",
    title: "RetroVault Identity & Settings System",
    type: "feature",
    changes: [
      { category: "App Configuration", items: [
        "app.config.json: centralized config (app name, tagline, currency, theme, Plex, auth, etc.)",
        "/api/config REST API with GET/POST for all settings",
        "Settings page with sections: Identity, Localization, Deployment, Plex, Price Data, Scrapers, Features, Auth",
        "AppConfig context provider for app-wide config reads",
      ]},
      { category: "Standalone Mode", items: [
        "StandaloneNav: horizontal top navigation replacing MC sidebar",
        "Dropdown menus per feature group on desktop, accordion on mobile",
        "Toggle between Standalone (RetroVault) and Embedded (Mission Control) modes",
        "App name dynamically shown in header based on mode",
      ]},
      { category: "Authentication", items: [
        "Optional password protection (disabled by default)",
        "SHA-256 password hashing, HMAC-signed session tokens",
        "Login page with retro aesthetic and 72-hour session cookies",
        "AuthGuard client component for route protection",
        "Logout button (only visible when auth enabled)",
      ]},
    ],
  },
  {
    version: "1.4.0",
    date: "2026-04-11",
    title: "Theme System & Tags/Mentions",
    type: "feature",
    changes: [
      { category: "Themes", items: [
        "8 color palettes: Matrix Green, Cobalt Blue, Synthwave, Amber, Arcade Magenta, Retro Cyan, Crimson, Golden Age",
        "5 style themes: Terminal, CRT Scanline, Arcade Cabinet, Cartridge, Dark Galaxy",
        "CSS variable-based theming with localStorage persistence",
        "Theme picker in Settings page with live preview",
      ]},
      { category: "Tags & Mentions", items: [
        "TagsPanel component: add/remove metadata tags with autocomplete suggestions",
        "Tags available on all games and platforms via Price Detail and Console modals",
        "@ Mention system: send critic-specific notes on games/platforms",
        "Mentions viewable on Critic Profile modal",
        "/api/tags REST API for full tag/mention CRUD",
      ]},
      { category: "Search", items: [
        "Tag search bar in Vault (#tag syntax)",
        "Critic mention search (@critic syntax)",
        "Dual search bars: title/platform + tag/mention",
      ]},
    ],
  },
  {
    version: "1.5.0",
    date: "2026-04-11",
    title: "Feature Flags & Grouped Navigation",
    type: "feature",
    changes: [
      { category: "Feature Groups", items: [
        "5 toggleable feature groups: Business, Field Tools, Social, Personal, Media",
        "Navigation updates instantly when features are enabled/disabled",
        "? popover per feature with description, benefits list, and included pages",
        "Feature state persisted in app.config.json",
      ]},
      { category: "Navigation Overhaul", items: [
        "MC sidebar: collapsible groups with ▲/▼ toggle, auto-expands active group",
        "Standalone nav: dropdown menus on hover, accordion on mobile",
        "Active page highlighting in both nav modes",
        "SYSTEM ITEMS (Events, Scrapers, Settings) always visible",
      ]},
    ],
  },
  {
    version: "1.6.0",
    date: "2026-04-11",
    title: "Field Tools & Business Intelligence",
    type: "feature",
    changes: [
      { category: "Field Tools", items: [
        "Field Mode: mobile-first price check + dupe alert + Should I Buy? engine",
        "Negotiation Helper: 5 scenario presets, offer ladder, suggested opening lines",
        "Convention Tracker: named sessions, real-time budget meter, purchase log",
        "Flip Calculator: net profit after fees, break-even analysis, 5 venue presets",
      ]},
      { category: "Business Intelligence", items: [
        "Hot List: auto-ranked flip opportunities by composite score",
        "Platform Market Report: 30-day trend direction per platform",
        "Sourcing Analytics: ROI by acquisition source",
        "Seasonal Buy/Sell Calendar: monthly buy/sell signals",
        "eBay Listing Quality Checker: 12-point listing checklist with tips",
      ]},
      { category: "Collection Tools", items: [
        "Condition Grader: platform-specific checklists (NES/SNES, GBA, disc, console)",
        "Insurance Valuation Report: printable collection value document",
        "Completion Tiers: Bronze/Silver/Gold/Platinum badges per platform",
        "Decade Timeline: visual history of collection by release year",
      ]},
    ],
  },
  {
    version: "1.7.0",
    date: "2026-04-11",
    title: "Personal & Social Features",
    type: "feature",
    changes: [
      { category: "Personal", items: [
        "Play Log: 5 statuses (Playing/Beaten/Backlog/Want/Gave Up), 1-5 star ratings",
        "Holy Grail Tracker: priority-ranked wish list with FOUND IT! tracking",
        "Friends Mode: per-critic profile view with mentions, favorites, regrets",
        "Collection Milestones: 25+ auto-computed achievements",
      ]},
      { category: "Discovery", items: [
        "Field Guide: 8 chapters, 60+ principles from the retro hunting community",
        "Quote Banner: 200+ quotes from game designers and hunting wisdom",
        "Events Calendar: Eventbrite scraper, manual add, attending/interested tracking",
        "Whatnot Tracker: follow sellers, log scheduled streams",
        "Local Deals: Craigslist + Reddit r/gameswap alerts matched to watchlist",
      ]},
    ],
  },
  {
    version: "1.8.0",
    date: "2026-04-11",
    title: "Scraper Control Center & Achievement Codex",
    type: "feature",
    changes: [
      { category: "Scraper System", items: [
        "Scraper Control Center: status indicators, run/enable/disable, schedule editing",
        "6 scrapers: PriceCharting, Events, eBay Sold (placeholder), Reddit r/gameswap, PriceCharting Trending, Craigslist",
        "Auto-crontab registration when scrapers are enabled",
        "Log viewer with color-coded output, clear button",
        "5-second polling while scrapers are running",
      ]},
      { category: "Achievement Codex", items: [
        "100+ achievements across 9 categories: Collection, Business, Hunting, Platform, Personal, Social, Grind, Secret, Milestone",
        "Auto-evaluated from real app data on every page load",
        "Rarity tiers: Common/Uncommon/Rare/Epic/Legendary with point values",
        "6 secret achievements discoverable through specific behaviors",
        "Achievement panel on Analytics page, full Codex at /achievements",
        "Manual unlock API for app-usage achievements",
      ]},
    ],
  },
  {
    version: "1.9.0",
    date: "2026-04-11",
    title: "Dashboard, PWA & Alerts",
    type: "feature",
    changes: [
      { category: "Dashboard Overhaul", items: [
        "Command Center home page replacing placeholder Mission Control content",
        "4 KPI cards: Games Owned, Collection Value, Total Profit, Achievement Points",
        "Hot Flip Opportunities widget with live ROI calculations",
        "Price Alerts widget for watchlist items at/below target",
        "Currently Playing from Play Log",
        "Recent Achievements panel",
        "Upcoming Events countdown",
        "Active Grails list",
        "Quick Actions grid: 6 frequently-used tools",
        "Collection Snapshot sidebar stats",
      ]},
      { category: "PWA", items: [
        "manifest.json with app name, theme, display: standalone",
        "3 app shortcuts: Field Mode, Vault, Negotiate",
        "Apple Web App meta tags for iOS Safari Add to Home Screen",
        "Installable as native-feel app on iOS and Android",
      ]},
      { category: "Price Alert Engine", items: [
        "/api/alerts: real-time watchlist hit detection, 10% proximity warnings",
        "Hot flip alerts for 80%+ ROI opportunities",
        "Grail found alerts within 7 days of acquisition",
        "AlertsBanner component with dismiss-per-session behavior",
        "Severity levels: urgent (red), warning (yellow), success (green)",
      ]},
    ],
  },
  {
    version: "2.0.0",
    date: "2026-04-12",
    title: "Search, Shortcuts, History & Sharing",
    type: "feature",
    changes: [
      { category: "Global Search", items: [
        "Universal search overlay (press / or click 🔍 in sidebar)",
        "Searches: all 30+ pages, games in vault, grails, watchlist, events simultaneously",
        "Keyboard navigation (↑↓ + Enter), results grouped by type",
        "ESC to dismiss",
      ]},
      { category: "Keyboard Shortcuts", items: [
        "? to open shortcuts panel",
        "/ to open global search",
        "g + letter for instant page navigation (g v = Vault, g f = Field, etc.)",
        "Visual 'G + ...' hint while waiting for second key",
      ]},
      { category: "Collection Tools", items: [
        "🎲 What Should I Play? randomizer with animated slot-machine roll",
        "Platform filter, exclude-played/beaten options, add directly to Play Log",
        "Duplicate Detector: scans vault for multi-copy games with sellable extras",
        "Shows net eBay value per extra copy with direct Flip Calc and eBay links",
      ]},
      { category: "Value History", items: [
        "Daily collection value snapshot script (scripts/snapshot-value.mjs)",
        "Line chart: Loose Value vs Total Paid over time",
        "Game count growth chart",
        "30d / 90d / 180d / 1yr / All time range selector",
        "KPIs: current value, change, % change, games added",
      ]},
      { category: "Sharing", items: [
        "Public Collection URL: generate shareable read-only link with token",
        "Public page shows game list, platform stats, condition — hides all prices/P&L",
        "QR Code generator (SVG, downloadable) for conventions",
        "3 app shortcuts in PWA manifest: Field Mode, Vault, Negotiate",
      ]},
      { category: "Changelog", items: [
        "Full backward-looking changelog from v1.0.0 to current",
        "Searchable changelog at /changelog",
        "Codex updated with all new features",
      ]},
    ],
  },
];
