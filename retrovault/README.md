# 👾 RetroVault

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
