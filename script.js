// ============================================================
// D'SE GUSTO — lógica del menú y carrito
// ============================================================

let MENU = MENU_FALLBACK;
let cart = [];             // [{lineId, id, nombre, precio, cantidad, toppings:[], nota, lineTotal}]
let currentItem = null;    // item que se está configurando en el modal
let currentQty = 1;

const money = (n) => "$" + Math.round(n).toLocaleString("es-CO");

// ---------- carga de menú (Sheets si hay backend, si no fallback) ----------
async function loadMenu(){
  if (DEMO_MODE) {
    document.getElementById("demoFlag").style.display = "block";
    renderMenu();
    return;
  }
  try{
    const res = await fetch(`${BACKEND_URL}?action=menu`);
    const data = await res.json();
    if (Array.isArray(data) && data.length){
      MENU = data.map(d => ({
        id: String(d.id || d.ID || "").trim(),
        nombre: d.nombre || d.Nombre,
        descripcion: d.descripcion || d.Descripcion || "",
        precio: Number(d.precio || d.Precio || 0),
        disponible: (d.disponible ?? d.Disponible ?? true) === true ||
                    String(d.disponible ?? d.Disponible).toUpperCase() === "TRUE"
      })).filter(i => i.id && i.nombre);
    }
  }catch(e){
    console.warn("No se pudo cargar el menú desde Sheets, usando respaldo local.", e);
  }
  renderMenu();
}

function renderMenu(){
  const wrap = document.getElementById("menuList");
  wrap.innerHTML = "";
  MENU.forEach(item => {
    const card = document.createElement("div");
    card.className = "item-card" + (item.disponible === false ? " unavailable" : "");
    card.innerHTML = `
      <div class="item-info">
        <div class="item-top">
          <span class="item-name">${item.nombre}</span>
          <span class="item-price">${money(item.precio)}</span>
        </div>
        <p class="item-desc">${item.descripcion || ""}</p>
        <div class="item-actions">
          ${item.disponible === false
            ? `<span class="soldout-tag">Agotado</span>`
            : `<button class="btn-add" data-id="${item.id}">+ Agregar</button>`}
        </div>
      </div>
    `;
    wrap.appendChild(card);
  });
  wrap.querySelectorAll(".btn-add").forEach(btn=>{
    btn.addEventListener("click", () => openItemModal(btn.dataset.id));
  });
}

// ---------- selector Mesa / Domicilio ----------
const modeMesaBtn = document.getElementById("modeMesaBtn");
const modeDomicilioBtn = document.getElementById("modeDomicilioBtn");
const mesaFields = document.getElementById("mesaFields");
const domicilioFields = document.getElementById("domicilioFields");
let orderMode = "mesa";

modeMesaBtn.addEventListener("click", () => {
  orderMode = "mesa";
  modeMesaBtn.classList.add("active");
  modeDomicilioBtn.classList.remove("active");
  mesaFields.style.display = "grid";
  domicilioFields.style.display = "none";
  updateCheckoutState();
});
modeDomicilioBtn.addEventListener("click", () => {
  orderMode = "domicilio";
  modeDomicilioBtn.classList.add("active");
  modeMesaBtn.classList.remove("active");
  domicilioFields.style.display = "grid";
  mesaFields.style.display = "none";
  updateCheckoutState();
});

// ---------- modal de item ----------
const modalBackdrop = document.getElementById("itemModalBackdrop");
const toppingListEl = document.getElementById("toppingList");

function openItemModal(id){
  currentItem = MENU.find(i => i.id === id);
  if (!currentItem) return;
  currentQty = 1;
  document.getElementById("modalItemName").textContent = currentItem.nombre;
  document.getElementById("modalItemDesc").textContent = currentItem.descripcion || "";
  document.getElementById("qtyValue").textContent = currentQty;
  document.getElementById("itemNote").value = "";

  toppingListEl.innerHTML = "";
  const allowsToppings = currentItem.id !== "longaniza";
  if (allowsToppings){
    TOPPINGS.forEach(t => {
      const row = document.createElement("label");
      row.className = "topping-row";
      row.innerHTML = `
        <input type="checkbox" value="${t}">
        <label>${t}</label>
        <span class="tp">+${money(PRECIO_TOPPING)}</span>
      `;
      toppingListEl.appendChild(row);
    });
  }
  modalBackdrop.classList.add("open");
}

document.getElementById("cancelModalBtn").addEventListener("click", () => {
  modalBackdrop.classList.remove("open");
});
modalBackdrop.addEventListener("click", (e) => {
  if (e.target === modalBackdrop) modalBackdrop.classList.remove("open");
});

document.getElementById("qtyMinus").addEventListener("click", () => {
  currentQty = Math.max(1, currentQty - 1);
  document.getElementById("qtyValue").textContent = currentQty;
});
document.getElementById("qtyPlus").addEventListener("click", () => {
  currentQty = Math.min(20, currentQty + 1);
  document.getElementById("qtyValue").textContent = currentQty;
});

