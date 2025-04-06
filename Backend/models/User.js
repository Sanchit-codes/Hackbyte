const mongoose = require('mongoose');

const platformHandleSchema = new mongoose.Schema({
  platform: {
    type: String,
    enum: ['LeetCode', 'CodeChef', 'GeeksforGeeks', 'Codeforces'],
    required: true
  },
  handle: {
    type: String,
    required: true
  },
  lastSynced: {
    type: Date,
    default: null
  },
  syncInProgress: {
    type: Boolean,
    default: false
  },
  lastSyncError: {
    type: String,
    default: null
  }
});

const userSchema = new mongoose.Schema({
  firebaseUID: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    required: true
  },
  photoURL: {
    type: String,
    default: null
  },
  platformHandles: [platformHandleSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
});

// Add validation to ensure unique platforms
userSchema.pre('save', function(next) {
  const platforms = this.platformHandles.map(handle => handle.platform);
  const uniquePlatforms = new Set(platforms);
  
  if (platforms.length !== uniquePlatforms.size) {
    const error = new Error('Duplicate coding platforms detected. Each platform can only be added once.');
    error.statusCode = 400;
    return next(error);
  }
  
  next();
});

module.exports = mongoose.model('User', userSchema);
