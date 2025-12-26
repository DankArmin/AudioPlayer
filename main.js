import { app, BrowserWindow, ipcMain, dialog } from 'electron/main'

import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from "fs/promises";
import path from 'node:path';

import Store from 'electron-store'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const store = new Store() 

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 800,
    minHeight: 600,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      icon: path.join(__dirname, 'assets', process.platform === 'darwin' ? 'icon.icns' : 'icon.png')
    }
  })
  win.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle('store:get', (_, key) => {
  return store.get(key)
})

ipcMain.handle('store:set', (_, key, value) => {
  store.set(key, value)
})

ipcMain.handle("select-audio-folder", async () => {
    const result = await dialog.showOpenDialog({
        properties: ["openDirectory"]
    });

    if (result.canceled) return null;
    return result.filePaths[0];
});

ipcMain.handle("get-tracks", async (_, folderPath) => {
    const audioExtensions = ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.aac', '.m4b'];
    const tracks = [];
    
    async function walkDir(dirPath, folderName = null) {
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = join(dirPath, entry.name);
                
                if (entry.isDirectory()) {
                    await walkDir(fullPath, entry.name);
                } else if (entry.isFile()) {
                    const ext = extname(entry.name).toLowerCase();
                    if (audioExtensions.includes(ext)) {
                        tracks.push({
                            name: entry.name,
                            path: fullPath,
                            folder: folderName
                        });
                    }
                }
            }
        } catch (err) {
            console.error(`Error reading directory ${dirPath}:`, err);
        }
    }
    
    await walkDir(folderPath);
    return tracks;
});

ipcMain.handle("get-track", async (_, trackPath) => {
    let data = await fs.readFile(trackPath);
    return data;
});