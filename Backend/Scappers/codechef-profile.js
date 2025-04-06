#!/usr/bin/env node

const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Extract contest history data from page scripts
 * @param {Object} $ - Cheerio instance loaded with the page HTML
 * @returns {Array} Contest history data
 */
function extractContestHistory($) {
  try {
    let contestHistory = [];
    
    // Look for scripts that might contain the Drupal settings
    $('script').each((i, elem) => {
      const scriptContent = $(elem).html() || '';
      
      if (scriptContent.includes('Query.extend(Drupal.settings')) {
        // Extract the JSON-like content
        const match = scriptContent.match(/Query\.extend\(Drupal\.settings,\s*(\{.*?\})\);/s);
        if (match && match[1]) {
          try {
            // Replace single quotes with double quotes for JSON parsing
            const jsonText = match[1].replace(/'/g, '"');
            // Parse the JSON-like content
            const settings = JSON.parse(jsonText);
            
            if (settings && settings.date_versus_rating && settings.date_versus_rating.all) {
              contestHistory = settings.date_versus_rating.all.map(contest => ({
                code: contest.code,
                name: contest.name,
                date: `${contest.getyear}-${contest.getmonth}-${contest.getday}`,
                rating: contest.rating,
                rank: contest.rank,
                color: contest.color
              }));
            }
          } catch (parseError) {
            console.error('Error parsing contest history:', parseError.message);
          }
        }
      }
    });
    
    return contestHistory;
  } catch (error) {
    console.error('Error extracting contest history:', error.message);
    return [];
  }
}

/**
 * Fetch CodeChef profile data by scraping the profile page
 * @param {string} username - CodeChef username
 * @returns {Promise<Object>} Extracted profile data
 */
async function fetchProfile(username) {
  try {
    console.log(`Fetching profile for ${username}...`);
    
    // Fetch the user's profile page
    const response = await axios.get(`https://www.codechef.com/users/${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    // Parse HTML response
    const $ = cheerio.load(response.data);
    
    // Extract basic profile data
    const name = $('.m-username').text().trim();
    
    // Extract avatar URL
    const avatar = $('.user-details-container img').attr('src') || '';
    
    // Extract country (improve with additional details if available)
    const country = $('.user-country-name').text().trim();
    const countryFlag = $('.user-country-flag img').attr('src') || '';
    
    // Extract user information - fix the undefined variable issue
    const userRating = $('.rating-number').text().trim() || '0';
    
    // Extract global rank and other ranks more specifically
    const globalRank = $('.rating-ranks').find('strong').eq(0).text().trim();
    const countryRank = $('.rating-ranks').find('strong').eq(1).text().trim();
    
    // Extract stars/badges
    const stars = $('.rating-star').text().trim();
    
    // Get more detailed problem solving stats
    const solvedStats = {
      total: 0,
      fullySolved: 0,
      partiallySolved: 0
    };
    
    // Parse the problems solved section
    $('.problems-solved h5').each((i, elem) => {
      const text = $(elem).text().trim();
      if (text.includes('Fully Solved')) {
        const match = text.match(/\((\d+)\)/);
        if (match) {
          solvedStats.fullySolved = parseInt(match[1], 10);
        }
      } else if (text.includes('Partially Solved')) {
        const match = text.match(/\((\d+)\)/);
        if (match) {
          solvedStats.partiallySolved = parseInt(match[1], 10);
        }
      }
    });
    
    solvedStats.total = solvedStats.fullySolved + solvedStats.partiallySolved;
    
    // Extract recently solved problems - improved selectors and extraction
    const recentlySolvedProblems = [];
    
    // Try multiple selectors to find recent activity
    const selectors = [
      // Main recent activity section
      '.rating-data-section:contains("Recent Activity")',
      // Alternative content container 
      '#content-regions .content-container table',
      // Problems section
      '.problems-solved + div table',
      // User profile submissions
      '.user-profile-data table'
    ];
    
    // Try each selector until we find results
    for (const selector of selectors) {
      $(selector).find('table tbody tr, tr').each((i, elem) => {
        if (i < 10) { // Get more problems and filter later
          const problemName = $(elem).find('td:nth-child(1)').text().trim();
          const problemLink = $(elem).find('td:nth-child(1) a').attr('href') || '';
          const problemDate = $(elem).find('td:nth-child(2)').text().trim();
          const problemStatus = $(elem).find('td:nth-child(3)').text().trim() || 'Solved';
          
          // Only add if we have at least a problem name
          if (problemName && !problemName.includes('Contest') && !problemName.includes('Challenge')) {
            const problem = {
              name: problemName,
              code: problemLink.split('/').pop() || '',
              link: problemLink.startsWith('http') ? problemLink : `https://www.codechef.com${problemLink}`,
              date: problemDate,
              status: problemStatus
            };
            
            // Only add if not already in the list
            if (!recentlySolvedProblems.some(p => p.name === problem.name)) {
              recentlySolvedProblems.push(problem);
            }
          }
        }
      });
      
      // If we found problems, no need to try other selectors
      if (recentlySolvedProblems.length > 0) {
        break;
      }
    }
    
    // Limit to 5 recent problems
    const topRecentProblems = recentlySolvedProblems.slice(0, 5);
    
    // Log what we found for debugging
    console.log(`Found ${topRecentProblems.length} recently solved problems`);
    
    // Extract recent contests
    const recentContests = [];
    $('.contest-participated-count table tbody tr').each((i, elem) => {
      if (i < 5) { // Limit to 5 recent contests
        const contest = {
          name: $(elem).find('td:nth-child(1)').text().trim(),
          rank: $(elem).find('td:nth-child(2)').text().trim(),
          score: $(elem).find('td:nth-child(3)').text().trim()
        };
        recentContests.push(contest);
      }
    });
    
    // Extract contest history from page scripts
    const contestHistory = extractContestHistory($);
    
    // Calculate highest and current ratings from contest history
    let highestRating = 0;
    let currentRating = userRating; // Now userRating is defined above
    
    if (contestHistory.length > 0) {
      highestRating = Math.max(...contestHistory.map(contest => parseInt(contest.rating) || 0));
      // The current rating is typically from the most recent contest
      const mostRecentContest = contestHistory.sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      })[0];
      
      if (mostRecentContest && mostRecentContest.rating) {
        currentRating = mostRecentContest.rating;
      }
    }
    
    // Format profile data
    const profileData = {
      username: username,
      name: name,
      avatar: avatar,
      country: {
        name: country,
        flag: countryFlag
      },
      ranks: {
        global: globalRank,
        country: countryRank
      },
      stars: stars,
      rating: userRating, // Now userRating is defined above
      stats: {
        ...solvedStats,
        lastSolved: topRecentProblems
      },
      recentContests: recentContests,
      contestHistory: {
        total: contestHistory.length,
        highestRating: highestRating,
        currentRating: currentRating,
        contests: contestHistory
      }
    };
    
    return profileData;
  } catch (error) {
    throw new Error(`Failed to fetch profile for '${username}': ${error.message}`);
  }
}

/**
 * Main function to run the script
 */
async function main() {
  // Get username from command line arguments
  const username = "mridulahi";
  
  if (!username) {
    console.error('Error: Username is required');
    console.error('Usage: node codechef-profile.js <username>');
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
