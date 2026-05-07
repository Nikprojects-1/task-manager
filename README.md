# TaskFlow - Professional Task Manager

A modern, real-time task management application with full-stack capabilities.

## 🚀 Features

### Frontend
- **Modern UI/UX** with Inter font and professional design
- **Real-time Updates** with WebSocket simulation
- **Responsive Design** for all devices
- **Drag & Drop** task management
- **Keyboard Shortcuts** for productivity
- **Auto-save** functionality
- **Toast Notifications** for user feedback
- **Progress Tracking** and analytics
- **Multi-theme Support** (light/dark)

### Backend
- **RESTful API** with Express.js
- **MongoDB** database with Mongoose ODM
- **JWT Authentication** with secure token handling
- **Input Validation** with express-validator
- **Rate Limiting** for API protection
- **CORS Support** for cross-origin requests
- **Comprehensive Error Handling**
- **Soft Deletes** for data recovery

## 📁 Project Structure

```
task-manager/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── .env                  # Environment variables
├── api-client.js          # Frontend API client
├── models/               # Database models
│   ├── user.js
│   ├── task.js
│   └── project.js
├── routes/               # API routes
│   ├── auth.js
│   ├── tasks.js
│   ├── projects.js
│   └── users.js
├── styles.css            # Global styles
├── script-enhanced.js   # Frontend logic
└── *.html               # Frontend pages
```

## 🛠️ Installation

### Prerequisites
- Node.js 16.0 or higher
- MongoDB 4.4 or higher
- npm or yarn

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd task-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   mongod
   ```

5. **Start the application**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

## 🔧 Configuration

### Environment Variables (.env)

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/taskflow

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

# CORS
FRONTEND_URL=http://localhost:8080

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user
- `PUT /api/auth/profile` - Update profile

### Tasks
- `GET /api/tasks` - Get all tasks (with pagination, filtering, sorting)
- `GET /api/tasks/:id` - Get single task
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task (soft delete)
- `POST /api/tasks/:id/comments` - Add comment to task

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project (soft delete)
- `POST /api/projects/:id/members` - Add member to project

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user (admin only)
- `PATCH /api/users/:id/deactivate` - Deactivate user (admin only)
- `GET /api/users/search` - Search users

### System
- `GET /api/health` - Health check endpoint

## 🔐 Security Features

- **Password Hashing** with bcryptjs
- **JWT Token Authentication**
- **Rate Limiting** to prevent abuse
- **Input Validation** on all endpoints
- **CORS Configuration**
- **Helmet.js** for security headers
- **SQL Injection Prevention** with Mongoose

## 📱 Frontend Integration

### Using the API Client

```javascript
// Authentication
const loginResult = await taskFlowAPI.login({
    email: 'user@example.com',
    password: 'password123'
});

if (loginResult.success) {
    // User logged in successfully
    const user = loginResult.data.user;
    const token = loginResult.data.token;
}

// Task Management
const tasks = await taskFlowAPI.getTasks({
    page: 1,
    limit: 20,
    status: 'in-progress',
    sortBy: 'dueDate',
    sortOrder: 'asc'
});

const newTask = await taskFlowAPI.createTask({
    title: 'Complete project documentation',
    description: 'Write comprehensive docs',
    priority: 'high',
    dueDate: '2024-12-31T23:59:59.000Z',
    tags: ['documentation', 'urgent']
});
```

## 🚀 Deployment

### Production Setup

1. **Environment Configuration**
   ```bash
   export NODE_ENV=production
   export MONGODB_URI=mongodb://your-production-db/taskflow
   export JWT_SECRET=your-production-secret
   ```

2. **Build and Deploy**
   ```bash
   # Using PM2 for process management
   npm install -g pm2
   pm2 start server.js --name "taskflow-api"
   
   # Or using Docker
   docker build -t taskflow .
   docker run -p 3000:3000 taskflow
   ```

3. **Reverse Proxy (Nginx)**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location /api {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
       
       location / {
           root /path/to/frontend;
           try_files $uri $uri/ index.html;
       }
   }
   ```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

### API Testing
Use tools like Postman, Insomnia, or curl:

```bash
# Health check
curl http://localhost:3000/api/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'
```

## 📊 Monitoring

### Health Check Response
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600,
  "environment": "development"
}
```

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": [...], // Validation errors if any
  "stack": "..." // Stack trace in development
}
```

## 🔄 Data Models

### User Schema
- Authentication credentials
- Profile information
- Preferences and settings
- Role-based permissions

### Task Schema
- Title, description, status, priority
- Assignment and collaboration
- Tags and due dates
- Comments and attachments
- Time tracking

### Project Schema
- Project details and metadata
- Member management
- Progress tracking
- Budget and timeline

## 🎨 Customization

### Adding New Features
1. **Backend**: Add new routes in `/routes/` directory
2. **Frontend**: Extend `api-client.js` with new methods
3. **UI**: Add new components and update existing pages

### Theming
```css
:root {
    --primary-color: #4f46e5;
    --secondary-color: #7c3aed;
    --success-color: #10b981;
    --warning-color: #f59e0b;
    --danger-color: #ef4444;
    /* Add your custom colors */
}
```

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Email: support@taskflow.com
- Check the documentation at `/help`

---

**TaskFlow** - Professional Task Management Made Simple 🚀
