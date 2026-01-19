// ============================================
// Park Lane Title - Weekly Update Application
// ============================================

// Application State
const appState = {
    currentWeekDate: null,
    projectData: {},
    checklistItems: [],
    underwriterChecklist: [],
    noteBlocks: [], // Array of note blocks: [{id, content, contributor, createdAt, isClosed}]
    lastSaveTime: null,
    autoSaveInterval: null
};

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Set current week date
    const today = new Date();
    const weekStart = getWeekStart(today);
    appState.currentWeekDate = formatDate(weekStart);
    document.getElementById('weekDate').textContent = appState.currentWeekDate;

    // Initialize event listeners
    setupEventListeners();
    
    // Save HTML defaults to state first (preserve what's in the HTML)
    saveProjectTableData();
    
    // Removed: loadPreviousWeekData - no longer using "Last Week's Checklist" panel
    
    // Load any existing data for this week (only if it has content)
    loadCurrentWeekData();
    
    // Start auto-save
    startAutoSave();
    
    // Initialize checklists only if they're empty after loading
    // Don't override loaded data by adding default items
    if (appState.checklistItems.length === 0) {
        // Add one default task as example
        addNewTask();
    }
    // Only add default underwriter item if checklist is truly empty after loading
    // This prevents overwriting loaded items - check happens after loadCurrentWeekData()
    if (appState.underwriterChecklist.length === 0) {
        // Add one default item as example
        addUnderwriterItem();
    }
}

// ============================================
// Date Utilities
// ============================================

function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    return new Date(d.setDate(diff));
}

function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateString) {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function getPreviousWeekDate(currentDateString) {
    const current = new Date(currentDateString);
    const previous = new Date(current);
    previous.setDate(previous.getDate() - 7);
    return formatDate(previous);
}

// ============================================
// Event Listeners Setup
// ============================================

function setupEventListeners() {
    // Sidebar toggle
    document.getElementById('sidebarToggle').addEventListener('click', toggleSidebar);
    
    // Save button
    document.getElementById('saveBtn').addEventListener('click', saveUpdate);
    
    // New week button
    document.getElementById('newWeekBtn').addEventListener('click', startNewWeek);
    
    // Project table - make cells editable and save changes
    setupProjectTableListeners();
    
    // Checklist buttons
    document.getElementById('addTaskBtn').addEventListener('click', addNewTask);
    document.getElementById('addUnderwriterItemBtn').addEventListener('click', addUnderwriterItem);
    
    // Checklist filters
    document.getElementById('filterDepartment').addEventListener('change', filterChecklist);
    document.getElementById('filterPriority').addEventListener('change', filterChecklist);
    document.getElementById('sortByDateBtn').addEventListener('click', sortChecklistByDate);
    
    // Archive dropdown
    document.getElementById('archiveDropdown').addEventListener('change', loadArchiveWeek);
    
    // Notes - add new note block
    document.getElementById('addNoteBlockBtn').addEventListener('click', addNewNoteBlock);
}

function setupProjectTableListeners() {
    const table = document.getElementById('projectTable');
    
    // Save data when editable cells are changed
    table.querySelectorAll('.editable').forEach(cell => {
        cell.addEventListener('blur', function() {
            saveProjectTableData();
        });
    });
    
    // Save data when dropdowns or date inputs change
    table.querySelectorAll('.status-dropdown, .date-input').forEach(input => {
        input.addEventListener('change', function() {
            saveProjectTableData();
        });
    });
}

// ============================================
// Note Blocks Management
// ============================================

function addNewNoteBlock() {
    const noteId = Date.now();
    const newNote = {
        id: noteId,
        content: '',
        contributor: 'Jake Liberman',
        createdAt: new Date().toISOString(),
        isClosed: false
    };
    
    appState.noteBlocks.push(newNote);
    renderNoteBlocks();
    saveNotesToLocalStorage();
}

function renderNoteBlocks() {
    const container = document.getElementById('notesContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!appState.noteBlocks || appState.noteBlocks.length === 0) {
        return;
    }
    
    appState.noteBlocks.forEach(note => {
        const noteBlock = createNoteBlockElement(note);
        container.appendChild(noteBlock);
    });
}

function createNoteBlockElement(note) {
    const noteDiv = document.createElement('div');
    noteDiv.className = `note-block ${note.isClosed ? 'closed' : ''}`;
    noteDiv.dataset.id = note.id;
    
    const contributorColor = note.contributor === 'Jake Liberman' ? '#3B82F6' : '#9333ea';
    const dateStr = new Date(note.createdAt).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
    
    noteDiv.innerHTML = `
        <div class="note-header">
            <div class="note-meta">
                <select class="note-contributor-select">
                    <option value="Jake Liberman" ${note.contributor === 'Jake Liberman' ? 'selected' : ''}>Jake Liberman</option>
                    <option value="Dan Krantz" ${note.contributor === 'Dan Krantz' ? 'selected' : ''}>Dan Krantz</option>
                </select>
                <span class="note-date">${dateStr}</span>
            </div>
            <div class="note-actions">
                <button class="btn-icon btn-close-note" title="${note.isClosed ? 'Reopen' : 'Close'} note">${note.isClosed ? '↻' : '✓'}</button>
                <button class="btn-icon btn-delete-note" title="Delete note">×</button>
            </div>
        </div>
        <div class="note-content-wrapper">
            <textarea class="note-textarea" placeholder="Add your notes here...">${note.content || ''}</textarea>
        </div>
    `;
    
    // Set up event listeners
    const contributorSelect = noteDiv.querySelector('.note-contributor-select');
    const textarea = noteDiv.querySelector('.note-textarea');
    const closeBtn = noteDiv.querySelector('.btn-close-note');
    const deleteBtn = noteDiv.querySelector('.btn-delete-note');
    
    contributorSelect.addEventListener('change', function() {
        const noteData = appState.noteBlocks.find(n => n.id === note.id);
        if (noteData) {
            noteData.contributor = this.value;
            saveNotesToLocalStorage();
        }
    });
    
    textarea.addEventListener('input', function() {
        const noteData = appState.noteBlocks.find(n => n.id === note.id);
        if (noteData) {
            noteData.content = this.value;
        }
        // Debounced save
        clearTimeout(textarea._saveTimeout);
        textarea._saveTimeout = setTimeout(() => {
            saveNotesToLocalStorage();
        }, 500);
    });
    
    closeBtn.addEventListener('click', function() {
        const noteData = appState.noteBlocks.find(n => n.id === note.id);
        if (noteData) {
            noteData.isClosed = !noteData.isClosed;
            noteDiv.classList.toggle('closed', noteData.isClosed);
            this.textContent = noteData.isClosed ? '↻' : '✓';
            this.title = noteData.isClosed ? 'Reopen note' : 'Close note';
            saveNotesToLocalStorage();
        }
    });
    
    deleteBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to delete this note?')) {
            appState.noteBlocks = appState.noteBlocks.filter(n => n.id !== note.id);
            noteDiv.remove();
            saveNotesToLocalStorage();
        }
    });
    
    // Disable editing if closed
    if (note.isClosed) {
        textarea.disabled = true;
        textarea.style.opacity = '0.7';
    }
    
    return noteDiv;
}

