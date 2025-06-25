# Tracka - Simple Work Logger

A lightweight desktop application for tracking work activities with global keyboard shortcuts. Built with Electron for cross-platform compatibility.

## Features

### Core Functionality
- **Quick Entry Logging**: Log work activities with task description, requestor, duration, and tags
- **Global Keyboard Shortcut**: Access the app instantly with `Cmd+Shift+T` (Mac) or `Ctrl+Shift+T` (Windows/Linux)
- **Auto-minimize**: Window automatically hides after saving entries for seamless workflow integration
- **Always on Top**: Window stays on top when visible for easy access

### Data Management
- **View All Entries**: Browse all logged work entries with timestamps
- **Edit Entries**: Modify any previously logged entry
- **Delete Entries**: Remove entries with confirmation
- **Persistent Storage**: Data is automatically saved locally using electron-store

### Analytics & Reporting
- **Time Tracking**: View total hours worked and entry counts
- **Tag Analysis**: See time breakdown by project tags
- **Requestor Analysis**: Track time spent for different clients/departments
- **Date Range Filtering**: Analyze work patterns for specific time periods
- **Preset Date Ranges**: Quick filters for Today, This Week, This Month, This Quarter, This Year

## Installation

### Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Setup
1. Clone or download the project
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application
```bash
npm start
```

The app will launch and be accessible via the global keyboard shortcut.

## Usage

### Logging Work
1. Press `Cmd+Shift+T` (Mac) or `Ctrl+Shift+T` (Windows/Linux) to open the app
2. Fill out the form:
   - **What did you do?**: Describe the work completed
   - **Who did you do it for?**: Client, project, or department name
   - **How long did it take?**: Duration in hours (supports decimals like 1.5)
   - **Tags**: Comma-separated tags for categorization (optional)
3. Click "Save Entry"
4. The app automatically minimizes after saving

### Managing Entries
1. Open the app and click the "Entries" tab
2. View all your logged work entries sorted by date
3. Use "Edit" button to modify any entry
4. Use "Delete" button to remove entries (with confirmation)

### Analytics
1. Click the "Analytics" tab to view your work patterns
2. Use date range filters:
   - **Custom Range**: Select specific start and end dates
   - **Preset Ranges**: Click buttons for common time periods
   - **Clear Filter**: Remove date restrictions to view all data
3. View breakdowns by:
   - Total entries and hours
   - Time spent per tag
   - Time spent per requestor

### Keyboard Shortcuts
- `Cmd+Shift+T` (Mac) or `Ctrl+Shift+T` (Windows/Linux): Toggle app visibility
- Window automatically hides when it loses focus

## Data Storage

All data is stored locally on your machine using electron-store. The data includes:
- Work entry details (task, requestor, duration, tags)
- Automatic timestamps for each entry
- Persistent storage across app sessions

## Technical Details

### Built With
- **Electron**: Cross-platform desktop app framework
- **HTML/CSS/JavaScript**: Frontend interface
- **electron-store**: Local data persistence

### Project Structure
```
tracka/
├── src/
│   ├── main.js          # Electron main process
│   ├── index.html       # Application UI
│   └── renderer.js      # Frontend logic
├── package.json         # Dependencies and scripts
└── README.md           # This file
```

### Development
- `npm start`: Run the application
- `npm run dev`: Run in development mode
- `npm run build`: Build for distribution (requires electron-builder setup)

## Features in Detail

### Auto-minimize Behavior
- New entries: Window hides after successful save
- Entry updates: Window remains open for continued editing
- Manual control: Use keyboard shortcut to show/hide anytime

### Date Range Analytics
- Filter analytics by any date range
- Preset options for common time periods
- Visual indication of active date filters
- Smart validation prevents invalid date ranges

### Entry Management
- Chronological listing with newest entries first
- Complete entry details with metadata
- In-place editing with form pre-population
- Confirmation dialogs for destructive actions

## Tips for Effective Use

1. **Consistent Tagging**: Use consistent tag names for better analytics
2. **Regular Logging**: Log work frequently for accurate time tracking
3. **Descriptive Tasks**: Write clear task descriptions for future reference
4. **Use Requestor Field**: Track client/project work for billing and reporting
5. **Review Analytics**: Regularly check time breakdowns to understand work patterns

## Support

This is a standalone application. All data is stored locally on your machine. For technical issues, check that:
- Node.js and npm are properly installed
- All dependencies were installed successfully
- The app has permission to register global keyboard shortcuts

---

*Tracka - Simple, effective work logging for busy professionals*