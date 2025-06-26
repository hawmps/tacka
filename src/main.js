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

ipcMain.handle('get-management-data', () => {
  const entries = store.get('entries', []);
  
  // Aggregate requestors
  const requestorCounts = {};
  // Aggregate tags
  const tagCounts = {};
  
  entries.forEach(entry => {
    // Count requestors
    if (entry.requestor) {
      requestorCounts[entry.requestor] = (requestorCounts[entry.requestor] || 0) + 1;
    }
    
    // Count tags
    if (entry.tags) {
      entry.tags.split(',').forEach(tag => {
        const cleanTag = tag.trim();
        if (cleanTag) {
          tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
        }
      });
    }
  });
  
  // Convert to arrays sorted by count (descending)
  const requestors = Object.entries(requestorCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
    
  const tags = Object.entries(tagCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  
  return { requestors, tags };
});

ipcMain.handle('rename-item', (event, { type, oldName, newName }) => {
  const entries = store.get('entries', []);
  let updatedEntries = [...entries];
  
  if (type === 'requestor') {
    updatedEntries = entries.map(entry => {
      if (entry.requestor === oldName) {
        return { ...entry, requestor: newName };
      }
      return entry;
    });
  } else if (type === 'tag') {
    updatedEntries = entries.map(entry => {
      if (entry.tags) {
        const tags = entry.tags.split(',').map(tag => {
          const cleanTag = tag.trim();
          return cleanTag === oldName ? newName : cleanTag;
        });
        return { ...entry, tags: tags.join(', ') };
      }
      return entry;
    });
  }
  
  store.set('entries', updatedEntries);
  return true;
});

ipcMain.handle('merge-item', (event, { type, sourceName, targetName }) => {
  const entries = store.get('entries', []);
  let updatedEntries = [...entries];
  
  if (type === 'requestor') {
    updatedEntries = entries.map(entry => {
      if (entry.requestor === sourceName) {
        return { ...entry, requestor: targetName };
      }
      return entry;
    });
  } else if (type === 'tag') {
    updatedEntries = entries.map(entry => {
      if (entry.tags) {
        const tags = entry.tags.split(',').map(tag => {
          const cleanTag = tag.trim();
          return cleanTag === sourceName ? targetName : cleanTag;
        });
        return { ...entry, tags: tags.join(', ') };
      }
      return entry;
    });
  }
  
  store.set('entries', updatedEntries);
  return true;
});

ipcMain.handle('generate-weekly-report', async (event, { startDate, endDate }) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    
    const entries = store.get('entries', []);
    
    // Filter entries for the specified date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const weeklyEntries = entries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= start && entryDate <= end;
    });
    
    // Generate comprehensive report structure for AI analysis
    const report = {
      metadata: {
        reportType: "weekly_work_log",
        generatedAt: new Date().toISOString(),
        periodStart: start.toISOString().split('T')[0],
        periodEnd: end.toISOString().split('T')[0],
        periodDescription: `Business week ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`,
        entryCount: weeklyEntries.length,
        totalHours: weeklyEntries.reduce((sum, entry) => sum + parseFloat(entry.duration || 0), 0)
      },
      summary: {
        totalWorkHours: weeklyEntries.reduce((sum, entry) => sum + parseFloat(entry.duration || 0), 0),
        averageHoursPerDay: weeklyEntries.reduce((sum, entry) => sum + parseFloat(entry.duration || 0), 0) / 5, // Business days
        uniqueRequestors: [...new Set(weeklyEntries.map(entry => entry.requestor).filter(Boolean))],
        uniqueTags: [...new Set(weeklyEntries.flatMap(entry => 
          entry.tags ? entry.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []
        ))],
        dailyBreakdown: {}
      },
      analytics: {
        timeByRequestor: {},
        timeByTag: {},
        dailyHours: {},
        workPatterns: {
          mostProductiveDay: null,
          averageTaskDuration: 0,
          taskDistribution: {}
        }
      },
      entries: weeklyEntries.map(entry => ({
        id: entry.id,
        date: new Date(entry.timestamp).toISOString().split('T')[0],
        dayOfWeek: new Date(entry.timestamp).toLocaleDateString('en-US', { weekday: 'long' }),
        task: entry.task,
        requestor: entry.requestor,
        duration: parseFloat(entry.duration || 0),
        tags: entry.tags ? entry.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        timestamp: entry.timestamp
      })).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    };
    
    // Calculate analytics
    weeklyEntries.forEach(entry => {
      const duration = parseFloat(entry.duration || 0);
      const date = new Date(entry.timestamp).toISOString().split('T')[0];
      const dayOfWeek = new Date(entry.timestamp).toLocaleDateString('en-US', { weekday: 'long' });
      
      // Time by requestor
      if (entry.requestor) {
        report.analytics.timeByRequestor[entry.requestor] = 
          (report.analytics.timeByRequestor[entry.requestor] || 0) + duration;
      }
      
      // Time by tag
      if (entry.tags) {
        entry.tags.split(',').forEach(tag => {
          const cleanTag = tag.trim();
          if (cleanTag) {
            report.analytics.timeByTag[cleanTag] = 
              (report.analytics.timeByTag[cleanTag] || 0) + duration;
          }
        });
      }
      
      // Daily hours
      report.analytics.dailyHours[date] = (report.analytics.dailyHours[date] || 0) + duration;
      report.summary.dailyBreakdown[dayOfWeek] = (report.summary.dailyBreakdown[dayOfWeek] || 0) + duration;
    });
    
    // Find most productive day
    const dailyTotals = Object.entries(report.analytics.dailyHours);
    if (dailyTotals.length > 0) {
      const mostProductive = dailyTotals.reduce((max, [date, hours]) => 
        hours > max.hours ? { date, hours } : max, { date: null, hours: 0 });
      report.analytics.workPatterns.mostProductiveDay = {
        date: mostProductive.date,
        hours: mostProductive.hours,
        dayOfWeek: mostProductive.date ? new Date(mostProductive.date).toLocaleDateString('en-US', { weekday: 'long' }) : null
      };
    }
    
    // Calculate average task duration
    if (weeklyEntries.length > 0) {
      report.analytics.workPatterns.averageTaskDuration = 
        weeklyEntries.reduce((sum, entry) => sum + parseFloat(entry.duration || 0), 0) / weeklyEntries.length;
    }
    
    // Add AI-friendly context
    report.aiContext = {
      purpose: "This weekly work log is intended for AI analysis to provide insights on productivity, work patterns, and time allocation.",
      suggestedAnalysisAreas: [
        "Time allocation across different requestors/clients",
        "Productivity patterns by day of week",
        "Task categorization and time distribution",
        "Work-life balance indicators",
        "Efficiency trends and recommendations"
      ],
      dataQuality: {
        hasTimeTracking: weeklyEntries.length > 0,
        hasRequestorData: weeklyEntries.some(e => e.requestor),
        hasTagData: weeklyEntries.some(e => e.tags),
        completenessScore: weeklyEntries.length > 0 ? 
          (weeklyEntries.filter(e => e.task && e.requestor && e.duration).length / weeklyEntries.length) : 0
      }
    };
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `weekly-report-${report.metadata.periodStart}-to-${report.metadata.periodEnd}-${timestamp}.json`;
    const desktopPath = path.join(os.homedir(), 'Desktop', filename);
    
    // Write file to desktop
    fs.writeFileSync(desktopPath, JSON.stringify(report, null, 2));
    
    return {
      success: true,
      filename: filename,
      fullPath: desktopPath,
      entryCount: weeklyEntries.length,
      totalHours: report.metadata.totalHours,
      period: `${report.metadata.periodStart} to ${report.metadata.periodEnd}`
    };
    
  } catch (error) {
    console.error('Error generating weekly report:', error);
    return {
      success: false,
      error: error.message
    };
  }
});