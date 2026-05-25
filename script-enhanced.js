// Task Manager App - Enhanced Real-time JavaScript

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

// Enhanced Task Manager Class
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
        this.isOnline = navigator.onLine;
        this.lastSync = localStorage.getItem('lastSync') || 0;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupRealtimeListeners();
        this.setupNetworkListeners();
        this.renderTasks();
        this.updateStats();
        this.initializePage();
        this.startAutoSync();
        this.updateConnectionStatus();
    }

    setupRealtimeListeners() {
        // Listen for real-time updates
        realtime.subscribe('task:created', (data) => {
            this.addTaskToList(data.task);
            this.showToast(`Task "${data.task.title}" created`, 'success');
            this.updateConnectionStatus();
        });

        realtime.subscribe('task:updated', (data) => {
            this.updateTaskInList(data.task);
            this.showToast(`Task "${data.task.title}" updated`, 'success');
        });

        realtime.subscribe('task:deleted', (data) => {
            this.removeTaskFromList(data.taskId);
            this.showToast('Task deleted', 'info');
        });

        realtime.subscribe('task:completed', (data) => {
            this.updateTaskStatus(data.taskId, 'completed');
            this.showToast(`Task "${data.task.title}" completed!`, 'success');
        });

        realtime.subscribe('sync:started', () => {
            this.showSyncIndicator();
        });

        realtime.subscribe('sync:completed', () => {
            this.hideSyncIndicator();
            this.showToast('Sync completed', 'success');
        });
    }

    setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncWithServer();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showToast('You are offline. Changes will sync when online.', 'warning');
        });
    }

    setupEventListeners() {
        // Enhanced search with debouncing
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

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Drag and drop
        this.setupDragAndDrop();

        // Auto-save
        this.setupAutoSave();

        // Collaboration indicators
        this.setupCollaborationIndicators();
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

        // Ctrl/Cmd + S: Quick save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.quickSave();
        }

        // Escape: Close modals
        if (e.key === 'Escape') {
            this.closeAllModals();
        }
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
        // Simulate other users viewing/editing
        const activeUsers = document.querySelectorAll('.task-item');
        activeUsers.forEach(task => {
            if (Math.random() > 0.7) {
                task.setAttribute('data-active-users', '2 users viewing');
            }
        });
    }

    startAutoSync() {
        // Sync every 30 seconds when online
        setInterval(() => {
            if (this.isOnline) {
                this.syncWithServer();
            }
        }, 30000);
    }

    syncWithServer() {
        if (!this.isOnline) {
            this.showToast('Cannot sync while offline', 'warning');
            return;
        }

        const now = Date.now();
        
        if (now - this.lastSync > 60000) {
            realtime.emit('sync:started');
            this.lastSync = now;
            localStorage.setItem('lastSync', now.toString());
            
            // Simulate sync completion
            setTimeout(() => {
                realtime.emit('sync:completed');
            }, 2000);
        }
    }

    showSyncIndicator() {
        // Sync indicator functionality removed
    }

    hideSyncIndicator() {
        // Sync indicator functionality removed
    }

    updateConnectionStatus() {
        // No-op: offline UI removed; app uses local storage by default
    }

    isTaskCompleted(task) {
        return !!(task.completed || task.status === 'completed');
    }

    quickSave() {
        const activeForm = document.querySelector('form:focus-within');
        if (activeForm) {
            const formData = new FormData(activeForm);
            const data = {};
            for (let [key, value] of formData.entries()) {
                data[key] = value;
            }
            localStorage.setItem(`quicksave_${Date.now()}`, JSON.stringify(data));
            this.showToast('Quick saved', 'success');
        }
    }

    // Enhanced task methods with real-time updates
    addTask(taskData = null) {
        const task = taskData || this.getFormData();
        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks(this.currentFilter);
        this.updateStats();
        
        // Emit real-time event
        realtime.emit('task:created', { task });
        
        return task;
    }

    updateTask(taskId, updates) {
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...updates };
            this.saveTasks();
            this.renderTasks(this.currentFilter);
            this.updateStats();
            
            // Emit real-time event
            realtime.emit('task:updated', { task: this.tasks[taskIndex] });
        }
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.saveTasks();
        this.renderTasks(this.currentFilter);
        this.updateStats();
        
        // Emit real-time event
        realtime.emit('task:deleted', { taskId });
    }

    toggleTaskComplete(taskId) {
        const task = this.tasks.find(t => t.id === taskId || t._id === taskId);
        if (task) {
            task.completed = !this.isTaskCompleted(task);
            task.status = task.completed ? 'completed' : (task.status === 'completed' ? 'pending' : task.status || 'pending');
            this.saveTasks();
            this.renderTasks(this.currentFilter);
            this.updateStats();
            
            // Emit real-time event
            if (task.completed) {
                realtime.emit('task:completed', { taskId, task });
            } else {
                realtime.emit('task:uncompleted', { taskId, task });
            }
        }
    }

    // Enhanced search with real-time filtering
    searchTasks(term) {
        this.searchTerm = term.toLowerCase();
        this.renderTasks(this.currentFilter);
        
        // Emit search event
        realtime.emit('search:changed', { term });
    }

    // Enhanced filtering
    filterTasks(filter) {
        this.currentFilter = filter;
        this.renderTasks(filter);
        
        // Emit filter event
        realtime.emit('filter:changed', { filter });
    }

    getFilteredTasks(filter = 'all') {
        switch (filter) {
            case 'completed':
                return this.tasks.filter(task => this.isTaskCompleted(task));
            case 'pending':
                return this.tasks.filter(task => task.status === 'pending' && !this.isTaskCompleted(task));
            case 'in-progress':
                return this.tasks.filter(task => task.status === 'in-progress');
            case 'today': {
                const today = new Date().toISOString().split('T')[0];
                return this.tasks.filter(task => task.dueDate === today);
            }
            case 'overdue': {
                const today = new Date().toISOString().split('T')[0];
                return this.tasks.filter(task => task.dueDate < today && !this.isTaskCompleted(task));
            }
            default:
                return this.tasks;
        }
    }

    getTasksByProject(projectName) {
        return this.tasks.filter(task => {
            const p = task.project;
            return p === projectName || (p && p.name === projectName);
        });
    }

    // Enhanced rendering
    renderTasks(filter = 'all') {
        let filteredTasks = this.tasks;
        
        // Apply filter
        if (filter !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.status === filter);
        }
        
        // Apply search
        if (this.searchTerm) {
            filteredTasks = filteredTasks.filter(task => 
                task.title.toLowerCase().includes(this.searchTerm) ||
                task.description.toLowerCase().includes(this.searchTerm)
            );
        }
        
        // Apply sorting
        filteredTasks.sort((a, b) => {
            switch (this.currentSort) {
                case 'dueDate':
                    return new Date(a.dueDate) - new Date(b.dueDate);
                case 'priority':
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                case 'title':
                    return a.title.localeCompare(b.title);
                default:
                    return 0;
            }
        });
        
        this.renderTaskList(filteredTasks);
    }

    renderTaskList(tasks) {
        const taskList = document.getElementById('task-list')
            || document.getElementById('tasks-container');
        if (taskList) {
            if (tasks.length === 0) {
                taskList.innerHTML = '<p class="text-center text-gray-500">No tasks found.</p>';
            } else {
                taskList.innerHTML = tasks.map(task => this.createTaskHTML(task)).join('');
                this.attachTaskEventListeners();
            }
        }
    }

    createTaskHTML(task) {
        const projectColor = this.getProjectColor(task.project);
        const priorityClass = task.priority === 'high' ? 'high-priority' : '';
        const completedClass = task.completed ? 'completed' : '';
        return `
            <div class="task-item ${completedClass} ${priorityClass}" data-task-id="${task.id}" draggable="true">
                <div class="task-checkbox-wrapper">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                </div>
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    <div class="task-meta">
                        <span class="badge badge-gray" style="background: ${projectColor}">${task.project}</span>
                        <span>Due: ${task.dueDate}</span>
                        ${(task.tags || []).map(tag => `<span class="badge badge-primary">${tag}</span>`).join('')}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn btn-sm btn-outline" onclick="taskManager.editTask(${task.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="taskManager.deleteTask(${task.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    attachTaskEventListeners() {
        const checkboxes = document.querySelectorAll('.task-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const taskId = parseInt(e.target.closest('.task-item').dataset.taskId);
                this.toggleTaskComplete(taskId);
            });
        });

        // Double-click for quick edit
        const taskItems = document.querySelectorAll('.task-item');
        taskItems.forEach(item => {
            item.addEventListener('dblclick', (e) => {
                const taskId = parseInt(item.dataset.taskId);
                this.editTask(taskId);
            });
        });

        // Drag events
        taskItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                const taskId = item.dataset.taskId;
                const task = this.tasks.find(t => t.id === parseInt(taskId));
                e.dataTransfer.setData('text', JSON.stringify(task));
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

    // Enhanced modal management
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Focus first input
            const firstInput = modal.querySelector('input');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    closeModal(modalId = null) {
        if (modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('active');
            }
        } else {
            // Close all modals
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
            });
        }
        document.body.style.overflow = '';
    }

    closeAllModals() {
        this.closeModal();
    }

    // Enhanced toast notifications
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${this.getToastIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    getToastIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Enhanced help system
    toggleHelp() {
        this.showToast('Press Ctrl+K to add task, Ctrl+/ to search, Ctrl+S to quick save', 'info');
    }

    // Enhanced notifications
    toggleNotifications() {
        const notificationPanel = document.getElementById('notification-panel');
        if (notificationPanel) {
            notificationPanel.classList.toggle('active');
        }
    }

    // Utility methods
    getProjectColor(projectName) {
        const colors = [
            '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
            '#8b5cf6', '#06b6d4', '#ec4899', '#6b7280'
        ];
        const hash = projectName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[Math.abs(hash) % colors.length];
    }

    updateStats() {
        const today = new Date().toISOString().split('T')[0];
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => this.isTaskCompleted(t)).length;
        const inProgress = this.tasks.filter(t => t.status === 'in-progress').length;
        const pending = this.tasks.filter(t => t.status === 'pending' && !this.isTaskCompleted(t)).length;
        const overdue = this.tasks.filter(t =>
            t.dueDate && t.dueDate < today && !this.isTaskCompleted(t)
        ).length;
        const todayCount = this.tasks.filter(t => t.dueDate === today).length;

        const stats = { total, completed, inProgress, pending, overdue, today: todayCount };

        this.updateStatElement('total-tasks', total);
        this.updateStatElement('completed-tasks', completed);
        this.updateStatElement('pending-tasks', pending);
        this.updateStatElement('in-progress-tasks', inProgress);
        this.updateStatElement('overdue-tasks', overdue);
        this.updateStatElement('today-tasks', todayCount);
        this.updateStatElement('total-tasks-count', total);
        this.updateStatElement('completed-tasks-count', completed);
        this.updateStatElement('progress-tasks-count', inProgress);
        this.updateStatElement('overdue-tasks-count', overdue);

        return stats;
    }

    updateStatElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
            element.classList.add('pulse');
            setTimeout(() => element.classList.remove('pulse'), 500);
        }
    }

    // Local Storage methods
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

    // Default data
    getDefaultTasks() {
        return [
            {
                id: 1,
                title: 'Complete project documentation',
                description: 'Write comprehensive documentation for the new feature',
                priority: 'high',
                dueDate: '2024-12-25',
                project: 'Development',
                status: 'pending',
                tags: ['documentation', 'urgent'],
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                title: 'Review pull requests',
                description: 'Review and merge pending pull requests',
                priority: 'medium',
                dueDate: '2024-12-20',
                project: 'Development',
                status: 'pending',
                tags: ['code-review'],
                createdAt: new Date().toISOString()
            },
            {
                id: 3,
                title: 'Team meeting preparation',
                description: 'Prepare slides for weekly team meeting',
                priority: 'low',
                dueDate: '2024-12-22',
                project: 'Management',
                status: 'completed',
                tags: ['meeting', 'team'],
                createdAt: new Date().toISOString()
            }
        ];
    }

    getDefaultProjects() {
        return [
            { id: 1, name: 'Development', color: '#3b82f6' },
            { id: 2, name: 'Design', color: '#10b981' },
            { id: 3, name: 'Marketing', color: '#f59e0b' },
            { id: 4, name: 'Management', color: '#ef4444' }
        ];
    }

    getDefaultSettings() {
        return {
            theme: 'light',
            notifications: true,
            autoSync: true,
            defaultPriority: 'medium',
            dateFormat: 'MM/DD/YYYY'
        };
    }

    // Page initialization
    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop().replace('.html', '');
        return page || 'index';
    }

    initializePage() {
        // Page-specific initialization
        switch (this.currentPage) {
            case 'index':
                this.initializeHomePage();
                break;
            case 'dashboard':
                this.initializeDashboard();
                break;
            case 'calendar':
                if (typeof this.initializeCalendar === 'function') {
                    this.initializeCalendar();
                }
                break;
            case 'tasks':
                this.initializeTasksPage();
                break;
            case 'calendar':
                this.initializeCalendarPage();
                break;
            case 'projects':
                this.initializeProjectsPage();
                break;
            case 'analytics':
                this.initializeAnalyticsPage();
                break;
            case 'team':
                this.initializeTeamPage();
                break;
            case 'settings':
                this.initializeSettingsPage();
                break;
        }
    }

    initializeHomePage() {
        this.updateHomePageStats();
        this.renderRecentTasks();
        this.initializeTipCarousel();
    }

    initializeDashboard() {
        const today = new Date().toISOString().split('T')[0];
        const stats = this.updateStats();
        const total = stats.total || 1;

        this.updateProgressBar('completed-progress', (stats.completed / total) * 100);
        this.updateProgressBar('progress-progress', (stats.inProgress / total) * 100);
        this.updateProgressBar('today-progress', (stats.today / total) * 100);

        const pctEl = document.getElementById('completed-percentage');
        if (pctEl) pctEl.textContent = `${Math.round((stats.completed / total) * 100)}% completion`;

        ['high', 'medium', 'low'].forEach(priority => {
            const count = this.tasks.filter(t => t.priority === priority).length;
            const el = document.getElementById(`${priority}-priority-count`);
            const bar = document.getElementById(`${priority}-priority-bar`);
            if (el) el.textContent = count;
            if (bar) bar.style.width = `${(count / total) * 100}%`;
        });

        const upcomingEl = document.getElementById('upcoming-deadlines');
        if (upcomingEl) {
            const now = new Date();
            const nextWeek = new Date(now.getTime() + 7 * 86400000);
            const upcoming = this.tasks
                .filter(t => {
                    const d = new Date(t.dueDate);
                    return d >= now && d <= nextWeek && !this.isTaskCompleted(t);
                })
                .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                .slice(0, 5);
            upcomingEl.innerHTML = upcoming.length
                ? upcoming.map(t => `<div class="deadline-item"><div class="deadline-info"><p class="deadline-title">${t.title}</p><p class="deadline-date">Due: ${t.dueDate}</p></div><span class="badge badge-${t.priority}">${t.priority}</span></div>`).join('')
                : '<p class="text-center text-gray-500">No upcoming deadlines</p>';
        }

        const todayList = document.getElementById('today-tasks-list');
        if (todayList) {
            const todayTasks = this.tasks.filter(t => t.dueDate === today);
            todayList.innerHTML = todayTasks.length
                ? todayTasks.map(t => this.createTaskHTML(t)).join('')
                : '<p class="text-center text-gray-500">No tasks for today</p>';
            if (todayTasks.length) this.attachTaskEventListeners();
        }

        const overdueList = document.getElementById('overdue-tasks-list');
        if (overdueList) {
            const overdueTasks = this.tasks.filter(t => t.dueDate < today && !this.isTaskCompleted(t));
            overdueList.innerHTML = overdueTasks.length
                ? overdueTasks.map(t => this.createTaskHTML(t)).join('')
                : '<p class="text-center text-gray-500">No overdue tasks</p>';
            if (overdueTasks.length) this.attachTaskEventListeners();
        }

        const projectOverview = document.getElementById('project-overview');
        if (projectOverview && this.projects.length) {
            projectOverview.innerHTML = `<div class="grid grid-cols-4">${this.projects.map(project => {
                const tasks = this.getTasksByProject(project.name);
                const done = tasks.filter(t => this.isTaskCompleted(t)).length;
                const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
                return `<div class="project-card"><div class="project-header"><h4 class="project-name">${project.name}</h4><span class="project-count">${tasks.length} tasks</span></div><div class="progress"><div class="progress-bar" style="width:${pct}%;background:${project.color};"></div></div><p class="project-percentage">${pct}% complete</p></div>`;
            }).join('')}</div>`;
        }
    }

    updateHomePageStats() {
        const today = new Date().toISOString().split('T')[0];
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => this.isTaskCompleted(t)).length;
        const inProgressTasks = this.tasks.filter(t => t.status === 'in-progress').length;
        const overdueTasks = this.tasks.filter(t =>
            t.dueDate && t.dueDate < today && !this.isTaskCompleted(t)
        ).length;

        // Update stat elements
        this.updateStatElement('total-tasks-count', totalTasks);
        this.updateStatElement('completed-tasks-count', completedTasks);
        this.updateStatElement('progress-tasks-count', inProgressTasks);
        this.updateStatElement('overdue-tasks-count', overdueTasks);

        // Update progress bars
        const totalProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        const completedProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        const progressProgress = totalTasks > 0 ? (inProgressTasks / totalTasks) * 100 : 0;
        const overdueProgress = totalTasks > 0 ? (overdueTasks / totalTasks) * 100 : 0;

        this.updateProgressBar('total-progress', totalProgress);
        this.updateProgressBar('completed-progress', completedProgress);
        this.updateProgressBar('progress-progress', progressProgress);
        this.updateProgressBar('overdue-progress', overdueProgress);
    }

    updateProgressBar(elementId, percentage) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.width = `${Math.min(percentage, 100)}%`;
        }
    }

    renderRecentTasks() {
        const container = document.getElementById('recent-tasks-container')
            || document.getElementById('recent-tasks-list');
        if (!container) return;

        const recentTasks = [...this.tasks]
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            .slice(0, 5);

        if (recentTasks.length > 0) {
            container.innerHTML = recentTasks.map(task => this.createRecentTaskHTML(task)).join('');
            this.attachTaskEventListeners();
        } else {
            container.innerHTML = '<p style="color:var(--muted); text-align:center; padding:2rem 0; font-size:0.9rem;">No tasks yet — create your first one above.</p>';
        }
    }

    createRecentTaskHTML(task) {
        const projectColor = this.getProjectColor(task.project);
        const priorityClass = task.priority === 'high' ? 'high-priority' : '';
        const completedClass = task.completed ? 'completed' : '';
        
        return `
            <div class="task-item ${completedClass} ${priorityClass}" data-task-id="${task.id}">
                <div class="task-checkbox-wrapper">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} onchange="taskManager.toggleTaskComplete(${task.id})">
                </div>
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    <div class="task-meta">
                        <span class="badge badge-gray" style="background: ${projectColor}">${task.project}</span>
                        <span>Due: ${task.dueDate}</span>
                        ${task.tags.map(tag => `<span class="badge badge-primary">${tag}</span>`).join('')}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn btn-sm btn-outline" onclick="taskManager.editTask(${task.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
        `;
    }

    initializeTipCarousel() {
        this.currentTipIndex = 0;
        this.tips = [
            {
                title: 'Keyboard Shortcuts',
                icon: 'fa-keyboard',
                content: 'Press <kbd>Ctrl+K</kbd> to quickly add a new task, <kbd>Ctrl+/</kbd> to focus search.'
            },
            {
                title: 'Time Management',
                icon: 'fa-clock',
                content: 'Break large tasks into smaller, manageable chunks for better productivity.'
            },
            {
                title: 'Use Tags',
                icon: 'fa-tags',
                content: 'Organize tasks with tags to easily filter and find related items.'
            },
            {
                title: 'Priority First',
                icon: 'fa-exclamation-triangle',
                content: 'Focus on high-priority tasks first to ensure important deadlines are met.'
            },
            {
                title: 'Regular Reviews',
                icon: 'fa-calendar-check',
                content: 'Review your tasks daily to stay on top of deadlines and priorities.'
            }
        ];
        
        this.showTip(0);
    }

    showTip(index) {
        const tipItems = document.querySelectorAll('.tip-item');
        tipItems.forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });
        
        this.currentTipIndex = index;
    }

    nextTip() {
        this.currentTipIndex = (this.currentTipIndex + 1) % this.tips.length;
        this.showTip(this.currentTipIndex);
    }

    previousTip() {
        this.currentTipIndex = (this.currentTipIndex - 1 + this.tips.length) % this.tips.length;
        this.showTip(this.currentTipIndex);
    }

    initializeDashboard() {
        // Dashboard specific logic
        this.renderDashboardStats();
    }

    initializeTasksPage() {
        // Tasks page specific logic
        this.renderTasks();
    }

    initializeCalendarPage() {
        // Calendar page specific logic
        this.renderCalendar();
    }

    initializeProjectsPage() {
        // Projects page specific logic
        this.renderProjects();
    }

    initializeAnalyticsPage() {
        // Analytics page specific logic
        this.renderAnalytics();
    }

    initializeTeamPage() {
        // Team page specific logic
        this.renderTeam();
    }

    initializeSettingsPage() {
        // Settings page specific logic
        this.renderSettings();
    }

    // Additional methods for other pages
    renderDashboardStats() {
        // Render dashboard statistics
        console.log('Rendering dashboard stats...');
    }

    renderCalendar() {
        // Render calendar view
        console.log('Rendering calendar...');
    }

    renderProjects() {
        // Render projects list
        console.log('Rendering projects...');
    }

    renderAnalytics() {
        // Render analytics charts
        console.log('Rendering analytics...');
    }

    renderTeam() {
        // Render team members
        console.log('Rendering team...');
    }

    renderSettings() {
        // Render settings form
        console.log('Rendering settings...');
    }

    // Public methods for global access
    syncNow() {
        this.syncWithServer();
    }

    viewAllTasks() {
        window.location.href = 'tasks.html';
    }

    goToTasks() {
        window.location.href = 'tasks.html';
    }

    goToDashboard() {
        window.location.href = 'dashboard.html';
    }

    goToCalendar() {
        window.location.href = 'calendar.html';
    }

    goToProjects() {
        window.location.href = 'projects.html';
    }

    goToAnalytics() {
        window.location.href = 'analytics.html';
    }

    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            this.openModal('task-modal');
            // Populate form with task data
            setTimeout(() => {
                document.getElementById('task-title').value = task.title;
                document.getElementById('task-description').value = task.description;
                document.getElementById('task-priority').value = task.priority;
                document.getElementById('task-dueDate').value = task.dueDate;
                document.getElementById('task-project').value = task.project;
                document.getElementById('task-tags').value = task.tags.join(', ');
            }, 100);
        }
    }
}

// Initialize the application (single global instance)
document.addEventListener('DOMContentLoaded', () => {
    if (!window.taskManager) {
        window.taskManager = new TaskManager();
    }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (taskManager && !document.hidden) {
        taskManager.syncWithServer();
    }
});

// Handle before unload
window.addEventListener('beforeunload', (e) => {
    if (taskManager) {
        // Save any unsaved changes
        taskManager.saveTasks();
        taskManager.saveSettings();
    }
});
