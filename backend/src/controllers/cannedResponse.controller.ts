import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { db } from '../utils/db';

/**
 * GET /api/v1/canned-responses
 * List all canned responses, optionally filtered by category.
 */
export const getCannedResponses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const category = req.query.category as string;
    const where: any = {};
    if (category) where.category = category;

    const responses = await db.cannedResponse.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ success: true, data: responses });
  } catch (error) {
    console.error('getCannedResponses error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * POST /api/v1/canned-responses
 * Create a new canned response.
 */
export const createCannedResponse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content, category, shortcut } = req.body;

    if (!title || !content) {
      res.status(400).json({ success: false, message: 'Title and content are required' });
      return;
    }

    let formattedShortcut = shortcut;
    if (formattedShortcut && typeof formattedShortcut === 'string') {
      formattedShortcut = formattedShortcut.trim();
      if (!formattedShortcut.startsWith('/')) {
        formattedShortcut = '/' + formattedShortcut;
      }
    }

    const response = await db.cannedResponse.create({
      data: { title, content, category, shortcut: formattedShortcut },
    });

    res.status(201).json({ success: true, data: response });
  } catch (error) {
    console.error('createCannedResponse error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * PUT /api/v1/canned-responses/:id
 * Update a canned response.
 */
export const updateCannedResponse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, content, category, shortcut } = req.body;

    const existing = await db.cannedResponse.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Canned response not found' });
      return;
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (category !== undefined) updateData.category = category;
    if (shortcut !== undefined) {
      let formattedShortcut = shortcut;
      if (formattedShortcut && typeof formattedShortcut === 'string') {
        formattedShortcut = formattedShortcut.trim();
        if (!formattedShortcut.startsWith('/')) {
          formattedShortcut = '/' + formattedShortcut;
        }
      }
      updateData.shortcut = formattedShortcut;
    }

    const updated = await db.cannedResponse.update({
      where: { id },
      data: updateData,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('updateCannedResponse error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * DELETE /api/v1/canned-responses/:id
 * Delete a canned response.
 */
export const deleteCannedResponse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await db.cannedResponse.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Canned response not found' });
      return;
    }

    await db.cannedResponse.delete({ where: { id } });
    res.json({ success: true, message: 'Canned response deleted' });
  } catch (error) {
    console.error('deleteCannedResponse error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
