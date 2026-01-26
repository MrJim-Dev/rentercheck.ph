import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a login URL with an optional returnTo parameter
 * @param returnTo - The path to return to after login (default: current path)
 * @returns Login URL with returnTo parameter
 */
export function getLoginUrl(returnTo?: string): string {
  const path = returnTo || (typeof window !== 'undefined' ? window.location.pathname : '/')
  return `/login?returnTo=${encodeURIComponent(path)}`
}

/**
 * Generates a signup URL with an optional returnTo parameter
 * @param returnTo - The path to return to after signup (default: current path)
 * @returns Signup URL with returnTo parameter
 */
export function getSignupUrl(returnTo?: string): string {
  const path = returnTo || (typeof window !== 'undefined' ? window.location.pathname : '/')
  return `/signup?returnTo=${encodeURIComponent(path)}`
}

