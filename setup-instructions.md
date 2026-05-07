# 🚀 TaskFlow Backend Setup Instructions

## Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment
Copy `.env` file and update with your settings:
- MongoDB connection string
- JWT secret key
- Frontend URL

### 3. Start MongoDB
```bash
# Make sure MongoDB is running
mongod
```

### 4. Start the Server
```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

### 5. Access the API
- Server runs on: `http://localhost:3000`
- Health check: `http://localhost:3000/api/health`
- API documentation: Check endpoints in README.md

## 📡 Available Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login to existing account
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Tasks
- `GET /api/tasks` - List tasks with filtering/pagination
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get specific task
- `PUT /api/tasks/:id` - Update existing task
- `DELETE /api/tasks/:id` - Delete task (soft delete)
- `POST /api/tasks/:id/comments` - Add comment to task

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get specific project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project (soft delete)
- `POST /api/projects/:id/members` - Add team member

### Users (Admin)
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get specific user
- `PUT /api/users/:id` - Update user (admin only)
- `GET /api/users/search` - Search users for project assignment

## 🔧 Frontend Integration

The frontend now uses the new `api-client.js` for all data operations:

```javascript
// Example: Login and get tasks
const loginResult = await taskFlowAPI.login({
    email: 'user@example.com',
    password: 'password123'
});

if (loginResult.success) {
    const tasks = await taskFlowAPI.getTasks();
    // Tasks are now loaded from the backend!
}
```

## 🗄️ Database Schema

### Users Collection
```javascript
{
  username: String (unique, required),
  email: String (unique, required),
  password: String (hashed, required),
  firstName: String (required),
  lastName: String (required),
  role: String ('user', 'admin'),
  preferences: Object,
  isActive: Boolean,
  createdAt: Date,
  lastLogin: Date
}
```

### Tasks Collection
```javascript
{
  title: String (required),
  description: String,
  status: String ('todo', 'in-progress', 'review', 'completed'),
  priority: String ('low', 'medium', 'high', 'urgent'),
  createdBy: ObjectId (ref: User),
  assignedTo: ObjectId (ref: User),
  project: ObjectId (ref: Project),
  tags: [String],
  dueDate: Date,
  completedAt: Date,
  comments: [{ author: ObjectId, content: String, createdAt: Date }],
  isDeleted: Boolean (soft delete),
  createdAt: Date
}
```

### Projects Collection
```javascript
{
  name: String (required),
  description: String,
  color: String (hex color),
  status: String ('planning', 'active', 'on-hold', 'completed', 'archived'),
  owner: ObjectId (ref: User),
  members: [{ user: ObjectId, role: String, joinedAt: Date }],
  startDate: Date,
  endDate: Date,
  budget: Number,
  currency: String,
  isDeleted: Boolean (soft delete),
  createdAt: Date
}
```

## 🔐 Security Features

- **JWT Authentication** with secure token handling
- **Password Hashing** using bcryptjs
- **Rate Limiting** (100 requests per 15 minutes)
- **Input Validation** on all endpoints
- **CORS Configuration** for frontend access
- **Helmet.js** security headers
- **Soft Deletes** for data recovery

## 🚨 Error Handling

All API responses follow this format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [...] // Validation errors if applicable
}
```

## 📊 Monitoring

### Health Check
Access `http://localhost:3000/api/health` to verify:
- Server status
- Uptime
- Environment
- Database connection

### Logs
The server provides detailed logging for:
- API requests
- Database operations
- Authentication events
- Error tracking

## 🔧 Development Tips

### Testing the API
```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test user registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'
```

### Database Management
```bash
# Connect to MongoDB shell
mongo taskflow

# View collections
db.users.find().pretty()
db.tasks.find().pretty()
db.projects.find().pretty()
```

## 🚀 Production Deployment

### Environment Setup
```bash
export NODE_ENV=production
export JWT_SECRET=your-production-secret-key
export MONGODB_URI=mongodb://your-production-server/taskflow
```

### Process Management
```bash
# Using PM2 for production
npm install -g pm2
pm2 start server.js --name "taskflow-api"

# Check status
pm2 status

# View logs
pm2 logs taskflow-api
```

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t taskflow-api .
docker run -p 3000:3000 --env-file .env taskflow-api
```

## 📝 Next Steps

1. **Set up your MongoDB instance**
2. **Configure environment variables**
3. **Start the backend server**
4. **Test the API endpoints**
5. **Use the frontend with full backend integration**

---

**TaskFlow Backend** - Professional Task Management API 🚀
