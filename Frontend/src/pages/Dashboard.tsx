import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FaSpinner } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000'; // Backend server URL

const Dashboard = () => {
  const { userToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState({
    activityData: [],
    skills: [],
    recentActivities: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userToken) return;
      
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/dashboard`, {
          headers: {
            'Authorization': `Bearer ${userToken}`
          }
        });
        
        // Ensure response data has expected structure
        const data = response.data || {};
        
        // Make sure profiles is an array before using array methods
        const profiles = Array.isArray(data.profiles) ? data.profiles : [];
        
        setDashboardData({
          activityData: data.activityData || [],
          skills: data.skills || [],
          recentActivities: data.recentActivities || []
        });
      } catch (err: any) {
        console.error('Failed to fetch dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [userToken]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <FaSpinner className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-500/20 text-red-500 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  // Use mock data as fallback if needed
  const mockData = [
    { name: 'Jan', value: 400 },
    { name: 'Feb', value: 300 },
    { name: 'Mar', value: 600 },
    { name: 'Apr', value: 800 },
    { name: 'May', value: 500 },
    { name: 'Jun', value: 700 },
  ];

  // Safe data access with fallbacks
  const activityData = dashboardData.activityData.length > 0 ? dashboardData.activityData : mockData;
  const skills = dashboardData.skills.length > 0 ? dashboardData.skills : ['JavaScript', 'Python', 'React', 'Node.js'];
  const recentActivities = dashboardData.recentActivities.length > 0 ? dashboardData.recentActivities : [
    'Solved LeetCode Problem #217',
    'Pushed to main branch',
    'Created new React component',
    'Updated documentation',
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Coding Activity</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData}>
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
                  dataKey="value"
                  stroke="#10B981"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Skills Overview</h2>
          <div className="space-y-4">
            {skills.map((skill) => (
              <div key={skill}>
                <div className="flex justify-between mb-1">
                  <span>{skill}</span>
                  <span>{Math.floor(Math.random() * 40 + 60)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{
                      width: `${Math.floor(Math.random() * 40 + 60)}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 text-sm"
              >
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span>{activity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;