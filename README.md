# LeetCode Profile Extractor

A script that extracts information from LeetCode profile pages.

## Installation

```bash
# Install dependencies
npm install

# Make the script executable (Linux/Mac)
chmod +x leetcode-profile.js
```

## Usage

```bash
# Run directly
./leetcode-profile.js <username>

# Or using npm
npm start -- <username>

# Or with node
node leetcode-profile.js <username>
```

## Output Data

The script outputs JSON data containing:

- `username`: LeetCode username
- `name`: User's real name
- `avatar`: URL to user's avatar image
- `ranking`: Global ranking
- `skillTags`: Array of user's skill tags
- `stats`: Problem solving statistics
  - `totalSolved`: Total number of problems solved
  - `easySolved`: Number of easy problems solved
  - `mediumSolved`: Number of medium problems solved
  - `hardSolved`: Number of hard problems solved
- `recentSubmissions`: List of recent accepted submissions
  - `id`: Submission ID
  - `title`: Problem title
  - `slug`: Problem slug for URL construction
  - `timestamp`: Unix timestamp of submission
  - `date`: Formatted date and time of submission

## Note

This script uses the LeetCode GraphQL API to fetch public profile data. Be mindful of LeetCode's terms of service when using it.

## License

MIT
