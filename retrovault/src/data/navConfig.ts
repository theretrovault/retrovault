export type FeatureGroup = "collection" | "business" | "fieldTools" | "social" | "personal";

export type NavItem = {
  href: string;
  label: string;
  icon: string;
  feature: FeatureGroup;
};

export type NavGroup = {
  id: FeatureGroup;
  label: string;
  icon: string;
  description: string;
  benefits: string[];
  alwaysOn: boolean;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "collection",
    label: "Collection",
    icon: "🕹️",
    description: "The core of RetroVault — track every game you own.",
    benefits: [
      "Full inventory with condition, cost, and copy tracking",
      "Visual showcase gallery with ratings and rarity",
      "Per-platform collection goals and progress bars",
      "Completion tier badges (Bronze → Platinum) per system",
      "Collection milestones and achievement tracking",
      "Decade timeline view of your library",
    ],
    alwaysOn: true,
    items: [
      { href: "/inventory", label: "Vault", icon: "🕹️", feature: "collection" },
      { href: "/showcase", label: "Showcase", icon: "🎮", feature: "collection" },
      { href: "/goals", label: "Goals", icon: "🏆", feature: "collection" },
      { href: "/tiers", label: "Completion Tiers", icon: "🏅", feature: "collection" },
      { href: "/achievements", label: "Achievements", icon: "🏆", feature: "collection" },
      { href: "/milestones", label: "Milestones", icon: "🎯", feature: "collection" },
      { href: "/timeline", label: "Timeline", icon: "📅", feature: "collection" },
      { href: "/condition", label: "Condition Grader", icon: "🔍", feature: "collection" },
      { href: "/insurance", label: "Insurance Report", icon: "📋", feature: "collection" },
      { href: "/value-history", label: "Value History", icon: "📈", feature: "collection" },
      { href: "/random", label: "Randomizer", icon: "🎲", feature: "collection" },
      { href: "/dupes", label: "Dupe Detector", icon: "🔎", feature: "collection" },
    ],
  },
  {
    id: "business",
    label: "Business",
    icon: "💰",
    description: "Turn your collection into a money-making operation.",
    benefits: [
      "P&L ledger tracks every buy and sell with realized profit",
      "Buy/Sell scores (1–100) on every game based on market data",
      "Analytics dashboard with platform ROI and collection value",
      "Hot List auto-ranks your best flip opportunities right now",
      "Flip Calculator shows exact net profit after fees and shipping",
      "Target Radar watchlist with buy-below price alerts",
    ],
    alwaysOn: false,
    items: [
      { href: "/analytics", label: "Analytics", icon: "📊", feature: "business" },
      { href: "/sales", label: "P&L Ledger", icon: "💰", feature: "business" },
      { href: "/watchlist", label: "Target Radar", icon: "🎯", feature: "business" },
      { href: "/hotlist", label: "Hot List", icon: "🔥", feature: "business" },
      { href: "/flip", label: "Flip Calc", icon: "💸", feature: "business" },
      { href: "/sourcing", label: "Sourcing Analytics", icon: "📍", feature: "business" },
      { href: "/market", label: "Market Report", icon: "📈", feature: "business" },
      { href: "/seasonal", label: "Seasonal Calendar", icon: "📆", feature: "business" },
      { href: "/listing", label: "Listing Checker", icon: "📝", feature: "business" },
    ],
  },
  {
    id: "fieldTools",
    label: "Field Tools",
    icon: "🔦",
    description: "Your toolkit for the hunt — at garage sales, thrift stores, and conventions.",
    benefits: [
      "Field Mode: instant price check + dupe alert on any game",
      "Should I Buy? decision engine with margin analysis",
      "Negotiation Helper with offer ladder and suggested opening lines",
      "Lot Calculator for proportional cost splitting on bulk purchases",
      "Convention Tracker with real-time budget meter per event",
    ],
    alwaysOn: false,
    items: [
      { href: "/field", label: "Field Mode", icon: "🔦", feature: "fieldTools" },
      { href: "/negotiate", label: "Negotiate", icon: "🤝", feature: "fieldTools" },
      { href: "/lot", label: "Lot Calc", icon: "📦", feature: "fieldTools" },
      { href: "/convention", label: "Convention", icon: "🎪", feature: "fieldTools" },
    ],
  },
  {
    id: "social",
    label: "Social",
    icon: "👥",
    description: "Share your collection with friends and get their takes.",
    benefits: [
      "Add critics (friends) who can favorite and rate games",
      "VIBE column shows group consensus on each game",
      "Tag any game with metadata labels for search and discovery",
      "@ mention critics on specific games with notes",
      "Friends Mode: each critic gets their own personalized view",
    ],
    alwaysOn: false,
    items: [
      { href: "/friends", label: "Friends Mode", icon: "👥", feature: "social" },
    ],
  },
  {
    id: "personal",
    label: "Personal",
    icon: "📓",
    description: "Track your gaming life beyond just what you own.",
    benefits: [
      "Play Log: Currently Playing / Beaten / Backlog / Gave Up status",
      "1–5 star ratings and notes per game",
      "Holy Grail Tracker: your must-have wish list, priority-ranked",
      "Mark grails as FOUND when you score them",
          ],
    alwaysOn: false,
    items: [
      { href: "/playlog", label: "Play Log", icon: "🎮", feature: "personal" },
      { href: "/grails",   label: "Grail List", icon: "🏴‍☠️", feature: "personal" },
      { href: "/wishlist", label: "Wishlist",   icon: "🎁",         feature: "personal" },
    ],
  }
];

// Always-visible items regardless of feature flags
export const SYSTEM_ITEMS: NavItem[] = [
  { href: "/guide", label: "Field Guide", icon: "📖", feature: "collection" },
  { href: "/changelog", label: "Changelog", icon: "📋", feature: "collection" },
  { href: "/import", label: "CSV Import", icon: "📥", feature: "collection" },
  { href: "/share", label: "Share Collection", icon: "🔗", feature: "collection" },
  { href: "/whatnot", label: "Whatnot", icon: "📺", feature: "collection" },
  { href: "/deals", label: "Local Deals", icon: "🏠", feature: "collection" },
  { href: "/events", label: "Events", icon: "🎪", feature: "collection" },
  { href: "/health", label: "System Health", icon: "📊", feature: "collection" },
  { href: "/api-docs", label: "API", icon: "🔌", feature: "collection" },
  { href: "/scrapers", label: "Scrapers", icon: "🔧", feature: "collection" },
  { href: "/settings", label: "Settings", icon: "⚙️", feature: "collection" },
];

export type Features = {
  collection: boolean; // always true
  business: boolean;
  fieldTools: boolean;
  social: boolean;
  personal: boolean;
};

export const DEFAULT_FEATURES: Features = {
  collection: true,
  business: true,
  fieldTools: true,
  social: true,
  personal: true,
};

export function getEnabledGroups(features: Features): NavGroup[] {
  return NAV_GROUPS.filter(g => g.alwaysOn || features[g.id]);
}

export function getEnabledItems(features: Features): NavItem[] {
  return [
    ...getEnabledGroups(features).flatMap(g => g.items),
    ...SYSTEM_ITEMS,
  ];
}
