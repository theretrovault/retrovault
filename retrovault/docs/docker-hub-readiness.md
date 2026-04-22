# RetroVault Docker Hub Readiness

This document defines what RetroVault should look like on Docker Hub and what remains to make that surface clean, trustworthy, and easy to use.

---

## Goal

Make RetroVault available on Docker Hub because many self-hosters search there first, even if GHCR remains the more natural primary registry.

Recommended canonical Docker Hub repo shape:
- official repo path: `retrovault/retrovault`
- image naming should mirror GHCR tags as closely as possible

---

## Recommended role of Docker Hub

Docker Hub should be treated as:
- a discoverability surface
- a convenience mirror for users
- a familiar install path for self-hosters

GHCR can remain the more GitHub-native primary source of truth for image publishing.

---

## Desired tag model

Mirror GHCR as closely as possible for stable releases:
- `latest`
- semver tags like `2.1.25`
- optional `v2.1.25` mirror tag if GHCR keeps both styles

Current scope decision:
- stable only for Docker Hub right now
- `nightly` remains GHCR-only for now

Rule of thumb:
- same image content across GHCR and Docker Hub for equivalent stable tags
- avoid letting Docker Hub drift into a separate manual release path

---

## Readiness checklist

### Public surface
- [ ] official Docker Hub repo exists
- [ ] description clearly explains what RetroVault is
- [ ] long description mirrors or adapts the README well
- [ ] tags are predictable and documented
- [ ] install example is visible in Docker Hub description

### Automation
- [x] GitHub Actions can authenticate to Docker Hub
- [x] stable release tags publish automatically
- [x] optional nightly tag publish behavior is defined
- [x] no manual-only publish process unless intentionally temporary

### Trust / operator experience
- [ ] docs explain persistence volumes and environment expectations
- [ ] docs explain upgrade expectations
- [ ] backup/restore guidance is linked nearby
- [ ] image naming matches docs exactly

---

## Draft Docker Hub short description

RetroVault is a self-hosted retro game collection manager for collectors, flippers, and hunters, with inventory tracking, market pricing, Field Mode, P&L, and watchlist tools.

---

## Draft Docker Hub long description

RetroVault is a self-hosted retro game collection manager built for people who buy, sell, trade, and track retro games seriously. It combines collection management, live market pricing, field buying tools, watchlists, sales tracking, and operator-friendly backup/restore workflows in one app.

Highlights:
- collection inventory with copies, condition, purchase history, and market pricing
- Field Mode for garage sales, conventions, and live buying decisions
- P&L tracking, flip tools, and sourcing/business workflows
- watchlists, goals, grails, play log, and achievement systems
- self-hosted, open source, and designed around keeping your data under your control

For install, upgrade, and backup/restore guidance, see the GitHub README and docs.

---

## Work I can do without Alex

- define the recommended Docker Hub role in the distribution model
- draft repo copy and description text
- define the tag strategy and parity expectations vs GHCR
- document the CI/token requirements for automated publishing
- document verification steps

---

## Work that needs Alex

- confirm whether nightly images should also publish publicly to Docker Hub later

---

## Recommended verification steps

### Pull test
```bash
docker pull retrovault/retrovault:latest
```

### Install test
Use the documented compose path and verify:
- initial startup works cleanly
- volumes persist runtime state
- upgrade path does not lose runtime data

### Release verification
For each stable release:
- confirm matching semver tag exists on Docker Hub
- confirm `latest` points to the expected stable release
- confirm docs still match the real repo/image/tag names

---

## Recommendation

Use Docker Hub as a public convenience mirror, not as a separate release authority. Publish from the same GitHub-driven automation path that feeds GHCR so users get consistency instead of registry drift. Current implementation scope is stable-only mirroring to `retrovault/retrovault`.
