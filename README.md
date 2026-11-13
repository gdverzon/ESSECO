# ESSECO Inventory

A responsive stock inventory web app powered by Firebase Hosting and Firebase Realtime Database.

## Features

- Live product inventory with search and category/stock filters
- Add, edit, and delete catalog items
- Stock-in and stock-out adjustments with validation
- Low-stock and out-of-stock indicators
- Inventory valuation and real-time dashboard metrics
- Recent activity audit trail
- Owner-only Google authentication and protected database access

## Firebase setup and deployment

The project is already configured for Firebase project `esseco-ea869`.

1. Enable Google as a sign-in provider under Firebase Console → Authentication → Sign-in method.
2. Add `esseco-ea869.web.app` under Authentication → Settings → Authorized domains if it is not already present.
3. Deploy hosting and database rules:

   `firebase deploy --only hosting,database`

Database access is restricted to the verified Google account `gd.verzon@gmail.com`. Change `OWNER_EMAIL` in `app.js` and the matching email in `database.rules.json` when transferring ownership.
