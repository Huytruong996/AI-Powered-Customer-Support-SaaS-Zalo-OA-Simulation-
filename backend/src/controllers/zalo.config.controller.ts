import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { db } from '../utils/db';

/**
 * GET /api/v1/zalo/config
 * Get current Zalo configuration.
 */
export const getZaloConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let config = await db.zaloConfiguration.findFirst();

    if (!config) {
      config = await db.zaloConfiguration.create({
        data: {},
      });
    }

    res.json({
      success: true,
      data: {
        id: config.id,
        appId: config.appId || '',
        hasSecretKey: !!config.secretKey,
        hasAccessToken: !!config.accessToken,
        hasRefreshToken: !!config.refreshToken,
      },
    });
  } catch (error) {
    console.error('getZaloConfig error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * PUT /api/v1/zalo/config
 * Update Zalo configuration.
 */
export const updateZaloConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { appId, secretKey, accessToken, refreshToken } = req.body;

    let config = await db.zaloConfiguration.findFirst();

    const updateData: any = {};
    if (appId !== undefined) updateData.appId = appId;
    if (secretKey !== undefined && secretKey !== '') updateData.secretKey = secretKey;
    if (accessToken !== undefined && accessToken !== '') updateData.accessToken = accessToken;
    if (refreshToken !== undefined && refreshToken !== '') updateData.refreshToken = refreshToken;

    if (config) {
      config = await db.zaloConfiguration.update({
        where: { id: config.id },
        data: updateData,
      });
    } else {
      config = await db.zaloConfiguration.create({
        data: updateData,
      });
    }

    res.json({
      success: true,
      data: {
        id: config.id,
        appId: config.appId || '',
        hasSecretKey: !!config.secretKey,
        hasAccessToken: !!config.accessToken,
        hasRefreshToken: !!config.refreshToken,
      },
    });
  } catch (error) {
    console.error('updateZaloConfig error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
