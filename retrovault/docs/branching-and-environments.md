# RetroVault — Branching, Environments, and Promotion Blueprint

This document defines the target delivery model for RetroVault so development can move quickly without touching production by accident.

## Goals

- Support fast iteration without risking the public production instance.
- Separate code promotion from deployment promotion.
- Allow Neo to spin up externally visible demo/dev instances safely.
- Make production releases intentional and manual.
- Create a model that can be reused for future apps, not just RetroVault.

## Branch model

RetroVault should move from a single `master` release lane to three long-lived branches:

- `autopush`
  - fast integration branch
  - direct pushes allowed for trusted maintainers
  - auto-deploys to the dev environment
  - can be noisy and temporarily unstable

- `nightly`
  - promoted from `autopush` on a schedule
  - deploys to a more stable preview environment
  - intended for next-day demos and broader validation
  - should only move forward if tests/build pass

- `prod`
  - protected production branch
  - manual promotion only
  - production deploys happen only from this branch
  - no routine direct development here

## Naming transition

The repo has already been expanded to include long-lived remote branches for:

1. `prod`
2. `nightly`
3. `autopush`

`master` still exists during transition, but it is no longer the intended long-term release lane.

Remaining transition work:
1. Make `prod` the default branch in GitHub
2. Move or recreate protections/rulesets on `prod` and `nightly` as needed
3. Update any remaining integrations or references that still assume `master`
4. Retire or hard-lock `master` once the cutover is complete

If lower risk is preferred during transition, `master` can remain temporarily as an alias/safety net until GitHub-side protections, badges, and workflow assumptions are fully migrated.

## Environment model

Branches alone are not enough. Each branch needs a distinct runtime target.

### Environments

- **Dev**
  - source branch: `autopush`
  - purpose: rapid iteration, experiments, live demos
  - URL: `retrovault-dev.peschpit.com`
  - optional shared ingress: `dev.peschpit.com`
  - deployment: automatic
  - authentication: none for explicitly approved demo windows
  - exposure: ephemeral, auto-disabled after 48 hours unless renewed

- **Nightly**
  - source branch: `nightly`
  - purpose: stable preview, next-day validation
  - URL: `retrovault-nightly.peschpit.com`
  - deployment: scheduled nightly or on explicit promotion
  - authentication: optional, but recommended if it contains real data
  - exposure: persistent preview environment

- **Production**
  - source branch: `prod`
  - purpose: public release
  - URL: `retrovault.peschpit.com`
  - deployment: manual only
  - authentication: based on product settings
  - exposure: persistent

## Data separation

This is mandatory. Environments must not share the same mutable data by accident.

### Recommended database split

Use separate environment directories with a consistent DB filename:

- `data/dev/retrovault.db`
- `data/nightly/retrovault.db`
- `data/prod/retrovault.db`

### Recommended config split

Use separate config and scraper files inside each environment directory:

- `data/dev/app.config.json`
- `data/nightly/app.config.json`
- `data/prod/app.config.json`
- `data/dev/scrapers.json`
- `data/nightly/scrapers.json`
- `data/prod/scrapers.json`

### Why

If dev and prod share any of the following, the branch model is fake:

- same DB file
- same config file
- same scraper state
- same API key registry
- same pm2 process and port
- same reverse proxy hostname

## Local runtime model

### Strong recommendation: git worktrees

Use one repo plus multiple worktrees instead of constantly switching branches in one directory.

Example:

- `/home/apesch/projects/retrovault-autopush`
- `/home/apesch/projects/retrovault-nightly`
- `/home/apesch/projects/retrovault-prod`

Benefits:

- less branch-flipping risk
- easier side-by-side testing
- clean per-environment pm2 or docker targets
- better fit for Neo-driven automation

### Example worktree setup

```bash
bash scripts/setup-worktrees.sh
```

Default output directories:

- `../retrovault-autopush`
- `../retrovault-nightly`
- `../retrovault-prod`

## Process manager layout

### PM2 option