function syncNoteBlocksFromDOM() {
    const container = document.getElementById('notesContainer');
    if (!container) return;
    
    const noteDivs = container.querySelectorAll('.note-block');
    const syncedBlocks = [];
    
    noteDivs.forEach(noteDiv => {
        const noteId = parseInt(noteDiv.dataset.id);
        const textarea = noteDiv.querySelector('.note-textarea');
        const contributorSelect = noteDiv.querySelector('.note-contributor-select');
        const isClosed = noteDiv.classList.contains('closed');
        
        // Find original note to preserve createdAt
        const originalNote = appState.noteBlocks.find(n => n.id === noteId);
        
        syncedBlocks.push({
            id: noteId,
            content: textarea ? textarea.value : '',
            contributor: contributorSelect ? contributorSelect.value : 'Jake Liberman',
            createdAt: originalNote ? originalNote.createdAt : new Date().toISOString(),
            isClosed: isClosed
        });
    });
    
    appState.noteBlocks = syncedBlocks;
}

function saveNotesToLocalStorage() {
    // Sync project data
    saveProjectTableData();
    
    // Sync underwriter checklist
    syncUnderwriterChecklistFromDOM();
    
    // Sync note blocks
    syncNoteBlocksFromDOM();
    
    const data = {
        weekDate: appState.currentWeekDate,
        projectData: appState.projectData,
        checklistItems: appState.checklistItems,
        underwriterChecklist: appState.underwriterChecklist,
        noteBlocks: appState.noteBlocks,
        lastSaveTime: new Date().toISOString()
    };
    
    localStorage.setItem(`update_${appState.currentWeekDate}`, JSON.stringify(data));
    console.log('Saved note blocks to localStorage:', appState.noteBlocks);
}

// ============================================
// Project Table Management
// ============================================

function saveProjectTableData() {
    const table = document.getElementById('projectTable');
    const rows = table.querySelectorAll('tbody tr');
    const data = {};
    
    rows.forEach((row, index) => {
        const businessNeed = row.querySelector('.business-need').textContent.trim();
        const description = row.querySelector('td:nth-child(2)').textContent.trim();
        const details = row.querySelector('td:nth-child(3)').textContent.trim();
        const status = row.querySelector('.status-dropdown').value;
        const dueDate = row.querySelector('.date-input').value;
        
        data[businessNeed] = {
            description,
            details,
            status,
            dueDate
        };
    });
    
    appState.projectData = data;
}

