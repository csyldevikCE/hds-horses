/**
 * Vercel Serverless Function: BLUP API Proxy
 *
 * Proxies requests to the BLUP API to avoid CORS issues.
 * The BLUP API doesn't include CORS headers, so browser requests fail.
 * This serverless function acts as a proxy, making server-to-server requests.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// BLUP API Configuration
const BLUP_API_BASE_URL = 'https://www.blup.se/api/v1';
const BLUP_API_TOKEN = '9f1a2b3c4d5e6f7890abc1234567890defabcdef1234567890abcdef12345678';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS for this endpoint
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get registration number from query parameter
    const { regno } = req.query;

    if (!regno || typeof regno !== 'string') {
      return res.status(400).json({ error: 'Registration number is required' });
    }

    // Clean the registration number
    const cleanRegno = regno.trim().replace(/[-\s]/g, '');

    // Construct BLUP API URL
    const url = `${BLUP_API_BASE_URL}/horses/${cleanRegno}?token=${BLUP_API_TOKEN}`;

    console.log('[BLUP Proxy] Fetching from:', url);

    // Fetch from BLUP API
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[BLUP Proxy] Error:', response.status, errorText);

      if (response.status === 404) {
        return res.status(404).json({
          error: `Horse with registration number "${regno}" not found in BLUP system`
        });
      }

      // Check if we got an HTML error page (Cloudflare error, API down, etc.)
      const isHtmlError = errorText.trim().startsWith('<!DOCTYPE') || errorText.trim().startsWith('<html');

      if (response.status >= 500) {
        return res.status(502).json({
          error: 'The BLUP system is temporarily unavailable',
          message: 'The external BLUP API is currently experiencing issues. Please try again in a few minutes.',
          status: response.status
        });
      }

      return res.status(response.status).json({
        error: `BLUP API error: ${response.status} ${response.statusText}`,
        details: isHtmlError ? 'Server error (HTML response received)' : errorText
      });
    }

    // Parse and return the data
    const data = await response.json();
    console.log('[BLUP Proxy] Success:', data.name, data.regno);

    // Return the data with CORS headers
    return res.status(200).json(data);

  } catch (error) {
    console.error('[BLUP Proxy] Unexpected error:', error);
    return res.status(500).json({
      error: 'Failed to fetch horse data from BLUP system',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
