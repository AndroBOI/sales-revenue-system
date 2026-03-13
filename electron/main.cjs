const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const isDev = process.env.NODE_ENV === "development";
let mainWindow = null;
let db = null;

function initDatabase() {
  const dbPath = isDev
    ? path.join(__dirname, "../dev.db")
    : path.join(app.getPath("userData"), "app.db");

  console.log("DB path:", dbPath);
  db = new Database(dbPath);

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

  console.log("Database ready");
}

function registerHandlers() {
  ipcMain.handle("db:getEntries", () => {
    return db
      .prepare(
        `
      SELECT
        e.id,
        e.date,
        e.revenue,
        e.notes,
        COALESCE(SUM(CASE WHEN d.type != 'duration' THEN d.amount ELSE 0 END), 0) AS expenses,
        e.revenue - COALESCE(SUM(CASE WHEN d.type != 'duration' THEN d.amount ELSE 0 END), 0) AS profit
      FROM entries e
      LEFT JOIN daily_expenses d ON d.entry_date = e.date
      GROUP BY e.id
      ORDER BY e.date DESC
    `,
      )
      .all();
  });

  ipcMain.handle(
    "db:saveEntry",
    (event, { date, revenue, notes, expenses }) => {
      db.prepare(
        `
    INSERT INTO entries (date, revenue, notes)
    VALUES (?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET
      revenue = excluded.revenue,
      notes   = excluded.notes
  `,
      ).run(date, revenue, notes ?? null);

      // Delete old daily expenses for this date
      db.prepare("DELETE FROM daily_expenses WHERE entry_date = ?").run(date);

      const insertDaily = db.prepare(`
    INSERT INTO daily_expenses (entry_date, category, amount, type, notes)
    VALUES (?, ?, ?, ?, ?)
  `);

      const insertFixed = db.prepare(`
    INSERT INTO fixed_expenses (name, category, amount, start_date, end_date, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

      for (const exp of expenses) {
        if (exp.type === "duration") {
          // Goes to fixed_expenses — pro-rated in analytics
          insertFixed.run(
            exp.category, // use category as name
            exp.category,
            exp.amount,
            exp.startDate,
            exp.endDate,
            exp.notes ?? null,
          );
        } else {
          // everyday + one-time go to daily_expenses
          insertDaily.run(
            date,
            exp.category,
            exp.amount,
            exp.type,
            exp.notes ?? null,
          );
        }
      }

      return { success: true };
    },
  );

  ipcMain.handle("db:deleteEntry", (event, date) => {
    db.prepare("DELETE FROM entries WHERE date = ?").run(date);
    db.prepare("DELETE FROM daily_expenses WHERE entry_date = ?").run(date);
    return { success: true };
  });

  // ─── Analytics ───────────────────────────────────
  ipcMain.handle("db:getAnalytics", () => {
    const entries = db
      .prepare(
        `
    SELECT
      e.date,
      e.revenue,
      COALESCE(SUM(d.amount), 0) AS dailyExpenses,
      e.revenue - COALESCE(SUM(d.amount), 0) AS profit
    FROM entries e
    LEFT JOIN daily_expenses d ON d.entry_date = e.date
    GROUP BY e.id
    ORDER BY e.date ASC
  `,
      )
      .all();

    const fixed = db.prepare(`SELECT * FROM fixed_expenses`).all();

    // ← ADD THIS
    const parseLocal = (str) => {
      const [y, m, d] = str.split("-").map(Number);
      return new Date(y, m - 1, d);
    };

    return entries.map((entry) => {
      let proRated = 0;

      for (const f of fixed) {
        const start = parseLocal(f.start_date);
        const end = parseLocal(f.end_date);
        const current = parseLocal(entry.date);

        if (current < start || current > end) continue;

        const totalDays = Math.round((end - start) / 86400000) + 1;
        const dailyAmount = f.amount / totalDays;
        proRated += dailyAmount;
      }

      const totalExpenses = entry.dailyExpenses + proRated;

      return {
        date: entry.date,
        revenue: entry.revenue,
        expenses: Math.round(totalExpenses),
        profit: Math.round(entry.revenue - totalExpenses),
      };
    });
  });

  ipcMain.handle("db:fixDuration", () => {
    // Move wrongly saved duration expenses to fixed_expenses
    const bad = db
      .prepare(`SELECT * FROM daily_expenses WHERE type = 'duration'`)
      .all();

    const insertFixed = db.prepare(`
    INSERT INTO fixed_expenses (name, category, amount, start_date, end_date, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

    for (const exp of bad) {
      insertFixed.run(
        exp.category,
        exp.category,
        exp.amount,
        exp.start_date ?? exp.entry_date,
        exp.end_date ?? exp.entry_date,
        exp.notes ?? null,
      );
    }

    db.prepare(`DELETE FROM daily_expenses WHERE type = 'duration'`).run();
    return { fixed: bad.length };
  });

  ipcMain.handle("db:debugDuration", () => {
    const inDaily = db
      .prepare(`SELECT * FROM daily_expenses WHERE type = 'duration'`)
      .all();
    const inFixed = db.prepare(`SELECT * FROM fixed_expenses`).all();
    return { inDaily, inFixed };
  });

  // ─── Settings ────────────────────────────────────
  ipcMain.handle("db:getSettings", () => {
    return db.prepare("SELECT * FROM settings WHERE id = 1").get();
  });

  ipcMain.handle(
    "db:saveSettings",
    (event, { business_name, currency, corporate_tax }) => {
      db.prepare(
        `
      UPDATE settings
      SET business_name = ?, currency = ?, corporate_tax = ?
      WHERE id = 1
    `,
      ).run(business_name, currency, corporate_tax);
      return { success: true };
    },
  );

  ipcMain.handle("db:getFixedExpenses", () => {
    return db
      .prepare(`SELECT * FROM fixed_expenses ORDER BY start_date DESC`)
      .all();
  });

  ipcMain.handle(
    "db:addFixedExpense",
    (event, { name, category, amount, start_date, end_date, notes }) => {
      db.prepare(
        `
    INSERT INTO fixed_expenses (name, category, amount, start_date, end_date, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
      ).run(name, category, amount, start_date, end_date, notes ?? null);
      return { success: true };
    },
  );

  ipcMain.handle("db:deleteFixedExpense", (event, id) => {
    db.prepare(`DELETE FROM fixed_expenses WHERE id = ?`).run(id);
    return { success: true };
  });
}

async function createWindow() {
  try {
    const preloadPath = path.join(__dirname, "preload.cjs");
    console.log("Preload path:", preloadPath);
    console.log("Preload exists:", fs.existsSync(preloadPath));

    initDatabase();

    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      show: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: preloadPath,
      },
    });

    registerHandlers();

    if (isDev) {
      await mainWindow.loadURL("http://localhost:5173");
    } else {
      await mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
    }

    mainWindow.on("closed", () => {
      mainWindow = null;
    });
  } catch (err) {
    console.error("❌ createWindow error:", err);
  }
}

app.whenReady().then(createWindow).catch(console.error);

app.on("window-all-closed", () => {
  if (db) db.close();
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) createWindow();
});
