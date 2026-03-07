const { contextBridge, ipcRenderer } = require("electron");

console.log("✅ Preload running");

contextBridge.exposeInMainWorld("api", {
  getNames: () => ipcRenderer.invoke("db:getNames"),
  addName: (name) => ipcRenderer.invoke("db:addName", name),
  deleteName: (id) => ipcRenderer.invoke("db:deleteName", id),
});
