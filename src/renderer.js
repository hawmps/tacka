const { ipcRenderer } = require('electron');

let editingEntryId = null;

document.getElementById('workForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const entry = {
    task: document.getElementById('task').value,
    requestor: document.getElementById('requestor').value,
    duration: parseFloat(document.getElementById('duration').value),
    tags: document.getElementById('tags').value
  };
  
  try {
    if (editingEntryId) {
      entry.id = editingEntryId;
      await ipcRenderer.invoke('update-entry', entry);
      alert('Entry updated successfully!');
      cancelEdit();
    } else {
      await ipcRenderer.invoke('save-entry', entry);
      alert('Entry saved successfully!');
      clearForm();
      await ipcRenderer.invoke('minimize-window');
    }
  } catch (error) {
    alert('Error saving entry: ' + error.message);
  }
});

function clearForm() {
  document.getElementById('workForm').reset();
  document.getElementById('task').focus();
  editingEntryId = null;
  document.getElementById('submitBtn').textContent = 'Save Entry';
  document.getElementById('cancelEdit').style.display = 'none';
}

function cancelEdit() {
  clearForm();
}

function showTab(tabName) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
  document.getElementById(`${tabName}-tab`).classList.add('active');
  
  if (tabName === 'analytics') {
    loadAnalytics();
  } else if (tabName === 'entries') {
    loadEntries();
  }
}

async function loadAnalytics(dateRange = null) {
  try {
    const analytics = await ipcRenderer.invoke('get-analytics', dateRange);
    displayAnalytics(analytics, dateRange);
  } catch (error) {
    document.getElementById('analytics-content').innerHTML = '<p>Error loading analytics</p>';
  }
}

function displayAnalytics(analytics, dateRange) {
  const content = document.getElementById('analytics-content');
  
  let dateRangeText = '';
  if (dateRange && dateRange.startDate && dateRange.endDate) {
    const startDate = new Date(dateRange.startDate).toLocaleDateString();
    const endDate = new Date(dateRange.endDate).toLocaleDateString();
    dateRangeText = ` (${startDate} - ${endDate})`;
  }
  
  let html = `<h3>Summary${dateRangeText}</h3>`;
  html += `<div class="analytics-item"><span>Total Entries:</span><span>${analytics.totalEntries}</span></div>`;
  html += `<div class="analytics-item"><span>Total Hours:</span><span>${analytics.totalDuration.toFixed(2)}</span></div>`;
  
  if (Object.keys(analytics.byTag).length > 0) {
    html += '<h3>Time by Tag</h3>';
    Object.entries(analytics.byTag)
      .sort(([,a], [,b]) => b - a)
      .forEach(([tag, hours]) => {
        html += `<div class="analytics-item">
          <span>${tag}</span>
          <span>${hours.toFixed(2)} hours</span>
        </div>`;
      });
  }
  
  if (Object.keys(analytics.byRequestor).length > 0) {
    html += '<h3>Time by Requestor</h3>';
    Object.entries(analytics.byRequestor)
      .sort(([,a], [,b]) => b - a)
      .forEach(([requestor, hours]) => {
        html += `<div class="analytics-item">
          <span>${requestor}</span>
          <span>${hours.toFixed(2)} hours</span>
        </div>`;
      });
  }
  
  if (analytics.totalEntries === 0) {
    html += '<p>No entries found for the selected date range.</p>';
  }
  
  content.innerHTML = html;
}

async function loadEntries() {
  try {
    const entries = await ipcRenderer.invoke('get-entries');
    displayEntries(entries);
  } catch (error) {
    document.getElementById('entries-content').innerHTML = '<p>Error loading entries</p>';
  }
}

function displayEntries(entries) {
  const content = document.getElementById('entries-content');
  
  if (entries.length === 0) {
    content.innerHTML = '<p>No entries yet. Start logging your work!</p>';
    return;
  }
  
  const sortedEntries = entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  let html = '';
  sortedEntries.forEach(entry => {
    const date = new Date(entry.timestamp).toLocaleString();
    html += `
      <div class="entry-item">
        <div class="entry-header">
          <div class="entry-date">${date}</div>
          <div class="entry-actions">
            <button class="btn-small" onclick="editEntry(${entry.id})">Edit</button>
            <button class="btn-small danger" onclick="deleteEntry(${entry.id})">Delete</button>
          </div>
        </div>
        <div class="entry-details">
          <strong>${entry.task}</strong>
        </div>
        <div class="entry-meta">
          <span><strong>For:</strong> ${entry.requestor}</span>
          <span><strong>Duration:</strong> ${entry.duration} hours</span>
          ${entry.tags ? `<span><strong>Tags:</strong> ${entry.tags}</span>` : ''}
        </div>
      </div>
    `;
  });
  
  content.innerHTML = html;
}

async function editEntry(entryId) {
  try {
    const entries = await ipcRenderer.invoke('get-entries');
    const entry = entries.find(e => e.id === entryId);
    
    if (entry) {
      document.getElementById('task').value = entry.task;
      document.getElementById('requestor').value = entry.requestor;
      document.getElementById('duration').value = entry.duration;
      document.getElementById('tags').value = entry.tags || '';
      
      editingEntryId = entryId;
      document.getElementById('submitBtn').textContent = 'Update Entry';
      document.getElementById('cancelEdit').style.display = 'inline-block';
      
      showTab('log');
      document.getElementById('task').focus();
    }
  } catch (error) {
    alert('Error loading entry for editing: ' + error.message);
  }
}

async function deleteEntry(entryId) {
  if (confirm('Are you sure you want to delete this entry?')) {
    try {
      await ipcRenderer.invoke('delete-entry', entryId);
      loadEntries();
    } catch (error) {
      alert('Error deleting entry: ' + error.message);
    }
  }
}

function applyDateFilter() {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  
  if (startDate && endDate) {
    if (new Date(startDate) > new Date(endDate)) {
      alert('Start date must be before end date');
      return;
    }
    loadAnalytics({ startDate, endDate });
  } else if (startDate || endDate) {
    alert('Please select both start and end dates');
  } else {
    loadAnalytics();
  }
}

function clearDateFilter() {
  document.getElementById('startDate').value = '';
  document.getElementById('endDate').value = '';
  loadAnalytics();
}

function setDatePreset(preset) {
  const today = new Date();
  let startDate, endDate;
  
  switch (preset) {
    case 'today':
      startDate = endDate = today;
      break;
    case 'week':
      const dayOfWeek = today.getDay();
      startDate = new Date(today);
      startDate.setDate(today.getDate() - dayOfWeek);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      break;
    case 'month':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      break;
    case 'quarter':
      const quarter = Math.floor(today.getMonth() / 3);
      startDate = new Date(today.getFullYear(), quarter * 3, 1);
      endDate = new Date(today.getFullYear(), quarter * 3 + 3, 0);
      break;
    case 'year':
      startDate = new Date(today.getFullYear(), 0, 1);
      endDate = new Date(today.getFullYear(), 11, 31);
      break;
  }
  
  document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
  document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
  
  loadAnalytics({ 
    startDate: startDate.toISOString().split('T')[0], 
    endDate: endDate.toISOString().split('T')[0] 
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('task').focus();
});