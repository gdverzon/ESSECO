const { applicationDefault, initializeApp } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");
const nodemailer = require("nodemailer");
const { findNewAlerts, buildCurrentStatuses, createDigest, notificationRecipients } = require("./stock-alert");

const notificationEmail = "gd.verzon@gmail.com";
const appPassword = process.env.GMAIL_APP_PASSWORD;
const dailyReport = process.env.DAILY_STOCK_REPORT === "true";

if (!appPassword) throw new Error("GMAIL_APP_PASSWORD GitHub secret is not configured.");

initializeApp({
  credential: applicationDefault(),
  databaseURL: "https://esseco-ea869-default-rtdb.asia-southeast1.firebasedatabase.app"
});

async function run() {
  const database = getDatabase();
  const [productsSnapshot, materialsSnapshot, recipientsSnapshot, statusesSnapshot] = await Promise.all([
    database.ref("inventory/products").get(),
    database.ref("inventory/materials").get(),
    database.ref("inventory/notificationRecipients").get(),
    database.ref("system/stockAlertStatuses").get()
  ]);
  const products = Object.fromEntries([
    ...Object.entries(productsSnapshot.val() || {}).map(([id, item]) => [`product_${id}`, item]),
    ...Object.entries(materialsSnapshot.val() || {}).map(([id, item]) => [`material_${id}`, item])
  ]);
  const recipients = notificationRecipients(recipientsSnapshot.val(), notificationEmail);
  const previousStatuses = statusesSnapshot.val() || {};
  const alerts = findNewAlerts(products, previousStatuses);

  if (alerts.length || dailyReport) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: notificationEmail, pass: appPassword }
    });
    await transporter.sendMail({
      from: `ESSECO Inventory <${notificationEmail}>`,
      to: recipients,
      ...createDigest(alerts, products, { daily: dailyReport })
    });
    console.log(dailyReport ? `Sent daily stock report to ${recipients.length} recipient(s).` : `Sent ${alerts.length} stock alert(s) to ${recipients.length} recipient(s).`);
  } else {
    console.log("No new low-stock or out-of-stock alerts.");
  }

  if (!dailyReport) await database.ref("system/stockAlertStatuses").set(buildCurrentStatuses(products));
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