Create one pm2 app per environment.

Recommended names:

- `retrovault-dev`
- `retrovault-nightly`
- `retrovault-prod`

Recommended ports:

- dev: `3001`
- nightly: `3002`
- prod: `3000`

Each app should have:

- unique `cwd`
- unique `PORT`
- unique `DATABASE_URL`
- unique config env var overrides if the app is updated to support them
- separate logs

### Docker option

If using Docker for env separation, use one compose project per environment with:

- distinct container names
- distinct bind/named volumes
- distinct ports
- distinct env files

Example names:

- `retrovault-dev`
- `retrovault-nightly`
- `retrovault-prod`

## App changes needed

A large portion of the multi-environment app work is now implemented in-repo.

### Implemented groundwork

1. **Environment-aware DB path**
   - runtime DB resolution now flows through `src/lib/runtimePaths.ts`
   - pm2/docker/scripts now align on env-local DB paths

2. **Environment-aware config and scraper paths**
   - env-local config/scraper path resolution is implemented
   - legacy routes were swept off many hardcoded `process.cwd()/data/...` assumptions

3. **Environment label in UI**
   - visible runtime labeling is now present to reduce operator mistakes

### Remaining app/runtime work

1. **Hybrid storage consolidation**
   - several important surfaces still read env-local JSON
   - JSON -> SQLite migration remains an active follow-up workstream

2. **Safer bug-report / outbound integrations**
   - dev/nightly should not accidentally post prod-facing reports unless intended

3. **Optional demo-mode or sanitized seeding**
   - dev/nightly may eventually want sanitized or synthetic demo data in addition to private prod-derived fixtures

## GitHub model

### Branch protections

Recommended rules:

#### `autopush`
- allow direct push by maintainer
- require CI if practical, but do not block iteration excessively

#### `nightly`
- no direct pushes except maintainers/emergency
- require tests and build checks
- promotion should be automated from `autopush` on schedule or via workflow

#### `prod`
- protected
- require passing tests/build
- require manual approval or explicit workflow dispatch
- no automatic merge from `nightly`

### GitHub environments

Create:

- `dev`
- `nightly`
- `production`

Store separate secrets per environment when needed.

### GitHub Actions target model

Current scaffold now exists in-repo under `.github/workflows/`:

#### Workflow 1: `ci.yml`
Trigger on pushes and PRs to `master`, `autopush`, `nightly`, `prod`
- install
- bootstrap env data
- test
- build

#### Workflow 2: `promote-nightly.yml`
Trigger on push to `autopush` or manual dispatch
- validate
- fast-forward `nightly` to `autopush`

#### Workflow 3: `promote-prod.yml`
Trigger by manual workflow dispatch
- validate `nightly`
- fast-forward `prod` to `nightly`

#### Workflow 4: `release.yml`
Trigger on `v*` tag push
- install
- bootstrap env data
- test
- build
- create GitHub release

Deployment steps still need to be wired to the actual host/runtime commands.

## Nginx / domain model

### Recommended domains

- `retrovault-dev.peschpit.com`
- `retrovault-nightly.peschpit.com`
- `retrovault.peschpit.com`

### Shared dev ingress

`dev.peschpit.com` can exist as a landing page or router for ephemeral demos, but path-based app hosting should only be used when the target app is base-path-ready.

For now:
- prefer subdomains for real apps
- use `dev.peschpit.com` as directory/landing page/launcher

## Release and promotion SOP

### Standard flow

1. Work happens on `autopush`
2. Dev auto-deploy updates `retrovault-dev`
3. At night, promote `autopush -> nightly`
4. Review nightly instance
5. When approved, manually promote `nightly -> prod`
6. Deploy production

### Dev instance SOP

When exposing a dev/demo instance externally:

1. back up nginx config first
2. add or update nginx blocks
3. issue or verify TLS certs
4. verify external reachability
5. record what changed in memory/docs
6. record exposure start timestamp
7. automatically disable exposure after 48 hours unless renewed

### Dev exposure shutdown options

