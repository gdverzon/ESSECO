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

function notificationRecipients(records, defaultEmail) {
  return [...new Set([
    defaultEmail,
    ...Object.values(records || {}).map(record => String(record?.email || "").trim().toLowerCase())
  ].filter(Boolean))];
}

function createDigest(alerts, products = {}, options = {}) {
  const daily = options.daily === true;
  const outCount = alerts.filter(alert => alert.status === "out").length;
  const lowCount = alerts.length - outCount;
  const alertSummary = [
    outCount ? `${outCount} out of stock` : "",
    lowCount ? `${lowCount} low stock` : ""
  ].filter(Boolean).join(", ");

  const inventory = Object.entries(products).map(([id, product]) => ({
    id,
    product,
    status: stockStatus(product)
  })).sort((a, b) => {
    const priority = { out: 0, low: 1, healthy: 2, missing: 3 };
    return priority[a.status] - priority[b.status]
      || String(a.product?.name || "").localeCompare(String(b.product?.name || ""));
  });
  const statusCounts = inventory.reduce((counts, item) => {
    counts[item.status] = (counts[item.status] || 0) + 1;
    return counts;
  }, {});
  const inventorySummary = `${statusCounts.out || 0} out of stock, ${statusCounts.low || 0} low stock, ${statusCounts.healthy || 0} healthy`;
  const colors = { out: "#b42318", low: "#b54708", healthy: "#157347", missing: "#667085" };

  const sections = [
    { status: "out", heading: "OUT OF STOCK" },
    { status: "low", heading: "LOW STOCK" },
    { status: "healthy", heading: "HEALTHY STOCK" }
  ];
  const textSections = sections.map(section => {
    const items = inventory.filter(item => item.status === section.status);
    const rows = items.length ? items.map(({ product }) =>
      `- ${product?.name || "Unnamed product"} (${product?.sku || "No SKU"}) - ${Number(product?.stock) || 0} ${product?.unit || "units"}, threshold ${Number(product?.threshold) || 0}`
    ) : ["- No items"];
    return `${section.heading} (${items.length})\n${rows.join("\n")}`;
  });
  const htmlSections = sections.map(section => {
    const items = inventory.filter(item => item.status === section.status);
    const rows = items.length ? items.map(({ product }) => `
      <tr>
        <td style="padding:9px;border-bottom:1px solid #ddd"><strong>${escapeHtml(product?.name || "Unnamed product")}</strong><br><small>${escapeHtml(product?.sku || "No SKU")}</small></td>
        <td style="padding:9px;border-bottom:1px solid #ddd">${Number(product?.stock) || 0} ${escapeHtml(product?.unit || "units")}</td>
        <td style="padding:9px;border-bottom:1px solid #ddd">${Number(product?.threshold) || 0}</td>
      </tr>`).join("") : '<tr><td colspan="3" style="padding:12px;color:#667085">No items in this status.</td></tr>';
    return `<h3 style="margin:24px 0 8px;color:${colors[section.status]}">${section.heading} (${items.length})</h3><table style="border-collapse:collapse;width:100%"><thead><tr><th style="text-align:left">Item</th><th style="text-align:left">Stock</th><th style="text-align:left">Threshold</th></tr></thead><tbody>${rows}</tbody></table>`;
  }).join("");

  return {
    subject: daily ? `[ESSECO] Daily stock report: ${inventory.length} items` : `[ESSECO] Stock alert: ${alertSummary}`,
    text: daily ? `Daily stock report\nCurrent inventory: ${inventorySummary}\n\n${textSections.join("\n\n")}\n\nOpen inventory: https://esseco-ea869.web.app` : `New alerts: ${alertSummary}\nCurrent inventory: ${inventorySummary}\n\n${textSections.join("\n\n")}\n\nOpen inventory: https://esseco-ea869.web.app`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#17231d;max-width:640px">
        <h2>${daily ? "ESSECO daily stock report" : "ESSECO stock alert"}</h2>
        <p>${daily ? "Here is the current inventory status." : `<strong>${escapeHtml(alertSummary)}</strong> requires attention.`}</p>
        <p>Current inventory: ${escapeHtml(inventorySummary)}.</p>
        ${htmlSections}
        <p style="margin-top:24px"><a href="https://esseco-ea869.web.app" style="background:#12372a;color:white;padding:11px 16px;text-decoration:none;border-radius:6px">Open inventory</a></p>
      </div>`
  };
}

module.exports = { stockStatus, findNewAlerts, buildCurrentStatuses, createDigest, notificationRecipients };
