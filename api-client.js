class TaskFlowAPI {
    constructor() {
        this.baseURL = process.env.API_BASE_URL || 'http://localhost:3000/api';
        this.token = localStorage.getItem('taskflow_token');
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        localStorage.setItem('taskflow_token', token);
    }

    // Clear authentication token
    clearToken() {
        this.token = null;
        localStorage.removeItem('taskflow_token');
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        const url = `${this.baseURL}${endpoint}`;
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Authentication endpoints
    async register(userData) {
        return await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async login(credentials) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
        
        if (data.success) {
            this.setToken(data.data.token);
        }
        
        return data;
    }

    async getProfile() {
        return await this.request('/auth/profile');
    }

    async updateProfile(profileData) {
        return await this.request('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    // Task endpoints
    async getTasks(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/tasks?${queryString}` : '/tasks';
        return await this.request(endpoint);
    }

    async getTask(id) {
        return await this.request(`/tasks/${id}`);
    }

    async createTask(taskData) {
        return await this.request('/tasks', {
            method: 'POST',
            body: JSON.stringify(taskData)
        });
    }

    async updateTask(id, taskData) {
        return await this.request(`/tasks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(taskData)
        });
    }

    async deleteTask(id) {
        return await this.request(`/tasks/${id}`, {
            method: 'DELETE'
        });
    }

    async addTaskComment(taskId, content) {
        return await this.request(`/tasks/${taskId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content })
        });
    }

    // Project endpoints
    async getProjects(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/projects?${queryString}` : '/projects';
        return await this.request(endpoint);
    }

    async getProject(id) {
        return await this.request(`/projects/${id}`);
    }

    async createProject(projectData) {
        return await this.request('/projects', {
            method: 'POST',
            body: JSON.stringify(projectData)
        });
    }

    async updateProject(id, projectData) {
        return await this.request(`/projects/${id}`, {
            method: 'PUT',
            body: JSON.stringify(projectData)
        });
    }

    async deleteProject(id) {
        return await this.request(`/projects/${id}`, {
            method: 'DELETE'
        });
    }

    async addProjectMember(projectId, userId, role = 'member') {
        return await this.request(`/projects/${projectId}/members`, {
            method: 'POST',
            body: JSON.stringify({ userId, role })
        });
    }

    // User endpoints
    async getUsers(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/users?${queryString}` : '/users';
        return await this.request(endpoint);
    }

    async getUser(id) {
        return await this.request(`/users/${id}`);
    }

    async updateUser(id, userData) {
        return await this.request(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    async searchUsers(query) {
        return await this.request(`/users/search?q=${encodeURIComponent(query)}`);
    }

    // Health check
    async healthCheck() {
        return await this.request('/health');
    }
}

// Create global API instance
window.taskFlowAPI = new TaskFlowAPI();
