const test = require("node:test");
const assert = require("node:assert/strict");
const { stockStatus, findNewAlerts, buildCurrentStatuses, createDigest } = require("./stock-alert");

test("classifies stock levels", () => {
  assert.equal(stockStatus({ stock: 8, threshold: 5 }), "healthy");
  assert.equal(stockStatus({ stock: 5, threshold: 5 }), "low");
  assert.equal(stockStatus({ stock: 0, threshold: 5 }), "out");
});

test("finds only new alert states", () => {
  const products = {
    healthy: { stock: 8, threshold: 5 },
    low: { stock: 4, threshold: 5 },
    out: { stock: 0, threshold: 5 }
  };
  assert.deepEqual(findNewAlerts(products, { low: "low" }).map(alert => alert.id), ["out"]);
  assert.deepEqual(buildCurrentStatuses(products), { healthy: "healthy", low: "low", out: "out" });
});

test("creates one escaped digest with every product status", () => {
  const alerts = [
    { status: "low", product: { name: "Beans <Premium>", sku: "COF-01", stock: 2, threshold: 5, unit: "bags" } },
    { status: "out", product: { name: "Tea", sku: "TEA-01", stock: 0, threshold: 3, unit: "boxes" } }
  ];
  const digest = createDigest(alerts, {
    beans: alerts[0].product,
    tea: alerts[1].product,
    rice: { name: "Rice", sku: "RICE-01", stock: 10, threshold: 4, unit: "bags" }
  });
  assert.match(digest.subject, /1 out of stock, 1 low stock/);
  assert.match(digest.html, /Beans &lt;Premium&gt;/);
  assert.match(digest.html, /HEALTHY/);
  assert.match(digest.html, /Rice/);
  assert.match(digest.text, /1 healthy/);
});
