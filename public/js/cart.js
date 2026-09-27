import { api, getCart, nav, rupee, setCart } from "./app.js";

nav();

const addrBox = document.getElementById("address");
const addAddrBtn = document.getElementById("add-addr");
const me = await api("/api/auth/me");
if (me.user?.address) {
  addrBox.value = me.user.address;
  addrBox.hidden = false;
  addAddrBtn.textContent = "Edit address";
}
addAddrBtn.onclick = () => {
  addrBox.hidden = false;
  addrBox.focus();
};

function render() {
  const cart = getCart();
  const list = document.getElementById("list");
  if (!cart.length) {
    list.innerHTML = "<p>Cart is empty.</p>";
    document.getElementById("total").textContent = "";
    return;
  }
  list.innerHTML = cart
    .map((row, i) => `<div class="card row"><span>${row.qty} × ${row.name}</span><span>${rupee(row.price_inr * row.qty)} <button data-i="${i}">Remove</button></span></div>`)
    .join("");
  document.getElementById("total").textContent =
    "Total " + rupee(cart.reduce((n, r) => n + r.price_inr * r.qty, 0));
  document.querySelectorAll("[data-i]").forEach((btn) => {
    btn.onclick = () => {
      const next = getCart();
      next.splice(Number(btn.dataset.i), 1);
      setCart(next);
      render();
    };
  });
}

document.getElementById("place").onclick = async () => {
  const err = document.getElementById("err");
  err.textContent = "";
  try {
    const me = await api("/api/auth/me");
    if (!me.user) {
      location.href = "/login.html";
      return;
    }
    const address = document.getElementById("address").value.trim();
    if (!address) {
      document.getElementById("address").hidden = false;
      throw new Error("Add a delivery address first.");
    }
    await api("/api/orders", {
      method: "POST",
      body: {
        items: getCart().map((r) => ({ id: r.id, qty: r.qty })),
        note: document.getElementById("note").value,
        address,
      },
    });
    setCart([]);
    location.href = "/orders.html";
  } catch (e) {
    err.textContent = e.message;
  }
};

render();
