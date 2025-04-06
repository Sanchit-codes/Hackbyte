const User = require('../models/User');

// Register or update user after Firebase authentication
const registerUser = async (req, res, next) => {
  try {
    // Firebase decoded token uses uid, not firebaseUID
    const { uid, email, name, picture } = req.user;
    // Extract platformHandles from request body
    const { platformHandles } = req.body;

    console.log('Request body:', req.body);
    console.log('Decoded token data:', req.user);

    // Validate platform handles
    if (platformHandles && Array.isArray(platformHandles)) {
      // Check for duplicate platforms
      const platforms = platformHandles.map(handle => handle.platform);
      const uniquePlatforms = new Set(platforms);
      
      if (platforms.length !== uniquePlatforms.size) {
        return res.status(400).json({
          message: "Duplicate coding platforms detected. Each platform can only be added once."
        });
      }
      
      // Validate that each platform is allowed
      const allowedPlatforms = ['LeetCode', 'CodeChef', 'GeeksforGeeks', 'Codeforces'];
      const hasInvalidPlatform = platformHandles.some(handle => 
        !allowedPlatforms.includes(handle.platform)
      );
      
      if (hasInvalidPlatform) {
        return res.status(400).json({
          message: "Invalid platform detected. Allowed platforms are: LeetCode, CodeChef, GeeksforGeeks, and Codeforces."
        });
      }
    }

    // Check if user already exists
    let user = await User.findOne({ firebaseUID: uid });

    if (user) {
      // Update existing user
      user.lastLogin = new Date();
      if (name) user.displayName = name;
      if (picture) user.photoURL = picture;
      
      // Update platformHandles if provided
      if (platformHandles && Array.isArray(platformHandles)) {
        user.platformHandles = platformHandles;
      }
      
      await user.save();
      return res.status(200).json(user);
    }

    // Create new user
    user = new User({
      firebaseUID: uid,
      email,
      displayName: name || email.split('@')[0],
      photoURL: picture,
      platformHandles: platformHandles || [], // Initialize with empty array if not provided
      lastLogin: new Date()
    });

    await user.save();
    res.status(201).json(user);
  } catch (error) {
    console.error('Register user error:', error);
    next(error);
  }
};

// Get current user profile
const getCurrentUser = async (req, res, next) => {
  try {
    console.log('Getting user with Firebase UID:', req.user.uid);
    
    const user = await User.findOne({ firebaseUID: req.user.uid });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Get user error:', error);
    next(error);
  }
};

module.exports = {
  registerUser,
  getCurrentUser
};
