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
- Admin and user roles with server-enforced Firebase permissions
- Admin role delegation and account access logs
- Filterable inventory activity audit trail
- Manage multiple daily stock-report recipients from the Notifications table

## Firebase setup

The project is already configured for Firebase project `esseco-ea869`.

1. Enable Google as a sign-in provider under Firebase Console → Authentication → Sign-in method.
2. Add `esseco-ea869.web.app` under Authentication → Settings → Authorized domains if it is not already present.
3. To deploy the database rules manually, run:

   ```powershell
   firebase deploy --only database
   ```

The verified Google account `gd.verzon@gmail.com` is the permanent bootstrap admin. Other verified Google accounts are recorded when they first sign in and remain pending until an admin assigns a role from **Accounts**. Admins have full control and can manage the shared website title, logo, theme, and brand colors. Users can view inventory and activity, add items, create categories and units, and adjust stock across Products, Raw Materials, and Packaging. Users cannot edit item details, delete items, or manage notifications, accounts, roles, or branding. These restrictions are enforced by `database.rules.json`, not only by the interface.

## Sample inventory data

The repository includes 15 ready-to-import records for each inventory:

- `sample-products.json` goes under `inventory/products`.
- `sample-raw-materials.json` goes under `inventory/materials`.
- `sample-packaging.json` also goes under `inventory/materials`.

Import the product file at the Products path, then import both material files at the Materials path without replacing existing records. Each material record includes the required `materialType` value so it appears in the correct Raw Materials or Packaging view.

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

The `.github/workflows/daily-stock-report.yml` workflow sends one complete stock-status report every day at 8:00 AM Philippine time to `gd.verzon@gmail.com` and all addresses maintained in the website's Notifications table. The email separates inventory into **Out of Stock**, **Low Stock**, and **Healthy Stock** sections. It can also be run manually from the GitHub Actions tab.

Before the workflow can send the daily report:

1. Enable two-step verification for `gd.verzon@gmail.com` and create a Google App Password.
2. In the GitHub repository, open **Settings → Secrets and variables → Actions**.
3. Create a repository secret named `GMAIL_APP_PASSWORD` containing the app password.
4. Confirm that `FIREBASE_SERVICE_ACCOUNT_ESSECO_EA869` contains the Firebase service-account JSON.
5. Push the workflow to `main`, then run **Send daily stock report** manually from the GitHub Actions tab for the first test.

Low-stock and out-of-stock event alerts are disabled; only the daily grouped report is sent. The Gmail app password must never be committed to this repository.

# Android APK from GitHub Actions

GitHub Actions automatically builds a debug APK when Android project files are pushed to `main`. You can also start a build manually:

1. Open the repository's **Actions** tab.
2. Select **Build Android APK**.
3. Select **Run workflow**.
4. When the build finishes, open the run and download the APK from **Artifacts**.

The downloaded ZIP contains `app-debug.apk`. Extract it, transfer the APK to your Android phone, allow installation from that source when prompted, and install it. GitHub retains each APK artifact for 30 days.
