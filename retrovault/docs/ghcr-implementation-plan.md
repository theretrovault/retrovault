# RetroVault GHCR Implementation Plan

This document covers the gap between current GHCR readiness docs and a real publish pipeline.

---

## Current truth

RetroVault now has dedicated GitHub Actions workflows for GHCR publishing.

Current workflows now do the following:
- `ci.yml` runs tests and build
- `release.yml` runs tests, build, smoke, publishes stable GHCR tags, and creates a GitHub release on `v*` tags
- `publish-nightly-image.yml` runs from `nightly`, validates the build, and publishes `ghcr.io/theretrovault/retrovault:nightly`
- deploy/promotion workflows handle SSH deploys and live smoke validation

What is still missing:
- Docker Hub mirror workflow
- any additional nightly verification beyond successful Actions publish/logs

---

## Recommended publish model

### Stable publish source
- publish stable images from tagged releases on `prod`

### Recommended stable tags
- `latest`
- `X.Y.Z`
- optional `vX.Y.Z`

### Optional nightly publish source
- publish `nightly` from the `nightly` branch or promotion workflow

### Important rule
- do not publish `latest` from `autopush`

---

## Recommended workflow shape

### Stable release workflow
Add a new workflow or extend `release.yml` to:
1. checkout repo
2. set up Docker Buildx
3. log in to GHCR with GitHub token
4. compute tags/labels
5. build image from repo Dockerfile
6. push image to GHCR
7. optionally verify a pull of the published tag
8. create/update GitHub Release

### Nightly workflow
A separate workflow now:
1. runs only from `nightly`
2. publishes `ghcr.io/theretrovault/retrovault:nightly`
3. never updates `latest`

---

## Recommended Actions permissions

Likely needed for publish workflow:
- `contents: write` for release creation if bundled together
- `packages: write` for GHCR publish

---

## Recommended metadata

Image should include standard OCI labels such as:
- source repo URL
- project title
- project description
- license
- revision/commit SHA
- version/tag

---

## Recommended verification after publish

### Registry verification
- confirm package/tag is visible on GHCR
- confirm tags match docs/release expectations

### Pull verification
```bash
docker pull ghcr.io/theretrovault/retrovault:latest
```

### Run verification
Use documented compose/install path and verify:
- app boots
- health endpoint responds
- data volume expectations are clear
- upgrade path remains consistent

---

## Recommendation

Keep GHCR as the primary automated registry target and wire Docker Hub only after GHCR publishing is clean. Stable and nightly GHCR lanes are now separated cleanly, which is the right shape. One clean cartridge before a second cartridge, because registry drift is a lousy boss battle.
