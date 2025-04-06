#!/usr/bin/env node

const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Fetch Codeforces profile data by scraping the profile page and using the API
 * @param {string} username - Codeforces username
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
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'max-age=0',
      'TE': 'Trailers'
    };
    
    // Function to handle API requests with retries
    const fetchWithRetry = async (url, options = {}, retries = 2) => {
      try {
        return await axios.get(url, options);
      } catch (error) {
        if (retries > 0 && error.response && (error.response.status === 403 || error.response.status === 429)) {
          console.log(`Request to ${url} failed. Retrying in 2 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          return fetchWithRetry(url, options, retries - 1);
        }
        throw error;
      }
    };
    
    // Try fetching user info from API first
    let userInfo, recentSubmissions, graphData;
    try {
      const userInfoResponse = await fetchWithRetry(`https://codeforces.com/api/user.info?handles=${username}`);
      
      if (userInfoResponse.data.status !== 'OK') {
        throw new Error(`Failed to fetch user info: ${userInfoResponse.data.comment || 'Unknown API error'}`);
      }
      
      userInfo = userInfoResponse.data.result[0];
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Fetch recent submissions
      const userStatusResponse = await fetchWithRetry(`https://codeforces.com/api/user.status?handle=${username}&from=1&count=20`);
      
      recentSubmissions = [];
      if (userStatusResponse.data.status === 'OK') {
        recentSubmissions = userStatusResponse.data.result.slice(0, 5).map(submission => ({
          problemId: submission.problem.contestId + submission.problem.index,
          problemName: submission.problem.name,
          verdict: submission.verdict,
          programmingLanguage: submission.programmingLanguage,
          submissionTime: new Date(submission.creationTimeSeconds * 1000).toISOString(),
          link: `https://codeforces.com/contest/${submission.contestId}/submission/${submission.id}`
        }));
      }
    } catch (apiError) {
      console.warn(`API request failed: ${apiError.message}. Falling back to webpage scraping.`);
    }
    
    // Always attempt to fetch the profile page for additional data
    try {
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const profilePageResponse = await fetchWithRetry(`https://codeforces.com/profile/${username}`, { headers });
      
      // Parse HTML response
      const $ = cheerio.load(profilePageResponse.data);
      
      // Extract rating history
      graphData = extractRatingHistory($);
      
      // If we didn't get user info from API, extract from HTML
      if (!userInfo) {
        userInfo = {
          handle: username,
          rank: $('.user-rank span').first().text().trim(),
          rating: parseInt($('.info li:contains("Contest rating") span').text().trim()) || 0,
          maxRating: parseInt($('.info li:contains("max.") span').text().trim()) || 0,
          contribution: parseInt($('.info li:contains("Contribution") span').text().trim()) || 0
        };
        
        // Extract name
        const titleText = $('div.main-info h1').text().trim();
        const nameParts = titleText.split('(');
        if (nameParts.length > 1) {
          userInfo.firstName = nameParts[0].trim();
        }
        
        // Extract avatar
        userInfo.titlePhoto = $('div.title-photo img').attr('src') || '';
      }
      
      // Extract solved problems count
      const solvedProblems = {
        total: 0,
        byTags: {}
      };
      
      // Try different selectors for problem count
      const problemCountSelectors = [
        'div._UserActivityFrame_counterValue',
        '.personal-sidebar li:contains("Solved problems") span'
      ];
      
      for (const selector of problemCountSelectors) {
        const solvedText = $(selector).first().text().trim();
        if (solvedText && !isNaN(parseInt(solvedText))) {
          solvedProblems.total = parseInt(solvedText);
          break;
        }
      }
      
      // Format profile data
      const profileData = {
        username: userInfo.handle,
        name: userInfo.firstName && userInfo.lastName ? `${userInfo.firstName} ${userInfo.lastName}` : (userInfo.firstName || userInfo.handle),
        avatar: userInfo.titlePhoto ? (userInfo.titlePhoto.startsWith('http') ? userInfo.titlePhoto : `https:${userInfo.titlePhoto}`) : '',
        country: userInfo.country || '',
        city: userInfo.city || '',
        organization: userInfo.organization || '',
        rank: {
          title: userInfo.rank || '',
          colorCode: getRankColor(userInfo.rank),
          rating: userInfo.rating || 0,
          maxRating: userInfo.maxRating || 0,
          maxRank: userInfo.maxRank || ''
        },
        contributions: userInfo.contribution || 0,
        registrationDate: userInfo.registrationTimeSeconds ? new Date(userInfo.registrationTimeSeconds * 1000).toISOString() : '',
        lastVisit: userInfo.lastOnlineTimeSeconds ? new Date(userInfo.lastOnlineTimeSeconds * 1000).toISOString() : '',
        stats: {
          problemsSolved: solvedProblems.total,
          byTags: solvedProblems.byTags
        },
        recentSubmissions: recentSubmissions || [],
        ratingHistory: graphData || []
      };
      
      return profileData;
    } catch (htmlError) {
      if (userInfo) {
        // If we have at least basic user info from API, return a partial profile
        return {
          username: userInfo.handle,
          name: userInfo.firstName && userInfo.lastName ? `${userInfo.firstName} ${userInfo.lastName}` : userInfo.handle,
          avatar: userInfo.titlePhoto ? `https:${userInfo.titlePhoto}` : '',
          country: userInfo.country || '',
          city: userInfo.city || '',
          organization: userInfo.organization || '',
          rank: {
            title: userInfo.rank || '',
            colorCode: getRankColor(userInfo.rank),
            rating: userInfo.rating || 0,
            maxRating: userInfo.maxRating || 0,
            maxRank: userInfo.maxRank || ''
          },
          contributions: userInfo.contribution || 0,
          registrationDate: userInfo.registrationTimeSeconds ? new Date(userInfo.registrationTimeSeconds * 1000).toISOString() : '',
          lastVisit: userInfo.lastOnlineTimeSeconds ? new Date(userInfo.lastOnlineTimeSeconds * 1000).toISOString() : '',
          recentSubmissions: recentSubmissions || [],
          note: "Limited profile data available due to scraping restrictions"
        };
      }
      
      throw htmlError;
    }
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      if (status === 403) {
        throw new Error(`Access to Codeforces is forbidden. The service might be blocking scraping attempts.`);
      } else if (status === 404) {
        throw new Error(`User '${username}' not found on Codeforces`);
      } else if (status === 429) {
        throw new Error(`Too many requests to Codeforces. Please try again later.`);
      }
      throw new Error(`Failed to fetch profile for '${username}': ${status} ${error.response.statusText}`);
    }
    throw new Error(`Failed to fetch profile for '${username}': ${error.message}`);
  }
}

