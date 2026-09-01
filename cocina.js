// ============================================================
// D'SE GUSTO — pantalla de cocina
// Sondea (polling) el backend de Google Sheets cada 5s.
// GitHub Pages es estático, así que esto simula "tiempo real"
// con actualizaciones automáticas — no hace falta un servidor.
// ============================================================

const POLL_MS = 5000;
const ESTADOS = ["Nuevo", "Preparando", "Listo"];
let lastKnownIds = new Set();

const DEMO_ORDERS = [
  { id: "DEMO-1001", tipo: "mesa", mesa: "4", nombre:"", direccion:"", telefono:"",
    items:[{nombre:"Grandota", cantidad:1, toppings:["Chicharrón"], nota:""}],
    total: 15500, estado: "Nuevo", timestamp: Date.now() - 1*60000 },
  { id: "DEMO-1000", tipo: "domicilio", mesa:"", nombre:"Laura Gómez", direccion:"Cra 10 # 20-30", telefono:"3001234567",
    items:[{nombre:"Mixta", cantidad:2, toppings:[], nota:"una sin huevo"}],
    total: 22000, estado: "Preparando", timestamp: Date.now() - 6*60000 },
];

function money(n){ return "$" + Math.round(n).toLocaleString("es-CO"); }

function minutesAgo(ts){
  const diff = Math.max(0, Date.now() - Number(ts));
  return Math.round(diff/60000);
}

async function fetchOrders(){
  if (DEMO_MODE){
    document.getElementById("demoBanner").style.display = "block";
    return DEMO_ORDERS;
  }
  const res = await fetch(`${BACKEND_URL}?action=pedidos`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

function ticketHTML(order){
  const isNew = !lastKnownIds.has(order.id);
  const destino = order.tipo === "mesa"
    ? `Mesa ${order.mesa}`
    : `${order.nombre} · ${order.direccion} · ${order.telefono}`;

  const itemsHTML = (order.items || []).map(it => `
    <div class="line">
      <span class="qty">${it.cantidad}×</span> ${it.nombre}
      ${it.toppings && it.toppings.length ? `<div class="tp">+ ${it.toppings.join(", ")}</div>` : ""}
      ${it.nota ? `<div class="nota">"${it.nota}"</div>` : ""}
    </div>
  `).join("");

  const mins = minutesAgo(order.timestamp);
  const idx = ESTADOS.indexOf(order.estado);
  const puedeAvanzar = idx < ESTADOS.length - 1;
  const puedeRetroceder = idx > 0;

  return `
    <div class="ticket ${mins >= 15 ? "urgente" : ""}" data-id="${order.id}">
      <div class="ticket-top">
        <span class="ticket-tag ${order.tipo === "domicilio" ? "domicilio" : ""}">${order.tipo === "mesa" ? "MESA" : "DOMICILIO"}</span>
        <span class="ticket-time">hace ${mins} min</span>
      </div>
      <div class="ticket-id">Pedido #${order.id}</div>
      <div class="ticket-dest">${destino}</div>
      <div class="ticket-items">${itemsHTML}</div>
      <div class="ticket-actions">
        ${puedeRetroceder ? `<button class="btn-atras" data-action="atras">← ${ESTADOS[idx-1]}</button>` : ""}
        ${puedeAvanzar ? `<button class="btn-avanzar" data-action="avanzar">${idx===0?"Marcar en parrilla":"Marcar listo"} →</button>`
                       : `<button class="btn-avanzar" data-action="entregar">Entregado ✓</button>`}
      </div>
    </div>
  `;
}

function render(orders){
  const cols = { Nuevo: [], Preparando: [], Listo: [] };
  orders.forEach(o => { if (cols[o.estado]) cols[o.estado].push(o); });

  const mapping = [
    ["colNuevos", "countNuevos", cols.Nuevo],
    ["colPreparando", "countPreparando", cols.Preparando],
    ["colListos", "countListos", cols.Listo],
  ];

  mapping.forEach(([colId, countId, list]) => {
    const el = document.getElementById(colId);
    document.getElementById(countId).textContent = list.length;
    el.innerHTML = list.length
      ? list.sort((a,b)=>a.timestamp-b.timestamp).map(ticketHTML).join("")
      : `<div class="empty-col">Sin pedidos</div>`;
  });

  document.querySelectorAll(".ticket-actions button").forEach(btn=>{
    btn.addEventListener("click", () => handleAction(btn));
  });

  lastKnownIds = new Set(orders.map(o=>o.id));
}

async function handleAction(btn){
  const ticket = btn.closest(".ticket");
  const id = ticket.dataset.id;
  const action = btn.dataset.action;

  const order = (window.__currentOrders || []).find(o => o.id === id);
  if (!order) return;
  const idx = ESTADOS.indexOf(order.estado);
  let nuevoEstado;
  if (action === "avanzar") nuevoEstado = ESTADOS[idx+1];
  else if (action === "atras") nuevoEstado = ESTADOS[idx-1];
  else if (action === "entregar") nuevoEstado = "Entregado";

  if (DEMO_MODE){
    order.estado = nuevoEstado;
    render(window.__currentOrders.filter(o => o.estado !== "Entregado"));
    return;
  }

  try{
    await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "actualizarEstado", id, estado: nuevoEstado })
    });
    poll();
  }catch(e){
    console.error("No se pudo actualizar el estado", e);
  }
}

async function poll(){
  try{
    const orders = await fetchOrders();
    window.__currentOrders = orders.filter(o => o.estado !== "Entregado");
    render(window.__currentOrders);
    setStatus(true);
  }catch(e){
    console.error(e);
    setStatus(false);
  }
}

function setStatus(ok){
  document.getElementById("statusDot").classList.toggle("off", !ok);
  document.getElementById("statusText").textContent = ok ? "Conectado" : "Sin conexión — reintentando";
}

function tickClock(){
  document.getElementById("clock").textContent = new Date().toLocaleTimeString("es-CO", {hour:"2-digit", minute:"2-digit"});
}

tickClock();
setInterval(tickClock, 15000);
poll();
setInterval(poll, POLL_MS);
