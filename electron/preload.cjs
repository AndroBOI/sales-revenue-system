const { contextBridge, ipcRenderer } = require("electron");

console.log("✅ Preload running");

contextBridge.exposeInMainWorld("api", {
  // Entries
  getEntries: () => ipcRenderer.invoke("db:getEntries"),
  saveEntry: (data) => ipcRenderer.invoke("db:saveEntry", data),
  deleteEntry: (date) => ipcRenderer.invoke("db:deleteEntry", date),

  // Analytics
  getAnalytics: () => ipcRenderer.invoke("db:getAnalytics"),

  // Settings
  getSettings: () => ipcRenderer.invoke("db:getSettings"),
  saveSettings: (data) => ipcRenderer.invoke("db:saveSettings", data),
  debugGetDurationExpenses: () => ipcRenderer.invoke("db:debugDuration"),
  fixDuration: () => ipcRenderer.invoke("db:fixDuration"),
});
