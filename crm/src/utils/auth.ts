/**
 * Utility functions for authentication
 */

/**
 * Set authentication token in both localStorage and as a cookie
 */
export function setAuthToken(token: string) {
  if (typeof window === 'undefined') return;
  
  // Store in localStorage for client-side access
  localStorage.setItem('token', token);
  
  // Store as a cookie for server-side access (middleware)
  // Cookie expires in 7 days
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);
  document.cookie = `token=${token}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
}

/**
 * Remove authentication token from both localStorage and cookies
 */
export function clearAuthToken() {
  if (typeof window === 'undefined') return;
  
  // Remove from localStorage
  localStorage.removeItem('token');
  
  // Remove cookie by setting expiration in the past
  document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
}

/**
 * Get authentication token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}
