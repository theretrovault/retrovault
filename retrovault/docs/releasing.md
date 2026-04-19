# RetroVault — Release Process

RetroVault uses [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`

| Type | When to use | Example |
|---|---|---|
| **PATCH** | Bug fixes, UI polish, test additions | `v2.0.1` |
| **MINOR** | New features, new pages, new scrapers | `v2.1.0` |
| **MAJOR** | Breaking changes, data migrations, architecture shifts | `v3.0.0` |

---

## How to cut a release

### 1. Update the changelog

Add an entry to `src/data/changelog.ts`:

```typescript
{
  version: "2.1.0",
  date: "2026-05-01",
  title: "What's new in this release",
  type: "feature",
  changes: [
    { category: "New Feature", items: ["Description of what changed"] }
  ]
}
```

### 2. Update package.json version

```bash
cd retrovault
# Edit version field in package.json
npm version minor  # or patch, major
```

### 3. Commit everything

For now, RetroVault is moving toward a 3-lane promotion model:
- `autopush` = active integration/dev lane
- `nightly` = stabilized pre-prod lane
- `prod` = production lane

Until the GitHub automation is fully wired, make release commits on the intended branch explicitly.

```bash
git add -A
git commit -m "🚀 Release v2.1.0 - Brief description"
git push origin prod
```

### 4. Tag the release

```bash
git tag v2.1.0
git push origin v2.1.0
```

The target release automation is:
- CI on branch pushes
- promotion from `autopush` -> `nightly`
- manual promotion from `nightly` -> `prod`
- release tagging from `prod`

If that workflow is not yet fully present in the repo, treat this document as the intended operating model and verify branch, tests, and build manually before tagging.

### 5. Verify

Check `github.com/theretrovault/retrovault/releases` — the new release should appear within ~2 minutes.

---

## Version history

| Version | Date | Highlights |
|---|---|---|
| `v2.0.0` | 2026-04-13 | Initial public release |

---

## What makes a good release

- All tests passing
- `npm run build` succeeds
- Changelog updated with user-facing description
- No sensitive data in committed files
- Docker build test passes (if Dockerfile changed)
