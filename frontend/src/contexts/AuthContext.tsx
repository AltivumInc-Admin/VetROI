import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getCurrentUser, signOut, fetchAuthSession, signIn, SignInInput, fetchUserAttributes } from 'aws-amplify/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  loading: boolean;
  sessionExpired: boolean;
  sessionWarning: boolean;
  lastActivity: number;
  signOutUser: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateActivity: () => void;
  clearSessionExpired: () => void;
  signInUser: (username: string, password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session timeout in milliseconds (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;
// Warning time before timeout (25 minutes)
const SESSION_WARNING_TIME = 25 * 60 * 1000;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [sessionWarning, setSessionWarning] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const timeoutRef = useRef<number | null>(null);
  const warningRef = useRef<number | null>(null);

  const clearTimeouts = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
  };

  const updateActivity = () => {
    setLastActivity(Date.now());
    if (isAuthenticated) {
      resetSessionTimeout();
    }
  };

  const resetSessionTimeout = () => {
    clearTimeouts();

    // Set warning timeout
    warningRef.current = window.setTimeout(() => {
      console.log('Session will expire soon');
      setSessionWarning(true);
    }, SESSION_WARNING_TIME);

    // Set expiration timeout
    timeoutRef.current = window.setTimeout(() => {
      console.log('Session expired due to inactivity');
      setSessionExpired(true);
      setSessionWarning(false);
      signOutUser();
    }, SESSION_TIMEOUT);
  };

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession();
      
      if (currentUser && session.tokens) {
        // Check if the access token is expired
        const accessToken = session.tokens.accessToken;
        if (accessToken && accessToken.payload.exp) {
          const expirationTime = accessToken.payload.exp * 1000; // Convert to milliseconds
          const currentTime = Date.now();
          
          if (currentTime >= expirationTime) {
            console.log('Token expired');
            setSessionExpired(true);
            setUser(null);
            setIsAuthenticated(false);
            return;
          }
        }

        // Fetch user attributes to get email and name
        try {
          const attributes = await fetchUserAttributes();
          const enhancedUser = {
            ...currentUser,
            email: attributes.email,
            name: attributes.name,
            givenName: attributes.given_name,
            familyName: attributes.family_name,
            attributes
          };
          setUser(enhancedUser);
        } catch (attributeError) {
          console.log('Could not fetch user attributes:', attributeError);
          setUser(currentUser);
        }
        
        setIsAuthenticated(true);
        setSessionExpired(false);
        resetSessionTimeout();
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.log('Not authenticated');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    try {
      const session = await fetchAuthSession({ forceRefresh: true });
      if (session.tokens) {
        console.log('Session refreshed');
        setSessionExpired(false);
        setSessionWarning(false);
        resetSessionTimeout();
        return;
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
      setSessionExpired(true);
      setSessionWarning(false);
    }
  };

  const signOutUser = async () => {
    try {
      clearTimeouts();
      await signOut();
      setUser(null);
      setIsAuthenticated(false);
      setSessionExpired(false);
      setSessionWarning(false);
      // Redirect to welcome page
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
      // Force local signout even if AWS signout fails
      setUser(null);
      setIsAuthenticated(false);
      setSessionExpired(false);
      setSessionWarning(false);
      // Redirect to welcome page even on error
      window.location.href = '/';
    }
  };

  const signInUser = async (username: string, password: string): Promise<boolean> => {
    try {
      const signInInput: SignInInput = { username, password };
      const { isSignedIn } = await signIn(signInInput);
      
      if (isSignedIn) {
        await checkAuth();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Sign in error:', error);
      return false;
    }
  };

  const clearSessionExpired = () => {
    setSessionExpired(false);
  };

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Set up activity listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      updateActivity();
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearTimeouts();
    };
  }, [isAuthenticated]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        sessionExpired,
        sessionWarning,
        lastActivity,
        signOutUser,
        checkAuth,
        refreshSession,
        updateActivity,
        clearSessionExpired,
        signInUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};