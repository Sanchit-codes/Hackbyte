#!/usr/bin/env node

const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Fetch GeeksforGeeks profile data by scraping the profile page
 * @param {string} username - GeeksforGeeks username
 * @returns {Promise<Object>} Extracted profile data
 */
async function fetchProfile(username) {
  try {
    console.log(`Fetching profile for ${username}...`);
    
    // Enhanced headers to mimic a real browser
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Cache-Control': 'max-age=0',
      'Referer': 'https://www.geeksforgeeks.org/'
    };
    
    // Only use the specified URL format
    const profileUrl = `https://www.geeksforgeeks.org/user/${username}/`;
    
    // Fetch the profile data
    const response = await axios.get(profileUrl, { 
      headers, 
      timeout: 15000,
      maxRedirects: 5
    });
    
    if (response.status !== 200) {
      throw new Error(`Failed to fetch profile with status code: ${response.status}`);
    }
    
    const $ = cheerio.load(response.data);
    
    // Check if we have meaningful content
    const pageTitle = $('title').text();
    
    if (pageTitle.includes('Page not found') || pageTitle.includes('404')) {
      throw new Error(`User '${username}' not found on GeeksforGeeks`);
    }
    
    // Extract basic profile data with precise selectors based on the HTML reference
    const name = $('.profilePicSection_head_userHandle__oOfFy').text().trim() || username;
    
    // Extract avatar
    const avatar = $('.profilePicSection_head_img__1GLm0 img').attr('src') || '';
    
    // Extract institution from reference classes
    const institution = $('.educationDetails_head_left--text__tgi9I').text().trim();
    
    // Extract institution rank
    const institutionRank = $('.educationDetails_head_left_userRankContainer--text__wt81s b').text().trim();
    
    // Extract language used
    const languageUsed = $('.educationDetails_head_right--text__lLOHI').text().trim();
    
    // Extract coding score with precise selector
    const codingScore = $('.scoreCard_head__nxXR8:contains("Coding Score") .scoreCard_head_left--score__oSi_x').text().trim();
    
    // Extract problems solved count
    const problemsSolvedTotal = $('.scoreCard_head__nxXR8:contains("Problem Solved") .scoreCard_head_left--score__oSi_x').text().trim();
    
    // Extract contest rating
    const contestRating = $('.scoreCard_head__nxXR8:contains("Contest Rating") .scoreCard_head_left--score__oSi_x').text().trim();
    
    // Extract streak information
    const currentStreak = $('.circularProgressBar_head_mid_streakCnt__MFOF1').text().trim().split('/')[0] || '0';

    // Extract problems by difficulty level
    const problemsByDifficulty = {
      school: 0,
      basic: 0,
      easy: 0,
      medium: 0,
      hard: 0
    };
    
    // Use problemNavbar elements to extract problem counts by difficulty
    $('.problemNavbar_head_nav__a4K6P').each((i, elem) => {
      const text = $(elem).find('.problemNavbar_head_nav--text__UaGCx').text().trim();
      const difficultyMatch = text.match(/(SCHOOL|BASIC|EASY|MEDIUM|HARD)\s*\(\s*(\d+)\s*\)/i);
      
      if (difficultyMatch) {
        const difficulty = difficultyMatch[1].toLowerCase();
        const count = parseInt(difficultyMatch[2]);
        problemsByDifficulty[difficulty] = count;
      }
    });
    
    // Calculate total if not found directly
    const calculatedTotal = Object.values(problemsByDifficulty).reduce((acc, curr) => acc + curr, 0);
    
    // Format and return the profile data
    const profileData = {
      username: name,
      institution: institution,
      institutionRank: institutionRank,
      languageUsed: languageUsed,
      codingScore: parseInt(codingScore) || 0,
      contestRating: contestRating === '__' ? null : parseInt(contestRating) || 0,
      stats: {
        problemsSolved: {
          total: parseInt(problemsSolvedTotal) || calculatedTotal || 0,
          ...problemsByDifficulty
        },
        streak: {
          current: parseInt(currentStreak) || 0,
        }
      },
      source: profileUrl
    };
    
    return profileData;
  } catch (error) {
    if (error.response) {
      if (error.response.status === 404) {
        throw new Error(`User '${username}' not found on GeeksforGeeks`);
      }
      throw new Error(`Failed to fetch profile for '${username}': ${error.response.status} ${error.response.statusText}`);
    }
    throw new Error(`Failed to fetch profile for '${username}': ${error.message}`);
  }
}

/**
 * Main function to run the script
 */
async function main() {
  const username = process.argv[2] || "sanskarpatidar747"; 
  
  if (!username) {
    console.error('Error: Username is required');
    console.error('Usage: node geeksforgeeks-profile.js <username>');
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
