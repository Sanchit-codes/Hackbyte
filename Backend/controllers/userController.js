const User = require('../models/User');
const { fetchProfileData } = require('../services/profileSyncService');

// Update user profile
const updateProfile = async (req, res, next) => {
  try {
    const { displayName, photoURL } = req.body;
    const user = await User.findOne({ firebaseUID: req.user.uid });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (displayName) user.displayName = displayName;
    if (photoURL) user.photoURL = photoURL;
    
    await user.save();
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// Add platform handle
const addPlatformHandle = async (req, res, next) => {
  try {
    const { platform, handle } = req.body;
    const user = await User.findOne({ firebaseUID: req.user.uid });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Validate that the handle exists on the platform
    try {
      await fetchProfileData(platform, handle);
    } catch (error) {
      return res.status(400).json({ 
        message: `Unable to verify handle "${handle}" on ${platform}: ${error.message}` 
      });
    }
    
    // Check if platform handle already exists
    const existingHandle = user.platformHandles.find(h => h.platform === platform);
    
    if (existingHandle) {
      existingHandle.handle = handle;
      existingHandle.lastSynced = null;
      existingHandle.syncInProgress = false;
      existingHandle.lastSyncError = null;
    } else {
      user.platformHandles.push({ 
        platform, 
        handle, 
        lastSynced: null,
        syncInProgress: false,
        lastSyncError: null
      });
    }
    
    await user.save();
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// Remove platform handle
const removePlatformHandle = async (req, res, next) => {
  try {
    const { platform } = req.params;
    const user = await User.findOne({ firebaseUID: req.user.uid });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.platformHandles = user.platformHandles.filter(h => h.platform !== platform);
    
    await user.save();
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateProfile,
  addPlatformHandle,
  removePlatformHandle
};
