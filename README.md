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
- **Advanced Search**: Search entries by task, requestor, or tags with real-time filtering
- **Date Filtering**: Filter entries by Today, Yesterday, Last 7 Days, or Last Month
- **Data Cleanup**: Manage and organize requestors and tags centrally
- **Persistent Storage**: Data is automatically saved locally using electron-store

### Analytics & Reporting
- **Time Tracking**: View total hours worked and entry counts
- **Tag Analysis**: See time breakdown by project tags
- **Requestor Analysis**: Track time spent for different clients/departments
- **Date Range Filtering**: Analyze work patterns for specific time periods
- **Preset Date Ranges**: Quick filters for Today, This Week, This Month, This Quarter, This Year
- **Visual Charts**: Toggle between table and column chart views for analytics
- **Weekly Reports**: Generate AI-optimized JSON reports for external analysis

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
2. **Search and Filter**:
   - Use the search box to find entries by task, requestor, or tags
   - Filter by date using buttons: All, Today, Yesterday, Last 7 Days, Last Month
   - Combine search text with date filters for precise results
3. **Entry Actions**:
   - Use "Edit" button to modify any entry
   - Use "Delete" button to remove entries (with confirmation)
   - All changes update search results automatically

### Analytics
1. Click the "Analytics" tab to view your work patterns
2. **Date Range Filtering**:
   - **Custom Range**: Select specific start and end dates
   - **Preset Ranges**: Click buttons for common time periods
   - **Clear Filter**: Remove date restrictions to view all data
3. **View Options**:
   - **Table View**: Traditional list format with detailed breakdowns
   - **Chart View**: Interactive column charts with hover effects
   - Toggle between views using the View buttons
4. **Data Analysis**:
   - Total entries and hours worked
   - Time spent per tag (sorted by usage)
   - Time spent per requestor (sorted by usage)
   - Visual charts show proportional time allocation

### Data Management
1. Click the "Manage" tab for data cleanup and organization
2. **Requestor Management**:
   - View all requestors with entry counts
   - Rename requestors across all entries
   - Merge duplicate requestors into one
3. **Tag Management**:
   - View all tags with usage statistics
   - Rename tags globally
   - Merge similar tags to keep data clean
4. **Weekly Reports**:
   - Generate comprehensive JSON reports for current business week
   - Copy reports to clipboard for AI analysis
   - Reports include metadata, analytics, and detailed entry data

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

### Advanced Search & Filtering
- **Real-time Search**: Results update as you type
- **Multi-field Search**: Searches task descriptions, requestors, and tags simultaneously
- **Date Filters**: Combine text search with date-based filtering
- **Smart Results**: Shows "X of Y entries" counter during searches
- **Persistent Filters**: Maintains search state during entry operations

### Visual Analytics
- **Table View**: Clean, organized data lists with usage statistics
- **Chart View**: Interactive column charts with gradient styling
- **Hover Effects**: Charts respond to mouse interaction with scaling and color changes
- **Proportional Display**: Bar heights represent relative time allocation
- **Instant Switching**: Toggle between views without losing data context

### Data Management & Cleanup
- **Centralized Control**: Manage all requestors and tags from one interface
- **Usage Statistics**: See how many entries use each requestor/tag
- **Safe Operations**: Confirmation dialogs prevent accidental data loss
- **Global Updates**: Changes propagate across all tabs and views
- **Merge Functionality**: Combine duplicate entries intelligently

### AI-Optimized Reporting
- **Comprehensive Structure**: Metadata, summary, analytics, and raw data
- **Business Context**: Automatic business week calculation (Monday-Friday)
- **Quality Scoring**: Data completeness metrics for AI analysis
- **Suggested Analysis**: Guidance on productivity insights and patterns
- **Copy-Paste Ready**: One-click clipboard export for AI tools

## Tips for Effective Use

1. **Consistent Tagging**: Use consistent tag names for better analytics
2. **Regular Logging**: Log work frequently for accurate time tracking
3. **Descriptive Tasks**: Write clear task descriptions for future reference
4. **Use Requestor Field**: Track client/project work for billing and reporting
5. **Review Analytics**: Regularly check time breakdowns to understand work patterns
6. **Data Cleanup**: Use the Manage tab to merge duplicate tags and requestors
7. **Search Effectively**: Combine text search with date filters for precise results
8. **Weekly Reviews**: Generate weekly reports for productivity analysis
9. **Visual Insights**: Switch to chart view to quickly identify time allocation patterns
10. **Backup Strategy**: Consider exporting weekly reports as backup documentation

## Support

This is a standalone application. All data is stored locally on your machine. For technical issues, check that:
- Node.js and npm are properly installed
- All dependencies were installed successfully
- The app has permission to register global keyboard shortcuts

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*Tracka - Simple, effective work logging for busy professionals*