document.getElementById("confirmAddBtn").addEventListener("click", () => {
  const selectedToppings = Array.from(toppingListEl.querySelectorAll("input:checked")).map(cb => cb.value);
  const nota = document.getElementById("itemNote").value.trim();
  const unitPrice = currentItem.precio + selectedToppings.length * PRECIO_TOPPING;
  cart.push({
    lineId: Date.now() + Math.random().toString(36).slice(2,6),
    id: currentItem.id,
    nombre: currentItem.nombre,
    precioBase: currentItem.precio,
    toppings: selectedToppings,
    cantidad: currentQty,
    nota,
    lineTotal: unitPrice * currentQty
  });
  modalBackdrop.classList.remove("open");
  renderCart();
});

// ---------- carrito ----------
const cartBar = document.getElementById("cartBar");
const cartPanel = document.getElementById("cartPanel");

function renderCart(){
  const items = document.getElementById("cartItems");
  const totalItems = cart.reduce((s,l)=>s+l.cantidad,0);
  const total = cart.reduce((s,l)=>s+l.lineTotal,0);

  cartBar.classList.toggle("visible", cart.length > 0);
  document.getElementById("cartCount").textContent = `${totalItems} ${totalItems===1?"item":"items"}`;
  document.getElementById("cartTotalBar").textContent = money(total);
  document.getElementById("subtotalVal").textContent = money(total);
  document.getElementById("totalVal").textContent = money(total);

  items.innerHTML = "";
  if (cart.length === 0){
    items.innerHTML = `<div class="cart-empty">Tu carrito está vacío.<br>Agrega arepas del menú para empezar.</div>`;
  } else {
    cart.forEach(line => {
      const row = document.createElement("div");
      row.className = "cart-line";
      row.innerHTML = `
        <div class="cart-line-info">
          <div class="cart-line-name">${line.cantidad} × ${line.nombre}</div>
          ${line.toppings.length ? `<div class="cart-line-toppings">+ ${line.toppings.join(", ")}</div>` : ""}
          ${line.nota ? `<div class="cart-line-note">"${line.nota}"</div>` : ""}
        </div>
        <div class="cart-line-right">
          <div class="cart-line-price">${money(line.lineTotal)}</div>
          <button class="cart-line-remove" data-line="${line.lineId}">Quitar</button>
        </div>
      `;
      items.appendChild(row);
    });
    items.querySelectorAll(".cart-line-remove").forEach(btn=>{
      btn.addEventListener("click", () => {
        cart = cart.filter(l => l.lineId !== btn.dataset.line);
        renderCart();
      });
    });
  }
  updateCheckoutState();
}

document.getElementById("openCartBtn").addEventListener("click", () => cartPanel.classList.add("open"));
document.getElementById("closeCartBtn").addEventListener("click", () => cartPanel.classList.remove("open"));

// ---------- validación y envío ----------
function updateCheckoutState(){
  const btn = document.getElementById("checkoutBtn");
  const err = document.getElementById("checkoutError");
  err.textContent = "";
  let valid = cart.length > 0;
  if (orderMode === "mesa"){
    valid = valid && document.getElementById("mesaNumero").value.trim() !== "";
  } else {
    valid = valid
      && document.getElementById("domNombre").value.trim() !== ""
      && document.getElementById("domDireccion").value.trim() !== ""
      && document.getElementById("domTelefono").value.trim() !== "";
  }
  btn.disabled = !valid;
}
["mesaNumero","domNombre","domDireccion","domTelefono"].forEach(id=>{
  document.getElementById(id).addEventListener("input", updateCheckoutState);
});

document.getElementById("checkoutBtn").addEventListener("click", async () => {
  const btn = document.getElementById("checkoutBtn");
  const err = document.getElementById("checkoutError");
  btn.disabled = true;
  btn.textContent = "Enviando...";
  err.textContent = "";

  const total = cart.reduce((s,l)=>s+l.lineTotal,0);
  const order = {
    tipo: orderMode,                                 // "mesa" | "domicilio"
    mesa: orderMode === "mesa" ? document.getElementById("mesaNumero").value.trim() : "",
    nombre: orderMode === "domicilio" ? document.getElementById("domNombre").value.trim() : "",
    direccion: orderMode === "domicilio" ? document.getElementById("domDireccion").value.trim() : "",
    telefono: orderMode === "domicilio" ? document.getElementById("domTelefono").value.trim() : "",
    items: cart.map(l => ({
      nombre: l.nombre,
      cantidad: l.cantidad,
      toppings: l.toppings,
      nota: l.nota,
      lineTotal: l.lineTotal
    })),
    total
  };

  try{
    let orderId;
    if (DEMO_MODE){
      await new Promise(r => setTimeout(r, 600));
      orderId = "DEMO-" + Math.floor(1000 + Math.random()*9000);
    } else {
      const res = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" }, // evita preflight CORS con Apps Script
        body: JSON.stringify({ action: "crearPedido", pedido: order })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Error al guardar el pedido");
      orderId = data.id;
    }
    showConfirmation(orderId);
    cart = [];
    renderCart();
    cartPanel.classList.remove("open");
  }catch(e){
    console.error(e);
    err.textContent = "No pudimos enviar tu pedido. Intenta de nuevo.";
  }finally{
    btn.disabled = false;
    btn.textContent = "Enviar pedido";
  }
});

function showConfirmation(orderId){
  document.getElementById("confirmNum").textContent = "Pedido #" + orderId;
  document.getElementById("confirmScreen").classList.add("open");
}
document.getElementById("newOrderBtn").addEventListener("click", () => {
  document.getElementById("confirmScreen").classList.remove("open");
});

// ---------- init ----------
loadMenu();
renderCart();
