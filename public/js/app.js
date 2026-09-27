export function rupee(n) {
  return "₹" + n;
}

export async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Error");
  return data;
}

export function getCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}

export function setCart(items) {
  localStorage.setItem("cart", JSON.stringify(items));
  const n = items.reduce((sum, row) => sum + row.qty, 0);
  document.querySelectorAll(".cart-n").forEach((el) => {
    el.textContent = n ? "(" + n + ")" : "";
  });
}

export function addToCart(item) {
  const cart = getCart();
  const found = cart.find((row) => row.id === item.id);
  if (found) found.qty += 1;
  else cart.push({ id: item.id, name: item.name, price_inr: item.price_inr, is_veg: item.is_veg, qty: 1 });
  setCart(cart);
  const msg = document.getElementById("added");
  if (msg) {
    msg.textContent = item.name + " added to cart";
    msg.hidden = false;
    clearTimeout(addToCart._t);
    addToCart._t = setTimeout(() => {
      msg.hidden = true;
    }, 2000);
  }
}

export function nav() {
  const here = location.pathname;
  const link = (href, label) =>
    `<a class="${here === href || (href === "/" && here === "/index.html") ? "on" : ""}" href="${href}">${label}</a>`;
  document.body.insertAdjacentHTML(
    "afterbegin",
    `<p class="brand">NomNom<span>.com</span></p>
     <nav>
       ${link("/", "Menu")}
       ${link("/cart.html", 'Cart <span class="cart-n"></span>')}
       ${link("/orders.html", "Orders")}
       ${link("/profile.html", "Profile")}
       ${link("/login.html", "Login")}
       ${link("/signup.html", "Sign up")}
     </nav>`
  );
  document.body.insertAdjacentHTML(
    "beforeend",
    `<a class="cart-bottom" href="/cart.html">View cart <span class="cart-n"></span></a>`
  );
  setCart(getCart());
}
