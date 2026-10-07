# CHRONO PARADOX — Step 8.1 Scroll Fix

This maintenance release fixes the Step 8 Temporal Replay visibility issue.

- Enables normal vertical page scrolling on the game screen.
- Prevents the reality shell from clipping content below Step 7.
- Temporal Replay remains server-authoritative and unchanged.
- Redis and WebSocket architecture are unchanged.
- No environment-variable changes are required.

## Validation
The Step 8 Temporal Replay markup and client rendering logic remain present. This release only changes the page overflow behavior so Step 8 can be reached by scrolling.
