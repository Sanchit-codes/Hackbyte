const User = require('../models/User');
const Progress = require('../models/Progress');
const SuggestionQuery = require('../models/SuggestionQuery');
const geminiModel = require('../config/gemini');

// Generate suggestions using Gemini API
const generateSuggestions = async (req, res, next) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get user progress from all platforms
    const progressData = await Progress.find({ userId: user._id });
    
    if (!progressData || progressData.length === 0) {
      return res.status(400).json({ 
        message: 'Not enough progress data to generate suggestions. Please add some problems first.' 
      });
    }
    
    // Prepare data for Gemini API
    const userProgressSummary = progressData.map(progress => ({
      platform: progress.platform,
      totalSolved: progress.stats.totalSolved,
      easySolved: progress.stats.easySolved,
      mediumSolved: progress.stats.mediumSolved,
      hardSolved: progress.stats.hardSolved,
      successRate: progress.stats.successRate,
      topTags: progress.stats.topTags,
      recentProblems: progress.problems
        .sort((a, b) => new Date(b.attemptedAt) - new Date(a.attemptedAt))
        .slice(0, 10)
        .map(p => ({
          title: p.title,
          difficulty: p.difficulty,
          status: p.status,
          tags: p.tags
        }))
    }));
    
    // Create prompt for Gemini
    const prompt = `
    I'm using various competitive programming platforms. Based on my progress data below, please suggest:
    1. What topics I should focus on next to improve
    2. Resources I should check out (videos, blogs, courses)
    3. A brief explanation of why these recommendations would help me
    
    My progress data:
    ${JSON.stringify(userProgressSummary, null, 2)}
    
    Please format your response as a JSON object with the following structure:
    {
      "topicsToFocus": ["topic1", "topic2", "topic3"],
      "explanation": "Brief explanation of recommendations",
      "resources": [
        {
          "type": "video|blog|documentation|course|other",
          "title": "Resource title",
          "url": "Resource URL",
          "description": "Brief description",
          "source": "Source (e.g., YouTube, Medium)"
        }
      ]
    }
    `;
    
    // Call Gemini API
    const result = await geminiModel.generateContent(prompt);
    const response = result.response;
    const textResponse = response.text();
    
    // Parse Gemini's response
    let parsedResponse;
    try {
      // Extract JSON from response (in case Gemini adds any text before/after)
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not extract JSON from response');
      }
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      return res.status(500).json({ 
        message: 'Error parsing suggestion response', 
        rawResponse: textResponse 
      });
    }
    
    // Save suggestion query to database
    const suggestionQuery = new SuggestionQuery({
      userId: user._id,
      query: prompt,
      userProgress: userProgressSummary,
      result: parsedResponse
    });
    
    await suggestionQuery.save();
    
    res.status(200).json(parsedResponse);
  } catch (error) {
    console.error('Suggestion generation error:', error);
    next(error);
  }
};

// Get suggestion history
const getSuggestionHistory = async (req, res, next) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const suggestions = await SuggestionQuery.find({ 
      userId: user._id 
    }).sort({ createdAt: -1 });
    
    res.status(200).json(suggestions);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateSuggestions,
  getSuggestionHistory
};
