# ESSECO Inventory

A responsive stock inventory web app powered by Firebase Hosting and Firebase Realtime Database.

## Features

- Live product inventory with search and category/stock filters
- Add, edit, and delete catalog items
- Stock-in and stock-out adjustments with validation
- Low-stock and out-of-stock indicators
- Inventory valuation and real-time dashboard metrics
- Recent activity audit trail

## Firebase setup and deployment

The project is already configured for Firebase project `esseco-ea869`.

1. Create or enable Realtime Database in the Firebase console if it is not active yet.
2. Deploy hosting and database rules:

   `firebase deploy --only hosting,database`

> The included database rules allow public read/write access so the app works without sign-in. Before using this in production, add Firebase Authentication and restrict writes to authorized staff.
