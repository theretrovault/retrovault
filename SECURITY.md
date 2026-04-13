# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| Latest (master) | ✅ |
| Older releases | ❌ |

RetroVault is a self-hosted application. We recommend always running the latest version from `master`.

## Reporting a Vulnerability

**Please do not report security vulnerabilities via public GitHub issues.**

RetroVault handles:
- Personal game collection data
- Financial data (purchase costs, sale prices)
- Optional API keys and tokens (stored in `.env.local`, never committed)
- Optional password authentication

If you discover a security vulnerability, please:

1. **Email the maintainer directly** or use [GitHub's private vulnerability reporting](https://github.com/theretrovault/retrovault/security/advisories/new)
2. Include: what the vulnerability is, how to reproduce it, potential impact
3. Allow reasonable time to address it before public disclosure

## Security Architecture Notes

- All personal data lives in `data/*.json` — gitignored, never leaves your machine
- API keys (`YOUTUBE_API_KEY`, `GITHUB_ISSUES_TOKEN`) live in `.env.local` — gitignored
- Authentication uses HMAC-signed session tokens, not plain cookies
- API keys are stored as SHA-256 hashes in `app.config.json`
- The app is designed for LAN use; expose to the internet at your own risk (use auth + nginx)

## Known Limitations

- File-based storage has no protection against concurrent write races (single-user LAN app design)
- No CSRF protection (LAN-only, auth gates the sensitive endpoints)
- Rate limiting on bug reporter is IP-hash based, not cryptographically enforced
