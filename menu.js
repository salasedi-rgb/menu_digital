// Menú local de respaldo — se usa si la hoja de Google Sheets aún no responde
// o si el administrador no ha configurado la pestaña "Menu" todavía.
// Para editar precios o descripciones sin tocar código, hazlo directamente
// en la hoja de Google Sheets (ver README.md).

const MENU_FALLBACK = [
  {
    id: "grandota",
    nombre: "Grandota",
    descripcion: "Pollo, carne, chicharrón, maduro, maíz, tocineta, jamón, chorizo, quesillo, huevo",
    precio: 13000,
    disponible: true
  },
  {
    id: "montanera",
    nombre: "Montañera",
    descripcion: "Carne, chicharrón, chorizo, queso, huevo",
    precio: 11500,
    disponible: true
  },
  {
    id: "mixta",
    nombre: "Mixta",
    descripcion: "Carne, pollo, chicharrón, quesillo, huevo",
    precio: 11000,
    disponible: true
  },
  {
    id: "tierna",
    nombre: "Tierna",
    descripcion: "Carne, maduro, jamón, quesillo, huevo",
    precio: 11500,
    disponible: true
  },
  {
    id: "vanidosa",
    nombre: "Vanidosa",
    descripcion: "Pollo, maduro, maíz, quesillo, huevo",
    precio: 9000,
    disponible: true
  },
  {
    id: "dificil",
    nombre: "Difícil",
    descripcion: "Maduro, chicharrón, quesillo, bañada en salsa BBQ",
    precio: 9000,
    disponible: true
  },
  {
    id: "dormilona",
    nombre: "Dormilona",
    descripcion: "Chicharrón, quesillo, huevo",
    precio: 7000,
    disponible: true
  },
  {
    id: "consentida",
    nombre: "Consentida",
    descripcion: "Quesillo, jamón",
    precio: 6500,
    disponible: true
  },
  {
    id: "qsuda",
    nombre: "Q' Suda",
    descripcion: "Quesillo",
    precio: 5000,
    disponible: true
  },
  {
    id: "longaniza",
    nombre: "Longaniza de 15 cm",
    descripcion: "Longaniza a la parrilla",
    precio: 10000,
    disponible: true
  }
];

// Toppings adicionales — cada uno agrega $2.500 y va dentro de la arepa.
// La longaniza no admite toppings.
const TOPPINGS = [
  "Chicharrón", "Queso", "Huevo", "Tocineta", "Jamón",
  "Chorizo", "Maíz", "Maduro", "Pollo", "Carne", "Quesillo"
];
const PRECIO_TOPPING = 2500;
