// ============================================
// Soff Glam — App logic
// ============================================

const WHATSAPP_NUMBER = "573148928167"; // Colombia country code + number

let ALL_PRODUCTS = [];
let filteredProducts = [];
let currentCategory = "Todas";
let currentSearch = "";
let visibleCount = 30;
const PAGE_SIZE = 30;

const money = (n) => n == null
  ? "Consultar precio"
  : new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

function whatsappLinkFor(product) {
  const msg = `¡Hola Soff Glam! Quiero pedir este producto:%0A%0A${product.name} — ${money(product.price)}`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
}

// ---------- Load data ----------
async function loadProducts() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*&order=category&_=${Date.now()}`, {
      cache: "no-store",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (!res.ok) throw new Error("No se pudo conectar a la base de datos");
    ALL_PRODUCTS = await res.json();
  } catch (err) {
    console.error("Error cargando productos desde Supabase, usando respaldo local:", err);
    const res = await fetch("data/products.json");
    ALL_PRODUCTS = await res.json();
  }
  buildCategoryChips();
  applyFilters();
}

// ---------- Categories ----------
function buildCategoryChips() {
  const cats = ["Todas", ...Array.from(new Set(ALL_PRODUCTS.map(p => p.category))).sort()];
  const wrap = document.getElementById("categoryChips");
  wrap.innerHTML = "";
  cats.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "chip" + (cat === currentCategory ? " active" : "");
    btn.textContent = cat;
    btn.addEventListener("click", () => {
      currentCategory = cat;
      visibleCount = PAGE_SIZE;
      document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      applyFilters();
      document.getElementById("catalogo").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    wrap.appendChild(btn);
  });
}

// ---------- Filtering ----------
function applyFilters() {
  const term = currentSearch.trim().toLowerCase();
  filteredProducts = ALL_PRODUCTS.filter(p => {
    const matchCat = currentCategory === "Todas" || p.category === currentCategory;
    const matchSearch = !term || p.name.toLowerCase().includes(term) || p.id.toLowerCase().includes(term);
    return matchCat && matchSearch;
  });
  renderGrid();
}

// ---------- Render product grid ----------
function renderGrid() {
  const grid = document.getElementById("productGrid");
  const empty = document.getElementById("emptyState");
  const resultsCount = document.getElementById("resultsCount");
  const loadMoreBtn = document.getElementById("loadMoreBtn");

  grid.innerHTML = "";

  if (filteredProducts.length === 0) {
    empty.hidden = false;
    resultsCount.textContent = "";
    loadMoreBtn.style.display = "none";
    return;
  }
  empty.hidden = true;

  const toShow = filteredProducts.slice(0, visibleCount);
  resultsCount.textContent = `${filteredProducts.length} producto${filteredProducts.length !== 1 ? "s" : ""}`;

  toShow.forEach(p => grid.appendChild(renderCard(p)));

  loadMoreBtn.style.display = visibleCount < filteredProducts.length ? "inline-flex" : "none";
}

function renderCard(p) {
  const card = document.createElement("div");
  card.className = "product-card";
  card.innerHTML = `
    <div class="product-thumb-wrap">
      <img src="${p.image}" alt="${p.name}" loading="lazy">
    </div>
    <div class="product-category">${p.category}</div>
    <div class="product-name">${p.name}</div>
    <div class="product-footer">
      <span class="product-price ${p.price == null ? "unavailable" : ""}">${money(p.price)}</span>
      <a class="add-btn" href="${whatsappLinkFor(p)}" target="_blank" rel="noopener" aria-label="Pedir ${p.name} por WhatsApp">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M20.5 3.5a11 11 0 0 0-17.4 13.2L2 21l4.4-1.1A11 11 0 1 0 20.5 3.5z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8.5 8.7c.3-.9 1-.8 1.6-.8.3 0 .5.1.6.4l.7 1.7c.1.3 0 .5-.1.7l-.5.6c-.2.2-.2.4-.1.6.5.9 1.6 2 2.6 2.5.2.1.4.1.6-.1l.6-.6c.2-.2.4-.2.7-.1l1.7.8c.3.1.4.4.4.6 0 .8-.4 1.4-1.2 1.7-1.6.6-4-.1-6-2.1s-2.7-4.4-2.1-6z" fill="currentColor" stroke="none"/></svg>
      </a>
    </div>
  `;
  return card;
}

// ---------- Wire up events ----------
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("year").textContent = new Date().getFullYear();

  loadProducts();

  // Search
  const searchInput = document.getElementById("searchInput");
  const searchInputMobile = document.getElementById("searchInputMobile");
  const onSearch = (val) => {
    currentSearch = val;
    visibleCount = PAGE_SIZE;
    applyFilters();
  };
  searchInput.addEventListener("input", (e) => onSearch(e.target.value));
  searchInputMobile.addEventListener("input", (e) => {
    searchInput.value = e.target.value;
    onSearch(e.target.value);
  });

  // Mobile search toggle
  document.getElementById("mobileSearchToggle").addEventListener("click", () => {
    document.getElementById("mobileSearchBar").classList.toggle("open");
    searchInputMobile.focus();
  });

  // Load more
  document.getElementById("loadMoreBtn").addEventListener("click", () => {
    visibleCount += PAGE_SIZE;
    renderGrid();
  });
});
