// Task Manager App - Backend Integrated JavaScript
// Replaces localStorage operations with API calls

class TaskManager {
    constructor() {
        this.tasks = [];
        this.projects = [];
        this.settings = {};
        this.currentPage = this.getCurrentPage();
        this.searchTerm = '';
        this.currentFilter = 'all';
        this.currentSort = 'dueDate';
        this.selectedTasks = new Set();
        this.isOnline = navigator.onLine;
        this.lastSync = Date.now();
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupNetworkListeners();
        await this.loadInitialData();
        this.initializePage();
        this.startAutoSync();
    }

    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('dashboard.html')) return 'dashboard';
        if (path.includes('tasks.html')) return 'tasks';
        if (path.includes('projects.html')) return 'projects';
        if (path.includes('analytics.html')) return 'analytics';
        if (path.includes('calendar.html')) return 'calendar';
        if (path.includes('team.html')) return 'team';
        if (path.includes('settings.html')) return 'settings';
        return 'home';
    }

    loadFromLocalStorage() {
        try {
            const tasks = localStorage.getItem('tasks');
            const projects = localStorage.getItem('projects');
            if (tasks) this.tasks = JSON.parse(tasks);
            if (projects) this.projects = JSON.parse(projects);
            this.updateStats();
            this.updateHomePageStats();
        } catch (e) {
            console.error('Local storage load failed:', e);
        }
    }

    async loadInitialData() {
        if (!window.taskFlowAPI) {
            this.loadFromLocalStorage();
            return;
        }
        try {
            // Load user profile first
            const profileResponse = await taskFlowAPI.getProfile();
            if (profileResponse.success) {
                this.currentUser = profileResponse.data.user;
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            }

            // Load data based on current page
            switch (this.currentPage) {
                case 'home':
                case 'dashboard':
                    await this.loadTasks();
                    await this.loadProjects();
                    this.updateHomePageStats();
                    break;
                case 'tasks':
                    await this.loadTasks();
                    this.renderTasks();
                    break;
                case 'projects':
                    await this.loadProjects();
                    this.renderProjects();
                    break;
                case 'analytics':
                    await this.loadTasks();
                    await this.loadProjects();
                    this.updateAnalytics();
                    break;
                case 'calendar':
                    await this.loadTasks();
                    this.renderCalendar();
                    break;
                case 'team':
                    await this.loadTeamData();
                    this.renderTeam();
                    break;
                case 'settings':
                    this.renderSettings();
                    break;
            }
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.loadFromLocalStorage();
        }
    }

    async loadTasks() {
        try {
            const response = await taskFlowAPI.getTasks({
                limit: 100 // Load more tasks for better UX
            });
            
            if (response.success) {
                this.tasks = response.data.tasks;
                this.updateStats();
            }
        } catch (error) {
            console.error('Failed to load tasks:', error);
            this.showToast('Failed to load tasks', 'error');
        }
    }

    async loadProjects() {
        try {
            const response = await taskFlowAPI.getProjects({
                limit: 50
            });
            
            if (response.success) {
                this.projects = response.data.projects;
            }
        } catch (error) {
            console.error('Failed to load projects:', error);
            this.showToast('Failed to load projects', 'error');
        }
    }

    async loadTeamData() {
        try {
            const [usersResponse, projectsResponse] = await Promise.all([
                taskFlowAPI.getUsers({ limit: 50 }),
                taskFlowAPI.getProjects({ limit: 50 })
            ]);
            
            if (usersResponse.success && projectsResponse.success) {
                this.users = usersResponse.data.users;
                this.projects = projectsResponse.data.projects;
            }
        } catch (error) {
            console.error('Failed to load team data:', error);
            this.showToast('Failed to load team data', 'error');
        }
    }

    setupEventListeners() {
        // Task form submission
        const taskForm = document.getElementById('task-form');
        if (taskForm) {
            taskForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleTaskSubmit();
            });
        }

        // Search functionality
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(async () => {
                    this.searchTerm = e.target.value;
                    await this.handleSearch();
                }, 300);
            });
        }

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                this.currentFilter = e.target.dataset.filter;
                await this.applyFilters();
            });
        });

        // Modal controls
        document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });

        // Modal backdrop
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                this.openModal('task-modal');
                document.getElementById('task-title')?.focus();
            }
            if (e.ctrlKey && e.key === '/') {
                e.preventDefault();
                document.getElementById('search-input')?.focus();
            }
        });
    }

    async handleTaskSubmit() {
        try {
            const formData = this.getFormData();
            const response = await taskFlowAPI.createTask(formData);
            
            if (response.success) {
                this.tasks.unshift(response.data.task);
                this.renderTasks();
                this.updateStats();
                this.closeModal();
                this.showToast('Task created successfully', 'success');
            } else {
                this.showToast(response.message || 'Failed to create task', 'error');
            }
        } catch (error) {
            console.error('Task submission error:', error);
            this.showToast('Failed to create task', 'error');
        }
    }

    async handleSearch() {
        try {
            const response = await taskFlowAPI.getTasks({
                search: this.searchTerm,
                limit: 20
            });
            
            if (response.success) {
                this.tasks = response.data.tasks;
                this.renderTasks();
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showToast('Search failed', 'error');
        }
    }

    async applyFilters() {
        try {
            const params = {
                status: this.currentFilter === 'all' ? undefined : this.currentFilter,
                limit: 20
            };
            
            const response = await taskFlowAPI.getTasks(params);
            
            if (response.success) {
                this.tasks = response.data.tasks;
                this.renderTasks();
            }
        } catch (error) {
            console.error('Filter error:', error);
            this.showToast('Filter failed', 'error');
        }
    }

    getFormData() {
        const form = document.getElementById('task-form');
        const formData = new FormData(form);
        
        return {
            title: formData.get('title'),
            description: formData.get('description'),
            priority: formData.get('priority') || 'medium',
            status: 'todo',
            project: formData.get('project') || null,
            tags: formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()) : [],
            dueDate: formData.get('dueDate') || null
        };
    }

    renderTasks() {
        const container = document.getElementById('tasks-container');
        if (!container) return;

        const tasksHTML = this.tasks.map(task => this.createTaskHTML(task)).join('');
        container.innerHTML = tasksHTML;
        
        this.attachTaskEventListeners();
    }

    createTaskHTML(task) {
        const projectColor = this.getProjectColor(task.project);
        const priorityClass = task.priority === 'high' ? 'high-priority' : '';
        const completedClass = task.status === 'completed' ? 'completed' : '';
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

        return `
            <div class="task-item ${completedClass} ${priorityClass}" data-task-id="${task._id}">
                <div class="task-checkbox-wrapper">
                    <input type="checkbox" class="task-checkbox" ${task.status === 'completed' ? 'checked' : ''} onchange="taskManager.toggleTaskComplete('${task._id}')">
                </div>
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    <div class="task-meta">
                        ${task.project ? `<span class="badge badge-gray" style="background: ${projectColor}">${task.project.name || task.project}</span>` : ''}
                        ${task.dueDate ? `<span>Due: ${new Date(task.dueDate).toLocaleDateString()}</span>` : ''}
                        ${task.tags.map(tag => `<span class="badge badge-primary">${tag}</span>`).join('')}
                        ${isOverdue ? '<span class="badge badge-danger">Overdue</span>' : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn btn-sm btn-outline" onclick="taskManager.editTask('${task._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="taskManager.deleteTask('${task._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    getProjectColor(project) {
        if (!project) return 'var(--primary-color)';
        if (typeof project === 'object' && project.color) return project.color;
        const projectObj = this.projects.find(p => p._id === project);
        return projectObj ? projectObj.color : 'var(--primary-color)';
    }

    async toggleTaskComplete(taskId) {
        try {
            const task = this.tasks.find(t => t._id === taskId);
            if (!task) return;

            const newStatus = task.status === 'completed' ? 'todo' : 'completed';
            const response = await taskFlowAPI.updateTask(taskId, { status: newStatus });
            
            if (response.success) {
                task.status = newStatus;
                this.renderTasks();
                this.updateStats();
                this.showToast(`Task ${newStatus === 'completed' ? 'completed' : 'reopened'}`, 'success');
            }
        } catch (error) {
            console.error('Toggle task error:', error);
            this.showToast('Failed to update task', 'error');
        }
    }

    async deleteTask(taskId) {
        if (!confirm('Are you sure you want to delete this task?')) return;

        try {
            const response = await taskFlowAPI.deleteTask(taskId);
            
            if (response.success) {
                this.tasks = this.tasks.filter(t => t._id !== taskId);
                this.renderTasks();
                this.updateStats();
                this.showToast('Task deleted successfully', 'success');
            }
        } catch (error) {
            console.error('Delete task error:', error);
            this.showToast('Failed to delete task', 'error');
        }
    }

    editTask(taskId) {
        const task = this.tasks.find(t => t._id === taskId);
        if (!task) return;

        // Populate form with task data
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-description').value = task.description || '';
        document.getElementById('task-priority').value = task.priority;
        document.getElementById('task-project').value = task.project || '';
        document.getElementById('task-tags').value = task.tags ? task.tags.join(', ') : '';
        document.getElementById('task-dueDate').value = task.dueDate || '';

        this.openModal('task-modal');
    }

    updateStats() {
        const today = new Date().toISOString().split('T')[0];
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.status === 'completed').length;
        const inProgress = this.tasks.filter(t => t.status === 'in-progress').length;
        const overdue = this.tasks.filter(t =>
            t.dueDate && t.dueDate < today && t.status !== 'completed'
        ).length;
        const todayCount = this.tasks.filter(t => t.dueDate === today).length;

        this.updateStatElement('total-tasks-count', total);
        this.updateStatElement('total-tasks', total);
        this.updateStatElement('completed-tasks-count', completed);
        this.updateStatElement('completed-tasks', completed);
        this.updateStatElement('progress-tasks-count', inProgress);
        this.updateStatElement('in-progress-tasks', inProgress);
        this.updateStatElement('overdue-tasks-count', overdue);
        this.updateStatElement('today-tasks', todayCount);

        const totalSafe = total || 1;
        this.updateProgressBar('completed-progress', (completed / totalSafe) * 100);
        this.updateProgressBar('progress-progress', (inProgress / totalSafe) * 100);
        this.updateProgressBar('today-progress', (todayCount / totalSafe) * 100);

        return { total, completed, inProgress, overdue, today: todayCount, pending: total - completed };
    }

    updateStatElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    updateProgressBar(elementId, percentage) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.width = `${Math.min(percentage, 100)}%`;
        }
    }

    updateHomePageStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.status === 'completed').length;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

        const heroTotal = document.getElementById('hero-total');
        const heroDone = document.getElementById('hero-done');
        const heroRate = document.getElementById('hero-rate');
        const compBadge = document.getElementById('completed-badge');

        if (heroTotal) heroTotal.textContent = total;
        if (heroDone) heroDone.textContent = completed;
        if (heroRate) heroRate.textContent = rate + '%';
        if (compBadge) compBadge.textContent = rate + '%';
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal() {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    }

    setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showToast('Connection restored', 'success');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showToast('Connection lost', 'warning');
        });
    }

    startAutoSync() {
        setInterval(async () => {
            if (this.isOnline) {
                try {
                    await this.syncWithServer();
                } catch (error) {
                    console.error('Auto-sync error:', error);
                }
            }
        }, 30000); // Sync every 30 seconds
    }

    async syncWithServer() {
        try {
            const healthResponse = await taskFlowAPI.healthCheck();
            if (healthResponse.success) {
                this.lastSync = Date.now();
                localStorage.setItem('lastSync', this.lastSync);
            }
        } catch (error) {
            console.error('Sync error:', error);
        }
    }

    initializePage() {
        switch (this.currentPage) {
            case 'home':
                this.initializeHomePage();
                break;
            case 'dashboard':
                if (typeof this.initializeDashboard === 'function') {
                    this.initializeDashboard();
                } else {
                    this.updateHomePageStats();
                }
                break;
            case 'tasks':
                if (typeof this.initializeTasksPage === 'function') {
                    this.initializeTasksPage();
                } else {
                    this.renderTasks();
                }
                break;
            case 'projects':
                if (typeof this.initializeProjectsPage === 'function') {
                    this.initializeProjectsPage();
                }
                break;
            default:
                break;
        }
    }

    getFilteredTasks(filter = 'all') {
        switch (filter) {
            case 'completed':
                return this.tasks.filter(t => t.status === 'completed');
            case 'pending':
                return this.tasks.filter(t => t.status === 'pending');
            case 'in-progress':
                return this.tasks.filter(t => t.status === 'in-progress');
            case 'today': {
                const today = new Date().toISOString().split('T')[0];
                return this.tasks.filter(t => t.dueDate === today);
            }
            case 'overdue': {
                const today = new Date().toISOString().split('T')[0];
                return this.tasks.filter(t => t.dueDate < today && t.status !== 'completed');
            }
            default:
                return this.tasks;
        }
    }

    initializeHomePage() {
        this.updateHomePageStats();
        this.renderRecentTasks();
        this.initializeTipCarousel();
    }

    renderRecentTasks() {
        const container = document.getElementById('recent-tasks-container');
        if (!container) return;

        const recentTasks = this.tasks
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);

        if (recentTasks.length > 0) {
            container.innerHTML = recentTasks.map(task => this.createRecentTaskHTML(task)).join('');
        } else {
            container.innerHTML = '<p style="color:var(--gray-color); text-align:center; padding:2rem 0;">No tasks yet — create your first one above.</p>';
        }
    }

    createRecentTaskHTML(task) {
        const projectColor = this.getProjectColor(task.project);
        const priorityClass = task.priority === 'high' ? 'high-priority' : '';
        const completedClass = task.status === 'completed' ? 'completed' : '';

        return `
            <div class="task-item ${completedClass} ${priorityClass}" data-task-id="${task._id}">
                <div class="task-checkbox-wrapper">
                    <input type="checkbox" class="task-checkbox" ${task.status === 'completed' ? 'checked' : ''} onchange="taskManager.toggleTaskComplete('${task._id}')">
                </div>
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    <div class="task-meta">
                        ${task.project ? `<span class="badge badge-gray" style="background: ${projectColor}">${task.project.name || task.project}</span>` : ''}
                        ${task.dueDate ? `<span>Due: ${new Date(task.dueDate).toLocaleDateString()}</span>` : ''}
                        ${task.tags.map(tag => `<span class="badge badge-primary">${tag}</span>`).join('')}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn btn-sm btn-outline" onclick="taskManager.editTask('${task._id}')">
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

    // Navigation methods
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.taskManager = new TaskManager();
});
