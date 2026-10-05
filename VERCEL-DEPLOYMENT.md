# CHRONO PARADOX — Simple Vercel Deployment

## Before you start
You need:
1. A GitHub account.
2. A Vercel account (sign in with GitHub is easiest).
3. An Upstash Redis database connected through the Vercel Marketplace.

## 1. Create the GitHub repository
1. Go to GitHub.
2. Click **New repository**.
3. Name it `chrono-paradox`.
4. Keep it **Private** or **Public** — either works for this contest project.
5. Create the repository.
6. Upload **all files inside this ZIP's `chrono-paradox-vercel` folder** into the repository root.

You should see `index.html`, `app.js`, `style.css`, `api/`, `lib/`, `package.json`, and `vercel.json` in the repository.

## 2. Import the repository into Vercel
1. Open Vercel.
2. Click **Add New → Project**.
3. Find `chrono-paradox` under your GitHub repositories.
4. Click **Import**.
5. Leave the build settings at their defaults.
6. Click **Deploy**.

## 3. Add Redis for multiplayer reliability
1. Open the new Vercel project.
2. Open **Integrations / Marketplace**.
3. Choose **Upstash Redis**.
4. Create a new Redis database if you do not already have one.
5. Connect it to this Vercel project.
6. Confirm that the project has these environment variables:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
7. Redeploy the project after the integration is connected.

## 4. Test the live game
Open the Vercel URL in four separate browser windows (or on four devices).

Window 1:
- Click **ENTER CHRONO PARADOX**
- Click **CREATE GAME**
- Copy the six-character room code
- Click **READY UP**

Windows 2–4:
- Enter the same room code
- Click **JOIN GAME**
- Click **READY UP**

Then, in the host window:
- Click **START GAME**

Expected result:
- Player 1 = PAST
- Player 2 = PRESENT
- Player 3 = FUTURE
- Player 4 = ECHO
- All players see the same chamber/world description.
- Each player sees different private information.

## 5. Important reliability test
After the game starts, refresh one player's browser once.
That player should reconnect and recover the same room/reality state.

## If Vercel shows a deployment error
Send me the deployment log screenshot. In particular, if Vercel reports an `unmatched-function-pattern` error for `api/ws.js`, make sure your repository contains the updated `vercel.json` from this package, which intentionally does not use a `functions` pattern for the WebSocket route. Vercel's current WebSocket support does not require extra WebSocket configuration.
