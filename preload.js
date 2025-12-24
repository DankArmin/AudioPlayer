const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('store', {
  get: (key) => ipcRenderer.invoke('store:get', key),
  set: (key, value) => ipcRenderer.invoke('store:set', key, value)
});

contextBridge.exposeInMainWorld("electronAPI", {
    selectAudioFolder: () => ipcRenderer.invoke("select-audio-folder"),
    getTracks: (folderPath) => ipcRenderer.invoke("get-tracks", folderPath),
    getTrack: (trackPath) => ipcRenderer.invoke("get-track", trackPath)
});