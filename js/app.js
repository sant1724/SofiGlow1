// ============================================
// SofiGlow — App logic
// ============================================

const WHATSAPP_NUMBER = "573008196612"; // Colombia country code + number

let ALL_PRODUCTS = [];
let filteredProducts = [];
let currentCategory = "Todas";
let currentSearch = "";
let visibleCount = 30;
const PAGE_SIZE = 30;

let cart = {}; // { id: { product, qty } }

const money = (n) => n == null
  ? "Consultar precio"
  : new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

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
      <button class="add-btn" aria-label="Agregar ${p.name} al carrito" ${p.price == null ? "disabled" : ""}>+</button>
    </div>
  `;
  const addBtn = card.querySelector(".add-btn");
  if (p.price != null) {
    addBtn.addEventListener("click", () => addToCart(p));
  }
  return card;
}

// ---------- Cart ----------
function addToCart(product) {
  if (cart[product.id]) {
    cart[product.id].qty += 1;
  } else {
    cart[product.id] = { product, qty: 1 };
  }
  renderCart();
  openCart();
}

function changeQty(id, delta) {
  if (!cart[id]) return;
  cart[id].qty += delta;
  if (cart[id].qty <= 0) delete cart[id];
  renderCart();
}

function removeFromCart(id) {
  delete cart[id];
  renderCart();
}

function cartTotal() {
  return Object.values(cart).reduce((sum, item) => sum + item.product.price * item.qty, 0);
}

function cartCount() {
  return Object.values(cart).reduce((sum, item) => sum + item.qty, 0);
}

function renderCart() {
  const itemsWrap = document.getElementById("cartItems");
  const emptyMsg = document.getElementById("cartEmptyMsg");
  const footer = document.getElementById("cartFooter");
  const countBadge = document.getElementById("cartCount");

  const items = Object.values(cart);
  countBadge.textContent = cartCount();

  itemsWrap.innerHTML = "";
  if (items.length === 0) {
    emptyMsg.hidden = false;
    footer.hidden = true;
    return;
  }
  emptyMsg.hidden = true;
  footer.hidden = false;

  items.forEach(({ product, qty }) => {
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <div class="cart-item-info">
        <div class="cart-item-name">${product.name}</div>
        <div class="cart-item-price">${money(product.price)}</div>
        <div class="qty-control">
          <button aria-label="Restar">−</button>
          <span>${qty}</span>
          <button aria-label="Sumar">+</button>
        </div>
        <button class="remove-item">Eliminar</button>
      </div>
    `;
    const [minusBtn, plusBtn] = row.querySelectorAll(".qty-control button");
    minusBtn.addEventListener("click", () => changeQty(product.id, -1));
    plusBtn.addEventListener("click", () => changeQty(product.id, 1));
    row.querySelector(".remove-item").addEventListener("click", () => removeFromCart(product.id));
    itemsWrap.appendChild(row);
  });

  document.getElementById("cartTotal").textContent = money(cartTotal());
}

// ---------- Cart drawer open/close ----------
function openCart() {
  document.getElementById("cartDrawer").classList.add("open");
  document.getElementById("overlay").classList.add("visible");
}
function closeCartDrawer() {
  document.getElementById("cartDrawer").classList.remove("open");
  document.getElementById("overlay").classList.remove("visible");
}

// ---------- Checkout ----------
function openCheckout() {
  const items = Object.values(cart);
  if (items.length === 0) return;

  const summaryWrap = document.getElementById("checkoutSummary");
  summaryWrap.innerHTML = "";
  items.forEach(({ product, qty }) => {
    const line = document.createElement("div");
    line.className = "checkout-line";
    line.innerHTML = `<span>${qty} × ${product.name}</span><strong>${money(product.price * qty)}</strong>`;
    summaryWrap.appendChild(line);
  });
  document.getElementById("checkoutTotal").textContent = money(cartTotal());

  document.getElementById("stepSummary").hidden = false;
  document.getElementById("stepPay").hidden = true;
  document.getElementById("checkoutOverlay").classList.add("visible");
}

function closeCheckout() {
  document.getElementById("checkoutOverlay").classList.remove("visible");
}

function goToPay() {
  document.getElementById("stepSummary").hidden = true;
  document.getElementById("stepPay").hidden = false;

  const items = Object.values(cart);
  let msg = "¡Hola SoffGlam! Ya realicé el pago de mi pedido:%0A%0A";
  items.forEach(({ product, qty }) => {
    msg += `• ${qty} x ${product.name} — ${money(product.price * qty)}%0A`;
  });
  msg += `%0ATotal: ${money(cartTotal())}%0A%0AAdjunto el comprobante de pago.`;

  const link = document.getElementById("confirmWhatsappBtn");
  link.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
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

  // Cart drawer
  document.getElementById("cartBtn").addEventListener("click", openCart);
  document.getElementById("closeCart").addEventListener("click", closeCartDrawer);
  document.getElementById("overlay").addEventListener("click", closeCartDrawer);

  // Checkout
  document.getElementById("checkoutBtn").addEventListener("click", () => {
    closeCartDrawer();
    openCheckout();
  });
  document.getElementById("closeCheckout").addEventListener("click", closeCheckout);
  document.getElementById("goToPayBtn").addEventListener("click", goToPay);
  document.getElementById("backToSummaryBtn").addEventListener("click", () => {
    document.getElementById("stepSummary").hidden = false;
    document.getElementById("stepPay").hidden = true;
  });
  document.getElementById("checkoutOverlay").addEventListener("click", (e) => {
    if (e.target.id === "checkoutOverlay") closeCheckout();
  });
});
