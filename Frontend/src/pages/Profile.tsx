import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { FaSave, FaTrashAlt, FaSpinner, FaExclamationCircle } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

interface PlatformHandle {
  platform: 'LeetCode' | 'CodeChef' | 'GeeksforGeeks' | 'Codeforces';
  handle: string;
  lastSynced: Date | null;
}

interface UserProfile {
  _id?: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  platformHandles: PlatformHandle[];
}

const Profile = () => {
  const { currentUser, userToken } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const fetchUserProfile = useCallback(async () => {
    console.log("Fetching user profile, token available:", !!userToken);
    if (!userToken || !currentUser) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Profile data fetched:", data);
        setUserProfile(data);
      } else {
        console.log("Creating default profile for new user");
        setUserProfile({
          displayName: currentUser.displayName || '',
          email: currentUser.email || '',
          photoURL: currentUser.photoURL,
          platformHandles: []
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load profile. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [userToken, currentUser]);

  useEffect(() => {
    if (currentUser && userToken) {
      fetchUserProfile();
    }
  }, [fetchUserProfile, currentUser, userToken]);

  if (!currentUser && !loading) {
    return <Navigate to="/login" />;
  }

  const handleAddPlatform = () => {
    if (!userProfile) return;
    
    if (userProfile.platformHandles.length >= 4) {
      setValidationError("You've already added all available coding platforms.");
      return;
    }
    
    const availablePlatforms: ('LeetCode' | 'CodeChef' | 'GeeksforGeeks' | 'Codeforces')[] = 
      ['LeetCode', 'CodeChef', 'GeeksforGeeks', 'Codeforces'];
    
    const existingPlatforms = userProfile.platformHandles.map(p => p.platform);
    const remainingPlatforms = availablePlatforms.filter(p => !existingPlatforms.includes(p));
    
    if (remainingPlatforms.length === 0) {
      setValidationError("You've already added all available coding platforms.");
      return;
    }
    
    setUserProfile({
      ...userProfile,
      platformHandles: [
        ...userProfile.platformHandles,
        { 
          platform: remainingPlatforms[0], 
          handle: '', 
          lastSynced: null 
        }
      ]
    });
    
    setValidationError(null);
  };

  const handleRemovePlatform = (index: number) => {
    if (!userProfile) return;
    
    const updatedHandles = [...userProfile.platformHandles];
    updatedHandles.splice(index, 1);
    
    setUserProfile({
      ...userProfile,
      platformHandles: updatedHandles
    });
  };

  const handlePlatformChange = (index: number, platform: 'LeetCode' | 'CodeChef' | 'GeeksforGeeks' | 'Codeforces') => {
    if (!userProfile) return;
    
    const isDuplicate = userProfile.platformHandles.some(
      (handle, i) => i !== index && handle.platform === platform
    );
    
    if (isDuplicate) {
      setValidationError(`You already have a ${platform} handle configured.`);
      return;
    }
    
    const updatedHandles = [...userProfile.platformHandles];
    updatedHandles[index] = {
      ...updatedHandles[index],
      platform
    };
    
    setUserProfile({
      ...userProfile,
      platformHandles: updatedHandles
    });
    
    setValidationError(null);
  };

  const handleHandleChange = (index: number, handle: string) => {
    if (!userProfile) return;
    
    const updatedHandles = [...userProfile.platformHandles];
    updatedHandles[index] = {
      ...updatedHandles[index],
      handle
    };
    
    setUserProfile({
      ...userProfile,
      platformHandles: updatedHandles
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !userToken) return;

    const platforms = userProfile.platformHandles.map(h => h.platform);
    const uniquePlatforms = new Set(platforms);
    
    if (platforms.length !== uniquePlatforms.size) {
      setValidationError("You have duplicate coding platforms. Each platform can only be added once.");
      return;
    }

    try {
      setSaving(true);
      console.log("Sending platform handles:", userProfile.platformHandles);
      
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          platformHandles: userProfile.platformHandles
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log("Profile updated successfully:", data);
        setMessage({ text: 'Profile updated successfully!', type: 'success' });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      } else {
        console.error("API error:", data);
        setMessage({ 
          text: data.message || 'Failed to update profile', 
          type: 'error' 
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ text: 'An error occurred while updating profile', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <FaSpinner className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-500/20 text-red-500 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
          <button 
            onClick={() => fetchUserProfile()}
            className="mt-4 bg-white text-red-500 px-4 py-2 rounded hover:bg-gray-100"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">User Profile</h1>

          <div className="flex items-center mb-8">
            {userProfile?.photoURL ? (
              <img 
                src={userProfile.photoURL} 
                alt={userProfile.displayName} 
                className="w-20 h-20 rounded-full mr-4"
              />
            ) : (
              <div className="w-20 h-20 bg-blue-500 rounded-full mr-4 flex items-center justify-center text-2xl font-bold">
                {userProfile?.displayName?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold">{userProfile?.displayName}</h2>
              <p className="text-gray-400">{userProfile?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Coding Platforms</h3>
                <button
                  type="button"
                  onClick={handleAddPlatform}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Add Platform
                </button>
              </div>

              {validationError && (
                <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4 flex items-start">
                  <FaExclamationCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  <p>{validationError}</p>
                </div>
              )}

              {userProfile?.platformHandles?.length === 0 ? (
                <div className="text-gray-400 text-center py-8">
                  <p>You haven't added any coding platforms yet.</p>
                  <p>Add your handles to track your progress!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userProfile?.platformHandles?.map((platform, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center bg-gray-700 p-4 rounded-lg">
                      <div className="md:col-span-2">
                        <select
                          value={platform.platform}
                          onChange={(e) => handlePlatformChange(index, e.target.value as any)}
                          className="w-full bg-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="LeetCode">LeetCode</option>
                          <option value="CodeChef">CodeChef</option>
                          <option value="GeeksforGeeks">GeeksforGeeks</option>
                          <option value="Codeforces">Codeforces</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <input
                          type="text"
                          value={platform.handle}
                          onChange={(e) => handleHandleChange(index, e.target.value)}
                          placeholder="Enter your handle"
                          className="w-full bg-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemovePlatform(index)}
                          className="text-red-500 hover:text-red-400"
                        >
                          <FaTrashAlt className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {message.text && (
              <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                {message.text}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center"
              >
                {saving ? (
                  <>
                    <FaSpinner className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="w-4 h-4 mr-2" />
                    Save Profile
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
