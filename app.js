import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-analytics.js";
import { getDatabase, ref, push, update, onValue, query, limitToLast } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCUViNQKHmW6-JcSwKY4R_DXvB2SHpS_K0",
  authDomain: "esseco-ea869.firebaseapp.com",
  databaseURL: "https://esseco-ea869-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "esseco-ea869",
  storageBucket: "esseco-ea869.firebasestorage.app",
  messagingSenderId: "512168896477",
  appId: "1:512168896477:web:33d3b51e522caa86fbb834",
  measurementId: "G-GKJKE01BFC"
};

const app = initializeApp(firebaseConfig);
isSupported().then(supported => supported && getAnalytics(app)).catch(() => {});
const db = getDatabase(app);
const productsRef = ref(db, "inventory/products");
const activityRef = ref(db, "inventory/activity");

const $ = id => document.getElementById(id);
const state = { products: {}, activity: {}, search: "", category: "all", stock: "all" };
const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });
const dateTime = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" });

function stockStatus(product) {
  const stock = Number(product.stock) || 0;
  const threshold = Number(product.threshold) || 0;
  if (stock <= 0) return { key: "out", label: "Out of stock" };
  if (stock <= threshold) return { key: "low", label: "Low stock" };
  return { key: "healthy", label: "In stock" };
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

function filteredProducts() {
  return Object.entries(state.products).filter(([, product]) => {
    const haystack = `${product.name} ${product.sku} ${product.category}`.toLowerCase();
    return haystack.includes(state.search) && (state.category === "all" || product.category === state.category) && (state.stock === "all" || stockStatus(product).key === state.stock);
  }).sort((a, b) => String(a[1].name).localeCompare(String(b[1].name)));
}

function renderProducts() {
  const all = Object.values(state.products);
  const products = filteredProducts();
  $("totalProducts").textContent = all.length;
  $("inventoryValue").textContent = peso.format(all.reduce((sum, p) => sum + (Number(p.price) || 0) * (Number(p.stock) || 0), 0));
  $("lowStockCount").textContent = all.filter(p => stockStatus(p).key === "low").length;
  $("outOfStockCount").textContent = all.filter(p => stockStatus(p).key === "out").length;
  $("resultCount").textContent = products.length;
  $("productRows").innerHTML = products.map(([id, p]) => {
    const status = stockStatus(p);
    return `<tr><td class="product-cell"><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(p.notes || "No notes")}</small></td><td>${escapeHtml(p.sku)}</td><td><span class="category-pill">${escapeHtml(p.category)}</span></td><td>${peso.format(Number(p.price) || 0)}</td><td><span class="stock-number">${Number(p.stock) || 0}</span> ${escapeHtml(p.unit)}</td><td><span class="status ${status.key}">${status.label}</span></td><td class="align-right"><div class="actions"><button class="action-button" data-action="stock" data-id="${id}">Adjust</button><button class="action-button" data-action="edit" data-id="${id}">Edit</button><button class="action-button danger" data-action="delete" data-id="${id}">Delete</button></div></td></tr>`;
  }).join("");
  $("emptyState").hidden = products.length > 0;
  renderCategories();
}

function renderCategories() {
  const select = $("categoryFilter");
  const categories = [...new Set(Object.values(state.products).map(p => p.category).filter(Boolean))].sort();
  const current = state.category;
  select.innerHTML = '<option value="all">All categories</option>' + categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  select.value = categories.includes(current) ? current : "all";
}

function renderActivity() {
  const entries = Object.entries(state.activity).sort((a, b) => (b[1].timestamp || 0) - (a[1].timestamp || 0));
  $("activityList").innerHTML = entries.length ? entries.map(([, item]) => `<article class="activity-item"><span class="activity-symbol ${escapeHtml(item.type)}">${item.type === "in" || item.type === "add" ? "+" : item.type === "out" || item.type === "delete" ? "−" : "✎"}</span><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.detail || "")}</p></div><time>${item.timestamp ? dateTime.format(new Date(item.timestamp)) : "Just now"}</time></article>`).join("") : '<div class="empty-state"><div>↻</div><h3>No activity yet</h3><p>Inventory changes will appear here.</p></div>';
}

function activityRecord(type, title, detail, timestamp) {
  return { type, title, detail, timestamp };
}

function openProductModal(productId = "") {
  const p = state.products[productId];
  $("productModalTitle").textContent = p ? "Edit product" : "Add product";
  $("productId").value = productId;
  $("productName").value = p?.name || ""; $("productSku").value = p?.sku || ""; $("productCategory").value = p?.category || "";
  $("productPrice").value = p?.price ?? ""; $("productStock").value = p?.stock ?? ""; $("productThreshold").value = p?.threshold ?? 5;
  $("productUnit").value = p?.unit || "pcs"; $("productNotes").value = p?.notes || "";
  $("productModal").hidden = false; setTimeout(() => $("productName").focus(), 50);
}

function closeModal(id) { $(id).hidden = true; }
function toast(message, error = false) { const el = document.createElement("div"); el.className = `toast${error ? " error" : ""}`; el.textContent = message; $("toastRegion").append(el); setTimeout(() => el.remove(), 3200); }

$("productForm").addEventListener("submit", async event => {
  event.preventDefault(); const id = $("productId").value; const existing = state.products[id];
  const timestamp = Date.now();
  const product = { name: $("productName").value.trim(), sku: $("productSku").value.trim().toUpperCase(), category: $("productCategory").value.trim(), price: Number($("productPrice").value), stock: Number($("productStock").value), threshold: Number($("productThreshold").value), unit: $("productUnit").value.trim(), notes: $("productNotes").value.trim(), updatedAt: timestamp };
  try {
    const productId = id || push(productsRef).key;
    const activityId = push(activityRef).key;
    if (!id) product.createdAt = timestamp;
    const updates = {};
    updates[`inventory/products/${productId}`] = id ? { ...existing, ...product } : product;
    updates[`inventory/activity/${activityId}`] = activityRecord(id ? "edit" : "add", id ? `${product.name} updated` : `${product.name} added`, id ? "Product details and stock were edited." : `${product.stock} ${product.unit} entered into inventory.`, timestamp);
    await update(ref(db), updates);
    closeModal("productModal"); toast(id ? "Product updated" : "Product added");
  } catch (error) { toast(`Could not save: ${error.message}`, true); }
});

$("productRows").addEventListener("click", async event => {
  const button = event.target.closest("[data-action]"); if (!button) return; const { action, id } = button.dataset; const p = state.products[id];
  if (action === "edit") openProductModal(id);
  if (action === "stock") { $("stockProductId").value = id; $("stockProductName").textContent = `${p.name} · Current: ${p.stock} ${p.unit}`; $("stockQuantity").value = 1; $("stockReason").value = ""; $("stockModal").hidden = false; }
  if (action === "delete" && confirm(`Delete ${p.name}? This cannot be undone.`)) { try { const timestamp = Date.now(); const activityId = push(activityRef).key; const updates = {}; updates[`inventory/products/${id}`] = null; updates[`inventory/activity/${activityId}`] = activityRecord("delete", `${p.name} deleted`, `${p.sku} was removed from the catalog.`, timestamp); await update(ref(db), updates); toast("Product deleted"); } catch (error) { toast(`Could not delete: ${error.message}`, true); } }
});

$("stockForm").addEventListener("submit", async event => {
  event.preventDefault(); const id = $("stockProductId").value; const p = state.products[id]; const type = new FormData(event.currentTarget).get("stockType"); const quantity = Number($("stockQuantity").value); const nextStock = type === "in" ? Number(p.stock) + quantity : Number(p.stock) - quantity;
  if (nextStock < 0) return toast(`Only ${p.stock} ${p.unit} available`, true);
  try {
    const timestamp = Date.now(); const activityId = push(activityRef).key; const updates = {};
    updates[`inventory/products/${id}/stock`] = nextStock; updates[`inventory/products/${id}/updatedAt`] = timestamp;
    updates[`inventory/activity/${activityId}`] = activityRecord(type, `${type === "in" ? "Stock received" : "Stock released"}: ${p.name}`, `${type === "in" ? "+" : "−"}${quantity} ${p.unit}${$("stockReason").value.trim() ? ` · ${$("stockReason").value.trim()}` : ""}`, timestamp);
    await update(ref(db), updates); closeModal("stockModal"); toast("Stock updated");
  } catch (error) { toast(`Could not update stock: ${error.message}`, true); }
});

onValue(productsRef, snapshot => { state.products = snapshot.val() || {}; renderProducts(); setConnection("online", "Synced in real time"); }, error => setConnection("error", error.message));
onValue(query(activityRef, limitToLast(100)), snapshot => { state.activity = snapshot.val() || {}; renderActivity(); });
function setConnection(status, label) { document.querySelector(".status-dot").className = `status-dot ${status}`; $("syncStatus").textContent = label; }

$("searchInput").addEventListener("input", e => { state.search = e.target.value.trim().toLowerCase(); renderProducts(); });
$("categoryFilter").addEventListener("change", e => { state.category = e.target.value; renderProducts(); });
$("stockFilter").addEventListener("change", e => { state.stock = e.target.value; renderProducts(); });
$("addProductButton").addEventListener("click", () => openProductModal()); $("emptyAddButton").addEventListener("click", () => openProductModal());
document.querySelectorAll(".close-modal").forEach(el => el.addEventListener("click", () => closeModal("productModal"))); document.querySelectorAll(".close-stock-modal").forEach(el => el.addEventListener("click", () => closeModal("stockModal")));
document.querySelectorAll(".modal-backdrop").forEach(el => el.addEventListener("click", e => { if (e.target === el) el.hidden = true; }));
document.querySelectorAll(".nav-item").forEach(button => button.addEventListener("click", () => { document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active")); button.classList.add("active"); const inventory = button.dataset.view === "inventory"; $("inventoryView").hidden = !inventory; $("activityView").hidden = inventory; $("pageTitle").textContent = inventory ? "Inventory overview" : "Activity log"; $("addProductButton").hidden = !inventory; $("sidebar").classList.remove("open"); }));
$("menuButton").addEventListener("click", () => $("sidebar").classList.toggle("open"));
$("todayLabel").textContent = new Intl.DateTimeFormat("en-PH", { weekday: "long", month: "long", day: "numeric" }).format(new Date());
