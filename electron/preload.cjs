const { contextBridge, ipcRenderer } = require("electron");

console.log("Preload running");

contextBridge.exposeInMainWorld("api", {
  getEntries: () => ipcRenderer.invoke("db:getEntries"),
  saveEntry: (data) => ipcRenderer.invoke("db:saveEntry", data),
  deleteEntry: (date) => ipcRenderer.invoke("db:deleteEntry", date),

  getAnalytics: () => ipcRenderer.invoke("db:getAnalytics"),

  getSettings: () => ipcRenderer.invoke("db:getSettings"),
  getFixedExpenses: () => ipcRenderer.invoke("db:getFixedExpenses"),
  addFixedExpense: (data) => ipcRenderer.invoke("db:addFixedExpense", data),
  deleteFixedExpense: (id) => ipcRenderer.invoke("db:deleteFixedExpense", id),
  updateFixedExpense: (data) =>
    ipcRenderer.invoke("db:updateFixedExpense", data),
});
