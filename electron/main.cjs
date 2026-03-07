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

  console.log("📦 DB path:", dbPath);
  db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS names (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );
  `);

  console.log("✅ Database ready");
}

function registerHandlers() {
  ipcMain.handle("db:getNames", () => {
    return db.prepare("SELECT * FROM names ORDER BY id DESC").all();
  });

  ipcMain.handle("db:addName", (event, name) => {
    const result = db.prepare("INSERT INTO names (name) VALUES (?)").run(name);
    return { id: result.lastInsertRowid, name };
  });

  ipcMain.handle("db:deleteName", (event, id) => {
    db.prepare("DELETE FROM names WHERE id = ?").run(id);
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
      width: 800,
      height: 600,
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
