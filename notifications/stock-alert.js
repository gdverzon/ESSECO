const ALERT_STATUSES = new Set(["low", "out"]);

function stockStatus(product) {
  if (!product) return "missing";
  const stock = Number(product.stock) || 0;
  const threshold = Number(product.threshold) || 0;
  if (stock <= 0) return "out";
  if (stock <= threshold) return "low";
  return "healthy";
}

function findNewAlerts(products, previousStatuses) {
  return Object.entries(products || {}).flatMap(([id, product]) => {
    const status = stockStatus(product);
    if (!ALERT_STATUSES.has(status) || previousStatuses?.[id] === status) return [];
    return [{ id, product, status }];
  });
}

function buildCurrentStatuses(products) {
  return Object.fromEntries(
    Object.entries(products || {}).map(([id, product]) => [id, stockStatus(product)])
  );
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function createDigest(alerts) {
  const outCount = alerts.filter(alert => alert.status === "out").length;
  const lowCount = alerts.length - outCount;
  const summary = [
    outCount ? `${outCount} out of stock` : "",
    lowCount ? `${lowCount} low stock` : ""
  ].filter(Boolean).join(", ");

  const textRows = alerts.map(({ product, status }) =>
    `${status === "out" ? "OUT OF STOCK" : "LOW STOCK"}: ${product.name} (${product.sku}) — ${product.stock} ${product.unit || "units"}, threshold ${product.threshold}`
  );
  const htmlRows = alerts.map(({ product, status }) => `
    <tr>
      <td style="padding:9px;border-bottom:1px solid #ddd;color:${status === "out" ? "#b42318" : "#b54708"};font-weight:bold">${status === "out" ? "OUT" : "LOW"}</td>
      <td style="padding:9px;border-bottom:1px solid #ddd"><strong>${escapeHtml(product.name)}</strong><br><small>${escapeHtml(product.sku)}</small></td>
      <td style="padding:9px;border-bottom:1px solid #ddd">${Number(product.stock) || 0} ${escapeHtml(product.unit || "units")}</td>
      <td style="padding:9px;border-bottom:1px solid #ddd">${Number(product.threshold) || 0}</td>
    </tr>`).join("");

  return {
    subject: `[ESSECO] Stock alert: ${summary}`,
    text: `${textRows.join("\n")}\n\nOpen inventory: https://esseco-ea869.web.app`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#17231d;max-width:640px">
        <h2>ESSECO stock alert</h2>
        <p>${escapeHtml(summary)} requires attention.</p>
        <table style="border-collapse:collapse;width:100%">
          <thead><tr><th>Status</th><th>Product</th><th>Stock</th><th>Threshold</th></tr></thead>
          <tbody>${htmlRows}</tbody>
        </table>
        <p style="margin-top:24px"><a href="https://esseco-ea869.web.app" style="background:#12372a;color:white;padding:11px 16px;text-decoration:none;border-radius:6px">Open inventory</a></p>
      </div>`
  };
}

module.exports = { stockStatus, findNewAlerts, buildCurrentStatuses, createDigest };
