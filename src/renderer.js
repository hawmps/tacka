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
  } else if (tabName === 'manage') {
    loadManagementData();
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
  
  if (currentAnalyticsView === 'table') {
    displayAnalyticsTable(analytics, dateRangeText, content);
  } else {
    displayAnalyticsChart(analytics, dateRangeText, content);
  }
}

function displayAnalyticsTable(analytics, dateRangeText, content) {
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

function displayAnalyticsChart(analytics, dateRangeText, content) {
  let html = `<h3>Summary${dateRangeText}</h3>`;
  html += `<div class="analytics-item"><span>Total Entries:</span><span>${analytics.totalEntries}</span></div>`;
  html += `<div class="analytics-item"><span>Total Hours:</span><span>${analytics.totalDuration.toFixed(2)}</span></div>`;
  
  if (analytics.totalEntries === 0) {
    html += '<p>No entries found for the selected date range.</p>';
    content.innerHTML = html;
    return;
  }
  
  // Time by Tag Chart
  if (Object.keys(analytics.byTag).length > 0) {
    html += '<div class="chart-section">';
    html += '<div class="chart-title">Time by Tag</div>';
    html += '<div class="chart-container">';
    html += '<div class="chart">';
    
    const tagEntries = Object.entries(analytics.byTag).sort(([,a], [,b]) => b - a);
    const maxTagHours = Math.max(...tagEntries.map(([,hours]) => hours));
    
    tagEntries.forEach(([tag, hours]) => {
      const height = Math.max((hours / maxTagHours) * 250, 4);
      html += `<div class="chart-bar">
        <div class="chart-bar-fill" style="height: ${height}px;">
          <div class="chart-value">${hours.toFixed(1)}h</div>
        </div>
        <div class="chart-label">${tag}</div>
      </div>`;
    });
    
    html += '</div></div></div>';
  }
  
  // Time by Requestor Chart
  if (Object.keys(analytics.byRequestor).length > 0) {
    html += '<div class="chart-section">';
    html += '<div class="chart-title">Time by Requestor</div>';
    html += '<div class="chart-container">';
    html += '<div class="chart">';
    
    const requestorEntries = Object.entries(analytics.byRequestor).sort(([,a], [,b]) => b - a);
    const maxRequestorHours = Math.max(...requestorEntries.map(([,hours]) => hours));
    
    requestorEntries.forEach(([requestor, hours]) => {
      const height = Math.max((hours / maxRequestorHours) * 250, 4);
      html += `<div class="chart-bar">
        <div class="chart-bar-fill" style="height: ${height}px;">
          <div class="chart-value">${hours.toFixed(1)}h</div>
        </div>
        <div class="chart-label">${requestor}</div>
      </div>`;
    });
    
    html += '</div></div></div>';
  }
  
  content.innerHTML = html;
}

async function loadManagementData() {
  try {
    const management = await ipcRenderer.invoke('get-management-data');
    displayRequestors(management.requestors);
    displayTags(management.tags);
  } catch (error) {
    console.error('Error loading management data:', error);
    document.getElementById('requestors-list').innerHTML = '<p>Error loading requestors</p>';
    document.getElementById('tags-list').innerHTML = '<p>Error loading tags</p>';
  }
}

function displayRequestors(requestors) {
  const container = document.getElementById('requestors-list');
  
  if (requestors.length === 0) {
    container.innerHTML = '<p>No requestors found</p>';
    return;
  }
  
  let html = '';
  requestors.forEach(requestor => {
    html += `
      <div class="management-item" data-type="requestor" data-name="${requestor.name}">
        <div class="management-item-info">
          <div class="management-item-name">${requestor.name}</div>
          <div class="management-item-count">${requestor.count} entries</div>
        </div>
        <div class="management-actions">
          <button class="management-btn rename" onclick="renameItem('requestor', '${requestor.name}')">Rename</button>
          <button class="management-btn merge" onclick="showMergeForm('requestor', '${requestor.name}')">Merge</button>
        </div>
        <div class="merge-form" id="merge-form-requestor-${requestor.name.replace(/[^a-zA-Z0-9]/g, '_')}">
          <label>Merge "${requestor.name}" into:</label>
          <select id="merge-target-requestor-${requestor.name.replace(/[^a-zA-Z0-9]/g, '_')}">
            ${requestors.filter(r => r.name !== requestor.name).map(r => `<option value="${r.name}">${r.name}</option>`).join('')}
          </select>
          <div class="merge-form-actions">
            <button class="management-btn merge" onclick="mergeItem('requestor', '${requestor.name}')">Confirm Merge</button>
            <button class="management-btn secondary" onclick="hideMergeForm('requestor', '${requestor.name}')">Cancel</button>
          </div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

function displayTags(tags) {
  const container = document.getElementById('tags-list');
  
  if (tags.length === 0) {
    container.innerHTML = '<p>No tags found</p>';
    return;
  }
  
  let html = '';
  tags.forEach(tag => {
    html += `
      <div class="management-item" data-type="tag" data-name="${tag.name}">
        <div class="management-item-info">
          <div class="management-item-name">${tag.name}</div>
          <div class="management-item-count">${tag.count} entries</div>
        </div>
        <div class="management-actions">
          <button class="management-btn rename" onclick="renameItem('tag', '${tag.name}')">Rename</button>
          <button class="management-btn merge" onclick="showMergeForm('tag', '${tag.name}')">Merge</button>
        </div>
        <div class="merge-form" id="merge-form-tag-${tag.name.replace(/[^a-zA-Z0-9]/g, '_')}">
          <label>Merge "${tag.name}" into:</label>
          <select id="merge-target-tag-${tag.name.replace(/[^a-zA-Z0-9]/g, '_')}">
            ${tags.filter(t => t.name !== tag.name).map(t => `<option value="${t.name}">${t.name}</option>`).join('')}
          </select>
          <div class="merge-form-actions">
            <button class="management-btn merge" onclick="mergeItem('tag', '${tag.name}')">Confirm Merge</button>
            <button class="management-btn secondary" onclick="hideMergeForm('tag', '${tag.name}')">Cancel</button>
          </div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

async function renameItem(type, oldName) {
  const newName = prompt(`Enter new name for ${type} "${oldName}":`, oldName);
  
  if (newName && newName.trim() && newName !== oldName) {
    try {
      await ipcRenderer.invoke('rename-item', { type, oldName, newName: newName.trim() });
      loadManagementData();
      
      // Refresh other tabs if they're showing data
      if (document.getElementById('entries-tab').classList.contains('active')) {
        loadEntries();
      }
      if (document.getElementById('analytics-tab').classList.contains('active')) {
        loadAnalytics();
      }
    } catch (error) {
      alert(`Error renaming ${type}: ${error.message}`);
    }
  }
}

function showMergeForm(type, name) {
  const formId = `merge-form-${type}-${name.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const form = document.getElementById(formId);
  if (form) {
    form.classList.add('active');
  }
}

function hideMergeForm(type, name) {
  const formId = `merge-form-${type}-${name.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const form = document.getElementById(formId);
  if (form) {
    form.classList.remove('active');
  }
}

async function mergeItem(type, sourceName) {
  const targetSelectId = `merge-target-${type}-${sourceName.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const targetSelect = document.getElementById(targetSelectId);
  const targetName = targetSelect.value;
  
  if (!targetName) {
    alert('Please select a target to merge into');
    return;
  }
  
  if (confirm(`Are you sure you want to merge "${sourceName}" into "${targetName}"? This cannot be undone.`)) {
    try {
      await ipcRenderer.invoke('merge-item', { type, sourceName, targetName });
      loadManagementData();
      
      // Refresh other tabs if they're showing data
      if (document.getElementById('entries-tab').classList.contains('active')) {
        loadEntries();
      }
      if (document.getElementById('analytics-tab').classList.contains('active')) {
        loadAnalytics();
      }
    } catch (error) {
      alert(`Error merging ${type}: ${error.message}`);
    }
  }
}

let allEntries = [];
let currentDateFilter = 'all';
let currentAnalyticsView = 'table';

async function loadEntries() {
  try {
    allEntries = await ipcRenderer.invoke('get-entries');
    displayEntries(allEntries);
    updateSearchResults(allEntries.length, allEntries.length);
  } catch (error) {
    document.getElementById('entries-content').innerHTML = '<p>Error loading entries</p>';
  }
}

function displayEntries(entries) {
  const content = document.getElementById('entries-content');
  
  if (entries.length === 0) {
    const searchTerm = document.getElementById('searchInput').value;
    if (searchTerm) {
      content.innerHTML = '<p>No entries match your search.</p>';
    } else {
      content.innerHTML = '<p>No entries yet. Start logging your work!</p>';
    }
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

function filterEntriesByDate(entries, dateFilter) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (dateFilter) {
    case 'today':
      return entries.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        const entryDay = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());
        return entryDay.getTime() === today.getTime();
      });
    
    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return entries.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        const entryDay = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());
        return entryDay.getTime() === yesterday.getTime();
      });
    
    case 'last7days':
      const last7Days = new Date(today);
      last7Days.setDate(last7Days.getDate() - 7);
      return entries.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        return entryDate >= last7Days;
      });
    
    case 'lastmonth':
      const lastMonth = new Date(today);
      lastMonth.setDate(lastMonth.getDate() - 30);
      return entries.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        return entryDate >= lastMonth;
      });
    
    case 'all':
    default:
      return entries;
  }
}

function searchEntries(searchTerm) {
  let filteredEntries = filterEntriesByDate(allEntries, currentDateFilter);
  
  if (searchTerm && searchTerm.trim()) {
    const searchLower = searchTerm.toLowerCase();
    filteredEntries = filteredEntries.filter(entry => {
      const taskMatch = entry.task.toLowerCase().includes(searchLower);
      const requestorMatch = entry.requestor.toLowerCase().includes(searchLower);
      const tagsMatch = entry.tags && entry.tags.toLowerCase().includes(searchLower);
      
      return taskMatch || requestorMatch || tagsMatch;
    });
  }
  
  displayEntries(filteredEntries);
  updateSearchResults(filteredEntries.length, allEntries.length);
}

function updateSearchResults(shown, total) {
  const resultsDiv = document.getElementById('searchResults');
  const searchTerm = document.getElementById('searchInput').value;
  
  if (searchTerm.trim()) {
    resultsDiv.textContent = `Showing ${shown} of ${total} entries`;
  } else {
    resultsDiv.textContent = '';
  }
}

async function deleteEntry(entryId) {
  if (confirm('Are you sure you want to delete this entry?')) {
    try {
      await ipcRenderer.invoke('delete-entry', entryId);
      await loadEntries();
      
      // Re-apply search if there's a search term
      const searchTerm = document.getElementById('searchInput').value;
      if (searchTerm.trim()) {
        searchEntries(searchTerm);
      }
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
  
  // Add search functionality
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchEntries(e.target.value);
    });
  }
  
  // Add date filter functionality
  const dateFilterButtons = document.querySelectorAll('.date-filter-btn');
  dateFilterButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      // Remove active class from all buttons
      dateFilterButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked button
      e.target.classList.add('active');
      
      // Update current filter
      currentDateFilter = e.target.getAttribute('data-filter');
      
      // Re-apply search with new date filter
      const searchTerm = document.getElementById('searchInput').value;
      searchEntries(searchTerm);
    });
  });
  
  // Set default active button
  const defaultButton = document.querySelector('.date-filter-btn[data-filter="all"]');
  if (defaultButton) {
    defaultButton.classList.add('active');
  }
  
  // Add view toggle functionality for Analytics
  const viewToggleButtons = document.querySelectorAll('.view-toggle-btn');
  viewToggleButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      // Remove active class from all buttons
      viewToggleButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked button
      e.target.classList.add('active');
      
      // Update current view
      currentAnalyticsView = e.target.getAttribute('data-view');
      
      // Re-render analytics with new view
      if (document.getElementById('analytics-tab').classList.contains('active')) {
        loadAnalytics();
      }
    });
  });
});