import { Request, Response } from 'express';
import axios from 'axios';

/**
 * POST /api/v1/mock-zalo/send-to-webhook
 * Mô phỏng Zalo App gửi webhook lên hệ thống.
 */
export const sendMockWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, userName, text } = req.body;

    if (!userId || !text) {
      res.status(400).json({ success: false, message: 'Missing userId or text' });
      return;
    }

    // Payload giả lập y hệt chuẩn Zalo OA Webhook
    const zaloPayload = {
      event_name: 'user_send_text',
      sender: {
        id: userId,
        name: userName || `Mock User ${userId}`,
      },
      message: {
        text: text,
        msg_id: `mock_msg_${Date.now()}`,
      },
      timestamp: Date.now(),
    };

    // Forward tới webhook thật của hệ thống
    const webhookUrl = `http://localhost:${process.env.PORT || 4000}/api/v1/zalo/webhook`;
    
    await axios.post(webhookUrl, zaloPayload);

    res.json({ success: true, message: 'Gửi tin nhắn mock thành công' });
  } catch (error) {
    console.error('Mock send error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi gửi webhook giả lập' });
  }
};
