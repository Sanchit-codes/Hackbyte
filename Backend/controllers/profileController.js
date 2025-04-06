const User = require('../models/User');
const PlatformProfile = require('../models/PlatformProfile');
const { fetchProfileData, processProfileData } = require('../services/profileSyncService');

// Sync platform profile for a specific user
const syncPlatformProfile = async (req, res, next) => {
  try {
    const { platform } = req.params;
    const user = await User.findOne({ firebaseUID: req.user.uid });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Find platform handle
    const platformHandle = user.platformHandles.find(h => h.platform === platform);
    
    if (!platformHandle) {
      return res.status(404).json({ 
        message: `No ${platform} handle found for this user` 
      });
    }
    
    // Update sync status
    platformHandle.syncInProgress = true;
    platformHandle.lastSyncError = null;
    await user.save();
    
    try {
      // Fetch profile data
      const profileData = await fetchProfileData(platform, platformHandle.handle);
      
      // Process the profile data
      const processedData = processProfileData(platform, profileData);
      
      // Update or create platform profile
      const platformProfile = await PlatformProfile.findOneAndUpdate(
        { userId: user._id, platform },
        {
          username: platformHandle.handle,
          rawData: profileData,
          ...processedData
        },
        { upsert: true, new: true }
      );
      
      // Update user's platform handle with last synced time
      platformHandle.lastSynced = new Date();
      platformHandle.syncInProgress = false;
      await user.save();
      
      res.status(200).json(platformProfile);
    } catch (error) {
      // Update sync status with error
      platformHandle.syncInProgress = false;
      platformHandle.lastSyncError = error.message;
      await user.save();
      
      throw error;
    }
  } catch (error) {
    console.error(`Profile sync error for ${req.params.platform}:`, error);
    next(error);
  }
};

// Sync all platforms for a user
const syncAllPlatforms = async (req, res, next) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.platformHandles.length === 0) {
      return res.status(200).json({ message: 'No platform handles configured' });
    }
    
    const results = {
      success: [],
      failed: []
    };
    
    // Process platforms sequentially to avoid rate limiting
    for (const platformHandle of user.platformHandles) {
      try {
        // Skip platforms with no handle
        if (!platformHandle.handle) continue;
        
        // Update sync status
        platformHandle.syncInProgress = true;
        platformHandle.lastSyncError = null;
        await user.save();
        
        // Fetch and process profile data
        const profileData = await fetchProfileData(platformHandle.platform, platformHandle.handle);
        const processedData = processProfileData(platformHandle.platform, profileData);
        
        // Update or create platform profile
        await PlatformProfile.findOneAndUpdate(
          { userId: user._id, platform: platformHandle.platform },
          {
            username: platformHandle.handle,
            rawData: profileData,
            ...processedData
          },
          { upsert: true, new: true }
        );
        
        // Update status
        platformHandle.lastSynced = new Date();
        platformHandle.syncInProgress = false;
        await user.save();
        
        results.success.push(platformHandle.platform);
      } catch (error) {
        console.error(`Error syncing ${platformHandle.platform}:`, error);
        
        // Update sync status with error
        platformHandle.syncInProgress = false;
        platformHandle.lastSyncError = error.message;
        await user.save();
        
        results.failed.push({
          platform: platformHandle.platform,
          error: error.message
        });
      }
    }
    
    res.status(200).json(results);
  } catch (error) {
    console.error('Sync all platforms error:', error);
    next(error);
  }
};

// Get all platform profiles for a user
const getAllPlatformProfiles = async (req, res, next) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const profiles = await PlatformProfile.find({ userId: user._id });
    res.status(200).json(profiles);
  } catch (error) {
    next(error);
  }
};

// Get platform profile for a specific platform
const getPlatformProfile = async (req, res, next) => {
  try {
    const { platform } = req.params;
    const user = await User.findOne({ firebaseUID: req.user.uid });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const profile = await PlatformProfile.findOne({
      userId: user._id,
      platform
    });
    
    if (!profile) {
      return res.status(404).json({ message: `No ${platform} profile found` });
    }
    
    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  syncPlatformProfile,
  syncAllPlatforms,
  getAllPlatformProfiles,
  getPlatformProfile
};
