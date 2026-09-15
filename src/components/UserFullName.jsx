'use client';

import React from 'react';
import { useUserFullName, getUserFullName } from '@/lib/userApi';

/**
 * UserFullName Component
 *
 * Given a username (or user object), fetches and displays the user's Full Name from the User API.
 *
 * @example
 * // Basic usage with username string:
 * <UserFullName username="john_doe" />
 *
 * // With fallback:
 * <UserFullName username={username} fallback="Unknown User" />
 *
 * // With custom styling and username subtag:
 * <UserFullName username="admin" showUsernameTag className="font-semibold text-slate-800" />
 *
 * // Direct user object usage (no API call needed):
 * <UserFullName user={userObject} />
 */
export default function UserFullName({
  username,
  user: initialUser,
  fallback = 'System User',
  showUsernameTag = false,
  className = '',
  loadingFallback = 'Loading...',
}) {
  // If initialUser object is provided directly, use it without fetching
  const directFullName = initialUser ? getUserFullName(initialUser) : null;
  const targetUsername = initialUser?.username || username;

  const { fullName, loading } = useUserFullName(initialUser ? null : username);

  if (initialUser) {
    const displayName = directFullName || targetUsername || fallback;
    return (
      <span className={className}>
        {displayName}
        {showUsernameTag && targetUsername && (
          <span className="ml-1 text-xs text-muted-foreground font-normal">
            (@{targetUsername})
          </span>
        )}
      </span>
    );
  }

  if (!username) {
    return <span className={className}>{fallback}</span>;
  }

  if (loading) {
    return (
      <span className={`inline-block animate-pulse text-muted-foreground ${className}`}>
        {loadingFallback}
      </span>
    );
  }

  const finalDisplayName = fullName || username || fallback;

  return (
    <span className={className}>
      {finalDisplayName}
      {showUsernameTag && username && finalDisplayName !== `@${username}` && (
        <span className="ml-1 text-xs text-muted-foreground font-normal">
          (@{username})
        </span>
      )}
    </span>
  );
}

export { getUserFullName, useUserFullName, preloadAllUsers };
