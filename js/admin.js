// ============================================
// SofiGlow — Admin panel logic
// ============================================

let accessToken = null;
let adminProducts = [];
let adminVisibleCount = 40;
const ADMIN_PAGE_SIZE = 40;
let adminSearchTerm = "";

const moneyFmt = (n) => n == null
  ? ""
  : new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(n);

// ---------- Session ----------
function saveSession(token, email) {
  accessToken = token;
  sessionStorage.setItem("sofiglow_admin_token", token);
  sessionStorage.setItem("sofiglow_admin_email", email);
}
function loadSession() {
  return {
    token: sessionStorage.getItem("sofiglow_admin_token"),
    email: sessionStorage.getItem("sofiglow_admin_email"),
  };
}
function clearSession() {
  accessToken = null;
  sessionStorage.removeItem("sofiglow_admin_token");
  sessionStorage.removeItem("sofiglow_admin_email");
}

// ---------- Login ----------
async function login(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error("Correo o contraseña incorrectos");
  }
  const data = await res.json();
  return data.access_token;
}

// ---------- Products (admin) ----------
async function fetchAdminProducts() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*&order=name`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) throw new Error("No se pudieron cargar los productos");
  adminProducts = await res.json();
  renderAdminTable();
}

async function updatePrice(id, newPrice) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ price: newPrice }),
  });
  if (!res.ok) throw new Error("No se pudo guardar el precio");
}

// ---------- Render ----------
function renderAdminTable() {
  const tbody = document.getElementById("adminTableBody");
  const term = adminSearchTerm.trim().toLowerCase();
  const filtered = adminProducts.filter(p =>
    !term || p.name.toLowerCase().includes(term) || p.id.toLowerCase().includes(term)
  );

  tbody.innerHTML = "";
  const toShow = filtered.slice(0, adminVisibleCount);

  toShow.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><img class="admin-row-thumb" src="${p.image}" alt="${p.name}" loading="lazy"></td>
      <td class="admin-row-name">${p.name}<br><span style="color:var(--charcoal-60); font-weight:400; font-size:0.75rem;">${p.id}</span></td>
      <td class="admin-row-cat">${p.category}</td>
      <td><input type="number" class="admin-price-input" value="${p.price ?? ""}" min="0" step="100"></td>
      <td><button class="admin-save-btn">Guardar</button></td>
    `;
    const input = tr.querySelector(".admin-price-input");
    const saveBtn = tr.querySelector(".admin-save-btn");
    saveBtn.addEventListener("click", async () => {
      const val = input.value.trim();
      const newPrice = val === "" ? null : parseInt(val, 10);
      saveBtn.disabled = true;
      saveBtn.textContent = "Guardando…";
      try {
        await updatePrice(p.id, newPrice);
        p.price = newPrice;
        saveBtn.textContent = "Guardado ✓";
        saveBtn.classList.add("saved");
        setTimeout(() => {
          saveBtn.textContent = "Guardar";
          saveBtn.classList.remove("saved");
          saveBtn.disabled = false;
        }, 1500);
      } catch (err) {
        saveBtn.textContent = "Error, reintenta";
        saveBtn.disabled = false;
      }
    });
    tbody.appendChild(tr);
  });

  document.getElementById("adminLoadMoreBtn").style.display =
    adminVisibleCount < filtered.length ? "inline-flex" : "none";
}

// ---------- UI switching ----------
function showPanel(email) {
  document.getElementById("loginWrap").hidden = true;
  document.getElementById("adminPanel").hidden = false;
  document.getElementById("adminUserEmail").textContent = email;
}
function showLogin() {
  document.getElementById("loginWrap").hidden = false;
  document.getElementById("adminPanel").hidden = true;
}

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", () => {
  const session = loadSession();
  if (session.token) {
    accessToken = session.token;
    showPanel(session.email);
    fetchAdminProducts().catch(() => {
      clearSession();
      showLogin();
    });
  }

  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value;
    const errorEl = document.getElementById("loginError");
    errorEl.hidden = true;
    try {
      const token = await login(email, password);
      saveSession(token, email);
      showPanel(email);
      await fetchAdminProducts();
    } catch (err) {
      errorEl.textContent = err.message || "No se pudo iniciar sesión";
      errorEl.hidden = false;
    }
  });

  document.getElementById("logoutBtn").addEventListener("click", () => {
    clearSession();
    showLogin();
  });

  document.getElementById("adminSearch").addEventListener("input", (e) => {
    adminSearchTerm = e.target.value;
    adminVisibleCount = ADMIN_PAGE_SIZE;
    renderAdminTable();
  });

  document.getElementById("adminLoadMoreBtn").addEventListener("click", () => {
    adminVisibleCount += ADMIN_PAGE_SIZE;
    renderAdminTable();
  });
});
