import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { db } from '../utils/db';
import { sendZaloMessage } from '../utils/zalo';

/**
 * GET /api/v1/conversations
 * Returns paginated list of conversations with latest message preview.
 */
export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || '';
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status && (status === 'OPEN' || status === 'CLOSED')) {
      where.status = status;
    }

    if (search) {
      where.customer = {
        displayName: { contains: search, mode: 'insensitive' },
      };
    }

    const [conversations, total] = await Promise.all([
      db.conversation.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              displayName: true,
              zaloUserId: true,
              phone: true,
              tags: true,
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              content: true,
              senderType: true,
              createdAt: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      db.conversation.count({ where }),
    ]);

    const formatted = conversations.map((conv) => ({
      id: conv.id,
      customer: conv.customer,
      status: conv.status,
      unreadCount: conv.unreadCount,
      requiresHuman: conv.requiresHuman,
      botActive: conv.botActive,
      lastMessage: conv.messages[0] || null,
      updatedAt: conv.updatedAt,
      createdAt: conv.createdAt,
    }));

    res.json({
      success: true,
      data: {
        conversations: formatted,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('getConversations error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * GET /api/v1/conversations/:id
 * Returns conversation detail with all messages (paginated).
 */
export const getConversationById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const messagePage = parseInt(req.query.messagePage as string) || 1;
    const messageLimit = parseInt(req.query.messageLimit as string) || 50;
    const messageSkip = (messagePage - 1) * messageLimit;

    const conversation = await db.conversation.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    });

    if (!conversation) {
      res.status(404).json({ success: false, message: 'Conversation not found' });
      return;
    }

    const [messages, totalMessages] = await Promise.all([
      db.message.findMany({
        where: { conversationId: id },
        orderBy: { createdAt: 'asc' },
        skip: messageSkip,
        take: messageLimit,
      }),
      db.message.count({ where: { conversationId: id } }),
    ]);

    // Mark as read
    await db.conversation.update({
      where: { id },
      data: { unreadCount: 0 },
    });

    res.json({
      success: true,
      data: {
        conversation: {
          id: conversation.id,
          status: conversation.status,
          unreadCount: 0,
          requiresHuman: conversation.requiresHuman,
          botActive: conversation.botActive,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
          customer: conversation.customer,
        },
        messages,
        pagination: {
          page: messagePage,
          limit: messageLimit,
          total: totalMessages,
          totalPages: Math.ceil(totalMessages / messageLimit),
        },
      },
    });
  } catch (error) {
    console.error('getConversationById error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * POST /api/v1/conversations/:id/messages
 * Send a message in a conversation (staff reply).
 */
export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      res.status(400).json({ success: false, message: 'Message content is required' });
      return;
    }

    const conversation = await db.conversation.findUnique({ 
      where: { id },
      include: { customer: true }
    });
    if (!conversation) {
      res.status(404).json({ success: false, message: 'Conversation not found' });
      return;
    }

    const message = await db.message.create({
      data: {
        conversationId: id,
        content: content.trim(),
        senderType: 'STAFF',
      },
    });

    // Update conversation timestamp and clear requiresHuman since staff replied
    await db.conversation.update({
      where: { id },
      data: { 
        updatedAt: new Date(),
        requiresHuman: false
      },
    });

    // Emit socket event for the mock and real clients
    const io = req.app.get('io');
    if (io) {
      io.emit('new_message', { conversationId: id });
    }

    // Gửi tin nhắn thực tế qua Zalo API
    await sendZaloMessage(conversation.customer.zaloUserId, content.trim());

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error('sendMessage error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * GET /api/v1/conversations/stats
 * Returns conversation statistics for the dashboard.
 */
export const getConversationStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [totalConversations, openConversations, totalMessages, totalCustomers] = await Promise.all([
      db.conversation.count(),
      db.conversation.count({ where: { status: 'OPEN' } }),
      db.message.count(),
      db.customer.count(),
    ]);

    res.json({
      success: true,
      data: {
        totalConversations,
        openConversations,
        totalMessages,
        totalCustomers,
      },
    });
  } catch (error) {
    console.error('getConversationStats error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * PATCH /api/v1/conversations/:id/bot-status
 * Toggle botActive status for a conversation.
 */
export const toggleBotStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { botActive } = req.body;

    if (typeof botActive !== 'boolean') {
      res.status(400).json({ success: false, message: 'botActive boolean is required' });
      return;
    }

    const conversation = await db.conversation.update({
      where: { id },
      data: { 
        botActive,
        requiresHuman: botActive ? false : undefined, // If bot is re-enabled, clear requiresHuman flag
        updatedAt: new Date() 
      },
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('new_message', { conversationId: id }); // Notify clients to update UI
    }

    res.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error('toggleBotStatus error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
