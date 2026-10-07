# CHRONO PARADOX — Final Polish v1.0

Four realities. One world. One chance to change it.

This is the contest-ready polish build based on the tested Step 8.1 baseline. It preserves the existing server-authoritative multiplayer, Redis persistence, WebSocket synchronization, timeline branching, temporal memory, and Temporal Replay systems while improving first-time-player onboarding and the final replay experience.

## Final gameplay loop
1. Create or join a 2–4 player room.
2. Each player receives PAST, PRESENT, FUTURE, or ECHO.
3. Share private information and complete the four-step Paradox Protocol.
4. Vote to PRESERVE or ALTER the timeline.
5. Experience the shared consequence.
6. Review the persistent temporal memory.
7. Replay the created history together.
8. Return to the title screen after synchronized replay.

## Final polish changes
- Added a concise four-step onboarding strip on the title screen.
- Added a clear lobby objective briefing.
- Added a final replay return-to-title action after 4/4 synchronization.
- Preserved the Step 8.1 scroll/layout fix.
- Preserved existing gameplay and backend logic.

## Run
`npm install`

`npm test`

`npm start`

For Vercel deployment, see `VERCEL-DEPLOYMENT.md`.
