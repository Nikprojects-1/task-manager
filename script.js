// Task Manager App - Global JavaScript

// Real-time Event System
class RealtimeManager {
    constructor() {
        this.listeners = new Map();
        this.eventQueue = [];
        this.isProcessing = false;
    }

    subscribe(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    emit(event, data) {
        this.eventQueue.push({ event, data, timestamp: Date.now() });
        this.processQueue();
    }

    processQueue() {
        if (this.isProcessing) return;
        this.isProcessing = true;
        
        while (this.eventQueue.length > 0) {
            const { event, data } = this.eventQueue.shift();
            if (this.listeners.has(event)) {
                this.listeners.get(event).forEach(callback => {
                    try {
                        callback(data);
                    } catch (error) {
                        console.error(`Error in ${event} listener:`, error);
                    }
                });
            }
        }
        
        this.isProcessing = false;
    }
}

// Global realtime instance
const realtime = new RealtimeManager();

// Task Manager Class
class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.projects = this.loadProjects();
        this.settings = this.loadSettings();
        this.currentPage = this.getCurrentPage();
        this.searchTerm = '';
        this.currentFilter = 'all';
        this.currentSort = 'dueDate';
        this.selectedTasks = new Set();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupRealtimeListeners();
        this.renderTasks();
        this.updateStats();
        this.initializePage();
        this.startAutoSync();
    }

    setupRealtimeListeners() {
        // Listen for real-time updates
        realtime.subscribe('task:created', (data) => {
            this.addTaskToList(data.task);
            this.showToast(`Task "${data.task.title}" created`, 'success');
        });

        realtime.subscribe('task:updated', (data) => {
            this.updateTaskInList(data.task);
            this.showToast(`Task "${data.task.title}" updated`, 'success');
        });

        realtime.subscribe('task:deleted', (data) => {
            this.removeTaskFromList(data.taskId);
            this.showToast(`Task deleted`, 'info');
        });

        realtime.subscribe('task:completed', (data) => {
            this.updateTaskStatus(data.taskId, 'completed');
            this.showToast(`Task "${data.task.title}" completed!`, 'success');
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    startAutoSync() {
        // Simulate real-time sync every 30 seconds
        setInterval(() => {
            this.syncWithServer();
        }, 30000);
    }

    syncWithServer() {
        // Simulate server sync
        const lastSync = localStorage.getItem('lastSync');
        const now = Date.now();
        
        if (!lastSync || now - parseInt(lastSync) > 60000) {
            localStorage.setItem('lastSync', now.toString());
            this.showToast('Syncing with server...', 'info');
            
            // Simulate sync completion
            setTimeout(() => {
                this.showToast('Sync completed', 'success');
            }, 1000);
        }
    }

    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + K: Quick add task
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            this.openModal('task-modal');
            document.getElementById('task-title').focus();
        }

        // Ctrl/Cmd + /: Focus search
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }

        // Escape: Close modals
        if (e.key === 'Escape') {
            this.closeAllModals();
        }
    }

    // Local Storage Methods
    loadTasks() {
        const tasks = localStorage.getItem('tasks');
        return tasks ? JSON.parse(tasks) : this.getDefaultTasks();
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    loadProjects() {
        const projects = localStorage.getItem('projects');
        return projects ? JSON.parse(projects) : this.getDefaultProjects();
    }

    saveProjects() {
        localStorage.setItem('projects', JSON.stringify(this.projects));
    }

    loadSettings() {
        const settings = localStorage.getItem('settings');
        return settings ? JSON.parse(settings) : this.getDefaultSettings();
    }

    saveSettings() {
        localStorage.setItem('settings', JSON.stringify(this.settings));
    }

    // Default Data
    getDefaultTasks() {
        return [
            {
                id: 1,
                title: 'Complete project proposal',
                description: 'Finish the Q4 project proposal document',
                priority: 'high',
                status: 'pending',
                project: 'Work',
                dueDate: '2024-01-15',
                tags: ['urgent', 'work'],
                createdAt: new Date().toISOString(),
                completedAt: null
            },
            {
                id: 2,
                title: 'Review code changes',
                description: 'Review pull requests from team members',
                priority: 'medium',
                status: 'in-progress',
                project: 'Development',
                dueDate: '2024-01-10',
                tags: ['code', 'review'],
                createdAt: new Date().toISOString(),
                completedAt: null
            },
            {
                id: 3,
                title: 'Team meeting preparation',
                description: 'Prepare slides for weekly team meeting',
                priority: 'low',
                status: 'pending',
                project: 'Work',
                dueDate: '2024-01-12',
                tags: ['meeting', 'presentation'],
                createdAt: new Date().toISOString(),
                completedAt: null
            }
        ];
    }

    getDefaultProjects() {
        return [
            { id: 1, name: 'Work', color: '#4f46e5', description: 'Work-related tasks' },
            { id: 2, name: 'Personal', color: '#10b981', description: 'Personal tasks and goals' },
            { id: 3, name: 'Development', color: '#06b6d4', description: 'Development projects' },
            { id: 4, name: 'Learning', color: '#f59e0b', description: 'Learning and education' }
        ];
    }

    getDefaultSettings() {
        return {
            theme: 'light',
            notifications: true,
            autoSave: true,
            dateFormat: 'MM/DD/YYYY',
            defaultPriority: 'medium',
            defaultProject: 'Work'
        };
    }

    // Task Management Methods
    addTask(taskData) {
        const task = {
            id: Date.now(),
            ...taskData,
            createdAt: new Date().toISOString(),
            completedAt: null
        };
        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.showToast('Task added successfully!', 'success');
        return task;
    }

    updateTask(taskId, updates) {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...updates };
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.showToast('Task updated successfully!', 'success');
        }
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.showToast('Task deleted successfully!', 'success');
    }

    toggleTaskComplete(taskId) {
        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            task.status = task.status === 'completed' ? 'pending' : 'completed';
            task.completedAt = task.status === 'completed' ? new Date().toISOString() : null;
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
        }
    }

    // Project Management Methods
    addProject(projectData) {
        const project = {
            id: Date.now(),
            ...projectData,
            createdAt: new Date().toISOString()
        };
        this.projects.push(project);
        this.saveProjects();
        this.showToast('Project added successfully!', 'success');
        return project;
    }

    deleteProject(projectId) {
        this.projects = this.projects.filter(project => project.id !== projectId);
        this.saveProjects();
        this.showToast('Project deleted successfully!', 'success');
    }

    // Filtering and Sorting
    getFilteredTasks(filter = 'all') {
        switch (filter) {
            case 'completed':
                return this.tasks.filter(task => task.status === 'completed');
            case 'pending':
                return this.tasks.filter(task => task.status === 'pending');
            case 'in-progress':
                return this.tasks.filter(task => task.status === 'in-progress');
            case 'today':
                const today = new Date().toISOString().split('T')[0];
                return this.tasks.filter(task => task.dueDate === today);
            case 'overdue':
                const todayDate = new Date().toISOString().split('T')[0];
                return this.tasks.filter(task => task.dueDate < todayDate && task.status !== 'completed');
            default:
                return this.tasks;
        }
    }

    getTasksByProject(projectId) {
        return this.tasks.filter(task => task.project === projectId);
    }

    // Statistics
    updateStats() {
        const stats = {
            total: this.tasks.length,
            completed: this.tasks.filter(task => task.status === 'completed').length,
            pending: this.tasks.filter(task => task.status === 'pending').length,
            inProgress: this.tasks.filter(task => task.status === 'in-progress').length,
            overdue: this.getOverdueCount(),
            today: this.getTodayCount()
        };

        this.updateStatsDisplay(stats);
        return stats;
    }

    getOverdueCount() {
        const today = new Date().toISOString().split('T')[0];
        return this.tasks.filter(task => task.dueDate < today && task.status !== 'completed').length;
    }

    getTodayCount() {
        const today = new Date().toISOString().split('T')[0];
        return this.tasks.filter(task => task.dueDate === today).length;
    }

    updateStatsDisplay(stats) {
        const elements = {
            totalTasks: document.getElementById('total-tasks'),
            completedTasks: document.getElementById('completed-tasks'),
            pendingTasks: document.getElementById('pending-tasks'),
            inProgressTasks: document.getElementById('in-progress-tasks'),
            overdueTasks: document.getElementById('overdue-tasks'),
            todayTasks: document.getElementById('today-tasks')
        };

        Object.entries(elements).forEach(([key, element]) => {
            if (element) {
                const statKey = key.replace('Tasks', '').replace(/([A-Z])/g, (match) => match.toLowerCase());
                element.textContent = stats[statKey] || 0;
            }
        });
    }

    // Rendering Methods
    renderTasks(filter = 'all') {
        const tasksContainer = document.getElementById('tasks-container');
        if (!tasksContainer) return;

        const tasks = this.getFilteredTasks(filter);
        
        if (tasks.length === 0) {
            tasksContainer.innerHTML = '<p class="text-center text-gray-500">No tasks found.</p>';
            return;
        }

        tasksContainer.innerHTML = tasks.map(task => this.createTaskHTML(task)).join('');
        this.attachTaskEventListeners();
    }

    createTaskHTML(task) {
        const priorityClass = `${task.priority}-priority`;
        const statusClass = task.status === 'completed' ? 'completed' : '';
        const project = this.projects.find(p => p.name === task.project);
        const projectColor = project ? project.color : '#6b7280';

        return `
            <div class="task-item ${priorityClass} ${statusClass}" data-task-id="${task.id}">
                <input type="checkbox" class="task-checkbox" ${task.status === 'completed' ? 'checked' : ''}>
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    <div class="task-meta">
                        <span class="badge badge-gray" style="background: ${projectColor}">${task.project}</span>
                        <span>Due: ${task.dueDate}</span>
                        ${task.tags.map(tag => `<span class="badge badge-primary">${tag}</span>`).join('')}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn btn-sm btn-outline" onclick="taskManager.editTask(${task.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="taskManager.deleteTask(${task.id})">Delete</button>
            </div>
        `;
    }

    // Enhanced Event Listeners
    setupEventListeners() {
        // Add task form
        const addTaskForm = document.getElementById('add-task-form');
        if (addTaskForm) {
            addTaskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addTask();
            });
        }

        // Task modal
        const taskModal = document.getElementById('task-modal');
        const closeTaskModal = document.querySelector('.modal-close');
        
        if (taskModal && closeTaskModal) {
            closeTaskModal.addEventListener('click', () => {
                this.closeModal('task-modal');
            });
        }

        // Filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.filterTasks(btn.dataset.filter);
            });
        });

        // Search input with debouncing
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.searchTasks(e.target.value);
                }, 300);
            });
        }

        // Drag and drop for tasks
        this.setupDragAndDrop();

        // Auto-save functionality
        this.setupAutoSave();

        // Real-time collaboration indicators
        this.setupCollaborationIndicators();
    }

    setupDragAndDrop() {
        const taskList = document.getElementById('task-list');
        if (taskList) {
            taskList.addEventListener('dragover', (e) => {
                e.preventDefault();
                taskList.classList.add('drag-over');
            });

            taskList.addEventListener('dragleave', () => {
                taskList.classList.remove('drag-over');
            });

            taskList.addEventListener('drop', (e) => {
                e.preventDefault();
                const data = e.dataTransfer.getData('text');
                try {
                    const task = JSON.parse(data);
                    this.addTask(task);
                    this.showToast('Task imported successfully', 'success');
                } catch (error) {
                    this.showToast('Invalid task data', 'error');
                }
                taskList.classList.remove('drag-over');
            });
        }
    }

    setupAutoSave() {
        // Auto-save form data every 30 seconds
        setInterval(() => {
            const forms = document.querySelectorAll('form');
            forms.forEach(form => {
                const formData = new FormData(form);
                const data = {};
                for (let [key, value] of formData.entries()) {
                    data[key] = value;
                }
                localStorage.setItem(`autosave_${form.id}`, JSON.stringify(data));
            });
        }, 30000);
    }

    setupCollaborationIndicators() {
        // Show who's currently viewing/editing
        const activeUsers = document.querySelectorAll('.task-item');
        activeUsers.forEach(task => {
            if (Math.random() > 0.7) { // Simulate other users
                task.setAttribute('data-active-users', '2 users viewing');
            }
        });
    }

    // Enhanced Task form submission
    const taskForm = document.getElementById('task-form');
    if (taskForm) {
        taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTaskSubmit();
            // Emit real-time event
            realtime.emit('task:created', { task: this.getFormData() });
        });
    }

    // Filter buttons with real-time updates
    const filterButtons = document.querySelectorAll('[data-filter]');
    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const filter = e.target.dataset.filter;
            this.currentFilter = filter;
            this.renderTasks(filter);
            this.updateActiveFilter(e.target);
            // Emit filter change event
            realtime.emit('filter:changed', { filter });
        });
    });

    // Modal close buttons
    const modalCloseButtons = document.querySelectorAll('.modal-close');
    modalCloseButtons.forEach(button => {
        button.addEventListener('click', () => {
            this.closeModal();
            realtime.emit('modal:closed', { modal: 'task' });
        });
    });

    // Modal backdrop click with enhanced handling
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
                realtime.emit('modal:closed', { modal: 'task' });
            }
        });
    });

    // Enhanced Task checkboxes with real-time updates
    attachTaskEventListeners() {
        const checkboxes = document.querySelectorAll('.task-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const taskId = parseInt(e.target.closest('.task-item').dataset.taskId);
                const task = this.tasks.find(t => t.id === taskId);
                if (task) {
                    task.completed = e.target.checked;
                    this.saveTasks();
                    this.renderTasks(this.currentFilter);
                    this.updateStats();
                    
                    // Emit real-time completion event
                    if (task.completed) {
                        realtime.emit('task:completed', { taskId, task });
                    } else {
                        realtime.emit('task:uncompleted', { taskId, task });
                    }
                }
            });
        });

        // Add double-click for quick edit
        const taskItems = document.querySelectorAll('.task-item');
        taskItems.forEach(item => {
            item.addEventListener('dblclick', (e) => {
                const taskId = parseInt(item.dataset.taskId);
                this.editTask(taskId);
            });
        });
    }

    getFormData() {
        const form = document.getElementById('task-form');
        const formData = new FormData(form);
        const task = {
            id: Date.now(),
            title: formData.get('title'),
            description: formData.get('description'),
            priority: formData.get('priority'),
            dueDate: formData.get('dueDate'),
            project: formData.get('project'),
            status: 'pending',
            createdAt: new Date().toISOString(),
            tags: formData.get('tags') ? formData.get('tags').split(',').map(t => t.trim()) : []
        };
        return task;
    }

    handleTaskSubmit() {
        const form = document.getElementById('task-form');
        const formData = new FormData(form);
        
        const taskData = {
            title: formData.get('title'),
            description: formData.get('description'),
            priority: formData.get('priority'),
            project: formData.get('project'),
            dueDate: formData.get('dueDate'),
            tags: formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()) : [],
            status: 'pending'
        };

        this.addTask(taskData);
        form.reset();
        this.closeModal();
    }

    // Modal Methods
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    }

    closeModal() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.remove('active');
        });
    }

    // Navigation
    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop().replace('.html', '') || 'index';
        return page;
    }

    initializePage() {
        // Update active navigation
        const navLinks = document.querySelectorAll('.nav-links a');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `${this.currentPage}.html`) {
                link.classList.add('active');
            }
        });

        // Page-specific initialization
        switch (this.currentPage) {
            case 'dashboard':
                this.initializeDashboard();
                break;
            case 'tasks':
                this.initializeTasksPage();
                break;
            case 'calendar':
                this.initializeCalendar();
                break;
            case 'analytics':
                this.initializeAnalytics();
                break;
        }
    }

    initializeDashboard() {
        this.renderTasks();
        this.updateStats();
    }

    initializeTasksPage() {
        this.renderTasks();
        this.populateProjectSelect();
    }

    initializeCalendar() {
        this.renderCalendar();
    }

    initializeAnalytics() {
        this.renderAnalytics();
    }

    // Utility Methods
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" style="background: none; border: none; cursor: pointer;">×</button>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => toast.remove(), 3000);
    }

    updateActiveFilter(activeButton) {
        const filterButtons = document.querySelectorAll('[data-filter]');
        filterButtons.forEach(button => {
            button.classList.remove('active');
        });
        activeButton.classList.add('active');
    }

    populateProjectSelect() {
        const projectSelect = document.getElementById('project');
        if (projectSelect) {
            projectSelect.innerHTML = this.projects.map(project => 
                `<option value="${project.name}">${project.name}</option>`
            ).join('');
        }
    }

    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            // Populate form with task data
            const form = document.getElementById('task-form');
            if (form) {
                form.title.value = task.title;
                form.description.value = task.description;
                form.priority.value = task.priority;
                form.project.value = task.project;
                form.dueDate.value = task.dueDate;
                form.tags.value = task.tags.join(', ');
                
                // Change form to edit mode
                form.dataset.editId = taskId;
                this.openModal('task-modal');
            }
        }
    }

    // Calendar Methods
    renderCalendar() {
        const calendarContainer = document.getElementById('calendar-container');
        if (!calendarContainer) return;

        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        const calendarHTML = this.generateCalendarHTML(currentMonth, currentYear);
        calendarContainer.innerHTML = calendarHTML;
    }

    generateCalendarHTML(month, year) {
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        
        let html = `
            <div class="calendar-header">
                <h3>${monthNames[month]} ${year}</h3>
            </div>
            <div class="calendar-grid">
                <div class="calendar-day-header">Sun</div>
                <div class="calendar-day-header">Mon</div>
                <div class="calendar-day-header">Tue</div>
                <div class="calendar-day-header">Wed</div>
                <div class="calendar-day-header">Thu</div>
                <div class="calendar-day-header">Fri</div>
                <div class="calendar-day-header">Sat</div>
        `;

        // Empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            html += '<div class="calendar-day empty"></div>';
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayTasks = this.tasks.filter(task => task.dueDate === dateStr);
            const isToday = this.isToday(year, month, day);
            
            html += `
                <div class="calendar-day ${isToday ? 'today' : ''}" data-date="${dateStr}">
                    <div class="day-number">${day}</div>
                    ${dayTasks.length > 0 ? `<div class="task-count">${dayTasks.length} tasks</div>` : ''}
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    isToday(year, month, day) {
        const today = new Date();
        return year === today.getFullYear() && 
               month === today.getMonth() && 
               day === today.getDate();
    }

    // Analytics Methods
    renderAnalytics() {
        this.renderTaskChart();
        this.renderProjectChart();
        this.renderPriorityChart();
    }

    renderTaskChart() {
        const chartContainer = document.getElementById('task-chart');
        if (!chartContainer) return;

        const stats = this.updateStats();
        const chartHTML = `
            <div class="chart-container">
                <h4>Task Status Distribution</h4>
                <div class="chart-bars">
                    <div class="chart-bar" style="height: ${(stats.completed / stats.total) * 100}%">
                        <span>Completed: ${stats.completed}</span>
                    </div>
                    <div class="chart-bar" style="height: ${(stats.inProgress / stats.total) * 100}%">
                        <span>In Progress: ${stats.inProgress}</span>
                    </div>
                    <div class="chart-bar" style="height: ${(stats.pending / stats.total) * 100}%">
                        <span>Pending: ${stats.pending}</span>
                    </div>
                </div>
            </div>
        `;
        chartContainer.innerHTML = chartHTML;
    }

    renderProjectChart() {
        const chartContainer = document.getElementById('project-chart');
        if (!chartContainer) return;

        const projectStats = this.projects.map(project => {
            const tasks = this.getTasksByProject(project.name);
            return {
                name: project.name,
                count: tasks.length,
                color: project.color
            };
        });

        const chartHTML = `
            <div class="chart-container">
                <h4>Tasks by Project</h4>
                <div class="project-bars">
                    ${projectStats.map(project => `
                        <div class="project-bar">
                            <div class="project-label">${project.name}</div>
                            <div class="project-progress">
                                <div class="progress-bar" style="width: ${(project.count / this.tasks.length) * 100}%; background: ${project.color}"></div>
                            </div>
                            <div class="project-count">${project.count}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        chartContainer.innerHTML = chartHTML;
    }

    renderPriorityChart() {
        const chartContainer = document.getElementById('priority-chart');
        if (!chartContainer) return;

        const priorities = ['high', 'medium', 'low'];
        const priorityStats = priorities.map(priority => {
            const count = this.tasks.filter(task => task.priority === priority).length;
            return { priority, count };
        });

        const chartHTML = `
            <div class="chart-container">
                <h4>Tasks by Priority</h4>
                <div class="priority-bars">
                    ${priorityStats.map(stat => `
                        <div class="priority-item">
                            <span class="priority-label">${stat.priority}</span>
                            <span class="priority-count">${stat.count}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        chartContainer.innerHTML = chartHTML;
    }
}

// Initialize the app
let taskManager;

document.addEventListener('DOMContentLoaded', () => {
    taskManager = new TaskManager();
});

// Export for global access
window.taskManager = taskManager;
