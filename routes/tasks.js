const express = require('express');
const jwt = require('jsonwebtoken');
const Task = require('../models/task');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

// Input validation
const validateTask = [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
  body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('status').optional().isIn(['todo', 'in-progress', 'review', 'completed']).withMessage('Invalid status'),
  body('dueDate').optional().isISO8601().withMessage('Invalid date format')
];

// Get all tasks for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      project,
      assignedTo,
      tags,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = req.query;

    const query = {
      $or: [
        { createdBy: req.user.id },
        { assignedTo: req.user.id }
      ],
      isDeleted: false
    };

    // Filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (project) query.project = project;
    if (assignedTo) query.assignedTo = assignedTo;
    if (tags) query.tags = { $in: tags.split(',') };
    if (search) {
      query.$and = [
        query,
        {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ]
        }
      ];
    }

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tasks = await Task.find(query)
      .populate('createdBy', 'username firstName lastName avatar')
      .populate('assignedTo', 'username firstName lastName avatar')
      .populate('project', 'name color')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(query);

    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalTasks: total,
          hasNext: parseInt(page) < Math.ceil(total / limit),
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching tasks'
    });
  }
});

// Get single task
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      $or: [
        { createdBy: req.user.id },
        { assignedTo: req.user.id }
      ],
      isDeleted: false
    })
      .populate('createdBy', 'username firstName lastName avatar')
      .populate('assignedTo', 'username firstName lastName avatar')
      .populate('project', 'name color')
      .populate('comments.author', 'username firstName lastName avatar');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: { task }
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching task'
    });
  }
});

// Create new task
router.post('/', authenticateToken, validateTask, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const taskData = {
      ...req.body,
      createdBy: req.user.id
    };

    const task = new Task(taskData);
    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('createdBy', 'username firstName lastName avatar')
      .populate('assignedTo', 'username firstName lastName avatar')
      .populate('project', 'name color');

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task: populatedTask }
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating task'
    });
  }
});

// Update task
router.put('/:id', authenticateToken, validateTask, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      $or: [
        { createdBy: req.user.id },
        { assignedTo: req.user.id }
      ],
      isDeleted: false
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or access denied'
      });
    }

    const allowedUpdates = ['title', 'description', 'status', 'priority', 'assignedTo', 'project', 'tags', 'dueDate', 'estimatedTime'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'username firstName lastName avatar')
      .populate('assignedTo', 'username firstName lastName avatar')
      .populate('project', 'name color');

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: { task: updatedTask }
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating task'
    });
  }
});

// Delete task (soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      $or: [
        { createdBy: req.user.id },
        { assignedTo: req.user.id }
      ],
      isDeleted: false
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or access denied'
      });
    }

    task.isDeleted = true;
    task.deletedAt = new Date();
    await task.save();

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting task'
    });
  }
});

// Add comment to task
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    task.comments.push({
      author: req.user.id,
      content: content.trim()
    });

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('comments.author', 'username firstName lastName avatar');

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: { 
        comment: populatedTask.comments[populatedTask.comments.length - 1]
      }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding comment'
    });
  }
});

module.exports = router;
