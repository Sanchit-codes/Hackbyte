const mongoose = require('mongoose');

const platformProfileSchema = new mongoose.Schema({
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
  username: {
    type: String,
    required: true
  },
  profileUrl: String,
  lastSynced: {
    type: Date,
    default: Date.now
  },
  rawData: {
    type: mongoose.Schema.Types.Mixed
  },
  stats: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Additional fields for different platforms
  skillTags: [String],         // For LeetCode
  country: String,             // For CodeChef
  institution: String,         // For GeeksforGeeks
  organization: String         // For Codeforces
});

// Compound index to ensure unique platform per user
platformProfileSchema.index({ userId: 1, platform: 1 }, { unique: true });

module.exports = mongoose.model('PlatformProfile', platformProfileSchema);
