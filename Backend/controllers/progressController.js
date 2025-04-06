const User = require('../models/User');
const Progress = require('../models/Progress');
const PlatformProfile = require('../models/PlatformProfile');
const mongoose = require('mongoose');

// Add new problem to progress
const addProblem = async (req, res, next) => {
  try {
    const { platform, problemId, title, difficulty, tags, url, status, timeTaken, notes } = req.body;
    
    // Find user by Firebase UID
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Find or create progress for this platform
    let progress = await Progress.findOne({ 
      userId: user._id, 
      platform 
    });
    
    if (!progress) {
      progress = new Progress({
        userId: user._id,
        platform,
        problems: [],
        stats: {
          totalSolved: 0,
          easySolved: 0,
          mediumSolved: 0,
          hardSolved: 0,
          successRate: 0,
          weeklyActivity: [],
          monthlyActivity: [],
          topTags: []
        }
      });
    }
    
    // Check if problem already exists
    const existingProblemIndex = progress.problems.findIndex(p => p.problemId === problemId);
    
    const now = new Date();
    const problemData = {
      problemId,
      title,
      difficulty: difficulty || 'Unknown',
      tags: tags || [],
      url,
      status,
      attemptedAt: now,
      timeTaken,
      notes
    };
    
    if (status === 'Solved') {
      problemData.solvedAt = now;
    }
    
    if (existingProblemIndex !== -1) {
      // Update existing problem
      progress.problems[existingProblemIndex] = {
        ...progress.problems[existingProblemIndex],
        ...problemData
      };
    } else {
      // Add new problem
      progress.problems.push(problemData);
    }
    
    // Update statistics
    updateProgressStats(progress);
    
    await progress.save();
    res.status(200).json(progress);
  } catch (error) {
    next(error);
  }
};

// Update progress statistics
const updateProgressStats = (progress) => {
  const { problems } = progress;
  
  // Calculate solved counts
  const solved = problems.filter(p => p.status === 'Solved');
  progress.stats.totalSolved = solved.length;
  
  progress.stats.easySolved = solved.filter(p => p.difficulty === 'Easy').length;
  progress.stats.mediumSolved = solved.filter(p => p.difficulty === 'Medium').length;
  progress.stats.hardSolved = solved.filter(p => p.difficulty === 'Hard').length;
  
  // Calculate success rate
  const attempted = problems.length;
  progress.stats.successRate = attempted > 0 ? (solved.length / attempted) * 100 : 0;
  
  // Update weekly activity
  const currentDate = new Date();
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay());
  
  const weeklyActivity = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    
    const dayStr = day.toISOString().split('T')[0];
    const count = problems.filter(p => {
      const problemDate = new Date(p.attemptedAt).toISOString().split('T')[0];
      return problemDate === dayStr;
    }).length;
    
    weeklyActivity.push({ date: day, count });
  }
  progress.stats.weeklyActivity = weeklyActivity;
  
  // Update monthly activity
  const monthlyMap = {};
  problems.forEach(problem => {
    const date = new Date(problem.attemptedAt);
    const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
    
    if (!monthlyMap[monthYear]) {
      monthlyMap[monthYear] = 0;
    }
    monthlyMap[monthYear]++;
  });
  
  progress.stats.monthlyActivity = Object.entries(monthlyMap).map(([month, count]) => ({
    month,
    count
  }));
  
  // Update top tags
  const tagMap = {};
  problems.forEach(problem => {
    (problem.tags || []).forEach(tag => {
      if (!tagMap[tag]) {
        tagMap[tag] = 0;
      }
      tagMap[tag]++;
    });
  });
  
  progress.stats.topTags = Object.entries(tagMap)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  progress.lastUpdated = new Date();
};

// Get user progress for all platforms
const getUserProgress = async (req, res, next) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const progress = await Progress.find({ userId: user._id });
    res.status(200).json(progress);
  } catch (error) {
    next(error);
  }
};

// Get user progress for specific platform
const getPlatformProgress = async (req, res, next) => {
  try {
    const { platform } = req.params;
    const user = await User.findOne({ firebaseUID: req.user.uid });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const progress = await Progress.findOne({ 
      userId: user._id, 
      platform 
    });
    
    if (!progress) {
      return res.status(404).json({ message: 'Progress not found for this platform' });
    }
    
    res.status(200).json(progress);
  } catch (error) {
    next(error);
  }
};

