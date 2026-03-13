const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "../dev.db"));

// ─── Create tables if not exist ───────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS entries (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    date       TEXT NOT NULL UNIQUE,
    revenue    REAL NOT NULL,
    notes      TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS daily_expenses (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_date TEXT NOT NULL,
    category   TEXT NOT NULL,
    amount     REAL NOT NULL,
    type       TEXT NOT NULL CHECK(type IN ('everyday', 'one-time', 'duration')),
    start_date TEXT,
    end_date   TEXT,
    notes      TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS fixed_expenses (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    category   TEXT NOT NULL,
    amount     REAL NOT NULL,
    start_date TEXT NOT NULL,
    end_date   TEXT NOT NULL,
    notes      TEXT,
    entry_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    id             INTEGER PRIMARY KEY,
    business_name  TEXT DEFAULT 'My Business',
    currency       TEXT DEFAULT 'PHP',
    corporate_tax  REAL DEFAULT 0.25,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  INSERT OR IGNORE INTO settings (id) VALUES (1);
`);

// ─── Clear everything ─────────────────────────────────
db.exec(`
  DELETE FROM daily_expenses;
  DELETE FROM entries;
  DELETE FROM fixed_expenses;
  DELETE FROM sqlite_sequence WHERE name IN ('daily_expenses', 'entries', 'fixed_expenses');
`);

const insertEntry = db.prepare(`
  INSERT OR IGNORE INTO entries (date, revenue, notes)
  VALUES (?, ?, ?)
`);

const insertDaily = db.prepare(`
  INSERT INTO daily_expenses (entry_date, category, amount, type, notes)
  VALUES (?, ?, ?, ?, ?)
`);

const insertFixed = db.prepare(`
  INSERT INTO fixed_expenses (name, category, amount, start_date, end_date, notes)
  VALUES (?, ?, ?, ?, ?, ?)
`);

// ─── Fixed / Duration expenses ────────────────────────
insertFixed.run("Store Rent",      "Rent",      18000, "2026-01-01", "2026-12-31", "Annual lease");
insertFixed.run("Internet",        "Utilities",  1800, "2026-01-01", "2026-06-30", "Fiber plan 6mo");
insertFixed.run("Security System", "Utilities",  5000, "2026-02-01", "2026-04-30", "3-month contract");

// ─── Daily entries: Jan 1 to today ───────────────────
const startDate = new Date(2026, 0, 1);
const endDate   = new Date();

const everydayExpenses = [
  { category: "Electricity", amount: 450 },
  { category: "Staff Meal",  amount: 280 },
];

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const dow = d.getDay();

  let revenue;
  if (dow === 0 || dow === 6) {
    revenue = rand(14000, 22000);
  } else {
    revenue = rand(8000, 15000);
  }
  if (Math.random() < 0.1) revenue = rand(3000, 6000);

  insertEntry.run(dateStr, revenue, null);

  for (const exp of everydayExpenses) {
    const variance = rand(-Math.floor(exp.amount * 0.1), Math.floor(exp.amount * 0.1));
    insertDaily.run(dateStr, exp.category, exp.amount + variance, "everyday", null);
  }

  if (Math.random() < 0.15) {
    insertDaily.run(dateStr, "Supplies",    rand(500, 2500),  "one-time", "Restocked supplies");
  }
  if (Math.random() < 0.08) {
    insertDaily.run(dateStr, "Maintenance", rand(800, 4000),  "one-time", "Repair/maintenance");
  }
  if (Math.random() < 0.05) {
    insertDaily.run(dateStr, "Marketing",   rand(1000, 5000), "one-time", "Ads/promo");
  }
}

console.log("✅ Reseeded with realistic data:");
console.log("   Revenue:  ₱8k–22k/day (weekends higher, ~10% slow days)");
console.log("   Everyday: Electricity ~₱450, Staff Meal ~₱280");
console.log("   One-time: Supplies 15%, Maintenance 8%, Marketing 5% chance/day");
console.log("   Fixed:    Rent ₱18k/yr, Internet ₱1.8k Jan–Jun, Security ₱5k Feb–Apr");

db.close();