/**
 * Extract rating history data from JavaScript on the page
 * @param {Object} $ - Cheerio object with loaded HTML
 * @returns {Array} Rating history data
 */
function extractRatingHistory($) {
  try {
    let ratingHistory = [];
    
    // Try to find the JavaScript containing the rating data
    $('script').each((i, elem) => {
      const scriptContent = $(elem).html() || '';
      
      if (scriptContent.includes('Codeforces.getRatingGraphData')) {
        // Extract the JSON array from the JavaScript
        const match = scriptContent.match(/Codeforces\.getRatingGraphData\s*=\s*(\[.*?\]);/s);
        if (match && match[1]) {
          try {
            ratingHistory = JSON.parse(match[1]).map(entry => ({
              contestId: entry.contestId,
              contestName: entry.contestName,
              rank: entry.rank,
              ratingChange: entry.newRating - (entry.oldRating || 0),
              oldRating: entry.oldRating || 0,
              newRating: entry.newRating
            }));
          } catch (parseError) {
            console.error('Error parsing rating history:', parseError.message);
          }
        }
      }
    });
    
    return ratingHistory;
  } catch (error) {
    console.error('Error extracting rating history:', error.message);
    return [];
  }
}

/**
 * Get color code for Codeforces rank
 * @param {string} rank - Codeforces rank title
 * @returns {string} Color code hex value
 */
function getRankColor(rank) {
  if (!rank) return '#000000';
  
  const rankColors = {
    'legendary grandmaster': '#FF0000',
    'international grandmaster': '#FF0000',
    'grandmaster': '#FF0000',
    'international master': '#FF8C00',
    'master': '#FF8C00',
    'candidate master': '#AA00AA',
    'expert': '#0000FF',
    'specialist': '#03A89E',
    'pupil': '#008000',
    'newbie': '#808080'
  };
  
  const normalizedRank = rank.toLowerCase();
  return rankColors[normalizedRank] || '#000000';
}

/**
 * Main function to run the script
 */
async function main() {
  // Get username from command line arguments
  const username = process.argv[2] || 'tourist';
  
  if (!username) {
    console.error('Error: Username is required');
    console.error('Usage: node codeforces-profile.js <username>');
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
