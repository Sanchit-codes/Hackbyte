import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { FaGithub, FaChrome, FaExclamationCircle } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const { currentUser, signInWithGoogle, signInWithGithub, loading, error } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);

  // Show auth errors from context
  React.useEffect(() => {
    if (error) {
      setAuthError(error);
    }
  }, [error]);

  // If user is already logged in, redirect to home
  if (currentUser) {
    return <Navigate to="/profile" />;
  }

  const handleGoogleSignIn = async () => {
    try {
      setAuthError(null);
      await signInWithGoogle();
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleGithubSignIn = async () => {
    try {
      setAuthError(null);
      await signInWithGithub();
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-500 mb-2">DevMetrics</h1>
          <p className="text-gray-400">Sign in to track your coding progress</p>
        </div>

        {authError && (
          <div className="bg-red-500/20 text-red-400 p-4 rounded-lg mb-6 flex items-start">
            <FaExclamationCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <p>{authError}</p>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <FaChrome className="w-5 h-5 text-blue-500" />
            <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
          </button>

          <button
            onClick={handleGithubSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-gray-700 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            <FaGithub className="w-5 h-5" />
            <span>{loading ? 'Signing in...' : 'Continue with GitHub'}</span>
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-gray-400">
          <p>By signing in, you agree to our Terms of Service and Privacy Policy.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
