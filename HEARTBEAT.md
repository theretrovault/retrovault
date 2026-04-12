# RetroVault Heartbeat Tasks

## Git Auto-Sync
On each heartbeat, check if there are uncommitted changes in the RetroVault repo.
If yes, run the sync script.

```
node /home/apesch/.openclaw/workspace/second-brain/scripts/git-sync.mjs
```

Only run this if it's been more than 30 minutes since the last push (check logs/git-sync.log).
Don't run if the repo is already up to date.

## Value Snapshot
Once per day (if last snapshot was >20 hours ago), run:
```
node /home/apesch/.openclaw/workspace/second-brain/scripts/snapshot-value.mjs
```
This records today's collection value to data/value-history.json.
