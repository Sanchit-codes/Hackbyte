const User = require('../models/User');
const Progress = require('../models/Progress');
const PlatformProfile = require('../models/PlatformProfile');
const axios = require('axios');

// Refresh dashboard data
const refreshDashboard = async (req, res, next) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.platformHandles.length === 0) {
      return res.status(200).json({ 
        message: 'No platform handles configured',
        userData: user,
        progress: [],
        profiles: []
      });
    }
    
    // Create a local request to sync all platforms
    const platformSyncResults = await syncPlatforms(req);
    
    // Create a local request to sync progress
    const progressSyncResults = await syncProgress(req);
    
    // Get latest user data, profiles, and progress
    const updatedUser = await User.findOne({ firebaseUID: req.user.uid });
    const profiles = await PlatformProfile.find({ userId: user._id });
    const progress = await Progress.find({ userId: user._id });
    
    res.status(200).json({
      message: 'Dashboard refreshed successfully',
      userData: updatedUser,
      profiles,
      progress,
      syncResults: {
        platforms: platformSyncResults,
        progress: progressSyncResults
      }
    });
  } catch (error) {
    console.error('Dashboard refresh error:', error);
    next(error);
  }
};

// Get dashboard data
const getDashboardData = async (req, res, next) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get all platform profiles and progress for the user
    const profiles = await PlatformProfile.find({ userId: user._id });
    const progressData = await Progress.find({ userId: user._id });
    
    // Generate activity data from progress
    const activityData = generateActivityData(progressData);
    
    // Extract skills from user's profiles and progress
    const skills = extractSkills(profiles, progressData);
    
    // Get recent activities
    const recentActivities = getRecentActivities(progressData, profiles);
    
    res.status(200).json({
      userData: {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        platformHandles: user.platformHandles
      },
      profiles,
      progress: progressData,
      activityData,
      skills,
      recentActivities
    });
  } catch (error) {
    console.error('Get dashboard data error:', error);
    next(error);
  }
};

// Helper function to generate activity data
const generateActivityData = (progressData) => {
  // Create a map for the last 6 months
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const name = date.toLocaleDateString('en-US', { month: 'short' });
    months.push({ name, value: 0 });
  }
  
  // Populate with real data if available
  progressData.forEach(progress => {
    if (progress.stats?.monthlyActivity) {
      progress.stats.monthlyActivity.forEach(month => {
        const monthDate = new Date(month.month.split('-')[0], month.month.split('-')[1] - 1);
        const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
        const monthIndex = months.findIndex(m => m.name === monthName);
        if (monthIndex !== -1) {
          months[monthIndex].value += month.count;
        }
      });
    }
  });
  
  return months;
};

// Helper function to extract skills
const extractSkills = (profiles, progressData) => {
  const skillsSet = new Set();
  
  // Extract skills from all platform profiles
  profiles.forEach(profile => {
    // Extract skills from LeetCode profiles
    if (profile.platform === 'LeetCode' && profile.skillTags) {
      profile.skillTags.forEach(skill => skillsSet.add(skill));
    }
    
    // Extract skills from GeeksforGeeks profiles
    if (profile.platform === 'GeeksforGeeks') {
      // Add problem categories as skills
      if (profile.stats.easySolved > 0) skillsSet.add('Easy Problems');
      if (profile.stats.mediumSolved > 0) skillsSet.add('Medium Problems');
      if (profile.stats.hardSolved > 0) skillsSet.add('Hard Problems');
      
      // Add GeeksforGeeks-specific skills
      skillsSet.add('GeeksforGeeks');
      
      // Check if there's raw data with more detailed information
      if (profile.rawData && profile.rawData.languageUsed) {
        skillsSet.add(profile.rawData.languageUsed);
      }
    }
    
    // Extract skills from Codeforces profiles
    if (profile.platform === 'Codeforces') {
      skillsSet.add('Competitive Programming');
      
      // Extract tags from recent submissions if available
      if (profile.rawData && profile.rawData.recentSubmissions) {
        profile.rawData.recentSubmissions.forEach(submission => {
          if (submission.tags) {
            submission.tags.forEach(tag => skillsSet.add(tag));
          }
        });
      }
    }
    
    // Extract skills from CodeChef profiles
    if (profile.platform === 'CodeChef') {
      skillsSet.add('Competitive Programming');
      
      // Add skill based on rating if available
      if (profile.stats && profile.stats.rating) {
        const rating = parseInt(profile.stats.rating);
        if (rating > 1800) skillsSet.add('Advanced Algorithms');
        else if (rating > 1400) skillsSet.add('Intermediate Algorithms');
        else skillsSet.add('Basic Algorithms');
      }
    }
  });
  
  // Extract top tags from progress
  progressData.forEach(progress => {
    if (progress.stats?.topTags) {
      progress.stats.topTags.forEach(tag => skillsSet.add(tag.tag));
    }
  });
  
  // If we don't have enough skills, add some common programming languages
  const commonSkills = ['Algorithms', 'Data Structures', 'Dynamic Programming', 'Arrays', 'Strings'];
  if (skillsSet.size < 5) {
    commonSkills.forEach(skill => skillsSet.add(skill));
  }
  
  return Array.from(skillsSet).slice(0, 8);
};

// Helper function to get recent activities
const getRecentActivities = (progressData, profiles) => {
  const activities = [];
  
  // Get recent problems from progress
  progressData.forEach(progress => {
    if (progress.problems && progress.problems.length > 0) {
      // Sort problems by attempted date in descending order
      const sortedProblems = [...progress.problems]
        .sort((a, b) => new Date(b.attemptedAt) - new Date(a.attemptedAt))
        .slice(0, 5);
      
      sortedProblems.forEach(problem => {
        activities.push(`${problem.status} ${progress.platform} problem: ${problem.title}`);
      });
    }
  });
  
  // Get recent profile syncs
  profiles.forEach(profile => {
    if (profile.lastSynced) {
      activities.push(`Synced ${profile.platform} profile: ${profile.username}`);
    }
  });
  
  // Sort by recency (assuming most recent first)
  return activities.slice(0, 10);
};

// Helper functions for making internal API calls
const syncPlatforms = async (req) => {
  try {
    // Create a mini express app to handle the request
    const app = {
      status: (code) => {
        return {
          json: (data) => data
        };
      }
    };
    
    // Set up next handler that returns the error or result
    const next = (error) => {
      if (error) throw error;
    };
    
    // Import controller
    const { syncAllPlatforms } = require('./profileController');
    
    // Call controller directly
    return await syncAllPlatforms(req, app, next);
  } catch (error) {
    console.error('Error syncing platforms:', error);
    return { error: error.message };
  }
};

const syncProgress = async (req) => {
  try {
    // Create a mini express app to handle the request
    const app = {
      status: (code) => {
        return {
          json: (data) => data
        };
      }
    };
    
    // Set up next handler that returns the error or result
    const next = (error) => {
      if (error) throw error;
    };
    
    // Import controller
    const { syncProgressWithProfiles } = require('./progressController');
    
    // Call controller directly
    return await syncProgressWithProfiles(req, app, next);
  } catch (error) {
    console.error('Error syncing progress:', error);
    return { error: error.message };
  }
};

module.exports = {
  getDashboardData,
  refreshDashboard
};
