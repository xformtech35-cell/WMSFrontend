import api from '@/lib/api';
import { useState, useEffect } from 'react';

/**
 * Extracts full name from a user object with fallbacks.
 *
 * @param {Object} user - User object from API or state
 * @returns {string} Formatted full name or username/fallback
 */
export function getUserFullName(user) {
  if (!user) return '';
  
  if (user.fullName && String(user.fullName).trim()) {
    return String(user.fullName).trim();
  }
  
  if (user.name && String(user.name).trim()) {
    return String(user.name).trim();
  }

  if (user.firstName || user.lastName) {
    const combined = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    if (combined) return combined;
  }

  return user.username || user.wms_username || user.id || '';
}

// Global in-memory user cache
const userCache = new Map(); // key: lowercase username -> user object
const NOT_FOUND = Symbol('NOT_FOUND');

let allUsersPromise = null;
let allUsersLoaded = false;

/**
 * Pre-loads all users into cache with a single GET /users call.
 * This guarantees table views with hundreds of cells only make 1 single API request total.
 */
export async function preloadAllUsers() {
  if (allUsersLoaded) return userCache;
  if (allUsersPromise) return allUsersPromise;

  allUsersPromise = (async () => {
    try {
      const response = await api.get('/users', { skipToast: true });
      const data = response.data;
      const list = Array.isArray(data)
        ? data
        : data?.content && Array.isArray(data.content)
        ? data.content
        : [];

      for (const u of list) {
        if (u && u.username) {
          userCache.set(String(u.username).toLowerCase(), u);
        }
      }
      allUsersLoaded = true;
    } catch (err) {
      console.warn('Failed to pre-fetch users list:', err);
    } finally {
      allUsersPromise = null;
    }
    return userCache;
  })();

  return allUsersPromise;
}

/**
 * Retrieves user object by username from the preloaded /users cache.
 *
 * @param {string} username - Target username
 * @returns {Promise<Object|null>} User object or null
 */
export async function fetchUserByUsername(username) {
  if (!username) return null;
  const cleanUsername = String(username).trim();
  if (!cleanUsername) return null;

  const key = cleanUsername.toLowerCase();

  if (userCache.has(key)) {
    const cached = userCache.get(key);
    return cached === NOT_FOUND ? null : cached;
  }

  await preloadAllUsers();

  if (userCache.has(key)) {
    const cached = userCache.get(key);
    return cached === NOT_FOUND ? null : cached;
  }

  // Not found in preloaded users list; mark as NOT_FOUND to avoid repeated checks
  userCache.set(key, NOT_FOUND);
  return null;
}

/**
 * Async helper to get full name by username.
 *
 * @param {string} username - Target username
 * @param {string} fallback - Fallback value if user or full name is not found
 * @returns {Promise<string>} Full name or fallback
 */
export async function fetchUserFullNameByUsername(username, fallback = '') {
  if (!username) return fallback;
  const user = await fetchUserByUsername(username);
  const fullName = getUserFullName(user);
  return fullName || fallback || username;
}

/**
 * React Hook to get a user's full name based on username.
 * Uses pre-loaded /users cache to resolve names instantly.
 *
 * @param {string} username - Target username
 * @returns {{ fullName: string, user: Object|null, loading: boolean, error: Error|null }}
 */
export function useUserFullName(username) {
  const cleanUsername = username ? String(username).trim() : '';
  const key = cleanUsername.toLowerCase();

  // Check synchronous cache first
  const initialCached = key && userCache.has(key) ? userCache.get(key) : undefined;
  const initialUser = initialCached && initialCached !== NOT_FOUND ? initialCached : null;
  const initialFullName = initialUser ? getUserFullName(initialUser) : cleanUsername;

  const [state, setState] = useState(() => ({
    fullName: initialFullName,
    user: initialUser,
    loading: Boolean(cleanUsername && initialCached === undefined),
    error: null,
    username: cleanUsername,
  }));

  useEffect(() => {
    if (!cleanUsername) return;

    if (userCache.has(key)) {
      const cached = userCache.get(key);
      const cachedUser = cached !== NOT_FOUND ? cached : null;
      const name = cachedUser ? getUserFullName(cachedUser) : cleanUsername;
      if (state.user !== cachedUser || state.fullName !== name) {
        setState({
          fullName: name,
          user: cachedUser,
          loading: false,
          error: null,
          username: cleanUsername,
        });
      }
      return;
    }

    let isMounted = true;

    fetchUserByUsername(cleanUsername)
      .then((userData) => {
        if (!isMounted) return;
        const name = getUserFullName(userData);
        setState({
          fullName: name || cleanUsername,
          user: userData,
          loading: false,
          error: null,
          username: cleanUsername,
        });
      })
      .catch((err) => {
        if (!isMounted) return;
        setState({
          fullName: cleanUsername,
          user: null,
          loading: false,
          error: err,
          username: cleanUsername,
        });
      });

    return () => {
      isMounted = false;
    };
  }, [cleanUsername, key]);

  if (!cleanUsername) {
    return { fullName: '', user: null, loading: false, error: null };
  }

  const isLoading = state.username !== cleanUsername || state.loading;

  return {
    fullName: isLoading ? cleanUsername : state.fullName,
    user: state.user,
    loading: isLoading,
    error: state.error,
  };
}
