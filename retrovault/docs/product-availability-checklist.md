# RetroVault Product Availability Checklist

This checklist is the execution companion to `docs/product-availability-phase-1.md`.

Use it to move RetroVault onto the usual public/distribution surfaces without mixing that work into feature backlog.

---

## Phase 1 goal

Make RetroVault:
- easy to find
- easy to install
- easy to trust
- easy to join/support

Primary Phase 1 surfaces:
- GitHub
- GHCR as the primary public registry
- Docker Hub as a later convenience mirror
- docs
- landing-page messaging assets
- GitHub-first community/support entrypoints

---

## A. Work that can be completed without Alex

### A1. GitHub public-surface polish
- [x] Audit README/docs structure for product-availability gaps
- [x] Create GitHub public-surface recommendation doc
- [x] Create reusable public copy pack
- [ ] Audit README for:
  - [ ] clear one-line value prop
  - [ ] install options near the top
  - [ ] support/community links
  - [ ] release/distribution links
  - [ ] screenshots / image placeholders / media plan
- [ ] Prepare recommended GitHub About text
- [ ] Prepare recommended short repo description
- [ ] Draft release-note template for future public releases
- [ ] Draft support/discussion guidance for docs

### A2. GHCR readiness
- [x] Create GHCR readiness doc
- [x] Audit current GitHub Actions/release/deploy workflow posture at a planning level
- [ ] Audit current GitHub Actions workflows for container publish behavior
- [ ] Document desired image tags:
  - [ ] `latest`
  - [ ] `nightly`
  - [ ] version tags (`vX.Y.Z` and/or `X.Y.Z`)
- [ ] Document desired image metadata/labels
- [ ] Document pull/run verification steps
- [ ] Note any multi-arch gaps (`amd64`, `arm64`)

### A3. Docker Hub readiness
- [x] Create Docker Hub readiness doc
- [x] Create Docker Hub publish requirements handoff doc
- [ ] Draft Docker Hub repo description
- [ ] Draft Docker Hub long description / README copy
- [ ] Define desired tag mapping vs GHCR
- [ ] Document CI push requirements and token/secrets needed
- [ ] Document post-publish verification steps

### A4. Docs readiness
- [ ] Ensure install docs are adequate for public discovery traffic
- [ ] Ensure upgrade path is documented
- [ ] Ensure backup/restore docs are clearly linked
- [ ] Ensure release-channel model is documented (`autopush`, `nightly`, `prod`)
- [ ] Add product-availability docs to the discoverable docs set

### A5. Messaging assets
- [ ] Draft homepage hero copy
- [ ] Draft short description variants for:
  - [ ] GitHub
  - [ ] Docker Hub
  - [ ] directory/listing sites
  - [ ] social profiles
- [ ] Draft “Why RetroVault” paragraph
- [ ] Draft community/support call-to-action copy

### A6. Discord/community readiness
- [x] Create Discord/community recommendation doc
- [ ] Recommend public Discord structure
- [ ] Draft suggested channels and purpose of each
- [ ] Draft welcome/onboarding copy
- [ ] Draft announcements/support expectations copy

---

## B. Work that needs Alex

### B1. Platform ownership / decisions
- [x] Confirm official Docker Hub org/repo target as `theretrovault/retrovault`
- [x] Confirm that dedicated landing page/domain is later, not Phase 1
- [x] Confirm community remains GitHub-first in Phase 1
- [ ] Confirm official public domain / landing-page domain later when backlog item activates
- [ ] Confirm official public Discord server/invite later if community expands beyond GitHub-first support

### B2. GitHub settings / platform actions
- [ ] Make GHCR package public if still private
- [ ] Update GitHub About section / website / social preview
- [x] Decide that GitHub Discussions should be enabled and public-facing
- [ ] Provide Docker Hub token/secrets later when automated publishing is activated

### B3. Public-facing assets / approval
- [x] Approve tagline direction as "A self-hosted command center for retro game collectors."
- [x] Defer screenshots to Phase 2
- [ ] Approve public links to promote when GHCR visibility / GitHub settings are finalized

---

## Recommended execution order

### Wave 1: self-serve prep
1. Product availability planning docs
2. README/docs polish recommendations
3. GHCR audit
4. Docker Hub readiness checklist
5. messaging drafts
6. Discord structure recommendation

### Wave 2: Alex unblockers
1. GHCR visibility + GitHub About/discussions settings
2. Docker Hub token when the mirror is activated
3. landing domain decision later from backlog
4. screenshots/public media in Phase 2

### Wave 3: go live
1. enable/publish GHCR cleanly
2. publish Docker Hub mirror
3. update GitHub public surface
4. publish docs/support/community links
5. verify discoverability/install path end-to-end

---

## Exit criteria for Phase 1

Phase 1 is complete when:
- [ ] GitHub clearly presents RetroVault as a polished public project
- [ ] GHCR path is documented and trustworthy
- [ ] Docker Hub path is ready or live
- [ ] docs support install, upgrade, backup/restore, and release-channel questions
- [ ] community entrypoint is defined
- [ ] remaining user-dependent steps are explicit, small, and actionable
