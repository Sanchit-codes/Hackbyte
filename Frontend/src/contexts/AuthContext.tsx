import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User as FirebaseUser, 
  signInWithPopup, 
  GoogleAuthProvider, 
  GithubAuthProvider,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { auth } from '../config/firebase';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userToken: string | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      console.log("Setting up auth state observer");
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        console.log("Auth state changed:", user ? "User logged in" : "No user");
        setCurrentUser(user);
        if (user) {
          try {
            const token = await user.getIdToken();
            setUserToken(token);
          } catch (e) {
            console.error("Error getting user token:", e);
            setError("Failed to get authentication token");
          }
        } else {
          setUserToken(null);
        }
        setLoading(false);
      }, (error) => {
        console.error("Auth state observer error:", error);
        setError(error.message);
        setLoading(false);
      });

      return unsubscribe;
    } catch (e) {
      console.error("Error setting up auth observer:", e);
      setError("Authentication initialization failed");
      setLoading(false);
      return () => {};
    }
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGithub = async () => {
    try {
      setLoading(true);
      const provider = new GithubAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("GitHub sign-in error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      console.error("Sign-out error:", error);
      setError(error.message);
    }
  };

  const value = {
    currentUser,
    userToken,
    loading,
    error,
    signInWithGoogle,
    signInWithGithub,
    signOut
  };

  // Add error display for development
  if (error && process.env.NODE_ENV !== 'production') {
    console.error("Auth Error:", error);
  }

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="flex justify-center items-center min-h-screen bg-gray-900">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
