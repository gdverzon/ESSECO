# ESSECO Inventory

A responsive stock inventory web app powered by Firebase Hosting and Firebase Realtime Database.

**Live web app:** [https://esseco-ea869.web.app](https://esseco-ea869.web.app)

## Features

- Separate product, raw-material, and packaging inventories
- Search and category/stock filters for each inventory
- Add, edit, adjust, and delete individual items
- Bulk edit, stock adjustment, and deletion for selected rows
- Persistent light and dark themes
- Managed category dropdowns with in-form category creation
- Managed unit dropdowns with in-form unit creation
- Stock-in and stock-out adjustments with validation
- Low-stock and out-of-stock indicators
- Inventory valuation and real-time dashboard metrics
- Recent activity audit trail
- Itemized activity entries for every item changed by a bulk action
- Owner-only Google authentication and protected database access
- Manage multiple stock-alert email recipients from the Notifications table

## Firebase setup

The project is already configured for Firebase project `esseco-ea869`.

1. Enable Google as a sign-in provider under Firebase Console → Authentication → Sign-in method.
2. Add `esseco-ea869.web.app` under Authentication → Settings → Authorized domains if it is not already present.
3. To deploy the database rules manually, run:

   ```powershell
   firebase deploy --only database
   ```

Database access is restricted to the verified Google account `gd.verzon@gmail.com`. Change `OWNER_EMAIL` in `app.js` and the matching email in `database.rules.json` when transferring ownership.

## Deployment workflow

Production hosting is deployed from this local project folder through GitHub:

1. Make and test changes locally in this folder.
2. Commit the changes and push the `main` branch to [gdverzon/ESSECO](https://github.com/gdverzon/ESSECO).
3. The GitHub Actions workflow in `.github/workflows/firebase-hosting-merge.yml` deploys the site to Firebase Hosting.
4. The deployed app is available at [https://esseco-ea869.web.app](https://esseco-ea869.web.app).

The GitHub repository must contain a repository secret named `FIREBASE_SERVICE_ACCOUNT_ESSECO_EA869` with the Firebase service-account JSON used for deployment.

## Android APK

The Android package uses the application ID `com.esseco.inventory` and supports Android 7.0 or newer. The locally built, signed installer is `app-release-signed.apk`.

To install it on a phone:

1. Copy `app-release-signed.apk` to the Android phone.
2. Open the file on the phone and allow **Install unknown apps** for the file manager or browser when prompted.
3. Tap **Install**, then open **ESSECO** from the launcher.

Keep `android.keystore` in a secure backup. Android requires the same signing key to install future APK updates over the current app.

## Stock alert emails

The `.github/workflows/stock-alerts.yml` workflow checks product and materials inventory every 15 minutes and emails `gd.verzon@gmail.com` plus any addresses configured in the Notifications table when an item enters low-stock status and again if it becomes out of stock. Further checks in the same status do not send duplicate alerts.

Before the workflow can send email:

1. Enable two-step verification for `gd.verzon@gmail.com` and create a Google App Password.
2. In the GitHub repository, open **Settings → Secrets and variables → Actions**.
3. Create a repository secret named `GMAIL_APP_PASSWORD` containing the app password.
4. Confirm that `FIREBASE_SERVICE_ACCOUNT_ESSECO_EA869` contains the Firebase service-account JSON.
5. Push the workflow to `main`, then run **Check stock alerts** manually from the GitHub Actions tab for the first test.

The monitor stores product status under `system/stockAlertStatuses` in Realtime Database so repeated runs do not resend the same alert. This approach does not require the Firebase Blaze plan. The Gmail app password must never be committed to this repository.

# Android APK from GitHub Actions

GitHub Actions automatically builds a debug APK when Android project files are pushed to `main`. You can also start a build manually:

1. Open the repository's **Actions** tab.
2. Select **Build Android APK**.
3. Select **Run workflow**.
4. When the build finishes, open the run and download the APK from **Artifacts**.

The downloaded ZIP contains `app-debug.apk`. Extract it, transfer the APK to your Android phone, allow installation from that source when prompted, and install it. GitHub retains each APK artifact for 30 days.
