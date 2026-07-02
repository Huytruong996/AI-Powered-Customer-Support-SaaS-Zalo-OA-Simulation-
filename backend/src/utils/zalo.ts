import axios from 'axios';
import { db } from './db';

/**
 * Gửi tin nhắn Text tới Zalo User thông qua Zalo OpenAPI (v3.0)
 * Tài liệu: https://developers.zalo.me/docs/api/official-account-api/api-gui-tin-nhan/gui-tin-nhan-cs-dang-van-ban
 */
export const sendZaloMessage = async (zaloUserId: string, text: string): Promise<boolean> => {
  try {
    const config = await db.zaloConfiguration.findFirst();
    
    if (!config || !config.accessToken) {
      console.warn('[Zalo API] Không tìm thấy Access Token. Bỏ qua việc gửi tin Zalo thật.');
      return false; // Mock UI vẫn sẽ hiển thị được vì nó đọc từ DB
    }

    const response = await axios.post(
      'https://openapi.zalo.me/v3.0/oa/message/cs',
      {
        recipient: {
          user_id: zaloUserId,
        },
        message: {
          text: text,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          access_token: config.accessToken,
        },
      }
    );

    if (response.data.error === 0) {
      console.log(`[Zalo API] Gửi tin nhắn thành công tới ${zaloUserId}`);
      return true;
    } else {
      console.error(`[Zalo API] Lỗi từ Zalo: ${response.data.message} (Code: ${response.data.error})`);
      return false;
    }
  } catch (error: any) {
    console.error('[Zalo API] Gặp lỗi khi gọi API Zalo:', error.response?.data || error.message);
    return false;
  }
};
