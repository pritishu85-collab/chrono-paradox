# CHRONO PARADOX — Step 2 (Vercel-ready)

**Four realities. One world. One chance to change it.**

This version keeps the Step 2 lobby and Four Reality System, using Vercel Functions for HTTP actions, WebSockets for realtime updates, and Redis for shared room state.

## Included
- Real 2–4 player rooms
- Create / Join by 6-character code
- Host + ready system
- Host can start once at least 2 players are ready
- Deterministic reality assignment: P1 PAST, P2 PRESENT, P3 FUTURE, P4 ECHO
- Shared test environment: THE FRACTURED CHAMBER
- Private reality information is only sent to the matching player session
- WebSocket reconnect handling
- Redis-backed state so different Vercel function instances can share the same room
- 6-hour room TTL
- Vercel HTTP routes implemented with the current Web Standard Request/Response function format

## Production requirement
For reliable multiplayer across Vercel function instances, connect an Upstash Redis database through the Vercel Marketplace and provide `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` as environment variables.

## Local development
`npm install`
`npm start`

If Redis environment variables are absent locally, the app uses an in-memory store for local testing only.

## Test
`npm test`

## Deployment
1. Upload this folder's contents to the root of the GitHub repository.
2. In Vercel, import that repository.
3. Connect Upstash Redis from the Vercel Marketplace.
4. Redeploy.
5. Open the Vercel URL in 2–4 browser windows.
6. Create a room in one window, join from the others, Ready Up, and Start.
