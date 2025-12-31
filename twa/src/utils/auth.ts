/**
 * Utility functions for authentication
 */

/**
 * Set authentication token and user data in both localStorage and as cookies
 */
export function setAuthToken(token: string, user?: any) {
  if (typeof window === 'undefined') return;
  
  // Store in localStorage for client-side access
  localStorage.setItem('token', token);
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  }
  
  // Store as cookies for server-side access (middleware)
  // Cookie expires in 7 days
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);
  const expiresUTC = expires.toUTCString();
  
  document.cookie = `token=${token}; path=/; expires=${expiresUTC}; SameSite=Lax`;
  
  if (user) {
    // Store user roles as a cookie for middleware to check
    const roles = user.roles || [];
    document.cookie = `user_roles=${JSON.stringify(roles)}; path=/; expires=${expiresUTC}; SameSite=Lax`;
  }
}

/**
 * Remove authentication token and user data from both localStorage and cookies
 */
export function clearAuthToken() {
  if (typeof window === 'undefined') return;
  
  // Remove from localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Remove cookies by setting expiration in the past
  const pastDate = 'Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = `token=; path=/; expires=${pastDate}; SameSite=Lax`;
  document.cookie = `user_roles=; path=/; expires=${pastDate}; SameSite=Lax`;
}

/**
 * Get authentication token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}
