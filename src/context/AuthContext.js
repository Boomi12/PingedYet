import React, { createContext, useState, useEffect } from 'react';
import { getSession, setSession, clearSession } from '../storage/applicationStorage';
import api, { authService } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  // Register unauthorized interceptor callback on mount
  useEffect(() => {
    api.onUnauthorized = async () => {
      console.log('[AuthContext] api.onUnauthorized interceptor triggered. Token expired or invalid. Wiping storage...');
      try {
        await clearSession();
        console.log('[AuthContext] Session credentials wiped successfully.');
      } catch (err) {
        console.error('[AuthContext] Error during 401 session wipe:', err);
      }
      setUserToken(null);
      setUserInfo(null);
    };
    return () => {
      api.onUnauthorized = null;
    };
  }, []);

  // Bootstrap session state from AsyncStorage on startup
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const session = await getSession();
        if (session) {
          setUserToken(session.token);
          setUserInfo({
            name: session.name,
            email: session.email,
            createdAt: session.createdAt
          });
        }
      } catch (e) {
        console.error('[AuthContext] Failed to load session from storage:', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const signIn = async (email, password) => {
    setIsLoading(true);
    try {
      const data = await authService.login(email, password);
      // Data format returned: { id, name, email, createdAt, token }
      await setSession(data.token, data.name, data.email, data.createdAt);
      
      setUserToken(data.token);
      setUserInfo({
        name: data.name,
        email: data.email,
        createdAt: data.createdAt
      });
      return { success: true };
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (name, email, password) => {
    setIsLoading(true);
    try {
      const data = await authService.register(name, email, password);
      await setSession(data.token, data.name, data.email, data.createdAt);

      setUserToken(data.token);
      setUserInfo({
        name: data.name,
        email: data.email,
        createdAt: data.createdAt
      });
      return { success: true };
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    console.log('[AuthContext] signOut function invoked.');
    setIsLoading(true);
    try {
      console.log('[AuthContext] Calling clearSession to wipe credentials...');
      const success = await clearSession();
      console.log('[AuthContext] clearSession completed. Success status:', success);
      
      setUserToken(null);
      setUserInfo(null);
      console.log('[AuthContext] Context state variable resets completed. Navigating to Login.');
    } catch (e) {
      console.error('[AuthContext] Error signing out:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        userToken,
        userInfo,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
