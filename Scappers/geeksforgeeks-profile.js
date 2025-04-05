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
    
    // Try multiple profile URL formats, prioritizing the www.geeksforgeeks.org URL
    const urls = [
      `https://www.geeksforgeeks.org/user/${username}/`, // Prioritize this URL format
      `https://auth.geeksforgeeks.org/user/${username}`,
      `https://www.geeksforgeeks.org/user/${username}`, // Without trailing slash
      `https://auth.geeksforgeeks.org/user/${username}/practice/`
    ];
    
    let response;
    let $ = null;
    let successfulUrl = '';
    
    // Try each URL until we get a successful response
    for (const url of urls) {
      try {
        console.log(`Attempting to fetch profile from: ${url}`);
        response = await axios.get(url, { 
          headers, 
          timeout: 15000, // Increase timeout
          maxRedirects: 5
        });
        
        if (response.status === 200) {
          console.log(`Successfully fetched from ${url}`);
          $ = cheerio.load(response.data);
          
          // Check if we have meaningful content
          const pageTitle = $('title').text();
          console.log(`Page title: ${pageTitle}`);
          
          if (pageTitle.includes('Page not found') || pageTitle.includes('404')) {
            console.log('Page indicates 404, trying next URL...');
            $ = null;
            continue;
          }
          
          // Check if we have any profile-specific content to confirm it's a valid profile page
          const hasProfileContent = $('div.profile_name, div.userMainDiv, div.profilePage').length > 0;
          if (!hasProfileContent) {
            console.log('Page does not appear to contain profile data, trying next URL...');
            $ = null;
            continue;
          }
          
          successfulUrl = url;
          break;
        }
      } catch (e) {
        console.log(`Failed to fetch from ${url}: ${e.message}`);
      }
    }
    
    if (!$) {
      throw new Error(`Could not access profile for ${username} from any known URL format`);
    }
    
    console.log(`Successfully loaded profile from: ${successfulUrl}`);
    
    // For the www.geeksforgeeks.org URL format, adjust the selectors
    const isNewFormat = successfulUrl.includes('www.geeksforgeeks.org/user');
    
    // Save HTML for debugging (uncomment if needed)
    // require('fs').writeFileSync('gfg_debug.html', response.data);
    
    // Extract basic profile data with improved selectors for both formats
    let name, avatar, institution, codingScore, overallRank, monthlyRank;
    
    if (isNewFormat) {
      console.log('Using selectors for www.geeksforgeeks.org format');
      
      // Extract name from new format
      name = $('.profile_name h3, .user_details_container h3, .userPage h1').first().text().trim() || username;
      
      // Extract avatar from new format
      avatar = $('.profile_img img, .user_details_container img, .userMainDiv img.profileImage').first().attr('src') || '';
      
      // Extract institution from new format
      const institutionElem = $('.user_details_container .detail_box:contains("Institution"), .userPage .detail_box:contains("Institution")');
      institution = institutionElem.find('.value, a').text().trim();
      
      // Extract coding score - with more robust selectors
      const scoringSelectors = [
        '.coding-score-container .score .value', 
        '.rankingDetails .score_value',
        '.codingScore .value',
        '.profile-side-bar-widget .score span',
        'div.score_card_value',
        '.rating_charts div.score_card_value',
        'div.score span.value'
      ];
      
      codingScore = 0;
      for (const selector of scoringSelectors) {
        const scoreElement = $(selector);
        if (scoreElement.length) {
          const scoreText = scoreElement.first().text().trim().replace(/[^0-9]/g, '');
          if (scoreText) {
            codingScore = parseInt(scoreText);
            console.log(`Found coding score ${codingScore} using selector: ${selector}`);
            break;
          }
        }
      }
      
      // Extract ranks from new format
      const overallRankElem = $('.rankingDetails:contains("Overall Rank"), .rank_container:contains("Overall")');
      overallRank = overallRankElem.find('.value, .rank_value').text().trim();
      
      const monthlyRankElem = $('.rankingDetails:contains("Monthly Rank"), .rank_container:contains("Monthly")');
      monthlyRank = monthlyRankElem.find('.value, .rank_value').text().trim();
    } else {
      // Use existing selectors for the auth.geeksforgeeks.org format
      name = $('div.header_user_profile h1, div.profile_name h3, div.profile_details h3').first().text().trim() || username;
      avatar = $('div.avatar_img img, div.profile_img img, img.profileImage').first().attr('src') || '';
      
      const institutionSelectors = [
        'div.basic_details_container span:contains("Institution:")',
        'div.profile_details:contains("Institution")',
        'div.user_details_container div:contains("Institution")'
      ];
      
      for (const selector of institutionSelectors) {
        const element = $(selector);
        if (element.length) {
          institution = element.parent().find('a, span.field_val, span.value').text().trim();
          if (institution) break;
        }
      }
      
      const scoreSelectors = [
        'div.score_card_value:contains("Coding Score")',
        'div.rating_charts:contains("Coding Score") div.score_card_value',
        'div.score span.value',
        'div.rankingDetails div:contains("Coding Score") span'
      ];
      
      for (const selector of scoreSelectors) {
        const element = $(selector);
        if (element.length) {
          const scoreText = element.text().trim().replace(/[^0-9]/g, '');
          if (scoreText) {
            codingScore = parseInt(scoreText);
            break;
          }
        }
      }
      
      const rankSelectors = [
        ['div.rank_card:contains("Overall")', 'div.rank_div:contains("Overall Rank")', 'div.rankingDetails:contains("Overall")'],
        ['div.rank_card:contains("Monthly")', 'div.rank_div:contains("Monthly Rank")', 'div.rankingDetails:contains("Monthly")']
      ];
      
      for (const [i, selectors] of rankSelectors.entries()) {
        for (const selector of selectors) {
          const element = $(selector);
          if (element.length) {
            const rankText = element.find('div.rank_val, span.value, span.rank').first().text().trim();
            if (rankText) {
              if (i === 0) overallRank = rankText;
              else monthlyRank = rankText;
              break;
            }
          }
        }
      }
    }
    
    console.log(`Name found: ${name}`);
    console.log(`Avatar found: ${avatar ? 'Yes' : 'No'}`);
    console.log(`Institution found: ${institution ? 'Yes' : 'No'}`);
    console.log(`Coding score found: ${codingScore > 0 ? codingScore : 'No'}`);
    console.log(`Ranks found: Overall - ${overallRank || 'No'}, Monthly - ${monthlyRank || 'No'}`);
    
    // Extract problem-solving stats with different selectors based on the format
    const problemsSolved = {
      total: 0,
      school: 0,
      basic: 0,
      easy: 0,
      medium: 0,
      hard: 0
    };
    
    const problemSectionSelectors = isNewFormat ? 
      ['div.problemSolved div.difficulty-container', '.userPage .problemStats .difficultyLevel'] :
      ['div.problem_solved_count div.solved_problem_section', 
       'div.problems_solved_container div.solved_problem_section',
       'div.problemSolved div.difficulty-container',
       'div.solvedProblemSection div.difficulty'];
    
    let problemSectionFound = false;
    for (const selector of problemSectionSelectors) {
      const elements = $(selector);
      if (elements.length) {
        problemSectionFound = true;
        elements.each((i, elem) => {
          const difficultyText = $(elem).find('div.difficulty, div.diff_level, span.level').text().trim().toLowerCase();
          const countText = $(elem).find('div.problem_count, span.count, span.totalProblem').text().trim().replace(/[^0-9]/g, '');
          const count = parseInt(countText) || 0;
          
          if (difficultyText.includes('school')) {
            problemsSolved.school = count;
          } else if (difficultyText.includes('basic')) {
            problemsSolved.basic = count;
          } else if (difficultyText.includes('easy')) {
            problemsSolved.easy = count;
          } else if (difficultyText.includes('medium')) {
            problemsSolved.medium = count;
          } else if (difficultyText.includes('hard')) {
            problemsSolved.hard = count;
          }
        });
        break;
      }
    }
    
    problemsSolved.total = problemsSolved.school + problemsSolved.basic + 
                          problemsSolved.easy + problemsSolved.medium + 
                          problemsSolved.hard;
    console.log(`Problems solved found: ${problemSectionFound ? 'Yes' : 'No'}, Total: ${problemsSolved.total}`);
    
    // Try more direct approach for problem counts by difficulty
    if (problemsSolved.total === 0) {
      console.log('Trying direct selectors for problem counts...');
      
      // Try to find total problems solved directly
      const totalProblemSelectors = [
        '.problemSolved .totalProblem',
        '.problems-solved .total',
        '.problemStats .totalSolved',
        'div:contains("Total Problem Solved") .value',
        'h5:contains("Total Problem Solved")'
      ];
      
      for (const selector of totalProblemSelectors) {
        const element = $(selector);
        if (element.length) {
          const countText = element.first().text().trim().replace(/[^0-9]/g, '');
          if (countText) {
            problemsSolved.total = parseInt(countText);
            console.log(`Found total problems: ${problemsSolved.total} using: ${selector}`);
            break;
          }
        }
      }
      
      // Try to extract difficulty-specific problems with more direct selectors
      const difficultySelectors = {
        'school': ['.school-level .count', '.difficulty:contains("School") .count', 'div:contains("School") .problem-count'],
        'basic': ['.basic-level .count', '.difficulty:contains("Basic") .count', 'div:contains("Basic") .problem-count'],
        'easy': ['.easy-level .count', '.difficulty:contains("Easy") .count', 'div:contains("Easy") .problem-count'],
        'medium': ['.medium-level .count', '.difficulty:contains("Medium") .count', 'div:contains("Medium") .problem-count'],
        'hard': ['.hard-level .count', '.difficulty:contains("Hard") .count', 'div:contains("Hard") .problem-count']
      };
      
      // For each difficulty level, try all its selectors
      for (const [difficulty, selectors] of Object.entries(difficultySelectors)) {
        for (const selector of selectors) {
          const element = $(selector);
          if (element.length) {
            const countText = element.first().text().trim().replace(/[^0-9]/g, '');
            if (countText) {
              problemsSolved[difficulty] = parseInt(countText);
              console.log(`Found ${difficulty} problems: ${problemsSolved[difficulty]} using: ${selector}`);
              break;
            }
          }
        }
      }
      
      // If we found individual difficulties but no total, calculate it
      if (problemsSolved.total === 0 && (
          problemsSolved.school > 0 || 
          problemsSolved.basic > 0 || 
          problemsSolved.easy > 0 || 
          problemsSolved.medium > 0 || 
          problemsSolved.hard > 0)) {
        problemsSolved.total = problemsSolved.school + problemsSolved.basic + 
                              problemsSolved.easy + problemsSolved.medium + 
                              problemsSolved.hard;
        console.log(`Calculated total problems: ${problemsSolved.total}`);
      }
    }
    
    // Extract streak information more thoroughly
    let currentStreak = 0;
    let longestStreak = 0;
    
    const streakSelectors = [
      ['.current-streak .value', '.streakCard:contains("Current") .streakCount', '.streak-info:contains("Current") .value'],
      ['.longest-streak .value', '.streakCard:contains("Longest") .streakCount', '.streak-info:contains("Longest") .value']
    ];
    
    // Try to find current streak
    for (const selector of streakSelectors[0]) {
      const streakElement = $(selector);
      if (streakElement.length) {
        const streakText = streakElement.first().text().trim().replace(/[^0-9]/g, '');
        if (streakText) {
          currentStreak = parseInt(streakText);
          console.log(`Found current streak ${currentStreak} using selector: ${selector}`);
          break;
        }
      }
    }
    
    // Try to find longest streak
    for (const selector of streakSelectors[1]) {
      const streakElement = $(selector);
      if (streakElement.length) {
        const streakText = streakElement.first().text().trim().replace(/[^0-9]/g, '');
        if (streakText) {
          longestStreak = parseInt(streakText);
          console.log(`Found longest streak ${longestStreak} using selector: ${selector}`);
          break;
        }
      }
    }
    
    const recentActivities = [];
    const activitySelectors = isNewFormat ?
      ['div.recentActivity div.activityItem', '.userPage .recentSubmissions li', '.submissions-list .submission'] :
      ['div.recent_articles li', 'div.recent_activity_container div.activity',
       'div.recentActivity div.activityItem', 'div.submissions_container div.submission_item'];
    
    for (const selector of activitySelectors) {
      const elements = $(selector);
      if (elements.length) {
        elements.each((i, elem) => {
          if (i < 5) {
            const title = $(elem).find('a, div.title, span.problemName').text().trim();
            const link = $(elem).find('a').attr('href') || '';
            const date = $(elem).find('span.date, span.time, div.timestamp').text().trim();
            
            if (title) {
              recentActivities.push({
                title,
                link: link.startsWith('http') ? link : `https://www.geeksforgeeks.org${link}`,
                date
              });
            }
          }
        });
        
        if (recentActivities.length > 0) break;
      }
    }
    console.log(`Recent activities found: ${recentActivities.length}`);
    
    const profileData = {
      username,
      name,
      avatar,
      institution,
      codingScore,
      ranks: {
        overall: overallRank,
        monthly: monthlyRank
      },
      stats: {
        problemsSolved,
        streak: {
          current: currentStreak,
          longest: longestStreak
        }
      },
      recentActivities,
      source: successfulUrl
    };
    
    return profileData;
  } catch (error) {
    if (error.response) {
      if (error.response.status === 404) {
        throw new Error(`User '${username}' not found on Geeksforgeeks`);
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
