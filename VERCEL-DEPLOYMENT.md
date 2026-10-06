# CHRONO PARADOX — Step 3 deployment

1. Download the Step 3 ZIP.
2. Open the GitHub repository used by the Vercel project.
3. Replace the project files with the files from this ZIP.
4. Commit the changes.
5. Wait for Vercel to finish the deployment.
6. Open `/api/health` on the live domain.
7. Confirm `redisConfigured` and `redisHealthy` are both `true`.
8. Open the game in four browser windows.
9. Create a room in window 1 and join the same room from windows 2–4.
10. Ready all players and start the game.
11. Confirm P1/P2/P3/P4 receive PAST/PRESENT/FUTURE/ECHO.
12. Press the Temporal Event button and confirm all windows update to the same phase while each window shows different private event text.

## WebSocket diagnostics

The WebSocket server now logs structured events beginning with `chrono-ws`, including connection attempts, successful initialization, state errors, heartbeat failures, socket errors, and closes. If a connection problem occurs, inspect the Vercel Function logs for those events.
