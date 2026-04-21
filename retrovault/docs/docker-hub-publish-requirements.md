# RetroVault Docker Hub Publish Requirements

This is the concrete handoff/checklist for turning Docker Hub from a planned mirror into a real public distribution surface.

---

## Goal

Publish RetroVault to Docker Hub using the same release discipline as GitHub/GHCR so users can rely on familiar tags without registry drift.

---

## Minimum requirements

### 1. Official Docker Hub repo
Need Alex to confirm/create:
- Docker Hub namespace/org
- target repo name

Recommended target shape:
- `<namespace>/retrovault`

### 2. Automation credentials
Need Alex to provide/store as GitHub secrets:
- Docker Hub username or robot account identifier
- Docker Hub access token

### 3. Tag policy
Recommended mirror tags:
- `latest`
- `nightly`
- semver tags such as `2.1.25`
- optional `v2.1.25` mirror tag if we want exact Git tag matching too

### 4. Publish authority
Recommended rule:
- GitHub Actions is the publish authority
- do not maintain Docker Hub manually unless as a temporary fallback

---

## Recommended GitHub Actions inputs/secrets

Examples of likely needed secrets:
- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

Potential publish points:
- stable release tags from `prod`
- optional nightly publication from `nightly`

---

## Verification checklist

After setup:
- [ ] image can be pulled from Docker Hub
- [ ] expected tags exist
- [ ] README/description text is correct
- [ ] Docker Hub tags match GHCR tags for the same release
- [ ] documented install path actually works end-to-end

---

## Recommendation

Do not publish Docker Hub first and clean it up later. Treat it as a mirror that should launch cleanly, with the same trust and predictability as GitHub/GHCR.
