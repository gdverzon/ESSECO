const { applicationDefault, initializeApp } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");
const nodemailer = require("nodemailer");
const { createDigest, notificationRecipients } = require("./stock-alert");

const notificationEmail = "gd.verzon@gmail.com";
const appPassword = process.env.GMAIL_APP_PASSWORD;

if (!appPassword) throw new Error("GMAIL_APP_PASSWORD GitHub secret is not configured.");

initializeApp({
  credential: applicationDefault(),
  databaseURL: "https://esseco-ea869-default-rtdb.asia-southeast1.firebasedatabase.app"
});

async function run() {
  const database = getDatabase();
  const [productsSnapshot, materialsSnapshot, recipientsSnapshot] = await Promise.all([
    database.ref("inventory/products").get(),
    database.ref("inventory/materials").get(),
    database.ref("inventory/notificationRecipients").get()
  ]);
  const products = Object.fromEntries([
    ...Object.entries(productsSnapshot.val() || {}).map(([id, item]) => [`product_${id}`, item]),
    ...Object.entries(materialsSnapshot.val() || {}).map(([id, item]) => [`material_${id}`, item])
  ]);
  const recipients = notificationRecipients(recipientsSnapshot.val(), notificationEmail);
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: notificationEmail, pass: appPassword }
  });
  await transporter.sendMail({
    from: `ESSECO Inventory <${notificationEmail}>`,
    to: recipients,
    ...createDigest([], products, { daily: true })
  });
  console.log(`Sent daily stock report to ${recipients.length} recipient(s).`);
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
