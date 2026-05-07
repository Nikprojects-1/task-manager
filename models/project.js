const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [100, 'Project name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  color: {
    type: String,
    default: '#3b82f6',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color']
  },
  status: {
    type: String,
    enum: ['planning', 'active', 'on-hold', 'completed', 'archived'],
    default: 'planning'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member', 'viewer'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  startDate: {
    type: Date,
    default: null
  },
  endDate: {
    type: Date,
    default: null
  },
  budget: {
    type: Number,
    default: null
  },
  currency: {
    type: String,
    enum: ['USD', 'EUR', 'GBP', 'JPY', 'CNY'],
    default: 'USD'
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for project progress
projectSchema.virtual('progress').get(function() {
  return this.tasks && this.tasks.length > 0 
    ? Math.round((this.tasks.filter(task => task.status === 'completed').length / this.tasks.length) * 100)
    : 0;
});

// Virtual for active members count
projectSchema.virtual('activeMembersCount').get(function() {
  return this.members ? this.members.length : 0;
});

// Virtual for days remaining
projectSchema.virtual('daysRemaining').get(function() {
  if (!this.endDate) return null;
  const today = new Date();
  const end = new Date(this.endDate);
  const diffTime = end - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Indexes for better performance
projectSchema.index({ owner: 1, createdAt: -1 });
projectSchema.index({ 'members.user': 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ isDeleted: 1 });

// Pre-save middleware
projectSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'active' && !this.startDate) {
    this.startDate = new Date();
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);
