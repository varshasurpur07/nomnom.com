import { api, nav, rupee } from "./app.js";

nav();

const list = document.getElementById("list");
const me = await api("/api/auth/me");
if (!me.user) {
  list.innerHTML = '<p>Please <a href="/login.html">log in</a>.</p>';
} else {
  const orders = await api("/api/orders");
  if (!orders.length) list.innerHTML = "<p>No orders yet.</p>";
  else {
    list.innerHTML = orders
      .map((o) => {
        const items = o.items.map((i) => `${i.qty}× ${i.name}`).join(", ");
        return `<div class="card"><b>Order #${o.id}</b> · ${o.status}<div>${items}</div><div class="muted">${o.address || ""}</div><div>${rupee(o.total_inr)} · ${o.created_at}</div></div>`;
      })
      .join("");
  }
}
