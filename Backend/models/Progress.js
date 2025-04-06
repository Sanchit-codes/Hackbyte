const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  problemId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard', 'Unknown'],
    default: 'Unknown'
  },
  tags: [String],
  url: String,
  status: {
    type: String,
    enum: ['Solved', 'Attempted', 'Failed'],
    required: true
  },
  attemptedAt: {
    type: Date,
    default: Date.now
  },
  solvedAt: Date,
  timeTaken: Number,  // in minutes
  notes: String
});

const progressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    enum: ['LeetCode', 'CodeChef', 'GeeksforGeeks', 'Codeforces'],
    required: true
  },
  problems: [problemSchema],
  stats: {
    totalSolved: {
      type: Number,
      default: 0
    },
    easySolved: {
      type: Number,
      default: 0
    },
    mediumSolved: {
      type: Number,
      default: 0
    },
    hardSolved: {
      type: Number,
      default: 0
    },
    successRate: {
      type: Number,
      default: 0
    },
    // Store weekly activity as array of objects with date and count
    weeklyActivity: [{
      date: Date,
      count: Number
    }],
    // Store monthly activity as array of objects with month and count
    monthlyActivity: [{
      month: String,
      count: Number
    }],
    topTags: [{
      tag: String,
      count: Number
    }]
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Progress', progressSchema);
