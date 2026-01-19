// Archive Page JavaScript - Year/Month Organization

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadArchiveData();
});

function loadArchiveData() {
    const savedWeeks = getSavedWeeks();
    const content = document.getElementById('archiveContent');
    
    if (savedWeeks.length === 0) {
        content.innerHTML = `
            <div class="empty-state">
                <p>No archived updates found.</p>
                <p>Save your first weekly update to see it here.</p>
            </div>
        `;
        return;
    }
    
    // Organize updates by year and month
    const organized = organizeByYearMonth(savedWeeks);
    
    // Display the organized structure
    displayArchive(organized);
}

function getSavedWeeks() {
    const saved = localStorage.getItem('savedWeeks');
    return saved ? JSON.parse(saved) : [];
}

function getUpdateData(weekDate) {
    const saved = localStorage.getItem(`update_${weekDate}`);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error(`Error parsing update ${weekDate}:`, e);
        }
    }
    return null;
}

function organizeByYearMonth(weekDates) {
    const organized = {};
    
    weekDates.forEach(weekDate => {
        const date = new Date(weekDate);
        const year = date.getFullYear();
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        
        if (!organized[year]) {
            organized[year] = {};
        }
        
        if (!organized[year][month]) {
            organized[year][month] = [];
        }
        
        organized[year][month].push(weekDate);
    });
    
    // Sort months within each year (most recent first)
    Object.keys(organized).forEach(year => {
        const months = organized[year];
        const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const sortedMonths = {};
        monthOrder.reverse().forEach(month => {
            if (months[month]) {
                sortedMonths[month] = months[month].sort().reverse(); // Newest first
            }
        });
        organized[year] = sortedMonths;
    });
    
    // Sort years (most recent first)
    const sortedYears = {};
    Object.keys(organized).sort().reverse().forEach(year => {
        sortedYears[year] = organized[year];
    });
    
    return sortedYears;
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

function formatShortDate(dateString) {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function displayArchive(organized) {
    const content = document.getElementById('archiveContent');
    
    if (Object.keys(organized).length === 0) {
        content.innerHTML = `
            <div class="empty-state">
                <p>No archived updates found.</p>
                <p>Save your first weekly update to see it here.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    // Iterate through years (already sorted newest first)
    Object.keys(organized).forEach(year => {
        html += `<div class="year-section">`;
        html += `<h2 class="year-header">${year}</h2>`;
        
        // Iterate through months in this year
        Object.keys(organized[year]).forEach(month => {
            html += `<div class="month-section">`;
            html += `<h3 class="month-header">${month}</h3>`;
            html += `<div class="updates-list">`;
            
            // List all updates in this month
            organized[year][month].forEach(weekDate => {
                const data = getUpdateData(weekDate);
                const displayDate = formatShortDate(weekDate);
                
                // Create link to view the update
                const linkId = `update-${weekDate}`;
                html += `
                    <a href="#" class="update-link" data-date="${weekDate}" id="${linkId}">
                        <div class="update-title">Week of ${displayDate}</div>
                        <div class="update-meta">
                            ${data ? getUpdateMeta(data) : 'Click to view update'}
                        </div>
                    </a>
                `;
            });
            
            html += `</div></div>`; // Close updates-list and month-section
        });
        
        html += `</div>`; // Close year-section
    });
    
    content.innerHTML = html;
    
    // Add click handlers to update links
    document.querySelectorAll('.update-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const weekDate = this.dataset.date;
            viewUpdate(weekDate);
        });
    });
}

function getUpdateMeta(data) {
    if (!data) return '';
    
    const checklistTotal = data.checklistItems ? data.checklistItems.length : 0;
    const checklistCompleted = data.checklistItems ? 
        data.checklistItems.filter(t => t.completed).length : 0;
    const checklistPercentage = checklistTotal > 0 ? 
        Math.round((checklistCompleted / checklistTotal) * 100) : 0;
    
    const projectItems = Object.keys(data.projectData || {}).length;
    
    return `${checklistCompleted} of ${checklistTotal} tasks completed (${checklistPercentage}%) • ${projectItems} project items tracked`;
}

function viewUpdate(weekDate) {
    const data = getUpdateData(weekDate);
    
    if (!data) {
        alert('Update data not found.');
        return;
    }
    
    // Open in a new window/tab as a viewable HTML file
    const htmlContent = generateViewHTML(data);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
}

function generateViewHTML(data) {
    const formatDate = (dateString) => {
        const d = new Date(dateString);
        return d.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Park Lane Title - Weekly Update - ${data.weekDate}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            padding: 40px; 
            max-width: 1200px; 
            margin: 0 auto; 
            background: #F8F8F8;
        }
        .container {
            background: white;
            padding: 40px;
            border: 1px solid #E5E5E5;
        }
        h1 { color: #1A1A1A; margin-bottom: 10px; }
        h2 { color: #1A1A1A; margin-top: 30px; margin-bottom: 15px; }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0; 
            background: white;
        }
        th { 
            background: #0A0A0A; 
            color: white; 
            padding: 12px; 
            text-align: left; 
            font-weight: 600;
        }
        td { 
            padding: 12px; 
            border: 1px solid #E5E5E5; 
        }
        tr:nth-child(even) { background: #F8F8F8; }
        .section { margin: 40px 0; }
        .completed { text-decoration: line-through; opacity: 0.7; }
        .notes-section {
            background: #F8F8F8;
            padding: 20px;
            border-left: 2px solid #0A0A0A;
            margin-top: 20px;
            white-space: pre-wrap;
        }
        .checklist-item {
            padding: 10px;
            margin: 5px 0;
            border-left: 2px solid #0A0A0A;
            padding-left: 15px;
        }
        .meta-info {
            color: #5A5A5A;
            margin-bottom: 30px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Park Lane Title - Weekly Update</h1>
        <div class="meta-info">
            <p><strong>Week of:</strong> ${formatDate(data.weekDate)}</p>
            <p><strong>Saved:</strong> ${new Date(data.savedAt || Date.now()).toLocaleString()}</p>
        </div>
        
        <div class="section">
            <h2>PROJECT TRACKER</h2>
            <p style="color: #5A5A5A; margin-bottom: 15px;">Path To File Opening (2/15)</p>
            <table>
                <thead>
                    <tr>
                        <th>Business Need</th>
                        <th>Description</th>
                        <th>Details</th>
                        <th>Status</th>
                        <th>Due Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(data.projectData || {}).map(([need, item]) => 
                        `<tr>
                            <td><strong>${need}</strong></td>
                            <td>${item.description || ''}</td>
                            <td>${item.details || ''}</td>
                            <td>${item.status || 'Not Started'}</td>
                            <td>${item.dueDate || ''}</td>
                        </tr>`
                    ).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="section">
            <h2>IMMEDIATE NEXT STEPS - WEEKLY CHECKLIST</h2>
            <p style="margin-bottom: 15px;">
                <strong>Progress:</strong> ${data.checklistItems ? data.checklistItems.filter(t => t.completed).length : 0} of ${data.checklistItems ? data.checklistItems.length : 0} completed
            </p>
            <div>
                ${(data.checklistItems || []).map(task => {
                    return `
                        <div class="checklist-item ${task.completed ? 'completed' : ''}">
                            <strong>[${task.department}]</strong> ${task.description || '(No description)'}
                            ${task.dueDate ? ` <em>Due: ${task.dueDate}</em>` : ''}
                            ${task.notes ? `<br><small style="color: #5A5A5A;">${task.notes}</small>` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
        
        ${(data.underwriterChecklist && data.underwriterChecklist.length > 0) ? `
        <div class="section">
            <h2>UNDERWRITER APPOINTMENT CHECKLIST</h2>
            <div>
                ${data.underwriterChecklist.map(item => `
                    <div class="checklist-item ${item.completed ? 'completed' : ''}">
                        ${item.description || '(No description)'}
                        ${item.dateCompleted ? ` <em>Completed: ${item.dateCompleted}</em>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        ${data.additionalNotes ? `
        <div class="section">
            <h2>WEEKLY NOTES</h2>
            ${data.notesContributor ? `
            <p style="margin-bottom: 15px;">
                <span style="color: ${data.notesContributor === 'Jake Liberman' ? '#3B82F6' : '#9333ea'}; font-weight: 500;">Contributor: ${data.notesContributor}</span>
            </p>
            ` : ''}
            <div class="notes-section" style="color: #1A1A1A;">${data.additionalNotes}</div>
        </div>
        ` : ''}
    </div>
</body>
</html>`;
}
