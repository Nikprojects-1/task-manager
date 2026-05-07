const express = require('express');
const jwt = require('jsonwebtoken');
const Project = require('../models/project');
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
const validateProject = [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Project name must be 1-100 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('color').optional().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color'),
  body('status').optional().isIn(['planning', 'active', 'on-hold', 'completed', 'archived']).withMessage('Invalid status')
];

// Get all projects for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = req.query;

    const query = {
      $or: [
        { owner: req.user.id },
        { 'members.user': req.user.id }
      ],
      isDeleted: false
    };

    // Filters
    if (status) query.status = status;
    if (search) {
      query.$and = [
        query,
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ]
        }
      ];
    }

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const projects = await Project.find(query)
      .populate('owner', 'username firstName lastName avatar')
      .populate('members.user', 'username firstName lastName avatar')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Project.countDocuments(query);

    res.json({
      success: true,
      data: {
        projects,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalProjects: total,
          hasNext: parseInt(page) < Math.ceil(total / limit),
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching projects'
    });
  }
});

// Get single project
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user.id },
        { 'members.user': req.user.id }
      ],
      isDeleted: false
    })
      .populate('owner', 'username firstName lastName avatar')
      .populate('members.user', 'username firstName lastName avatar')
      .populate({
        path: 'tasks',
        match: { isDeleted: false },
        options: { sort: { createdAt: -1 } }
      });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: { project }
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching project'
    });
  }
});

// Create new project
router.post('/', authenticateToken, validateProject, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const projectData = {
      ...req.body,
      owner: req.user.id,
      members: [{
        user: req.user.id,
        role: 'owner',
        joinedAt: new Date()
      }]
    };

    const project = new Project(projectData);
    await project.save();

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'username firstName lastName avatar')
      .populate('members.user', 'username firstName lastName avatar');

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project: populatedProject }
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating project'
    });
  }
});

// Update project
router.put('/:id', authenticateToken, validateProject, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const project = await Project.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user.id },
        { 'members.user': req.user.id, 'members.role': 'admin' }
      ],
      isDeleted: false
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or access denied'
      });
    }

    const allowedUpdates = ['name', 'description', 'color', 'status', 'startDate', 'endDate', 'budget', 'currency', 'isPublic'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('owner', 'username firstName lastName avatar')
      .populate('members.user', 'username firstName lastName avatar');

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: { project: updatedProject }
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating project'
    });
  }
});

// Delete project (soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user.id,
      isDeleted: false
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or access denied'
      });
    }

    project.isDeleted = true;
    project.deletedAt = new Date();
    await project.save();

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting project'
    });
  }
});

// Add member to project
router.post('/:id/members', authenticateToken, async (req, res) => {
  try {
    const { userId, role = 'member' } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const project = await Project.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user.id },
        { 'members.user': req.user.id, 'members.role': 'admin' }
      ],
      isDeleted: false
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or access denied'
      });
    }

    // Check if user is already a member
    const existingMember = project.members.find(
      member => member.user.toString() === userId
    );

    if (existingMember) {
      return res.status(409).json({
        success: false,
        message: 'User is already a member of this project'
      });
    }

    project.members.push({
      user: userId,
      role,
      joinedAt: new Date()
    });

    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate('members.user', 'username firstName lastName avatar');

    res.status(201).json({
      success: true,
      message: 'Member added successfully',
      data: { project: updatedProject }
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding member'
    });
  }
});

module.exports = router;
