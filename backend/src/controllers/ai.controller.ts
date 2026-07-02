import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { db } from '../utils/db';
import { createAIProvider } from '../utils/ai-provider';
import { buildEnhancedSystemPrompt } from '../utils/ai-context';

/**
 * POST /api/v1/ai/suggest
 * AI Suggestion Mode: Generate a suggested reply for a customer message.
 * Staff reviews and optionally sends.
 */
export const suggestReply = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { conversationId, message } = req.body;
    if (!conversationId || !message) {
      res.status(400).json({ success: false, message: 'conversationId and message are required' });
      return;
    }

    // Get AI configuration
    const config = await db.aIConfiguration.findFirst();
    if (!config || !config.apiKey) {
      res.status(400).json({ success: false, message: 'AI is not configured. Set API key in Settings.' });
      return;
    }

    const provider = createAIProvider(config.provider, config.apiKey);
    const enhancedPrompt = await buildEnhancedSystemPrompt(conversationId, message, config.systemPrompt || '', provider);
    const suggestedReply = await provider.generateReply(message, enhancedPrompt);

    // Log the AI interaction
    await db.aIConversationLog.create({
      data: {
        conversationId,
        prompt: message,
        response: suggestedReply,
        provider: config.provider,
      },
    });

    res.json({
      success: true,
      data: {
        suggestion: suggestedReply,
        provider: config.provider,
      },
    });
  } catch (error) {
    console.error('suggestReply error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate AI suggestion' });
  }
};

/**
 * POST /api/v1/ai/suggest-stream
 * AI Suggestion Mode with Streaming: Generate a suggested reply for a customer message.
 */
export const suggestReplyStream = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { conversationId, message } = req.body;
    if (!conversationId || !message) {
      res.status(400).json({ success: false, message: 'conversationId and message are required' });
      return;
    }

    // Get AI configuration
    const config = await db.aIConfiguration.findFirst();
    if (!config || !config.apiKey) {
      res.status(400).json({ success: false, message: 'AI is not configured. Set API key in Settings.' });
      return;
    }

    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const provider = createAIProvider(config.provider, config.apiKey);
    const enhancedPrompt = await buildEnhancedSystemPrompt(conversationId, message, config.systemPrompt || '', provider);
    
    let fullReply = '';
    const stream = provider.generateReplyStream(message, enhancedPrompt);

    for await (const chunk of stream) {
      fullReply += chunk;
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    }

    res.write(`data: [DONE]\n\n`);
    res.end();

    // Log the AI interaction after streaming is complete
    try {
      await db.aIConversationLog.create({
        data: {
          conversationId,
          prompt: message,
          response: fullReply,
          provider: config.provider,
        },
      });
    } catch (logError) {
      console.error('Failed to log AI interaction:', logError);
    }
  } catch (error) {
    console.error('suggestReplyStream error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate AI suggestion' });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Failed to generate AI suggestion' })}\n\n`);
      res.end();
    }
  }
};

/**
 * POST /api/v1/ai/auto-reply
 * AI Auto-Reply Mode: Generate and automatically send a reply.
 */
export const autoReply = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { conversationId, message } = req.body;

    if (!conversationId || !message) {
      res.status(400).json({ success: false, message: 'conversationId and message are required' });
      return;
    }

    // Check if auto-reply is enabled
    const config = await db.aIConfiguration.findFirst();
    if (!config || !config.apiKey) {
      res.status(400).json({ success: false, message: 'AI is not configured.' });
      return;
    }

    if (!config.autoReplyEnabled) {
      res.status(400).json({ success: false, message: 'Auto-reply is not enabled.' });
      return;
    }

    const provider = createAIProvider(config.provider, config.apiKey);
    const enhancedPrompt = await buildEnhancedSystemPrompt(conversationId, message, config.systemPrompt || '', provider);
    const reply = await provider.generateReply(message, enhancedPrompt);

    // Create the auto-reply message in the conversation
    const aiMessage = await db.message.create({
      data: {
        conversationId,
        content: reply,
        senderType: 'AI',
      },
    });

    // Log the AI interaction
    await db.aIConversationLog.create({
      data: {
        conversationId,
        prompt: message,
        response: reply,
        provider: config.provider,
      },
    });

    // Update conversation timestamp
    await db.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    res.json({
      success: true,
      data: {
        message: aiMessage,
        provider: config.provider,
      },
    });
  } catch (error) {
    console.error('autoReply error:', error);
    res.status(500).json({ success: false, message: 'Failed to auto-reply' });
  }
};

/**
 * GET /api/v1/ai/config
 * Get current AI configuration.
 */
export const getAIConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let config = await db.aIConfiguration.findFirst();

    if (!config) {
      config = await db.aIConfiguration.create({
        data: {
          provider: 'gemini',
          autoReplyEnabled: false,
        },
      });
    }

    // Don't expose the full API key
    res.json({
      success: true,
      data: {
        id: config.id,
        provider: config.provider,
        hasApiKey: !!config.apiKey,
        systemPrompt: config.systemPrompt,
        autoReplyEnabled: config.autoReplyEnabled,
      },
    });
  } catch (error) {
    console.error('getAIConfig error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * PUT /api/v1/ai/config
 * Update AI configuration.
 */
export const updateAIConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { provider, apiKey, systemPrompt, autoReplyEnabled } = req.body;

    let config = await db.aIConfiguration.findFirst();

    const updateData: any = {};
    if (provider !== undefined) updateData.provider = provider;
    if (apiKey !== undefined) updateData.apiKey = apiKey;
    if (systemPrompt !== undefined) updateData.systemPrompt = systemPrompt;
    if (autoReplyEnabled !== undefined) updateData.autoReplyEnabled = autoReplyEnabled;

    if (config) {
      config = await db.aIConfiguration.update({
        where: { id: config.id },
        data: updateData,
      });
    } else {
      config = await db.aIConfiguration.create({
        data: {
          provider: provider || 'gemini',
          apiKey: apiKey || null,
          systemPrompt: systemPrompt || null,
          autoReplyEnabled: autoReplyEnabled || false,
        },
      });
    }

    res.json({
      success: true,
      data: {
        id: config.id,
        provider: config.provider,
        hasApiKey: !!config.apiKey,
        systemPrompt: config.systemPrompt,
        autoReplyEnabled: config.autoReplyEnabled,
      },
    });
  } catch (error) {
    console.error('updateAIConfig error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
