const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 500,
    show: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('src/index.html');
  
  mainWindow.on('blur', () => {
    mainWindow.hide();
  });
}

app.whenReady().then(() => {
  createWindow();

  globalShortcut.register('CommandOrControl+Shift+T', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

ipcMain.handle('save-entry', (event, entry) => {
  const entries = store.get('entries', []);
  const newEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
    id: Date.now()
  };
  entries.push(newEntry);
  store.set('entries', entries);
  return newEntry;
});

ipcMain.handle('get-entries', () => {
  return store.get('entries', []);
});

ipcMain.handle('get-analytics', (event, dateRange) => {
  let entries = store.get('entries', []);
  
  if (dateRange && dateRange.startDate && dateRange.endDate) {
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    endDate.setHours(23, 59, 59, 999);
    
    entries = entries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= startDate && entryDate <= endDate;
    });
  }
  
  const byTag = {};
  const byRequestor = {};
  let totalDuration = 0;
  
  entries.forEach(entry => {
    totalDuration += parseFloat(entry.duration || 0);
    
    if (entry.tags) {
      entry.tags.split(',').forEach(tag => {
        const cleanTag = tag.trim();
        if (cleanTag) {
          byTag[cleanTag] = (byTag[cleanTag] || 0) + parseFloat(entry.duration || 0);
        }
      });
    }
    
    if (entry.requestor) {
      byRequestor[entry.requestor] = (byRequestor[entry.requestor] || 0) + parseFloat(entry.duration || 0);
    }
  });
  
  return { byTag, byRequestor, totalEntries: entries.length, totalDuration };
});

ipcMain.handle('update-entry', (event, updatedEntry) => {
  const entries = store.get('entries', []);
  const index = entries.findIndex(entry => entry.id === updatedEntry.id);
  
  if (index !== -1) {
    entries[index] = {
      ...updatedEntry,
      timestamp: entries[index].timestamp
    };
    store.set('entries', entries);
    return entries[index];
  }
  
  throw new Error('Entry not found');
});

ipcMain.handle('delete-entry', (event, entryId) => {
  const entries = store.get('entries', []);
  const filteredEntries = entries.filter(entry => entry.id !== entryId);
  store.set('entries', filteredEntries);
  return true;
});

ipcMain.handle('minimize-window', () => {
  if (mainWindow) {
    mainWindow.hide();
  }
});