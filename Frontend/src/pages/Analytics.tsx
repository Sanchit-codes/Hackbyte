import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import axios from 'axios';
import { FiRefreshCw } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

interface Progress {
  platform: string;
  stats: {
    totalSolved: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    successRate: number;
    weeklyActivity: Array<{ date: string; count: number }>;
    monthlyActivity: Array<{ month: string; count: number }>;
    topTags: Array<{ tag: string; count: number }>;
  };
  problems: Array<{
    title: string;
    difficulty: string;
    status: string;
    attemptedAt: string;
    tags: string[];
    timeTaken?: number;
  }>;
}

interface PlatformProfile {
  platform: string;
  username: string;
  lastSynced: string;
  stats: any;
}

const CHART_COLORS = ['#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#EF4444'];
const API_BASE_URL = 'http://localhost:5000'; // Backend server URL

const Analytics = () => {
  const { userToken } = useAuth(); // Use the auth context for consistent token handling
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<PlatformProfile[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);

  const fetchData = async () => {
    if (!userToken) {
      setError('Not authenticated. Please log in again.');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Get profiles data
      const profilesResponse = await axios.get(`${API_BASE_URL}/api/profiles`, {
        headers: {
          Authorization: `Bearer ${userToken}`
        }
      });
      
      // Get progress data
      const progressResponse = await axios.get(`${API_BASE_URL}/api/progress`, {
        headers: {
          Authorization: `Bearer ${userToken}`
        }
      });
      
      // Ensure profiles is always an array
      setProfiles(Array.isArray(profilesResponse.data) ? profilesResponse.data : []);
      setProgress(Array.isArray(progressResponse.data) ? progressResponse.data : []);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    if (!userToken) {
      setError('Not authenticated. Please log in again.');
      return;
    }
    
    try {
      setRefreshing(true);
      setError(null);
      
      // Call dashboard refresh endpoint to update data
      const response = await axios.post(`${API_BASE_URL}/api/dashboard/refresh`, {}, {
        headers: {
          Authorization: `Bearer ${userToken}`
        }
      });
      
      // Ensure we're setting arrays
      setProfiles(Array.isArray(response.data.profiles) ? response.data.profiles : []);
      setProgress(Array.isArray(response.data.progress) ? response.data.progress : []);
      
    } catch (err) {
      console.error('Error refreshing analytics data:', err);
      setError('Failed to refresh data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userToken]); // Add userToken as dependency to re-fetch when auth changes

  const getPlatformDistribution = () => {
    // Add defensive check to ensure profiles is an array
    if (!Array.isArray(profiles)) {
      console.error('profiles is not an array:', profiles);
      return [];
    }
    
    return profiles.map(profile => ({
      name: profile.platform,
      value: profile.stats?.totalSolved || profile.stats?.problemsSolved || 0
    }));
  };

  const getDifficultyDistribution = () => {
    const distribution = {
      Easy: 0,
      Medium: 0,
      Hard: 0,
      Unknown: 0
    };
    
    progress.forEach(platformProgress => {
      distribution.Easy += platformProgress.stats?.easySolved || 0;
      distribution.Medium += platformProgress.stats?.mediumSolved || 0;
      distribution.Hard += platformProgress.stats?.hardSolved || 0;
    });
    
    // If we have no difficulty breakdown, try to get it from problems
    if (distribution.Easy === 0 && distribution.Medium === 0 && distribution.Hard === 0) {
      progress.forEach(platformProgress => {
        if (platformProgress.problems) {
          platformProgress.problems.forEach(problem => {
            if (problem.status === 'Solved') {
              distribution[problem.difficulty as keyof typeof distribution]++;
            }
          });
        }
      });
    }
    
    return Object.entries(distribution)
      .filter(([_, count]) => count > 0)
      .map(([difficulty, count]) => ({
        name: difficulty,
        value: count
      }));
  };

  const getWeeklyActivity = () => {
    // Create an array for the last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: date.toISOString().split('T')[0],
        count: 0
      });
    }
    
    // Count problems for each day
    progress.forEach(platformProgress => {
      if (platformProgress.problems) {
        platformProgress.problems.forEach(problem => {
          const problemDate = new Date(problem.attemptedAt).toISOString().split('T')[0];
          const dayIndex = days.findIndex(d => d.date === problemDate);
          if (dayIndex !== -1) {
            days[dayIndex].count++;
          }
        });
      }
    });
    
    return days;
  };

  const getTopTags = () => {
    const tagCounts: Record<string, number> = {};
    
    // Combine top tags from all platforms
    progress.forEach(platformProgress => {
      if (platformProgress.stats?.topTags) {
        platformProgress.stats.topTags.forEach((tag: { tag: string; count: number }) => {
          if (!tagCounts[tag.tag]) {
            tagCounts[tag.tag] = 0;
          }
          tagCounts[tag.tag] += tag.count;
        });
      }
      
      // Also count tags from individual problems
      if (platformProgress.problems) {
        platformProgress.problems.forEach(problem => {
          if (problem.tags) {
            problem.tags.forEach(tag => {
              if (!tagCounts[tag]) {
                tagCounts[tag] = 0;
              }
              tagCounts[tag]++;
            });
          }
        });
      }
    });
    
    // Convert to array and sort by count
    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  };

  const getMonthlyProgress = () => {
    // Create a map of the last 6 months
    const months: Record<string, { name: string, count: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const name = date.toLocaleDateString('en-US', { month: 'short' });
      months[monthYear] = { name, count: 0 };
    }
    
    // Count solved problems for each month
    progress.forEach(platformProgress => {
      if (platformProgress.stats?.monthlyActivity) {
        platformProgress.stats.monthlyActivity.forEach((month: { month: string; count: number }) => {
          if (months[month.month]) {
            months[month.month].count += month.count;
          }
        });
      }
    });
    
    return Object.values(months);
  };

  const getPerformanceMetrics = () => {
    // Calculate aggregate metrics
    const totalSolved = Array.isArray(profiles) ? profiles.reduce((sum, profile) => 
      sum + (profile.stats?.totalSolved || profile.stats?.problemsSolved || 0), 0) : 0;
    
    const avgSuccessRate = progress.length > 0
      ? Math.round(progress.reduce((sum, p) => sum + (p.stats?.successRate || 0), 0) / progress.length)
      : 0;
    
    // Calculate average time per problem if available
    let avgTime = 0;
    let problemsWithTime = 0;
    progress.forEach(p => {
      if (p.problems) {
        p.problems.forEach(problem => {
          if (problem.timeTaken) {
            avgTime += problem.timeTaken;
            problemsWithTime++;
          }
        });
      }
    });
    
    const avgTimeString = problemsWithTime > 0
      ? `${Math.round(avgTime / problemsWithTime)}m`
      : 'N/A';
    
    // Calculate current streak using dates
    const dates = new Set();
    progress.forEach(p => {
      if (p.problems) {
        p.problems.forEach(problem => {
          if (problem.status === 'Solved') {
            const date = new Date(problem.attemptedAt).toISOString().split('T')[0];
            dates.add(date);
          }
        });
      }
    });
    
    // Sort dates to calculate streak
    const sortedDates = Array.from(dates).sort();
    let currentStreak = 0;
    
    if (sortedDates.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      // Check if solved today or yesterday
      if (sortedDates.includes(today) || sortedDates.includes(yesterdayStr)) {
        currentStreak = 1; // Start with at least 1 day
        
        let checkDate = sortedDates.includes(today) ? today : yesterdayStr;
        let prevDate = new Date(checkDate);
        
        // Count backwards to find streak
        while (currentStreak < sortedDates.length) {
          prevDate.setDate(prevDate.getDate() - 1);
          const prevDateStr = prevDate.toISOString().split('T')[0];
          
          if (sortedDates.includes(prevDateStr)) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }
    
    return [
      { label: 'Problems Solved', value: totalSolved.toString() },
      { label: 'Average Time', value: avgTimeString },
      { label: 'Success Rate', value: `${avgSuccessRate}%` },
      { label: 'Current Streak', value: `${currentStreak}d` },
    ];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <button 
          onClick={refreshData}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-md disabled:opacity-50"
        >
          <FiRefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-500 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Platform Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getPlatformDistribution()}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {getPlatformDistribution().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {getPlatformDistribution().map((item, index) => (
              <div key={item.name} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                ></div>
                <span className="text-sm">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Weekly Progress</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getWeeklyActivity()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '0.5rem',
                  }}
                />
                <Bar dataKey="count" name="Problems" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Topic Mastery</h2>
          <div className="space-y-4">
            {getTopTags().map((item) => (
              <div key={item.tag}>
                <div className="flex justify-between mb-1">
                  <span>{item.tag}</span>
                  <span>{item.count}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{ width: `${Math.min(100, (item.count / getTopTags()[0].count) * 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
          <div className="grid grid-cols-2 gap-4">
            {getPerformanceMetrics().map((metric) => (
              <div
                key={metric.label}
                className="bg-gray-700 p-4 rounded-lg text-center"
              >
                <div className="text-2xl font-bold text-emerald-500">
                  {metric.value}
                </div>
                <div className="text-sm text-gray-400">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Difficulty Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getDifficultyDistribution()}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {getDifficultyDistribution().map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={
                        entry.name === 'Easy' ? '#10B981' : 
                        entry.name === 'Medium' ? '#F59E0B' : 
                        entry.name === 'Hard' ? '#EF4444' : 
                        '#6B7280'
                      } 
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Monthly Trend</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getMonthlyProgress()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '0.5rem',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Problems"
                  stroke="#10B981"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;