# RetroVault GitHub Setup Checklist

This turns the `autopush` / `nightly` / `prod` model from documentation into an actual repo policy.

## 1. Create branches

Local branches now exist in the working repo:
- `prod`
- `nightly`
- `autopush`

Next step is to push them to origin once the current workstream is committed cleanly:

```bash
git checkout master
git pull origin master
git push origin prod nightly autopush
```

Optional later cleanup:
- make `prod` the default branch
- retire `master` after docs, badges, and integrations are moved

## 2. Create local worktrees

```bash
bash scripts/setup-worktrees.sh
```

Expected directories:
- `../retrovault-autopush`
- `../retrovault-nightly`
- `../retrovault-prod`

## 3. Configure branch protection

### `autopush`
Recommended:
- allow maintainer direct pushes
- optional CI requirement

### `nightly`
Recommended:
- require CI (`CI / test-and-build`)
- restrict direct pushes if desired
- allow GitHub Actions to update branch

### `prod`
Recommended:
- require CI (`CI / test-and-build`)
- require pull request or manual promotion policy
- restrict direct pushes
- allow GitHub Actions only if using workflow-driven fast-forward promotion

## 4. Configure GitHub Actions permissions

Repository settings:
- Actions: enabled
- Workflow permissions: `Read and write permissions`
- Allow GitHub Actions to create and approve pull requests: optional

Needed because promotion workflows push to `nightly` and `prod`.

## 5. Create GitHub environments

Create these environments in repo settings:
- `dev`
- `nightly`
- `production`

Use them later for environment-specific secrets and approvals.

## 6. Wire deploy targets

Current workflow files validate and promote branches, but deployment steps still need repo-specific commands or SSH actions.

Target mapping:
- `autopush` -> dev runtime (`retrovault-dev`, port 3001)
- `nightly` -> nightly runtime (`retrovault-nightly`, port 3002)
- `prod` -> prod runtime (`retrovault-prod`, port 3000)

## 7. Verify release flow

After branch creation:
1. push to `autopush`
2. confirm `ci.yml` runs
3. confirm `promote-nightly.yml` can fast-forward `nightly`
4. manually run `promote-prod.yml`
5. push a `v*` tag from `prod`
6. confirm `release.yml` creates a GitHub release

## 8. Transition off `master`

Once stable:
- update README badges/docs to reference `prod` as the primary release lane
- switch default branch to `prod`
- remove `master` from CI triggers if no longer needed
