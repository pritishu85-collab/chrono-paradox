# CHRONO PARADOX — Step 8 Working Version

## Step 8: Temporal Replay

Step 8 adds a synchronized replay layer after the Step 5–7 timeline decision and temporal-memory sequence.

### Included
- 2–4 player realtime multiplayer
- PAST / PRESENT / FUTURE / ECHO realities
- Private information per reality
- Four-stage Paradox Protocol
- Server-authoritative timeline voting
- PRESERVE / ALTER branching
- Timeline consequence rendering
- Persistent Temporal Memory
- **Temporal Replay** after the final timeline decision
- Reality-specific replay interpretation
- Server-authoritative replay acknowledgements
- Synchronized replay completion when all participating players have replayed
- Redis persistence and WebSocket synchronization
- Four-player compatibility

### Step 8 behavior
1. Complete the existing Paradox Protocol.
2. All players vote PRESERVE or ALTER.
3. The resolved timeline and Step 7 memory appear.
4. Step 8 unlocks **Temporal Replay**.
5. Each player presses **REPLAY YOUR MEMORY**.
6. The server records each replay acknowledgement.
7. When every participating player has replayed, the replay becomes synchronized.
8. The original timeline memory is preserved; replay does not erase or rewrite it.

### Validation
`npm test` passes:
- Step 5 tests
- Step 6 tests
- Step 7 Temporal Memory tests
- Step 8 Temporal Replay tests
- Vercel API tests

## Deployment
Upload the contents of this ZIP to the root of the existing GitHub repository. Keep the existing Vercel project and Redis connection. Do not change the Redis environment variables.
