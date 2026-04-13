# 👾 RetroVault

**You've got a spreadsheet. You hate your spreadsheet.**

RetroVault is a self-hosted web app for retro game collectors and flippers. It tracks your inventory, pulls live market prices from PriceCharting, calculates your real net profit after eBay fees, tells you what to buy and what to sell — and it has a Field Mode designed to be opened at a garage sale while someone watches you decide whether their copy of Earthbound is worth $40.

It's the tool your spreadsheet could never be.

---

**What it does:**
- 🕹️ **Tracks your collection** — every game, every copy, condition, cost, and CIB status across 35 platforms
- 💰 **Knows what things are worth** — live prices from PriceCharting, updated nightly, with 30-day trend tracking
- 🔦 **Works in the field** — Field Mode gives you instant price lookups, dupe alerts, and a "Should I Buy?" verdict before you open your wallet
- 📊 **Does the math** — P&L ledger, flip calculator with real fee math, hot list of your best opportunities right now
- 🏆 **Gamifies the hobby** — 130+ achievements, play log, grail tracker, collection milestones

Built for the person who takes their collection seriously. Self-hosted, no subscription, your data stays on your machine.

---

The full app lives in [`retrovault/`](./retrovault/).

👉 **[Full README, features, and setup →](./retrovault/README.md)**
👉 **[Installation guide (Docker, Mac, Windows, Linux, Pi) →](./retrovault/docs/installation.md)**

---

```bash
# Docker (easiest)
cd retrovault
docker compose up -d

# Or native
cp data/sample/app.config.sample.json data/app.config.json
npm install && npm run dev
```

---

*Built for hunters, collectors, and everyone who's ever walked out of a garage sale with a cardboard box full of someone else's childhood.*

---

## Support the project

RetroVault is free and open source. If it saves you money on a deal or helps you run your collection better, consider sponsoring development:

[![GitHub Sponsors](https://img.shields.io/badge/GitHub%20Sponsors-Sponsor%20RetroVault-EA4AAA?style=flat-square&logo=github-sponsors)](https://github.com/sponsors/apesch85)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-Buy%20me%20a%20coffee-FF5E5B?style=flat-square&logo=kofi)](https://ko-fi.com/alexp85)

Every contribution helps keep the project active and free.
