import { addToCart, api, nav, rupee } from "./app.js";

nav();

const CATS = ["Starters", "Meals", "Desserts", "Drinks"];
let veg = "";
let cat = "";

function card(item) {
  return `<div class="card">
    <div class="row">
      <div>
        <b>${item.name}</b>
        <div class="muted">${item.is_veg ? '<span class="veg">VEG</span>' : '<span class="nv">NON-VEG</span>'} · ${item.restaurant_name}</div>
        <div class="muted">${item.description}</div>
      </div>
      <div>
        <div class="price">${rupee(item.price_inr)}</div>
        <button class="btn" data-id="${item.id}">Add</button>
      </div>
    </div>
  </div>`;
}

async function load() {
  const query = new URLSearchParams();
  if (veg !== "") query.set("veg", veg);
  if (cat) query.set("category", cat);
  const items = await api("/api/menu?" + query);
  const list = document.getElementById("list");
  const groups = cat ? [cat] : CATS;
  list.innerHTML = groups
    .map((name) => {
      const rows = items.filter((item) => item.category === name);
      if (!rows.length) return "";
      return `<h2 class="cat">${name}</h2>` + rows.map(card).join("");
    })
    .join("");
  document.querySelectorAll("[data-id]").forEach((btn) => {
    btn.onclick = () => addToCart(items.find((x) => String(x.id) === btn.dataset.id));
  });
}

document.querySelectorAll("[data-veg]").forEach((btn) => {
  btn.onclick = () => {
    document.querySelectorAll("[data-veg]").forEach((b) => b.classList.remove("on"));
    btn.classList.add("on");
    veg = btn.dataset.veg;
    load();
  };
});
document.querySelectorAll("[data-cat]").forEach((btn) => {
  btn.onclick = () => {
    document.querySelectorAll("[data-cat]").forEach((b) => b.classList.remove("on"));
    btn.classList.add("on");
    cat = btn.dataset.cat;
    load();
  };
});

load();
