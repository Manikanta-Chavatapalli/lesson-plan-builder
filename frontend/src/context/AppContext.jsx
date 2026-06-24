import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut, signInWithCustomToken } from 'firebase/auth';
import { auth } from '../config/firebase.js';
import * as authApi from '../api/auth.api.js';

const getInitialTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) return savedTheme;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const initialState = {
  isLoading: false,
  isAuthLoading: true,
  error: null,
  user: null, // this will hold { exists, role, name, email }
  isAuthenticated: false,
  theme: getInitialTheme(),
};

const AppContext = createContext(undefined);

const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_AUTH_LOADING':
      return { ...state, isAuthLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: Boolean(action.payload),
        isAuthLoading: false,
      };
    case 'LOGOUT':
      return { ...state, user: null, isAuthenticated: false, isAuthLoading: false };
    case 'TOGGLE_THEME': {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      return { ...state, theme: newTheme };
    }
    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const setLoading = (isLoading) => dispatch({ type: 'SET_LOADING', payload: isLoading });
  const setError = (error) => dispatch({ type: 'SET_ERROR', payload: error });
  const clearError = () => dispatch({ type: 'CLEAR_ERROR' });
  const toggleTheme = () => dispatch({ type: 'TOGGLE_THEME' });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  // Firebase Auth State Observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Firebase Auth State Changed. User:", firebaseUser?.email);
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          console.log("Firebase ID Token acquired.");
          localStorage.setItem('intellitots_token', token);
          
          console.log("Calling checkUser API for:", firebaseUser.email);
          const emailForSignIn = firebaseUser.email || window.localStorage.getItem('emailForSignIn');
          
          if (!emailForSignIn) {
             console.error("No email found for checkUser.");
             await signOut(auth);
             dispatch({ type: 'LOGOUT' });
             return;
          }

          const response = await authApi.checkUser({ email: emailForSignIn });
          console.log("checkUser response:", response);
          
          if (response.data.exists) {
             console.log("User exists in DB. Setting user state.");
             dispatch({ 
               type: 'SET_USER', 
               payload: { 
                 email: emailForSignIn, 
                 role: response.data.role, 
                 name: response.data.name 
               } 
             });
          } else {
             console.log("User does not exist in DB. Signing out.");
             await signOut(auth);
             dispatch({ type: 'LOGOUT' });
          }
        } catch (error) {
          console.error("Error fetching user data in observer:", error);
          await signOut(auth);
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        console.log("No Firebase user. Logging out state.");
        localStorage.removeItem('intellitots_token');
        dispatch({ type: 'LOGOUT' });
      }
    });

    return () => unsubscribe();
  }, []);

  const requestOtp = async (payload) => {
    clearError();
    setLoading(true);
    try {
      return await authApi.requestOtp(payload);
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (payload) => {
    clearError();
    setLoading(true);
    try {
      const response = await authApi.verifyOtp(payload);
      const customToken = response.data.token;
      
      // Use the custom token to sign in to Firebase
      await signInWithCustomToken(auth, customToken);
      
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      // Wait for observer to catch it
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    ...state,
    setLoading,
    setError,
    clearError,
    requestOtp,
    verifyOtp,
    logout,
    toggleTheme,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
