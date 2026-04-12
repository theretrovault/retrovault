# 👾 RetroVault

[![CI](https://github.com/apesch85/retrovault/actions/workflows/test.yml/badge.svg)](https://github.com/apesch85/retrovault/actions/workflows/test.yml)
[![Build](https://github.com/apesch85/retrovault/actions/workflows/build.yml/badge.svg)](https://github.com/apesch85/retrovault/actions/workflows/build.yml)
[![Version](https://img.shields.io/badge/version-2.0.0-22c55e?style=flat-square)](retrovault/src/data/changelog.ts)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](CONTRIBUTING.md)

**You've got a spreadsheet. You hate your spreadsheet.**

It doesn't know what your Earthbound CIB is worth today. It can't tell you if the PS1 game at the garage sale tomorrow is on your want list. It has no idea you already own three copies of Madden '95.

RetroVault is the tool that spreadsheet could never be.

---

## What it does

RetroVault is a self-hosted retro game collection manager built for people who take their collection seriously. Whether you're hunting for deals, tracking your flips, or just trying to remember what you actually own — this is the command center for your retro gaming operation.

**Know your collection.**  
Every game you own, across every platform, with condition tracking, purchase history, and real market prices pulled automatically from PriceCharting. Your total collection value, updated daily. Duplicate alerts so you stop buying games you already have.

**Hunt smarter.**  
Field Mode is your in-the-wild price checker — open it at a garage sale, type a title, and instantly see the market value, whether it's on your want list, and whether you should buy it or walk away. Dupe alert included. No fumbling with browser tabs.

**Know when to sell.**  
Hot List surfaces your best flip opportunities right now, ranked by ROI × market trend × copy count. Flip Calculator shows you exactly what you'll net after eBay's 13.25% cut and shipping. Because "selling for $80" and "making $80" are very different numbers.

**Track the hunt.**  
Convention Tracker keeps your event budget in check in real time. Negotiation Helper gives you an offer ladder before you walk up to the dealer table. The Field Guide has 60+ principles from experienced hunters — everything from "eBay sold listings are the truth, active listings are fiction" to exactly what to say when you want to haggle.

**Your data. Your machine.**  
RetroVault is self-hosted. Your collection data lives in plain files on your own computer — no cloud, no subscription, no company that can shut down and take your data with it. Back up by copying a folder. *That's it.*

---

## Features at a glance

| Category | What's included |
|---|---|
| 🕹️ **Collection** | Vault inventory · Showcase gallery · Platform completion tiers · Milestones · Achievement Codex (100+) · Decade timeline · Value history graph |
| 💰 **Business** | P&L ledger · Hot List · Flip Calculator · Target Radar watchlist · Sourcing analytics · Platform market report · Seasonal buy/sell calendar · eBay listing checklist |
| 🔦 **Field Tools** | Field Mode · Negotiation Helper · Lot Calculator · Convention Tracker · Condition Grader · Insurance valuation report |
| 🎮 **Personal** | Play Log · Holy Grail Tracker · Collection Randomizer · Duplicate Detector |
| 👥 **Social** | Critics & VIBE system · Tags & @mentions · Friends Mode |
| 🌐 **Discovery** | Gaming Events calendar · Whatnot seller tracker · Local Deals (Craigslist + Reddit r/gameswap) · Field Guide |
| ⚙️ **Platform** | 8 color themes · 5 style themes · Feature flags · Global search · Keyboard shortcuts · PWA · CSV import · Shareable collection URL + QR code |

**35 platforms supported** — from Atari 2600 to Xbox Series X. Default to retro; unlock everything in Settings.

---

## How it compares

You've probably tried the alternatives. Here's why they left you wanting more.

### vs. PriceCharting

PriceCharting is indispensable as a **price reference** — we use it as our data source too. But its built-in collection tracker is a sideline feature, not a purpose-built tool.

| | PriceCharting | RetroVault |
|---|---|---|
| Market prices (Loose/CIB/New/Graded) | ✅ | ✅ (powered by PriceCharting) |
| 30-day price history & trend analysis | ✅ | ✅ |
| Collection tracking | Basic | Full (copies, condition, cost, source, date) |
| P&L / flip tracking | ❌ | ✅ Full ledger with realized profit |
| Buy/Sell score per game | ❌ | ✅ Computed from market + trend data |
| Hot List (ranked flip opportunities) | ❌ | ✅ |
| Field Mode (garage sale price checker) | ❌ | ✅ With dupe alert + Should I Buy? |
| Negotiation Helper | ❌ | ✅ |
| Convention budget tracker | ❌ | ✅ |
| Watchlist price alerts | ❌ | ✅ |
| Play Log / backlog tracker | ❌ | ✅ |
| Holy Grail Tracker | ❌ | ✅ |
| Achievement system | ❌ | ✅ 100+ achievements |
| Local deal alerts (Craigslist/Reddit) | ❌ | ✅ |
| Sourcing analytics (ROI by source) | ❌ | ✅ |
| Seasonal buy/sell calendar | ❌ | ✅ |
| Self-hosted / your data | ❌ (cloud only) | ✅ |
| Free | Free tier + paid Pro | ✅ Free and open source |

**Bottom line:** PriceCharting is where you look up a price. RetroVault is what you do with that information.

---

### vs. CLZ Games

CLZ Games is the most polished dedicated game collection app available. It's genuinely good, especially on mobile. But it's built for cataloging, not for the business of collecting.

| | CLZ Games | RetroVault |
|---|---|---|
| Mobile app | ✅ Native iOS/Android | ✅ PWA (installable, works offline) |
| Barcode scanning | ✅ | ❌ (title search instead) |
| Cover art & metadata | ✅ Rich database | ✅ via PriceCharting catalog |
| Market prices | ✅ (PriceCharting powered) | ✅ (PriceCharting powered) |
| Cloud sync | ✅ (CLZ Cloud) | Self-hosted (your data stays local) |
| P&L / profit tracking | ❌ | ✅ |
| Flip calculator with fee math | ❌ | ✅ |
| Hot flip opportunities | ❌ | ✅ |
| Field Mode decision engine | ❌ | ✅ |
| Negotiation assistance | ❌ | ✅ |
| Local deal alerts | ❌ | ✅ |
| Convention tracker | ❌ | ✅ |
| Critics / social ratings | ❌ | ✅ |
| Achievement system | ❌ | ✅ |
| Open source | ❌ (proprietary SaaS) | ✅ MIT license |
| Subscription required | ✅ ~$4-6/month | ❌ Free forever |

**Bottom line:** CLZ is excellent if you want a polished catalog app and cloud sync. RetroVault is for collectors who also want to understand the *business* of their collection — what to buy, what to sell, what the margins look like.

---

### vs. a spreadsheet

A spreadsheet can't check for dupes at a garage sale. It doesn't know what the 30-day price trend is. It won't tell you your ROI after eBay fees. It has no idea when gaming conventions are happening near you. And it definitely doesn't have an achievement for finding 10 items off your grail list.

You know this already. That's why you're here.

---

## Getting started

### Requirements
- Node.js 22+
- Git

### Install

```bash
git clone git@github.com:apesch85/retrovault.git
cd retrovault/retrovault
cp data/sample/app.config.sample.json data/app.config.json
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start adding games.

### Build your game database

RetroVault can pull the full game catalog for any platform from PriceCharting:

```bash
# Scrape specific platforms
node scripts/scrape-catalog.mjs --platforms=NES,SNES,N64

# Scrape everything (takes a while — run overnight)
node scripts/scrape-catalog.mjs
```

### Set up price fetching

Prices are pulled automatically from PriceCharting. Register the nightly cron:

```bash
# Add to crontab (runs at midnight)
(crontab -l; echo "0 0 * * * node $(pwd)/scripts/bg-fetch.mjs >> $(pwd)/logs/bg-fetch.log 2>&1") | crontab -
```

---

## Your data

All your collection data lives in `data/` on your machine. **None of it is committed to git.**

```
data/
├── app.config.json      ← your settings
├── inventory.json       ← your game catalog + prices
├── sales.json           ← P&L transaction log
├── goals.json           ← platform completion goals
├── grails.json          ← holy grail wish list
├── playlog.json         ← what you've played/beaten
└── ...
```

To back up your collection: `cp -r data/ ~/my-retrovault-backup/`  
To migrate to a new machine: copy the `data/` folder and run `npm install`.

No database server. No migrations. No lock-in.

---

## Production deployment

RetroVault runs well on a Raspberry Pi, a spare box on your LAN, or any Linux server:

```bash
# Install pm2 for process management
npm install -g pm2

# Build and start
npm run build
pm2 start ecosystem.config.js

# Optional: nginx reverse proxy
# See nginx.conf.example for a ready-to-go config
```

PWA-ready — add it to your phone's home screen for a native-feeling Field Mode experience.

---

## Scripts

| Script | What it does |
|---|---|
| `scripts/bg-fetch.mjs` | Fetch PriceCharting prices for all owned games (run nightly) |
| `scripts/scrape-catalog.mjs` | Build game database for any platform |
| `scripts/scrape-events.mjs` | Pull gaming events from Eventbrite |
| `scripts/scrape-craigslist.mjs` | Local Craigslist game deal alerts |
| `scripts/scrape-reddit.mjs` | r/gameswap alerts for your watchlist |
| `scripts/snapshot-value.mjs` | Record daily collection value (run daily) |
| `scripts/deploy.sh` | Pull → build → reload pm2 in one command |

---

## The field guide

RetroVault includes an in-app **Field Guide** (`/guide`) with 8 chapters and 60+ principles sourced from experienced retro hunters:

> *"eBay SOLD listings are the truth. Asking price is just a dream."*

> *"Never buy what you can't sell. Always sell what you don't love."*

> *"The flea market at 6am is worth every minute of lost sleep."*

Topics covered: hunter's mindset · pricing mechanics · buying smart at garage sales vs conventions vs thrift stores · negotiation tactics · selling for maximum return · spotting fakes · building a collection with intent.

---

## Acknowledgments

Knowledge drawn from the retro game collecting community — r/gamecollecting, r/gameswap, Chase After The Right Price (YouTube), Metal Jesus Rocks, and the countless collectors who've shared what they know.

---

## License

MIT — use it, fork it, build on it.

---

## Support

If RetroVault saves you money on a deal, consider buying a coffee:

[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support%20the%20project-FF5E5B?style=flat-square&logo=kofi)](https://ko-fi.com)

---

*Built for hunters, collectors, and everyone who's ever walked out of a garage sale with a cardboard box full of someone else's childhood.*