Prefer reversible shutdown over deletion:

- remove or comment nginx block
- point hostname to maintenance response
- stop pm2 app or container
- leave code/worktree intact

## Automation needed for 48-hour expiry

A small scheduler should track externally exposed dev instances.

Recommended metadata file:

- `memory/dev-exposure-registry.json`

Suggested shape:

```json
{
  "instances": [
    {
      "app": "retrovault",
      "environment": "dev",
      "publicHost": "retrovault-dev.peschpit.com",
      "localTarget": "192.168.1.158:3001",
      "startedAt": "2026-04-19T16:00:00Z",
      "expiresAt": "2026-04-21T16:00:00Z",
      "status": "active"
    }
  ]
}
```

Then add a periodic check that:
- detects expired exposures
- disables nginx route or stops target app
- writes a short audit note
- notifies Alex if needed

## Recommended implementation phases

### Phase 1: branch and docs foundation
- create `autopush`, `nightly`, `prod`
- update docs to reflect new branch model
- set branch protections
- keep current prod behavior stable

### Phase 2: local environment separation
- create worktrees
- create pm2 or docker env targets
- split DB/config paths
- verify dev/nightly/prod can run independently

### Phase 3: GitHub automation
- add CI and deploy workflows
- auto-deploy `autopush`
- nightly promotion workflow
- manual production promotion workflow

### Phase 4: external demo infrastructure
- finalize nginx/certbot delegation
- add `retrovault-dev` and `retrovault-nightly` hostnames
- add expiry automation and registry

## Concrete recommendation for RetroVault now

Start with this exact model:

- Branches:
  - `autopush`
  - `nightly`
  - `prod`

- Ports:
  - prod: `3000`
  - dev: `3001`
  - nightly: `3002`

- PM2 apps:
  - `retrovault-prod`
  - `retrovault-dev`
  - `retrovault-nightly`

- Domains:
  - `retrovault.peschpit.com`
  - `retrovault-dev.peschpit.com`
  - `retrovault-nightly.peschpit.com`
  - optional landing host: `dev.peschpit.com`

- Data:
  - separate DB/config/scraper files per environment

- Promotion:
  - `autopush` auto deploys
  - `nightly` auto-promotes nightly
  - `prod` is manual only

## Immediate next actions

1. Add env-aware config path support to RetroVault.
2. Create pm2 configs for dev/nightly/prod instead of one shared config.
3. Create branches and protections in GitHub.
4. Implement GitHub Actions for CI, dev deploy, nightly promotion, and prod promotion.
5. Finish nginx/certbot delegation for external dev routing.
6. Add the 48-hour dev exposure registry + shutdown automation.

## Phase 1 implementation status

Implemented in repo:

- `src/lib/runtimePaths.ts`
  - central runtime path resolution
  - supports `RETROVAULT_DATA_DIR`
  - supports `RETROVAULT_CONFIG_PATH`
  - supports `RETROVAULT_SCRAPERS_PATH`
  - exposes `RETROVAULT_ENV` label helper

- `src/lib/data.ts`
  - now resolves JSON data paths through runtime path helpers instead of assuming `./data`

- `ecosystem.config.js`
  - now defines 3 PM2 apps:
    - `retrovault-prod` on `3000`
    - `retrovault-dev` on `3001`
    - `retrovault-nightly` on `3002`
  - each uses separate DB/config/scraper/data directories

- `scripts/setup-env-data.mjs`
  - bootstraps `data/prod`, `data/dev`, and `data/nightly`
  - creates starter config, scraper file, and DB file placeholders

Still needed before this is fully operational:

- update all code paths that directly hardcode `data/*.json` outside `src/lib/data.ts`
- verify Prisma migrations/bootstrap behavior per env DB
- add environment indicator in the UI
- create GitHub Actions and branch protections
- create worktrees or local deployment directories

---

This blueprint is the target operating model. Future release docs and deployment scripts should be updated to match it so the repo stops assuming a single `master -> prod` lane.