function loadProjectTableData(data) {
    if (!data || Object.keys(data).length === 0) return;
    
    const table = document.getElementById('projectTable');
    const rows = table.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
        const businessNeed = row.querySelector('.business-need').textContent.trim();
        if (data[businessNeed]) {
            const item = data[businessNeed];
            // Only overwrite if saved data has actual content
            if (item.description && item.description.trim()) {
                row.querySelector('td:nth-child(2)').textContent = item.description;
            }
            if (item.details && item.details.trim()) {
                row.querySelector('td:nth-child(3)').textContent = item.details;
            }
            if (item.status) {
                row.querySelector('.status-dropdown').value = item.status;
            }
            if (item.dueDate) {
                row.querySelector('.date-input').value = item.dueDate;
            }
        }
    });
}

// ============================================
// Checklist Management
// ============================================

function addNewTask() {
    const template = document.getElementById('taskTemplate');
    const clone = template.content.cloneNode(true);
    const taskItem = clone.querySelector('.checklist-item');
    const taskId = Date.now();
    taskItem.dataset.id = taskId;
    
    // Set up event listeners for this task
    setupTaskListeners(taskItem);
    
    // Add to container
    document.getElementById('checklistContainer').appendChild(taskItem);
    
    // Add to state
    const taskData = {
        id: taskId,
        completed: false,
        description: '',
        department: 'Other',
        priority: 'Medium',
        dueDate: '',
        notes: ''
    };
    appState.checklistItems.push(taskData);
    
    updateChecklistStats();
}

function addUnderwriterItem(itemData = null) {
    const container = document.getElementById('underwriterChecklist');
    const itemId = itemData ? itemData.id : Date.now();
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'checklist-item';
    itemDiv.dataset.id = itemId;
    
    if (itemData && itemData.completed) {
        itemDiv.classList.add('completed');
    }
    
    itemDiv.innerHTML = `
        <div class="task-main">
            <input type="checkbox" class="task-checkbox" ${itemData && itemData.completed ? 'checked' : ''}>
            <input type="text" class="task-description" placeholder="Checklist item..." value="${itemData ? (itemData.description || '') : ''}">
            <input type="date" class="task-due-date" placeholder="Date completed" value="${itemData ? (itemData.dateCompleted || '') : ''}">
            <button class="btn-icon btn-delete" title="Delete item">×</button>
        </div>
    `;
    
    // Set up event listeners
    const checkbox = itemDiv.querySelector('.task-checkbox');
    const description = itemDiv.querySelector('.task-description');
    const dueDate = itemDiv.querySelector('.task-due-date');
    const deleteBtn = itemDiv.querySelector('.btn-delete');
    
    checkbox.addEventListener('change', function() {
        const item = appState.underwriterChecklist.find(i => i.id == itemId); // Use == for loose equality
        if (item) {
            item.completed = this.checked;
            item.dateCompleted = this.checked ? (item.dateCompleted || new Date().toISOString().split('T')[0]) : '';
            if (this.checked && !dueDate.value) {
                dueDate.value = item.dateCompleted;
            }
            itemDiv.classList.toggle('completed', this.checked);
            // Save immediately when checkbox changes
            saveUnderwriterChecklistToLocalStorage();
        }
    });
    
    description.addEventListener('input', function() {
        const item = appState.underwriterChecklist.find(i => i.id == itemId); // Use == for loose equality
        if (item) {
            item.description = this.value;
        } else {
            // If item not found in state, sync from DOM and update
            syncUnderwriterChecklistFromDOM();
        }
        // Save immediately when description changes (debounced)
        clearTimeout(itemDiv._saveTimeout);
        itemDiv._saveTimeout = setTimeout(() => {
            saveUnderwriterChecklistToLocalStorage();
        }, 500);
    });
    
    dueDate.addEventListener('change', function() {
        const item = appState.underwriterChecklist.find(i => i.id == itemId); // Use == for loose equality
        if (item) {
            item.dateCompleted = this.value;
            // Save immediately when date changes
            saveUnderwriterChecklistToLocalStorage();
        }
    });
    
    deleteBtn.addEventListener('click', function() {
        appState.underwriterChecklist = appState.underwriterChecklist.filter(i => i.id != itemId); // Use != for loose equality
        itemDiv.remove();
        // Save immediately when item is deleted
        saveUnderwriterChecklistToLocalStorage();
    });
    
    container.appendChild(itemDiv);
    
    // Add to state if new item
    if (!itemData) {
        appState.underwriterChecklist.push({
            id: itemId,
            completed: false,
            description: '',
            dateCompleted: ''
        });
        // Save immediately when new item is added (no delay)
        saveUnderwriterChecklistToLocalStorage();
    }
}

function renderUnderwriterChecklist() {
    const container = document.getElementById('underwriterChecklist');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!appState.underwriterChecklist || appState.underwriterChecklist.length === 0) {
        console.log('No underwriter checklist items to render');
        return;
    }
    
    console.log('Rendering underwriter checklist items:', appState.underwriterChecklist);
    appState.underwriterChecklist.forEach(item => {
        // Ensure ID is a number for consistency
        const normalizedItem = {
            ...item,
            id: typeof item.id === 'string' ? parseInt(item.id) || item.id : item.id
        };
        addUnderwriterItem(normalizedItem);
    });
}

