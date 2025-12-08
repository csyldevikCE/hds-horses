import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validates a URL to ensure it's safe to open in a new window
 * Prevents javascript: protocol injection and other malicious URLs
 */
export function isValidExternalUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return ['http:', 'https:'].includes(urlObj.protocol)
  } catch {
    return false
  }
}

/**
 * Safely opens a URL in a new tab if it passes validation
 * Returns false if the URL is invalid
 */
export function safeOpenUrl(url: string): boolean {
  if (!isValidExternalUrl(url)) {
    return false
  }
  window.open(url, '_blank', 'noopener,noreferrer')
  return true
}
