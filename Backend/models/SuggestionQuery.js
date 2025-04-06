const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['video', 'blog', 'documentation', 'course', 'other'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  description: String,
  source: String
});

const suggestionQuerySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  query: {
    type: String,
    required: true
  },
  userProgress: {
    type: Object,
    required: true
  },
  result: {
    topicsToFocus: [String],
    explanation: String,
    resources: [resourceSchema]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SuggestionQuery', suggestionQuerySchema);
