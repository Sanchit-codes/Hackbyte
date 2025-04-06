const { spawn } = require('child_process');
const path = require('path');

/**
 * Fetch profile data from platforms using the appropriate scraper
 * @param {string} platform - Platform name (LeetCode, CodeChef, GeeksforGeeks, Codeforces)
 * @param {string} username - Platform username
 * @returns {Promise<Object>} - Profile data
 */
const fetchProfileData = async (platform, username) => {
  if (!username) {
    throw new Error('Username is required');
  }

  const scrapperMap = {
    'LeetCode': 'leetcode-profile.js',
    'CodeChef': 'codechef-profile.js',
    'GeeksforGeeks': 'geeksforgeeks-profile.js',
    'Codeforces': 'codeforces-profile.js'
  };

  const scriptName = scrapperMap[platform];
  
  if (!scriptName) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  return new Promise((resolve, reject) => {
    // Path to the scraper script
    const scriptPath = path.join(__dirname, '../Scappers', scriptName);
    
    // Spawn the script as a child process
    const scraper = spawn('node', [scriptPath, username]);

    let outputData = '';
    let errorData = '';

    // Collect data from the script
    scraper.stdout.on('data', (data) => {
      outputData += data.toString();
    });

    scraper.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    // Handle script completion
    scraper.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Scraper exited with code ${code}: ${errorData}`));
      }

      try {
        // Extract JSON data from output
        const jsonMatch = outputData.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const profileData = JSON.parse(jsonMatch[0]);
          resolve(profileData);
        } else {
          reject(new Error('No valid JSON data found in scraper output'));
        }
      } catch (error) {
        reject(new Error(`Failed to parse scraper output: ${error.message}`));
      }
    });

    // Handle script errors
    scraper.on('error', (error) => {
      reject(new Error(`Failed to start scraper: ${error.message}`));
    });

    // Set a timeout for the scraper
    const timeout = setTimeout(() => {
      scraper.kill();
      reject(new Error('Scraper timed out after 30 seconds'));
    }, 30000);

    // Clear timeout when done
    scraper.on('close', () => clearTimeout(timeout));
  });
};

/**
 * Process profile data based on platform
 * @param {string} platform - Platform name
 * @param {Object} profileData - Raw profile data from scraper
 * @returns {Object} - Processed profile data
 */
const processProfileData = (platform, profileData) => {
  // Basic profile info common to all platforms
  const processedData = {
    platform,
    username: profileData.username,
    profileUrl: profileData.source || '',
    lastSynced: new Date(),
    stats: {}
  };

  // Process platform-specific data
  switch (platform) {
    case 'LeetCode':
      processedData.stats = {
        totalSolved: profileData.stats.totalSolved || 0,
        easySolved: profileData.stats.easySolved || 0,
        mediumSolved: profileData.stats.mediumSolved || 0,
        hardSolved: profileData.stats.hardSolved || 0,
        ranking: profileData.ranking || 0,
        recentSubmissions: profileData.recentSubmissions || []
      };
      processedData.skillTags = profileData.skillTags || [];
      break;
      
    case 'CodeChef':
      processedData.stats = {
        rating: profileData.rating || 0,
        stars: profileData.stars || '',
        totalSolved: profileData.stats?.total || 0,
        recentProblems: profileData.stats?.lastSolved || []
      };
      processedData.country = profileData.country?.name || '';
      break;
      
    case 'GeeksforGeeks':
      processedData.stats = {
        codingScore: profileData.codingScore || 0,
        totalSolved: profileData.stats?.problemsSolved?.total || 0,
        schoolSolved: profileData.stats?.problemsSolved?.school || 0,
        basicSolved: profileData.stats?.problemsSolved?.basic || 0,
        easySolved: profileData.stats?.problemsSolved?.easy || 0,
        mediumSolved: profileData.stats?.problemsSolved?.medium || 0,
        hardSolved: profileData.stats?.problemsSolved?.hard || 0,
        streak: profileData.stats?.streak?.current || 0
      };
      processedData.institution = profileData.institution || '';
      break;
      
    case 'Codeforces':
      processedData.stats = {
        rating: profileData.rank?.rating || 0,
        maxRating: profileData.rank?.maxRating || 0,
        rank: profileData.rank?.title || '',
        problemsSolved: profileData.stats?.problemsSolved || 0,
        recentSubmissions: profileData.recentSubmissions || []
      };
      processedData.organization = profileData.organization || '';
      break;
  }

  return processedData;
};

module.exports = {
  fetchProfileData,
  processProfileData
};
