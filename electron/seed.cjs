const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "../dev.db"));

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

const insertFixed = db.prepare(`
  INSERT INTO fixed_expenses (name, category, amount, start_date, end_date, notes)
  VALUES (?, ?, ?, ?, ?, ?)
`);

// ─── Duration expense ONLY: Jan 1 to Feb 1 ───────────
insertFixed.run("Rent", "Rent", 30000, "2026-01-01", "2026-02-01", "Monthly rent");

// ─── Daily entries: Jan 1 to today, revenue = 10000 flat ──
const startDate = new Date(2026, 0, 1);
const endDate   = new Date();

for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  insertEntry.run(dateStr, 10000, null); // flat 10000 so easy to verify
}

console.log("✅ Seeded: flat ₱10,000 revenue every day, rent ₱30,000 Jan 1 – Feb 1");
console.log("Expected: expenses = ₱938/day Jan 1–Feb 1, ₱0 after Feb 1");
db.close();