function syncUnderwriterChecklistFromDOM() {
    // Sync underwriter checklist from DOM to state before saving
    const container = document.getElementById('underwriterChecklist');
    if (!container) return;
    
    const items = container.querySelectorAll('.checklist-item');
    const syncedItems = [];
    
    items.forEach(itemDiv => {
        // Handle both string and number IDs
        const itemIdStr = itemDiv.dataset.id;
        const itemId = itemIdStr ? (isNaN(parseInt(itemIdStr)) ? itemIdStr : parseInt(itemIdStr)) : Date.now();
        const checkbox = itemDiv.querySelector('.task-checkbox');
        const description = itemDiv.querySelector('.task-description');
        const dueDate = itemDiv.querySelector('.task-due-date');
        
        syncedItems.push({
            id: itemId,
            completed: checkbox ? checkbox.checked : false,
            description: description ? description.value : '',
            dateCompleted: dueDate ? dueDate.value : ''
        });
    });
    
    appState.underwriterChecklist = syncedItems;
    console.log('Synced underwriter checklist from DOM:', syncedItems);
}

function saveUnderwriterChecklistToLocalStorage() {
    // Sync from DOM first to get latest values, then save state
    syncUnderwriterChecklistFromDOM();
    
    // Also ensure project data is saved
    saveProjectTableData();
    
    // Get current notes
    const notesField = document.getElementById('additionalNotes');
    if (notesField) {
        appState.additionalNotes = notesField.value;
    }
    
    // Get current contributor
    const contributorDropdown = document.getElementById('notesContributor');
    if (contributorDropdown) {
        appState.notesContributor = contributorDropdown.value;
    }
    
    const data = {
        weekDate: appState.currentWeekDate,
        projectData: appState.projectData,
        checklistItems: appState.checklistItems,
        underwriterChecklist: appState.underwriterChecklist,
        additionalNotes: appState.additionalNotes,
        notesContributor: appState.notesContributor
    };
    
    localStorage.setItem(`update_${appState.currentWeekDate}`, JSON.stringify(data));
    console.log('Saved underwriter checklist to localStorage:', appState.underwriterChecklist);
    console.log('Full saved data:', data);
}

function setupTaskListeners(taskItem) {
    const taskId = parseInt(taskItem.dataset.id);
    const checkbox = taskItem.querySelector('.task-checkbox');
    const description = taskItem.querySelector('.task-description');
    const department = taskItem.querySelector('.task-department');
    const priority = taskItem.querySelector('.task-priority');
    const dueDate = taskItem.querySelector('.task-due-date');
    const notes = taskItem.querySelector('.task-notes');
    const deleteBtn = taskItem.querySelector('.btn-delete');
    const expandBtn = taskItem.querySelector('.expand-notes');
    
    // Checkbox
    checkbox.addEventListener('change', function() {
        const task = appState.checklistItems.find(t => t.id === taskId);
        if (task) {
            task.completed = this.checked;
            taskItem.classList.toggle('completed', this.checked);
            updateChecklistStats();
        }
    });
    
    // Description
    description.addEventListener('input', function() {
        const task = appState.checklistItems.find(t => t.id === taskId);
        if (task) task.description = this.value;
    });
    
    // Department
    department.addEventListener('change', function() {
        const task = appState.checklistItems.find(t => t.id === taskId);
        if (task) {
            task.department = this.value;
            taskItem.dataset.department = this.value;
        }
        filterChecklist();
    });
    
    // Priority
    priority.addEventListener('change', function() {
        const task = appState.checklistItems.find(t => t.id === taskId);
        if (task) {
            task.priority = this.value;
            taskItem.dataset.priority = this.value;
        }
        filterChecklist();
    });
    
    // Due date
    dueDate.addEventListener('change', function() {
        const task = appState.checklistItems.find(t => t.id === taskId);
        if (task) task.dueDate = this.value;
    });
    
    // Notes
    notes.addEventListener('input', function() {
        const task = appState.checklistItems.find(t => t.id === taskId);
        if (task) task.notes = this.value;
    });
    
    // Expand notes
    expandBtn.addEventListener('click', function() {
        const isVisible = notes.style.display !== 'none';
        notes.style.display = isVisible ? 'none' : 'block';
        this.textContent = isVisible ? 'Notes' : 'Hide Notes';
    });
    
    // Delete
    deleteBtn.addEventListener('click', function() {
        appState.checklistItems = appState.checklistItems.filter(t => t.id !== taskId);
        taskItem.remove();
        updateChecklistStats();
    });
}

