#!/usr/bin/env node

const axios = require('axios');

/**
 * Fetch LeetCode profile data using GraphQL API
 * @param {string} username - LeetCode username
 * @returns {Promise<Object>} Extracted profile data
 */
async function fetchProfile(username) {
  try {
    console.log(`Fetching profile for ${username}...`);
    
    // GraphQL query
    const query = {
      query: `query getFullUserData($username: String!) { 
        userProfile: matchedUser(username: $username) { 
          username 
          profile { 
            realName 
            ranking 
            userAvatar 
            skillTags 
          } 
          submitStatsGlobal { 
            acSubmissionNum { 
              difficulty 
              count 
            } 
          } 
        } 
        recentSubmissions: recentAcSubmissionList(username: $username) { 
          id 
          title 
          titleSlug 
          timestamp 
        } 
      }`,
      variables: {
        username: username
      }
    };
    
    // Fetch data from GraphQL API
    const response = await axios.post('https://leetcode.com/graphql', query, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Check if the response contains the expected data
    if (!response.data || !response.data.data || !response.data.data.userProfile) {
      throw new Error(`User '${username}' not found on LeetCode`);
    }
    
    const data = response.data.data;
    // Extract and format the data
    const userData = data.userProfile;
    const profileData = {
      username: userData.username,
      name: userData.profile.realName || '',
      avatar: userData.profile.userAvatar || '',
      ranking: userData.profile.ranking || 0,
      skillTags: userData.profile.skillTags || [],
      stats: processStats(userData.submitStatsGlobal.acSubmissionNum || []),
      recentSubmissions: processRecentSubmissions(data.recentSubmissions || [])
    };
    
    return profileData;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new Error(`User '${username}' not found on LeetCode`);
    }
    throw new Error(`Failed to fetch profile for '${username}': ${error.message}`);
  }
}

/**
 * Process the submission statistics from GraphQL response
 * @param {Array} submissions - Array of submission counts by difficulty
 * @returns {Object} Formatted stats object
 */
function processStats(submissions) {
  const stats = {
    totalSolved: 0,
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0
  };
  
  submissions.forEach(item => {
    const count = item.count || 0;
    
    // Update the appropriate counter based on difficulty
    switch(item.difficulty) {
      case 'All':
        stats.totalSolved = count;
        break;
      case 'Easy':
        stats.easySolved = count;
        break;
      case 'Medium':
        stats.mediumSolved = count;
        break;
      case 'Hard':
        stats.hardSolved = count;
        break;
    }
  });
  
  return stats;
}

/**
 * Process recent submissions from GraphQL response
 * @param {Array} submissions - Array of recent submissions
 * @returns {Array} Formatted submissions array
 */
function processRecentSubmissions(submissions) {
  return submissions.map(submission => {
    return {
      id: submission.id,
      title: submission.title,
      slug: submission.titleSlug,
      timestamp: submission.timestamp,
      date: new Date(parseInt(submission.timestamp) * 1000).toLocaleString()
    };
  });
}

/**
 * Main function to run the script
 */
async function main() {
  // Get username from command line arguments
  const username = process.argv[2] || "sanchit-codes";
  
  if (!username) {
    console.error('Error: Username is required');
    console.error('Usage: node leetcode-profile.js <username>');
    process.exit(1);
  }
  
  try {
    const profile = await fetchProfile(username);
    console.log('Profile data:');
    console.log(JSON.stringify(profile, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();