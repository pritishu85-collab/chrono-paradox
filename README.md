# CHRONO PARADOX — Step 3

**Four realities. One world. One chance to change it.**

Step 3 adds the first shared gameplay interaction: the **Temporal Event**. The event is server-authoritative and persisted in the same Redis-backed room state used by the lobby.

## What is included

- 2–4 player lobby
- PAST / PRESENT / FUTURE / ECHO reality assignment
- Shared world with private information per reality
- Server-authoritative realtime state over WebSockets
- Redis-backed room state
- Reconnect with exponential backoff
- Temporal Event with four simple phases:
  1. DORMANT
  2. SURGE
  3. AFTERMATH
  4. STABLE
- Every phase gives each reality a different private observation
- Any connected player can advance the shared event
- No weapons, enemies, scoring, or complex puzzle system yet

## Vercel

This project uses Vercel's Node.js WebSocket support with the `ws` package. Vercel documents WebSocket Functions as supported on Fluid compute.

Keep the existing Upstash/Vercel Redis environment variables. Do not rename or delete them.

## Local test

```bash
npm install
npm test
npm start
```

Open `http://localhost:3000` in two or more browser windows.

## Deployment

Replace the files in the GitHub repository with this ZIP, commit the change, and let Vercel deploy the new commit.

After deployment, check:

`/api/health`

Expected fields include:

- `ok: true`
- `redisConfigured: true`
- `redisHealthy: true`

Then test with 4 browser windows.


Redis compatibility: this build recognizes standard Upstash/Vercel names plus the current Vercel integration names `UPSTASH_REDIS_REST_KV_REST_API_URL` / `UPSTASH_REDIS_REST_KV_REST_API_TOKEN`.


## Step 4 — The Paradox Protocol

Step 4 turns the temporal event into a cooperative sequence. The required action advances through the players actually present in the room: PAST → PRESENT → FUTURE → ECHO. Each reality receives different intelligence, and only the required player can perform the current step. Two- and three-player rooms automatically use only the participating realities.


## Step 6 — Timeline Choice
After the Paradox Protocol, every participating player sees reality-specific consequences for two possible outcomes: PRESERVE or ALTER. Each player casts one private vote; the server resolves the shared timeline after all participating players decide. A majority selects the outcome; a tie defaults to PRESERVE.


## Step 6 — Timeline Consequences
After all players submit the Step 5 Preserve/Alter decision, the server resolves the branch and every reality receives a consequence-specific epilogue. Preserve creates one coherent stable timeline; Alter creates a visibly branched history with different private consequences for PAST, PRESENT, FUTURE, and ECHO. The result is persisted in Redis and synchronized to all connected players.
