const path = require("path");
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const { DatabaseSync } = require("node:sqlite");

const app = express();
const PORT = process.env.PORT || 3000;
const db = new DatabaseSync(path.join(__dirname, "nomnom.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    phone TEXT DEFAULT '',
    hostel TEXT DEFAULT '',
    address TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS restaurants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cuisine TEXT NOT NULL,
    eta_mins INTEGER NOT NULL,
    rating REAL NOT NULL,
    emoji TEXT NOT NULL,
    tag TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price_inr INTEGER NOT NULL,
    is_veg INTEGER NOT NULL,
    emoji TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Meals'
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    total_inr INTEGER NOT NULL,
    status TEXT NOT NULL,
    note TEXT DEFAULT '',
    address TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    menu_item_id INTEGER,
    name TEXT NOT NULL,
    qty INTEGER NOT NULL,
    price_inr INTEGER NOT NULL,
    is_veg INTEGER NOT NULL
  );
`);

try {
  db.exec("ALTER TABLE users ADD COLUMN address TEXT DEFAULT ''");
} catch (_e) {}
try {
  db.exec("ALTER TABLE orders ADD COLUMN address TEXT DEFAULT ''");
} catch (_e) {}
try {
  db.exec("ALTER TABLE menu_items ADD COLUMN category TEXT DEFAULT 'Meals'");
} catch (_e) {}

function assignCategories() {
  const byName = {
    "Samosa (2 pcs)": "Starters",
    "Veg Puff": "Starters",
    "Chicken Puff": "Starters",
    "Garlic Bread (4 pcs)": "Starters",
    "Veg Sandwich": "Starters",
    "Aloo Paratha + Dahi": "Meals",
    "Chole Bhature": "Meals",
    "Veg Thali": "Meals",
    "Egg Bhurji Pav": "Meals",
    "Chicken Curry Rice": "Meals",
    "Classic Maggi": "Meals",
    "Cheese Maggi": "Meals",
    "Chicken Maggi": "Meals",
    "Paneer Kathi Roll": "Meals",
    "Veg Fried Rice": "Meals",
    "Chicken Kathi Roll": "Meals",
    "Egg Fried Rice": "Meals",
    "Chicken Biryani (half)": "Meals",
    "Pav Bhaji": "Meals",
    "Masala Dosa": "Meals",
    "Chicken 65 Rice Bowl": "Meals",
    "Keema Pav": "Meals",
    "Chocolate Brownie": "Desserts",
    "Cutting Chai": "Drinks",
    "Mosambi Juice": "Drinks",
    "Mango Shake": "Drinks",
    "Banana Protein Shake": "Drinks",
    "Cold Coffee": "Drinks",
    "Watermelon Cooler": "Drinks",
    "Cold Cocoa": "Drinks",
  };
  const upd = db.prepare("UPDATE menu_items SET category = ? WHERE name = ?");
  for (const [name, category] of Object.entries(byName)) {
    upd.run(category, name);
  }
}

function seed() {
  const count = db.prepare("SELECT COUNT(*) AS n FROM restaurants").get().n;
  if (count > 0) return;

  const insertRestaurant = db.prepare(
    `INSERT INTO restaurants (name, cuisine, eta_mins, rating, emoji, tag)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const insertItem = db.prepare(
    `INSERT INTO menu_items (restaurant_id, name, description, price_inr, is_veg, emoji)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  const places = [
      {
        restaurant: ["Hostel Canteen", "North Indian", 18, 4.5, "🍛", "Campus favourite"],
        items: [
          ["Aloo Paratha + Dahi", "Two stuffed parathas with curd", 69, 1, "🫓"],
          ["Chole Bhature", "Fluffy bhature with chole", 89, 1, "🥘"],
          ["Veg Thali", "Dal, sabzi, roti, rice, salad", 109, 1, "🍱"],
          ["Egg Bhurji Pav", "Spiced scrambled eggs with pav", 79, 0, "🍳"],
          ["Chicken Curry Rice", "Home-style curry with steamed rice", 129, 0, "🍗"],
        ],
      },
      {
        restaurant: ["Maggi Point", "Quick bites", 12, 4.6, "🍜", "Late night"],
        items: [
          ["Classic Maggi", "Masala Maggi, extra veg", 49, 1, "🍜"],
          ["Cheese Maggi", "Loaded with processed cheese", 69, 1, "🧀"],
          ["Veg Sandwich", "Grilled, with green chutney", 59, 1, "🥪"],
          ["Chicken Maggi", "Shredded chicken + Maggi", 89, 0, "🍝"],
          ["Cutting Chai", "Strong campus chai", 15, 1, "☕"],
        ],
      },
      {
        restaurant: ["Spice Junction", "Rolls & rice", 22, 4.4, "🌯", "Spicy"],
        items: [
          ["Paneer Kathi Roll", "Tandoori paneer, onions, mint", 89, 1, "🌯"],
          ["Veg Fried Rice", "Wok tossed with mixed veg", 79, 1, "🍚"],
          ["Chicken Kathi Roll", "Juicy chicken tikka roll", 99, 0, "🌮"],
          ["Egg Fried Rice", "Classic egg fried rice", 85, 0, "🍳"],
          ["Chicken Biryani (half)", "Dum biryani, raita", 149, 0, "🍖"],
        ],
      },
      {
        restaurant: ["Sip Lab", "Juices & shakes", 10, 4.7, "🥤", "Fresh"],
        items: [
          ["Mosambi Juice", "Freshly squeezed", 40, 1, "🍋"],
          ["Mango Shake", "Alphonso pulp, chilled", 69, 1, "🥭"],
          ["Banana Protein Shake", "Banana, milk, peanut butter", 79, 1, "🍌"],
          ["Cold Coffee", "Iced, with ice cream scoop", 59, 1, "🧊"],
          ["Watermelon Cooler", "No added sugar", 45, 1, "🍉"],
        ],
      },
      {
        restaurant: ["Night Canteen", "Comfort food", 25, 4.3, "🌙", "Till 2am"],
        items: [
          ["Samosa (2 pcs)", "Crispy, with chutney", 30, 1, "🔺"],
          ["Pav Bhaji", "Buttery bhaji, two pavs", 89, 1, "🍞"],
          ["Masala Dosa", "Crisp dosa, sambar, chutney", 79, 1, "🥞"],
          ["Chicken 65 Rice Bowl", "Spicy fried chicken + rice", 139, 0, "🌶️"],
          ["Keema Pav", "Minced mutton, butter pav", 129, 0, "🥩"],
        ],
      },
      {
        restaurant: ["Bake House", "Bakery", 16, 4.5, "🧁", "Sweet tooth"],
        items: [
          ["Veg Puff", "Warm, flaky", 25, 1, "🥐"],
          ["Chocolate Brownie", "Fudgy square", 55, 1, "🍫"],
          ["Garlic Bread (4 pcs)", "Cheesy garlic", 60, 1, "🥖"],
          ["Chicken Puff", "Peppery chicken filling", 40, 0, "🥧"],
          ["Cold Cocoa", "Iced chocolate milk", 50, 1, "🥛"],
        ],
      },
    ];

  db.exec("BEGIN");
  try {
    for (const place of places) {
      const info = insertRestaurant.run(...place.restaurant);
      for (const item of place.items) {
        insertItem.run(info.lastInsertRowid, ...item);
      }
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

seed();
assignCategories();

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "nomnom-campus-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 },
  })
);
app.use(express.static(path.join(__dirname, "public")));

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Please log in to continue." });
  }
  next();
}

function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    hostel: row.hostel,
    address: row.address || "",
  };
}

app.get("/api/restaurants", (_req, res) => {
  const restaurants = db
    .prepare(
      `SELECT r.*,
        (SELECT MIN(price_inr) FROM menu_items WHERE restaurant_id = r.id) AS from_price
       FROM restaurants r
       ORDER BY r.id`
    )
    .all();
  res.json(restaurants);
});

app.get("/api/restaurants/:id", (req, res) => {
  const restaurant = db
    .prepare("SELECT * FROM restaurants WHERE id = ?")
    .get(req.params.id);
  if (!restaurant) return res.status(404).json({ error: "Kitchen not found." });
  const items = db
    .prepare("SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY is_veg DESC, name")
    .all(req.params.id);
  res.json({ ...restaurant, items });
});

app.get("/api/menu", (req, res) => {
  const veg = req.query.veg;
  const q = (req.query.q || "").trim();
  const category = String(req.query.category || "").trim();
  let sql = `
    SELECT m.*, r.name AS restaurant_name, r.eta_mins, r.emoji AS restaurant_emoji
    FROM menu_items m
    JOIN restaurants r ON r.id = m.restaurant_id
    WHERE 1=1
  `;
  const params = [];
  if (veg === "1" || veg === "true") {
    sql += " AND m.is_veg = 1";
  } else if (veg === "0" || veg === "false") {
    sql += " AND m.is_veg = 0";
  }
  if (category) {
    sql += " AND m.category = ?";
    params.push(category);
  }
  if (q) {
    sql += " AND (m.name LIKE ? OR r.name LIKE ? OR m.description LIKE ?)";
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  sql += ` ORDER BY CASE m.category
    WHEN 'Starters' THEN 1
    WHEN 'Meals' THEN 2
    WHEN 'Desserts' THEN 3
    WHEN 'Drinks' THEN 4
    ELSE 5 END, m.name`;
  res.json(db.prepare(sql).all(...params));
});

app.post("/api/auth/signup", (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const phone = String(req.body.phone || "").trim();
  const hostel = String(req.body.hostel || "").trim();

  if (name.length < 2) return res.status(400).json({ error: "Enter your name." });
  if (!email.includes("@")) return res.status(400).json({ error: "Enter a valid college email." });
  if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters." });

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) return res.status(409).json({ error: "That email already has an account. Log in instead." });

  const password_hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare(
      "INSERT INTO users (name, email, password_hash, phone, hostel) VALUES (?, ?, ?, ?, ?)"
    )
    .run(name, email, password_hash, phone, hostel);

  req.session.userId = info.lastInsertRowid;
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json({ user: publicUser(user) });
});

app.post("/api/auth/login", (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Email or password is incorrect." });
  }
  req.session.userId = user.id;
  res.json({ user: publicUser(user) });
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

app.get("/api/auth/me", (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.session.userId);
  if (!user) return res.json({ user: null });
  res.json({ user: publicUser(user) });
});

app.put("/api/profile", requireAuth, (req, res) => {
  const name = String(req.body.name || "").trim();
  const phone = String(req.body.phone || "").trim();
  const hostel = String(req.body.hostel || "").trim();
  const address = String(req.body.address || "").trim();
  if (name.length < 2) return res.status(400).json({ error: "Name is required." });
  db.prepare("UPDATE users SET name = ?, phone = ?, hostel = ?, address = ? WHERE id = ?").run(
    name,
    phone,
    hostel,
    address,
    req.session.userId
  );
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.session.userId);
  res.json({ user: publicUser(user) });
});

app.get("/api/orders", requireAuth, (req, res) => {
  const orders = db
    .prepare(
      `SELECT * FROM orders WHERE user_id = ? ORDER BY datetime(created_at) DESC`
    )
    .all(req.session.userId);
  const itemStmt = db.prepare("SELECT * FROM order_items WHERE order_id = ?");
  const full = orders.map((order) => ({
    ...order,
    items: itemStmt.all(order.id),
  }));
  res.json(full);
});

app.post("/api/orders", requireAuth, (req, res) => {
  const incoming = Array.isArray(req.body.items) ? req.body.items : [];
  const note = String(req.body.note || "").trim().slice(0, 200);
  const address = String(req.body.address || "").trim();
  if (incoming.length === 0) {
    return res.status(400).json({ error: "Your cart is empty." });
  }
  if (!address) {
    return res.status(400).json({ error: "Add a delivery address first." });
  }
  db.prepare("UPDATE users SET address = ? WHERE id = ?").run(address, req.session.userId);

  const getItem = db.prepare("SELECT * FROM menu_items WHERE id = ?");
  const lines = [];
  for (const row of incoming) {
    const qty = Math.max(1, Math.min(20, Number(row.qty) || 0));
    const item = getItem.get(row.id);
    if (!item) return res.status(400).json({ error: "A dish in your cart is no longer available." });
    lines.push({ item, qty });
  }

  const total = lines.reduce((sum, line) => sum + line.item.price_inr * line.qty, 0);
  const insertOrder = db.prepare(
    "INSERT INTO orders (user_id, total_inr, status, note, address) VALUES (?, ?, ?, ?, ?)"
  );
  const insertLine = db.prepare(
    `INSERT INTO order_items (order_id, menu_item_id, name, qty, price_inr, is_veg)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  db.exec("BEGIN");
  let orderId;
  try {
    const info = insertOrder.run(req.session.userId, total, "Preparing", note, address);
    orderId = info.lastInsertRowid;
    for (const line of lines) {
      insertLine.run(
        orderId,
        line.item.id,
        line.item.name,
        line.qty,
        line.item.price_inr,
        line.item.is_veg
      );
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
  order.items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(orderId);
  res.status(201).json(order);
});

app.listen(PORT, () => {
  console.log(`NomNom.com running at http://localhost:${PORT}`);
});