function updateChecklistStats() {
    const total = appState.checklistItems.length;
    const completed = appState.checklistItems.filter(t => t.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    document.getElementById('checklistProgress').textContent = `${completed} of ${total} tasks complete`;
    document.getElementById('progressFill').style.width = `${percentage}%`;
}

function filterChecklist() {
    const departmentFilter = document.getElementById('filterDepartment').value;
    const priorityFilter = document.getElementById('filterPriority').value;
    const items = document.querySelectorAll('#checklistContainer .checklist-item');
    
    items.forEach(item => {
        const department = item.dataset.department || item.querySelector('.task-department').value;
        const priority = item.dataset.priority || item.querySelector('.task-priority').value;
        
        const showDepartment = departmentFilter === 'all' || department === departmentFilter;
        const showPriority = priorityFilter === 'all' || priority === priorityFilter;
        
        item.style.display = (showDepartment && showPriority) ? 'block' : 'none';
    });
}

function sortChecklistByDate() {
    const container = document.getElementById('checklistContainer');
    const items = Array.from(container.querySelectorAll('.checklist-item'));
    
    items.sort((a, b) => {
        const dateA = a.querySelector('.task-due-date').value || '9999-12-31';
        const dateB = b.querySelector('.task-due-date').value || '9999-12-31';
        return dateA.localeCompare(dateB);
    });
    
    items.forEach(item => container.appendChild(item));
}

function renderChecklist(items, containerId, isReadOnly = false) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    items.forEach(item => {
        const template = document.getElementById('taskTemplate');
        const clone = template.content.cloneNode(true);
        const taskItem = clone.querySelector('.checklist-item');
        taskItem.dataset.id = item.id;
        taskItem.dataset.priority = item.priority || 'Medium';
        taskItem.dataset.department = item.department || 'Other';
        
        if (item.completed) {
            taskItem.classList.add('completed');
            taskItem.querySelector('.task-checkbox').checked = true;
        }
        
        taskItem.querySelector('.task-description').value = item.description || '';
        taskItem.querySelector('.task-department').value = item.department || 'Other';
        taskItem.querySelector('.task-priority').value = item.priority || 'Medium';
        taskItem.querySelector('.task-due-date').value = item.dueDate || '';
        taskItem.querySelector('.task-notes').value = item.notes || '';
        
        if (isReadOnly) {
            taskItem.querySelectorAll('input, select, textarea, button').forEach(el => {
                el.disabled = true;
            });
            taskItem.querySelector('.btn-delete').style.display = 'none';
        } else {
            setupTaskListeners(taskItem);
        }
        
        container.appendChild(taskItem);
    });
}

// ============================================
// Previous Week Reference Panel
// ============================================

// Removed loadPreviousWeekData and related functions - "Last Week's Checklist" panel removed

function loadSamplePreviousWeekData() {
    // Sample data from previous week's checklist
    const sampleData = {
        weekDate: getPreviousWeekDate(appState.currentWeekDate),
        checklistItems: [
            {
                id: 1001,
                completed: false,
                description: 'BH: Has met with Gary, Rescheduled Lynne; Assignments: Due Today, Gary has submitted',
                department: 'VP/GM Hiring',
                priority: 'High',
                dueDate: '',
                notes: ''
            },
            {
                id: 1002,
                completed: false,
                description: 'Need to update model, in progress. Target completion 1/13',
                department: 'Revenue Forecast',
                priority: 'High',
                dueDate: '2026-01-13',
                notes: '1. Forecast Update: Cut acquisition volume 50% and run numbers\n2. Update Forecast to Include DSCR Operations\n3. Update Forecast to Include Multifamily closings'
            },
            {
                id: 1003,
                completed: true,
                description: 'No Action Items as of 1/12',
                department: 'Technology',
                priority: 'Low',
                dueDate: '',
                notes: ''
            },
            {
                id: 1004,
                completed: false,
                description: 'Bank Account Selection: Operating Account Clarification & Escrow Account -> currently working w/ Finance team: Bank selection due by EOW w/ Steps to set up',
                department: 'Finance',
                priority: 'High',
                dueDate: '',
                notes: ''
            },
            {
                id: 1005,
                completed: false,
                description: 'Completed call with CRS, they are guiding us through E&O Policy. Submit v1 application by EOW',
                department: 'Insurance',
                priority: 'High',
                dueDate: '',
                notes: ''
            },
            {
                id: 1006,
                completed: false,
                description: 'HUB & CRS both working on feedback @ State Level: Full grid of bonding complete by EOW',
                department: 'Bonding',
                priority: 'High',
                dueDate: '',
                notes: ''
            },
            {
                id: 1007,
                completed: false,
                description: 'Given forecast, what is staffing plan? Names of positions, primary functions, cost, scaling factors, 6mo budget.',
                department: 'Other',
                priority: 'High',
                dueDate: '',
                notes: ''
            }
        ]
    };
    
    // Removed - function no longer needed
}

// Removed displayPreviousWeek, copyUncompletedTasks, and togglePanel - panel was removed

// ============================================
// Archive Management
// ============================================

