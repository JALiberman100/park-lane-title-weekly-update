# Park Lane Title - Weekly Update System

A professional weekly business unit update system for tracking projects, tasks, and notes.

## Features

### 📊 Project Tracker
- Interactive table with 6 business functions
- Editable cells for Description and Details
- Status dropdown (Not Started, In Progress, At Risk, Complete)
- Date picker for due dates
- Professional styling with alternating row colors

### ✅ Weekly Checklist
- Dynamic task management (add/remove tasks)
- Department categorization (VP/GM Hiring, Revenue Forecast, Technology, Finance, Insurance, Bonding, Legal, Other)
- Priority levels (High, Medium, Low) with color coding
- Due date tracking
- Optional notes for each task
- Filter by department or priority
- Sort by due date
- Progress tracking with visual progress bar

### 📋 Underwriter Appointment Checklist
- Simple checklist for tracking appointment items
- Checkbox completion tracking
- Auto-fill date completed when checked
- Add/remove items dynamically

### 📝 Additional Notes
- Rich text area for free-form notes
- Formatting toolbar (bold, italic, bullet lists, numbered lists)
- Perfect for meeting summaries, key decisions, etc.

### 📅 Previous Week Reference
- Automatically loads last week's checklist
- View completion statistics
- One-click copy of uncompleted tasks to current week
- Collapsible panel to save space

### 💾 Save & Archive
- Save updates as JSON (for data) and HTML (for viewing)
- Files automatically named with date: `park-lane-update-YYYY-MM-DD`
- Auto-save to browser storage every 2 minutes
- Archive page to view all past updates
- Search and filter archived updates

## Getting Started

### Setup

1. Open `index.html` in a web browser
2. The system will automatically:
   - Set the current week date
   - Load any previous week's data (if available)
   - Initialize empty checklists

### Using the System

#### Starting a New Week

1. Click **"New Week"** button
2. Confirm to save current week and start fresh
3. Previous week's checklist will appear in the reference panel
4. Click **"Copy Uncompleted Items"** to carry over tasks

#### Adding Tasks

1. Click **"+ Add New Task"** in the Weekly Checklist section
2. Fill in:
   - Task description
   - Department/Category
   - Priority level
   - Due date (optional)
3. Click "Notes" to add additional details

#### Updating Project Tracker

1. Click any cell in the Description or Details columns to edit
2. Select status from dropdown
3. Choose due date using date picker
4. Changes save automatically when you click away

#### Saving Your Update

1. Click **"Save Update"** button
2. Two files will download:
   - `park-lane-update-YYYY-MM-DD.json` - Data file
   - `park-lane-update-YYYY-MM-DD.html` - Viewable file
3. Move these files to the `archive/` folder for long-term storage
4. The system also auto-saves to browser storage every 2 minutes

#### Viewing Archives

1. Click **"Weekly Updates Archive"** in the sidebar
2. Browse all saved updates
3. Use search box to find specific keywords
4. Filter by:
   - Date range (Last Week, Month, Quarter)
   - Completion status (High, Medium, Low)
5. Click any card to view full update in new window

## File Structure

```
Park Lane Title_Weekly Update/
├── index.html          # Main application
├── archive.html        # Archive page
├── styles.css          # All styling
├── app.js              # Main application logic
├── archive.js          # Archive page logic
├── archive/            # Folder for saved updates
└── README.md           # This file
```

## Technical Details

### Data Storage

- **Browser Storage (localStorage)**: Used for auto-save and quick access
- **JSON Files**: Exportable data format for each week's update
- **HTML Files**: Standalone viewable versions of each update

### Browser Compatibility

- Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- Responsive design works on desktop, tablet, and mobile

### Customization

All styling uses CSS variables defined in `styles.css`:
- `--navy`: Primary color (#1e3a8a)
- `--gray-light`: Background color (#f3f4f6)
- Adjust these variables to customize the color scheme

## Tips & Best Practices

1. **Start Each Week Fresh**: Use "New Week" every Monday to maintain clean organization
2. **Copy Uncompleted Tasks**: Review last week's checklist and copy over unfinished items
3. **Set Priorities**: Use priority levels to focus on what matters most
4. **Use Notes**: Add context in task notes or the Additional Notes section
5. **Regular Saves**: While auto-save works, manually save before closing to ensure data is captured
6. **Archive Organization**: Keep the archive folder organized by moving downloaded files there

## Troubleshooting

### Data Not Loading
- Check browser console for errors
- Ensure JavaScript is enabled
- Try refreshing the page

### Files Not Downloading
- Check browser download settings
- Ensure pop-ups aren't blocked
- Try a different browser

### Previous Week Not Showing
- Make sure you've saved at least one previous week
- Check that files are in the `archive/` folder
- The system looks for files matching: `park-lane-update-YYYY-MM-DD.json`

## Support

For issues or questions, check:
1. Browser console for error messages
2. That all files are in the same directory
3. That the `archive/` folder exists

---

**Version:** 1.0  
**Last Updated:** January 2026
