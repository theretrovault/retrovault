# Contributing to RetroVault

Thanks for wanting to contribute! RetroVault is built for the retro gaming community, and we welcome contributions from collectors, hunters, and developers alike.

---

## Before You Start

- Check [open issues](https://github.com/apesch85/retrovault/issues) to avoid duplicates
- For big changes, open an issue first to discuss the approach
- For small fixes (typos, clear bugs), a PR is fine directly

---

## Development Setup

```bash
git clone https://github.com/apesch85/retrovault.git
cd retrovault/retrovault

# Copy the sample config
cp data/sample/app.config.sample.json data/app.config.json

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Running Tests

```bash
npm test          # Run once
npm run test:watch # Watch mode
```

All 97 tests must pass before a PR will be merged.

---

## What We're Looking For

**Great contributions:**
- Bug fixes with regression tests
- New scraper sources for game data or events
- Improvements to Field Mode, the Negotiation Helper, or hunt-related tools
- UI polish that respects the retro terminal aesthetic
- New achievements (see `src/data/achievements.ts`)
- Expanding the Field Guide (`src/data/guide.ts`) with community wisdom

**Out of scope:**
- Plex/media features (deliberately removed from the public codebase)
- Cloud sync or multi-tenant features (roadmap item, needs architectural discussion first)
- Breaking changes to the data file structure without a migration path

---

## Code Style

- **Font:** Use `font-terminal` class for all UI text (VT323 monospace)
- **Colors:** Green phosphor palette. Primary green: `text-green-400`, borders: `border-green-800`
- **Components:** Keep pages in `src/app/`, shared UI in `src/components/`, static data in `src/data/`
- **API routes:** All under `src/app/api/`, use `force-dynamic` and `Cache-Control: no-store`
- **TypeScript:** Type everything. No `any` unless truly unavoidable.
- **Data files:** Never commit personal data (`data/*.json`). The `.gitignore` covers this.

---

## Adding a Feature

1. Create or find an existing issue
2. Fork → branch → PR
3. Add tests for business logic (see `src/__tests__/`)
4. Update `src/data/changelog.ts` with your change
5. Make sure `npm test` passes and `npm run build` succeeds

---

## Adding a Scraper

Scrapers live in `scripts/`. Follow the existing pattern:

- Throttle requests (2.5s minimum between requests)
- Write to a `data/*.json` file
- Log to `logs/*.log`
- Register in `data/scrapers.json` so it appears in the Scraper Control Center
- No API keys required (free sources only)

---

## Commit Messages

We use conventional-ish commits:
- `fix: ` — bug fix
- `feat: ` — new feature
- `test: ` — test additions
- `docs: ` — documentation
- `refactor: ` — code improvement without behavior change
- `deps: ` — dependency updates

---

## Getting Help

- [GitHub Discussions](https://github.com/apesch85/retrovault/discussions) for questions
- Open an issue if you're unsure about direction

---

*Built for hunters, collectors, and everyone who's ever walked out of a garage sale with a cardboard box full of someone else's childhood.*
