import { db } from './db';

/**
 * Refresh Zalo OA access token using the refresh token.
 * Documentation: https://developers.zalo.me/docs/api/official-account-api/xac-thuc-va-uy-quyen/cach-1-xac-thuc-voi-giao-thuc-oauth/lay-access-token-tu-refresh-token
 */
export const refreshZaloToken = async () => {
  try {
    const config = await db.zaloConfiguration.findFirst();
    if (!config || !config.appId || !config.secretKey || !config.refreshToken) {
      console.log('[Zalo Refresh] Missing Zalo configuration (appId, secretKey, refreshToken). Skipping auto-refresh.');
      return;
    }

    console.log('[Zalo Refresh] Attempting to refresh Zalo access token...');

    const response = await fetch('https://oauth.zaloapp.com/v4/oa/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'secret_key': config.secretKey,
      },
      body: new URLSearchParams({
        app_id: config.appId,
        refresh_token: config.refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    });

    const data = await response.json();

    if (data.access_token) {
      await db.zaloConfiguration.update({
        where: { id: config.id },
        data: {
          accessToken: data.access_token,
          refreshToken: data.refresh_token || config.refreshToken,
        },
      });
      console.log('[Zalo Refresh] Successfully refreshed Zalo access token.');
    } else {
      console.error('[Zalo Refresh] Failed to refresh token:', data);
    }
  } catch (error) {
    console.error('[Zalo Refresh] Error during token refresh:', error);
  }
};

/**
 * Start the Zalo token refresh background job.
 * Runs every hour (3600000 ms).
 */
export const startZaloTokenRefreshJob = () => {
  // Run immediately on startup
  refreshZaloToken();

  // Run every 1 hour
  setInterval(() => {
    refreshZaloToken();
  }, 60 * 60 * 1000);
  
  console.log('[Zalo Refresh] Token refresh job started.');
};
