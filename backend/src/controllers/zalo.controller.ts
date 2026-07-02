import { Request, Response } from 'express';
import { db } from '../utils/db';
import { sendZaloMessage } from '../utils/zalo';

/**
 * GET /api/v1/zalo/webhook
 * Zalo webhook verification endpoint.
 */
export const verifyWebhook = (req: Request, res: Response) => {
  // Zalo webhook verification logic usually involves checking a challenge or secret
  // For the MVP, we just accept the GET request if it matches our secret setup or just return success
  res.status(200).send('OK');
};

/**
 * POST /api/v1/zalo/webhook
 * Receives incoming Zalo messages and persists them.
 * Creates Customer (if new) → Conversation (if none open) → Message.
 */
export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const { event_name, sender, message } = req.body;

    if (event_name === 'user_send_text') {
      const zaloUserId = sender.id;
      const text = message.text;
      const messageId = message.msg_id;

      // 1. Upsert customer
      let customer = await db.customer.findUnique({
        where: { zaloUserId },
      });

      if (!customer) {
        customer = await db.customer.create({
          data: {
            zaloUserId,
            displayName: sender.name || `Zalo User ${zaloUserId.slice(-4)}`,
          },
        });
      }

      // 2. Find or create an open conversation
      let conversation = await db.conversation.findFirst({
        where: {
          customerId: customer.id,
          status: 'OPEN',
        },
      });

      if (!conversation) {
        conversation = await db.conversation.create({
          data: {
            customerId: customer.id,
            status: 'OPEN',
          },
        });
      }

      // 3. Create the message (skip duplicates by zaloMessageId)
      const existingMessage = messageId
        ? await db.message.findUnique({ where: { zaloMessageId: messageId } })
        : null;

      if (!existingMessage) {
        await db.message.create({
          data: {
            conversationId: conversation.id,
            content: text,
            senderType: 'CUSTOMER',
            zaloMessageId: messageId || null,
          },
        });

        // 4. Increment unread count and update timestamp
        await db.conversation.update({
          where: { id: conversation.id },
          data: {
            unreadCount: { increment: 1 },
            updatedAt: new Date(),
          },
        });

        // Emit socket event for incoming message
        const io = req.app.get('io');
        if (io) {
          io.emit('new_message', { conversationId: conversation.id });
        }

        // 5. Trigger AI Auto-Reply if enabled
        try {
          if (!conversation.botActive) {
            console.log(`[AI Auto-Reply] Skipped for ${customer.displayName} (Bot Inactive)`);
          } else {
            const config = await db.aIConfiguration.findFirst();
            if (config && config.autoReplyEnabled && config.apiKey) {
              const { createAIProvider } = await import('../utils/ai-provider');
              const { buildEnhancedSystemPrompt } = await import('../utils/ai-context');
              const provider = createAIProvider(config.provider, config.apiKey);
              
              const handoverInstruction = `\n\n[INSTRUCTION]: Nếu khách hàng yêu cầu gặp nhân viên hoặc hỏi những vấn đề bạn không thể giải quyết, hãy thêm chính xác chuỗi "[HANDOVER]" vào trong câu trả lời của bạn, sau đó nói rằng bạn sẽ chuyển máy. Ví dụ: "[HANDOVER] Dạ vâng, em sẽ chuyển máy cho nhân viên tư vấn ạ."`;
              const systemPrompt = (config.systemPrompt || '') + handoverInstruction;
              
              const enhancedPrompt = await buildEnhancedSystemPrompt(conversation.id, text, systemPrompt, provider);
              const reply = await provider.generateReply(text, enhancedPrompt);
              
              let finalReply = reply;
              if (reply.includes('[HANDOVER]')) {
                finalReply = reply.replace('[HANDOVER]', '').trim();
                
                const currentHour = new Date().getHours();
                const startHour = parseInt(config.workingHoursStart?.split(':')[0] || '8');
                const endHour = parseInt(config.workingHoursEnd?.split(':')[0] || '17');
                const isWorkingHours = currentHour >= startHour && currentHour < endHour;
                
                if (!isWorkingHours) {
                  finalReply += `\n\nHiện tại nhân viên tư vấn đã hết giờ làm việc (từ ${config.workingHoursStart || '08:00'} đến ${config.workingHoursEnd || '17:00'}). Chúng tôi sẽ liên hệ lại với bạn vào giờ làm việc tiếp theo nhé.`;
                }
                
                await db.conversation.update({
                  where: { id: conversation.id },
                  data: { requiresHuman: true, botActive: false, updatedAt: new Date() }
                });
              } else {
                await db.conversation.update({
                  where: { id: conversation.id },
                  data: { updatedAt: new Date() },
                });
              }

              await db.message.create({
                data: {
                  conversationId: conversation.id,
                  content: finalReply,
                  senderType: 'AI',
                },
              });

              await db.aIConversationLog.create({
                data: {
                  conversationId: conversation.id,
                  prompt: text,
                  response: finalReply,
                  provider: config.provider,
                },
              });
              
              if (io) {
                io.emit('new_message', { conversationId: conversation.id });
              }
              
              // Send to Zalo API
              await sendZaloMessage(customer.zaloUserId, finalReply);
              
              console.log(`[AI Auto-Reply] Sent reply to ${customer.displayName}`);
            }
          }
        } catch (aiError) {
          console.error('[AI Auto-Reply] Error:', aiError);
        }
      }

      console.log(`[Zalo Webhook] Message from ${customer.displayName}: ${text}`);
    }

    res.status(200).json({ success: true, message: 'Webhook received' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