function loadArchiveWeeks() {
    const dropdown = document.getElementById('archiveDropdown');
    if (!dropdown) return; // Not on main page
    
    dropdown.innerHTML = '<option value="">Select a week...</option>';
    
    // Get saved weeks from localStorage
    const savedWeeks = getSavedWeeks();
    savedWeeks.forEach(weekDate => {
        const option = document.createElement('option');
        option.value = weekDate;
        option.textContent = formatDisplayDate(weekDate);
        dropdown.appendChild(option);
    });
}

function loadArchiveWeek(event) {
    const weekDate = event.target.value;
    if (!weekDate) {
        document.getElementById('archivePreview').innerHTML = '';
        return;
    }
    
    // Try localStorage first
    const saved = localStorage.getItem(`update_${weekDate}`);
    if (saved) {
        try {
            const data = JSON.parse(saved);
            displayArchivePreview(data);
            return;
        } catch (e) {
            console.error('Error parsing saved data:', e);
        }
    }
    
    // Fallback to fetch (would work with a server)
    const fileName = `archive/park-lane-update-${weekDate}.json`;
    
    fetch(fileName)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('File not found');
        })
        .then(data => {
            displayArchivePreview(data);
        })
        .catch(error => {
            document.getElementById('archivePreview').innerHTML = 
                '<p style="color: #ef4444;">Could not load archive data. Make sure the file exists in the archive folder.</p>';
        });
}

function displayArchivePreview(data) {
    const preview = document.getElementById('archivePreview');
    const total = data.checklistItems ? data.checklistItems.length : 0;
    const completed = data.checklistItems ? data.checklistItems.filter(t => t.completed).length : 0;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    let html = `
        <h4>Week of ${formatDisplayDate(data.weekDate)}</h4>
        <p><strong>Checklist:</strong> ${completed} of ${total} completed (${percentage}%)</p>
        <p><strong>Project Items:</strong> ${Object.keys(data.projectData || {}).length} tracked</p>
    `;
    
    preview.innerHTML = html;
}

function getSavedWeeks() {
    // In a real implementation, this would fetch from server
    // For now, we'll use localStorage as a cache
    const saved = localStorage.getItem('savedWeeks');
    return saved ? JSON.parse(saved) : [];
}

function addSavedWeek(weekDate) {
    const saved = getSavedWeeks();
    if (!saved.includes(weekDate)) {
        saved.push(weekDate);
        saved.sort().reverse(); // Newest first
        localStorage.setItem('savedWeeks', JSON.stringify(saved));
    }
}

// ============================================
// Save and Load Functions
// ============================================

function saveUpdate() {
    // Save project table data
    saveProjectTableData();
    
    // Sync underwriter checklist from DOM before saving
    syncUnderwriterChecklistFromDOM();
    
    // Sync note blocks from DOM
    syncNoteBlocksFromDOM();
    
    // Prepare data object
    const data = {
        weekDate: appState.currentWeekDate,
        projectData: appState.projectData,
        checklistItems: appState.checklistItems,
        underwriterChecklist: appState.underwriterChecklist,
        noteBlocks: appState.noteBlocks,
        savedAt: new Date().toISOString()
    };
    
    // Create JSON file content
    const jsonContent = JSON.stringify(data, null, 2);
    
    // Create HTML file content (for viewing)
    const htmlContent = generateHTMLFile(data);
    
    // Save files (using download approach since we can't write to server directly)
    downloadFile(`park-lane-update-${appState.currentWeekDate}.json`, jsonContent, 'application/json');
    downloadFile(`park-lane-update-${appState.currentWeekDate}.html`, htmlContent, 'text/html');
    
    // Update saved weeks list
    addSavedWeek(appState.currentWeekDate);
    
    // Update last save time
    const now = new Date();
    appState.lastSaveTime = now;
    document.getElementById('lastSave').textContent = 
        `Last saved: ${now.toLocaleTimeString()}`;
    
    alert('Update saved! Files downloaded. Move them to the archive folder.');
}

