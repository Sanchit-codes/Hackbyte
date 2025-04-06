import React from 'react';
import { FaGitAlt, FaCode, FaClock, FaBolt } from 'react-icons/fa';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const skillData = [
  { subject: 'Frontend', value: 85 },
  { subject: 'Backend', value: 75 },
  { subject: 'DevOps', value: 65 },
  { subject: 'Database', value: 80 },
  { subject: 'Testing', value: 70 },
];

const languageData = [
  { name: 'JavaScript', value: 45 },
  { name: 'Python', value: 30 },
  { name: 'Java', value: 15 },
  { name: 'TypeScript', value: 10 },
];

const COLORS = ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'];

const ContributionBox = ({ intensity }: { intensity: number }) => {
  const getColor = () => {
    const colors = [
      'bg-blue-950',
      'bg-blue-800',
      'bg-blue-600',
      'bg-blue-400',
    ];
    return colors[intensity] || colors[0];
  };

  return <div className={`w-3 h-3 ${getColor()} rounded-sm`}></div>;
};

const Home = () => {
  const generateMockContributions = () => {
    return Array(52).fill(0).map(() =>
      Array(7).fill(0).map(() => Math.floor(Math.random() * 4))
    );
  };

  const contributions = generateMockContributions();

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        {/* Profile Section */}
        <div className="flex items-center space-x-4 mb-6">
          <img
            src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&auto=format&fit=crop&q=60"
            alt="Profile"
            className="w-20 h-20 rounded-full border-4 border-blue-500"
          />
          <div>
            <h1 className="text-2xl font-bold">Prince</h1>
            <p className="text-gray-400">Full Stack Developer</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <FaGitAlt className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-400">Total Commits</p>
                <p className="text-2xl font-bold">1,247</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <FaCode className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-400">Problems Solved</p>
                <p className="text-2xl font-bold">342</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <FaClock className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-400">Coding Hours</p>
                <p className="text-2xl font-bold">856</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <FaBolt className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-400">Efficiency</p>
                <p className="text-2xl font-bold">89%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Skills Overview */}
          <div className="bg-gray-700 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Skills Overview</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={skillData}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="subject" stroke="#9CA3AF" />
                  <PolarRadiusAxis stroke="#374151" />
                  <Radar
                    name="Skills"
                    dataKey="value"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Language Distribution */}
          <div className="bg-gray-700 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Language Distribution</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={languageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {languageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {languageData.map((item, index) => (
                <div key={item.name} className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-sm">{`${item.name} (${item.value}%)`}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Calendar */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Activity</h2>
          <div className="bg-gray-700 p-6 rounded-lg">
            <div className="flex flex-wrap gap-1">
              {contributions.map((week, i) => (
                <div key={i} className="flex flex-col gap-1">
                  {week.map((day, j) => (
                    <ContributionBox key={`${i}-${j}`} intensity={day} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;