// Sync progress with platform profiles
const syncProgressWithProfiles = async (req, res, next) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const results = {
      platforms: [],
      totalUpdated: 0
    };
    
    // Get all platform profiles for user
    const platformProfiles = await PlatformProfile.find({ userId: user._id });
    
    if (!platformProfiles || platformProfiles.length === 0) {
      return res.status(200).json({ 
        message: 'No platform profiles found to sync with progress', 
        results 
      });
    }
    
    // For each platform profile, update progress
    for (const profile of platformProfiles) {
      try {
        let progress = await Progress.findOne({ 
          userId: user._id, 
          platform: profile.platform 
        });
        
        if (!progress) {
          progress = new Progress({
            userId: user._id,
            platform: profile.platform,
            problems: [],
            stats: {
              totalSolved: 0,
              easySolved: 0,
              mediumSolved: 0,
              hardSolved: 0,
              successRate: 0,
              weeklyActivity: [],
              monthlyActivity: [],
              topTags: []
            }
          });
        }
        
        // Update statistics based on platform
        let updated = false;
        
        switch (profile.platform) {
          case 'LeetCode':
            if (progress.stats.totalSolved !== profile.stats.totalSolved) {
              progress.stats.totalSolved = profile.stats.totalSolved || 0;
              progress.stats.easySolved = profile.stats.easySolved || 0;
              progress.stats.mediumSolved = profile.stats.mediumSolved || 0;
              progress.stats.hardSolved = profile.stats.hardSolved || 0;
              updated = true;
            }
            break;
            
          case 'CodeChef':
            if (progress.stats.totalSolved !== profile.stats.totalSolved) {
              progress.stats.totalSolved = profile.stats.totalSolved || 0;
              updated = true;
            }
            break;
            
          case 'GeeksforGeeks':
            if (progress.stats.totalSolved !== profile.stats.totalSolved) {
              progress.stats.totalSolved = profile.stats.totalSolved || 0;
              progress.stats.easySolved = profile.stats.easySolved || 0;
              progress.stats.mediumSolved = profile.stats.mediumSolved || 0;
              progress.stats.hardSolved = profile.stats.hardSolved || 0;
              updated = true;
            }
            break;
            
          case 'Codeforces':
            if (progress.stats.totalSolved !== profile.stats.problemsSolved) {
              progress.stats.totalSolved = profile.stats.problemsSolved || 0;
              updated = true;
            }
            break;
        }
        
        // Import recent problems if available in profile
        if (profile.rawData) {
          let importedProblems = 0;
          
          // Handle LeetCode recent submissions
          if (profile.platform === 'LeetCode' && profile.rawData.recentSubmissions) {
            for (const submission of profile.rawData.recentSubmissions) {
              const existingProblem = progress.problems.find(p => 
                p.problemId === submission.id || p.title === submission.title
              );
              
              if (!existingProblem && submission.title) {
                progress.problems.push({
                  problemId: submission.id || `leetcode-${submission.slug}`,
                  title: submission.title,
                  difficulty: 'Unknown',
                  tags: [],
                  url: `https://leetcode.com/problems/${submission.slug}/`,
                  status: 'Solved',
                  attemptedAt: new Date(submission.timestamp * 1000),
                  solvedAt: new Date(submission.timestamp * 1000)
                });
                importedProblems++;
                updated = true;
              }
            }
          }
          
          // Handle CodeChef recent problems
          if (profile.platform === 'CodeChef' && profile.rawData.stats && profile.rawData.stats.lastSolved) {
            for (const problem of profile.rawData.stats.lastSolved) {
              const existingProblem = progress.problems.find(p => 
                p.problemId === problem.code || p.title === problem.name
              );
              
              if (!existingProblem && problem.name) {
                progress.problems.push({
                  problemId: problem.code || `codechef-${problem.name.replace(/\s+/g, '-').toLowerCase()}`,
                  title: problem.name,
                  difficulty: 'Unknown',
                  tags: [],
                  url: problem.link || '',
                  status: problem.status === 'partially solved' ? 'Attempted' : 'Solved',
                  attemptedAt: new Date(problem.date || Date.now()),
                  solvedAt: problem.status === 'solved' ? new Date(problem.date || Date.now()) : null
                });
                importedProblems++;
                updated = true;
              }
            }
          }
          
          // Handle Codeforces recent submissions
          if (profile.platform === 'Codeforces' && profile.rawData.recentSubmissions) {
            for (const submission of profile.rawData.recentSubmissions) {
              const existingProblem = progress.problems.find(p => 
                p.problemId === submission.problemId || p.title === submission.problemName
              );
              
              if (!existingProblem && submission.problemName) {
                progress.problems.push({
                  problemId: submission.problemId || `codeforces-${Date.now()}`,
                  title: submission.problemName,
                  difficulty: 'Unknown',
                  tags: [],
                  url: submission.link || '',
                  status: submission.verdict === 'OK' ? 'Solved' : 'Attempted',
                  attemptedAt: new Date(submission.submissionTime),
                  solvedAt: submission.verdict === 'OK' ? new Date(submission.submissionTime) : null
                });
                importedProblems++;
                updated = true;
              }
            }
          }
          
          if (importedProblems > 0) {
            console.log(`Imported ${importedProblems} problems from ${profile.platform}`);
          }
        }
        
        if (updated) {
          // Update statistics
          updateProgressStats(progress);
          await progress.save();
          
          results.platforms.push({
            platform: profile.platform,
            updated: true
          });
          results.totalUpdated++;
        } else {
          results.platforms.push({
            platform: profile.platform,
            updated: false
          });
        }
      } catch (error) {
        console.error(`Error syncing progress for ${profile.platform}:`, error);
        results.platforms.push({
          platform: profile.platform,
          updated: false,
          error: error.message
        });
      }
    }
    
    res.status(200).json({
      message: results.totalUpdated > 0 
        ? `Successfully updated progress for ${results.totalUpdated} platforms` 
        : 'No progress updates needed',
      results
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addProblem,
  getUserProgress,
  getPlatformProgress,
  syncProgressWithProfiles
};