function downloadFile(filename, content, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function generateHTMLFile(data) {
    // This creates a standalone HTML file that can be viewed
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Park Lane Title - Weekly Update - ${data.weekDate}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; max-width: 1200px; margin: 0 auto; }
        h1 { color: #1e3a8a; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #1e3a8a; color: white; padding: 12px; text-align: left; }
        td { padding: 10px; border: 1px solid #ddd; }
        tr:nth-child(even) { background: #f3f4f6; }
        .section { margin: 30px 0; }
        .completed { text-decoration: line-through; opacity: 0.7; }
    </style>
</head>
<body>
    <h1>Park Lane Title - Weekly Update</h1>
    <p><strong>Week of:</strong> ${formatDisplayDate(data.weekDate)}</p>
    <p><strong>Saved:</strong> ${new Date(data.savedAt).toLocaleString()}</p>
    
    <div class="section">
        <h2>PROJECT TRACKER</h2>
        <table>
            <tr><th>Business Need</th><th>Description</th><th>Details</th><th>Status</th><th>Due Date</th></tr>
            ${Object.entries(data.projectData).map(([need, item]) => 
                `<tr>
                    <td><strong>${need}</strong></td>
                    <td>${item.description || ''}</td>
                    <td>${item.details || ''}</td>
                    <td>${item.status || 'Not Started'}</td>
                    <td>${item.dueDate || ''}</td>
                </tr>`
            ).join('')}
        </table>
    </div>
    
    <div class="section">
        <h2>WEEKLY CHECKLIST</h2>
        <p>${data.checklistItems.filter(t => t.completed).length} of ${data.checklistItems.length} completed</p>
        <ul>
            ${data.checklistItems.map(task => 
                `<li class="${task.completed ? 'completed' : ''}">
                    <strong>[${task.department}]</strong> ${task.description || '(No description)'}
                    ${task.priority !== 'Medium' ? ` <em>(${task.priority} priority)</em>` : ''}
                    ${task.dueDate ? ` Due: ${task.dueDate}` : ''}
                </li>`
            ).join('')}
        </ul>
    </div>
    
        ${(data.noteBlocks && data.noteBlocks.length > 0) || (data.additionalNotes && data.additionalNotes.trim()) ? `
    <div class="section">
        <h2>WEEKLY NOTES</h2>
        ${data.noteBlocks && data.noteBlocks.length > 0 ? data.noteBlocks.map(note => {
            const contributorColor = note.contributor === 'Jake Liberman' ? '#3B82F6' : '#9333ea';
            const dateStr = new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            return `
        <div style="margin-bottom: 30px; padding: 15px; border-left: 3px solid ${contributorColor}; background: #f9f9f9;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: ${contributorColor}; font-weight: 500;">${note.contributor}</span>
                <span style="color: #666; font-size: 12px;">${dateStr}${note.isClosed ? ' (Closed)' : ''}</span>
            </div>
            <pre style="white-space: pre-wrap; color: #1A1A1A; margin: 0;">${note.content || ''}</pre>
        </div>`;
        }).join('') : `
        <pre style="white-space: pre-wrap; color: #1A1A1A;">${data.additionalNotes || ''}</pre>
        `}
    </div>
    ` : ''}
</body>
</html>`;
}

function loadCurrentWeekData() {
    // Check if HTML table already has data (from HTML defaults)
    const table = document.getElementById('projectTable');
    const rows = table.querySelectorAll('tbody tr');
    let hasHtmlData = false;
    
    rows.forEach(row => {
        const description = row.querySelector('td:nth-child(2)').textContent.trim();
        const details = row.querySelector('td:nth-child(3)').textContent.trim();
        if (description || details) {
            hasHtmlData = true;
        }
    });
    
    // Try to load existing data for this week
    const saved = localStorage.getItem(`update_${appState.currentWeekDate}`);
    if (saved) {
        try {
            const data = JSON.parse(saved);
            // Check if there's meaningful project data in saved data
            const hasSavedProjectData = data.projectData && Object.keys(data.projectData).length > 0;
            const hasContentInSavedData = hasSavedProjectData && 
                Object.values(data.projectData).some(item => 
                    (item.description && item.description.trim()) || 
                    (item.details && item.details.trim())
                );
            
            // Always try to load checklist and notes data if it exists
            // Load underwriter checklist first (most important for user)
            if (data.underwriterChecklist && Array.isArray(data.underwriterChecklist) && data.underwriterChecklist.length > 0) {
                console.log('Loading underwriter checklist from localStorage:', data.underwriterChecklist);
                appState.underwriterChecklist = data.underwriterChecklist;
                renderUnderwriterChecklist();
            }
            
            // Load other checklist items
            if (data.checklistItems && Array.isArray(data.checklistItems) && data.checklistItems.length > 0) {
                appState.checklistItems = data.checklistItems;
                renderChecklist(data.checklistItems, 'checklistContainer');
                updateChecklistStats();
            }
            
            // Load note blocks (new format) or migrate old format
            if (data.noteBlocks && Array.isArray(data.noteBlocks) && data.noteBlocks.length > 0) {
                appState.noteBlocks = data.noteBlocks;
                renderNoteBlocks();
            } else if (data.additionalNotes && data.additionalNotes.trim().length > 0) {
                // Migrate old single note format to new note blocks format
                appState.noteBlocks = [{
                    id: Date.now(),
                    content: data.additionalNotes,
                    contributor: data.notesContributor || 'Jake Liberman',
                    createdAt: new Date().toISOString(),
                    isClosed: false
                }];
                renderNoteBlocks();
            }
            
            // Load project data only if there's meaningful content (to preserve HTML defaults)
            if (hasContentInSavedData) {
                loadProjectTableData(data.projectData);
                appState.projectData = data.projectData;
            } else if (hasHtmlData) {
                // Keep HTML defaults, already saved to state in initializeApp
            }
        } catch (e) {
            console.error('Error loading saved data:', e);
            // If there's an error, clear the bad data
            localStorage.removeItem(`update_${appState.currentWeekDate}`);
        }
    }
}

function loadDataIntoApp(data) {
    // Only load project data if it has actual content - don't overwrite HTML defaults
    if (data.projectData && Object.keys(data.projectData).length > 0) {
        loadProjectTableData(data.projectData);
        appState.projectData = data.projectData;
    } else {
        // If no saved project data, preserve HTML defaults by reading them into state
        saveProjectTableData();
    }
    
    if (data.checklistItems && data.checklistItems.length > 0) {
        appState.checklistItems = data.checklistItems;
        renderChecklist(data.checklistItems, 'checklistContainer');
        updateChecklistStats();
    }
    
    if (data.underwriterChecklist && Array.isArray(data.underwriterChecklist) && data.underwriterChecklist.length > 0) {
        console.log('Loading underwriter checklist from localStorage in loadDataIntoApp:', data.underwriterChecklist);
        appState.underwriterChecklist = data.underwriterChecklist;
        renderUnderwriterChecklist();
    }
    
    // Load note blocks (new format) or migrate old format
    if (data.noteBlocks && Array.isArray(data.noteBlocks) && data.noteBlocks.length > 0) {
        appState.noteBlocks = data.noteBlocks;
        renderNoteBlocks();
    } else if (data.additionalNotes && data.additionalNotes.trim().length > 0) {
        // Migrate old single note format to new note blocks format
        appState.noteBlocks = [{
            id: Date.now(),
            content: data.additionalNotes,
            contributor: data.notesContributor || 'Jake Liberman',
            createdAt: new Date().toISOString(),
            isClosed: false
        }];
        renderNoteBlocks();
    }
}

function startNewWeek() {
    if (confirm('Start a new week? This will save the current week first.')) {
        saveUpdate();
        
        // Reset to new week
        const today = new Date();
        const weekStart = getWeekStart(today);
        appState.currentWeekDate = formatDate(weekStart);
        document.getElementById('weekDate').textContent = appState.currentWeekDate;
        
        // Clear current data
        appState.projectData = {};
        appState.checklistItems = [];
        appState.underwriterChecklist = [];
        appState.noteBlocks = [];
        
        // Reload project table
        const table = document.getElementById('projectTable');
        table.querySelectorAll('.editable').forEach(cell => cell.textContent = '');
        table.querySelectorAll('.status-dropdown').forEach(select => select.value = 'Not Started');
        table.querySelectorAll('.date-input').forEach(input => input.value = '');
        
        // Clear checklists
        document.getElementById('checklistContainer').innerHTML = '';
        document.getElementById('underwriterChecklist').innerHTML = '';
        document.getElementById('notesContainer').innerHTML = '';
        
        // Add one default task
        addNewTask();
        addUnderwriterItem();
    }
}

// ============================================
// Data Recovery Helper
// ============================================

// Function to check for any saved data in localStorage (can be called from browser console)
window.recoverUnderwriterChecklist = function() {
    console.log('Checking localStorage for saved data...');
    
    // Check current week
    const currentWeekDate = formatDate(getWeekStart(new Date()));
    const currentData = localStorage.getItem(`update_${currentWeekDate}`);
    
    if (currentData) {
        try {
            const data = JSON.parse(currentData);
            console.log('Found data for current week:', data);
            if (data.underwriterChecklist && data.underwriterChecklist.length > 0) {
                console.log('Found underwriter checklist items:', data.underwriterChecklist);
                appState.underwriterChecklist = data.underwriterChecklist;
                renderUnderwriterChecklist();
                console.log('✓ Underwriter checklist items restored!');
                return data.underwriterChecklist;
            }
        } catch (e) {
            console.error('Error parsing current week data:', e);
        }
    }
    
    // Check all localStorage keys for potential data
    console.log('Checking all localStorage keys...');
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('update_')) {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                if (data.underwriterChecklist && data.underwriterChecklist.length > 0) {
                    console.log(`Found underwriter checklist in ${key}:`, data.underwriterChecklist);
                }
            } catch (e) {
                // Skip invalid JSON
            }
        }
    }
    
    console.log('No underwriter checklist items found to recover.');
    return null;
};

// ============================================
// Auto-save Functionality
// ============================================

function startAutoSave() {
    // Auto-save to localStorage every 2 minutes
    appState.autoSaveInterval = setInterval(() => {
        saveProjectTableData();
        
        // Sync underwriter checklist from DOM before saving
        syncUnderwriterChecklistFromDOM();
        
        // Sync note blocks from DOM
        syncNoteBlocksFromDOM();
        
        const data = {
            weekDate: appState.currentWeekDate,
            projectData: appState.projectData,
            checklistItems: appState.checklistItems,
            underwriterChecklist: appState.underwriterChecklist,
            noteBlocks: appState.noteBlocks
        };
        
        localStorage.setItem(`update_${appState.currentWeekDate}`, JSON.stringify(data));
        console.log('Auto-saved to localStorage');
    }, 120000); // 2 minutes
}

// ============================================
// UI Helpers
// ============================================

function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('open');
}

// Initialize archive dropdown on load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(loadArchiveWeeks, 1000);
});
