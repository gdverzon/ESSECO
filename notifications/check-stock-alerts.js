const { applicationDefault, initializeApp } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");
const nodemailer = require("nodemailer");
const { findNewAlerts, buildCurrentStatuses, createDigest } = require("./stock-alert");

const notificationEmail = "gd.verzon@gmail.com";
const appPassword = process.env.GMAIL_APP_PASSWORD;

if (!appPassword) throw new Error("GMAIL_APP_PASSWORD GitHub secret is not configured.");

initializeApp({
  credential: applicationDefault(),
  databaseURL: "https://esseco-ea869-default-rtdb.asia-southeast1.firebasedatabase.app"
});

async function run() {
  const database = getDatabase();
  const [productsSnapshot, statusesSnapshot] = await Promise.all([
    database.ref("inventory/products").get(),
    database.ref("system/stockAlertStatuses").get()
  ]);
  const products = productsSnapshot.val() || {};
  const previousStatuses = statusesSnapshot.val() || {};
  const alerts = findNewAlerts(products, previousStatuses);

  if (alerts.length) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: notificationEmail, pass: appPassword }
    });
    await transporter.sendMail({
      from: `ESSECO Inventory <${notificationEmail}>`,
      to: notificationEmail,
      ...createDigest(alerts)
    });
    console.log(`Sent ${alerts.length} stock alert(s) to ${notificationEmail}.`);
  } else {
    console.log("No new low-stock or out-of-stock alerts.");
  }

  await database.ref("system/stockAlertStatuses").set(buildCurrentStatuses(products));
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
