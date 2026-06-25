#!/usr/bin/env bash
set -Eeuo pipefail
shopt -s inherit_errexit 2>/dev/null || true

usage() {
  cat <<'EOF'
Usage: scripts/promote-dev-to-main.sh [--target prod|main] [--no-pr]

Promotes origin/dev through a protected-branch workflow:
1. verify dev with lint, tests, typecheck, and build;
2. create a promotion branch from the target branch;
3. fast-forward that branch to origin/dev;
4. push the branch and open a GitHub PR into the protected target.

Set --no-pr to stop after pushing the branch if GitHub API auth is unavailable.
Requires GITHUB_TOKEN/GH_TOKEN or ~/.config/hermes-secrets/github.env to create the PR.
EOF
}

repo_slug() {
  git remote get-url origin | sed -E 's|.*github\.com[:/]||; s|\.git$||'
}

load_github_token() {
  if [[ -n "${GITHUB_TOKEN:-}" || -n "${GH_TOKEN:-}" ]]; then
    return 0
  fi

  local secrets_file="${HOME}/.config/hermes-secrets/github.env"
  if [[ -f "$secrets_file" ]]; then
    # shellcheck disable=SC1090
    source "$secrets_file"
  fi

  [[ -n "${GITHUB_TOKEN:-}" || -n "${GH_TOKEN:-}" ]]
}

create_pr() {
  local owner_repo="$1" branch="$2" target="$3" title="$4" body="$5"

  if ! load_github_token; then
    printf 'No GitHub token found; pushed %s but did not open PR.\n' "$branch" >&2
    printf 'Open manually: https://github.com/%s/compare/%s...%s?expand=1\n' "$owner_repo" "$target" "$branch"
    return 0
  fi

  GITHUB_TOKEN="${GITHUB_TOKEN:-}" \
  GH_TOKEN="${GH_TOKEN:-}" \
  OWNER_REPO="$owner_repo" \
  PROMOTE_BRANCH="$branch" \
  PROMOTE_TARGET="$target" \
  PROMOTE_TITLE="$title" \
  PROMOTE_BODY="$body" \
  python3 - <<'PYPR'
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

owner_repo = os.environ['OWNER_REPO']
branch = os.environ['PROMOTE_BRANCH']
target = os.environ['PROMOTE_TARGET']
title = os.environ['PROMOTE_TITLE']
body = os.environ['PROMOTE_BODY']
token = os.environ.get('GITHUB_TOKEN') or os.environ.get('GH_TOKEN')
headers = {
    'Authorization': f'Bearer {token}',
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'retrovault-promote-script',
}
base = f'https://api.github.com/repos/{owner_repo}'
owner = owner_repo.split('/')[0]


def request(method: str, url: str, payload: dict | None = None):
    data = None if payload is None else json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.load(resp)

try:
    query = urllib.parse.urlencode({
        'state': 'open',
        'head': f'{owner}:{branch}',
        'base': target,
    })
    existing = request('GET', f'{base}/pulls?{query}')
    if existing:
        pr = existing[0]
    else:
        pr = request('POST', f'{base}/pulls', {
            'title': title,
            'body': body,
            'head': branch,
            'base': target,
        })
except urllib.error.HTTPError as exc:
    detail = exc.read().decode('utf-8', 'replace')
    print(f'GitHub PR creation failed: HTTP {exc.code}: {detail}', file=sys.stderr)
    print(f'Open manually: https://github.com/{owner_repo}/compare/{target}...{branch}?expand=1')
    raise SystemExit(0)

print(f"PR #{pr['number']}: {pr['html_url']}")
PYPR
}

main() {
  local target="prod" open_pr=1

  while (($#)); do
    case "$1" in
      --target)
        target="${2:?missing target}"
        shift 2
        ;;
      --target=*)
        target="${1#*=}"
        shift
        ;;
      --no-pr)
        open_pr=0
        shift
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        printf 'Unknown argument: %s\n' "$1" >&2
        usage >&2
        exit 2
        ;;
    esac
  done

  if [[ "$target" != "prod" && "$target" != "main" ]]; then
    printf 'Unsupported target branch: %s\n' "$target" >&2
    exit 2
  fi

  local repo_root branch owner_repo title body
  repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"
  cd "$repo_root"

  git fetch origin dev "$target" --tags
  git checkout dev
  git pull --ff-only origin dev

  (cd retrovault && npm run lint && npm test && npx tsc --noEmit && npm run build)

  branch="promote/dev-to-${target}-$(date -u +%Y%m%d%H%M%S)"
  git checkout -B "$branch" "origin/$target"
  git merge --ff-only origin/dev
  git push -u origin "$branch"

  printf 'Prepared protected promotion branch %s at %s\n' "$branch" "$(git rev-parse --short HEAD)"
  printf 'Next: merge the PR into %s, then tag vX.Y.Z from %s to publish registries.\n' "$target" "$target"

  if (( open_pr )); then
    owner_repo="$(repo_slug)"
    title="Promote dev to ${target}"
    body=$'## Summary\n- Promote verified `dev` to protected production branch.\n\n## Verification\n- `npm run lint`\n- `npm test`\n- `npx tsc --noEmit`\n- `npm run build`\n\nAfter merge, create and push the release tag from the protected branch to publish GHCR/DockerHub.'
    create_pr "$owner_repo" "$branch" "$target" "$title" "$body"
  fi
}

main "$@"
