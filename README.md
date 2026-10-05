# CHRONO PARADOX — Step 2 (Vercel-ready)

**Four realities. One world. One chance to change it.**

This version keeps the Step 2 lobby and Four Reality System, but replaces the local-only SSE server with Vercel WebSockets and Redis-backed room state.

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

## Production requirement
For Vercel, connect an Upstash Redis database through the Vercel Marketplace and set the injected `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` environment variables. Vercel's current guidance recommends external Redis for durable state across WebSocket connections.

## Local development
`npm install`
`npm start`

If Redis environment variables are absent locally, the app uses an in-memory store for local testing. Production Vercel multiplayer must use Redis; the deployment checklist below includes this step.

## Test
`npm test`

## Deployment
1. Upload this folder to GitHub.
2. In Vercel: Add New → Project → import the GitHub repository.
3. Add an Upstash Redis integration from Vercel Marketplace.
4. Deploy.
5. Open the Vercel URL in 2–4 browser windows/devices.
6. Create a room in one window, join from the others, Ready Up, and Start.
