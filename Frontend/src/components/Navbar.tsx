import React from 'react';
import { Link, useLocation } from 'react-router-dom';
// Use react-icons instead of lucide-react
import { FaHome, FaChartBar, FaBrain, FaTrophy, FaNewspaper, FaRobot, FaSignInAlt, FaSignOutAlt, FaUser } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const { currentUser, signOut } = useAuth();

  const navItems = [
    { path: '/', icon: FaHome, label: 'Home' },
    { path: '/dashboard', icon: FaChartBar, label: 'Dashboard' },
    { path: '/analytics', icon: FaBrain, label: 'Analytics' },
    { path: '/competitions', icon: FaTrophy, label: 'Competitions' },
    { path: '/tech-news', icon: FaNewspaper, label: 'Tech News' },
    { path: '/agaman-ai', icon: FaRobot, label: 'Agaman AI' },
  ];

  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <span className="text-2xl font-bold text-blue-500">Ranknity</span>
            </div>
            <div className="hidden md:flex space-x-4">
              {navItems.map(({ path, icon: Icon, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === path
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="flex items-center">
            {currentUser ? (
              <div className="flex items-center space-x-4">
                <Link
                  to="/profile"
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/profile'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <FaUser className="w-4 h-4 mr-2" />
                  Profile
                </Link>
                <button
                  onClick={signOut}
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  <FaSignOutAlt className="w-4 h-4 mr-2" />
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <FaSignInAlt className="w-4 h-4 mr-2" />
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;