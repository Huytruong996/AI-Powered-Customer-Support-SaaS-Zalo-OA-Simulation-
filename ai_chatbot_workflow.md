# Luồng hoạt động của Chatbot AI (Tích hợp Zalo)

Dưới đây là sơ đồ mô tả cách một AI Chatbot (như OpenAI, Gemini) thực tế hoạt động khi được tích hợp vào hệ thống Zalo OA của bạn.

## Sơ đồ luồng (Sequence Diagram)

```mermaid
sequenceDiagram
    participant C as Khách hàng (Zalo App)
    participant Z as Zalo Server
    participant S as SaaS Backend (Node.js)
    participant DB as Cơ sở dữ liệu
    participant AI as AI API (Gemini/OpenAI)
    participant F as Frontend (Nhân viên)

    C->>Z: 1. Gửi tin nhắn ("Shop có bán áo?")
    Z->>S: 2. Webhook Event (user_send_text)
    
    rect rgb(230, 240, 255)
        S->>DB: 3. Lưu tin nhắn của Khách
        S->>F: 3. Cập nhật UI (Socket.io)
    end
    
    note over S,AI: Bắt đầu xử lý AI (Nếu bật Auto-reply)
    
    rect rgb(255, 240, 230)
        S->>DB: 4. Lấy AI Config & System Prompt
        S->>AI: 5. Gửi Prompt + Tin nhắn Khách
        AI-->>S: 6. Trả về câu trả lời ("Dạ shop có áo ạ...")
    end

    rect rgb(230, 255, 230)
        S->>DB: 7. Lưu tin nhắn AI (senderType: 'AI')
        S->>F: 7. Cập nhật UI cho nhân viên xem
        S->>Z: 8. Gọi Zalo API gửi lại câu trả lời
        Z-->>C: 9. Khách nhận được tin nhắn trả lời
    end
```

## Giải thích chi tiết các bước:

1. **Khách hàng nhắn tin:** Người dùng mở ứng dụng Zalo và nhắn tin cho trang Zalo OA của bạn.
2. **Webhook kích hoạt:** Zalo Server bắt được tin nhắn và lập tức bắn một HTTP POST request (Webhook) về server của bạn.
3. **Lưu trữ & Hiển thị:** Backend của bạn (`zalo.controller.ts`) nhận dữ liệu, lưu vào database và báo cho Frontend (màn hình Inbox của nhân viên) cập nhật realtime thông qua `Socket.io`.
4. **Kiểm tra trạng thái AI:** Hệ thống kiểm tra xem tính năng AI Auto-Reply có đang được bật hay không và lấy cấu hình (API Key, Prompt - *VD: "Bạn là nhân viên bán hàng..."*).
5. **Gửi yêu cầu tới AI:** Backend gộp **System Prompt** và **Tin nhắn của khách** thành một đoạn văn bản (context) rồi gọi sang API của các bên cung cấp AI (như Google Gemini, OpenAI ChatGPT).
6. **AI phân tích & sinh văn bản:** AI đọc hiểu yêu cầu và trả về một đoạn text trả lời phù hợp nhất.
7. **Lưu vết:** Hệ thống lưu câu trả lời này vào Database với loại người gửi là `AI` để nhân viên có thể xem lại AI đã nói gì với khách.
8. **Trả lời khách hàng:** Backend gọi **Zalo OpenAPI (Gửi tin nhắn)** để đẩy câu trả lời của AI quay ngược lại cho người dùng. (Nếu đang dùng Zalo Mock, bước này sẽ là emit dữ liệu cho Zalo Mock hiển thị).
9. **Khách nhận tin:** Khách hàng thấy tin nhắn phản hồi ngay lập tức trên app Zalo của họ.

> [!WARNING]
> **Thực trạng code hiện tại của bạn:**
> Khi xem qua file `backend/src/controllers/zalo.controller.ts`, mình thấy bạn đã viết logic từ bước **1 đến bước 7** cực kỳ chuẩn xác. 
> Tuy nhiên, code hiện tại đang **thiếu bước số 8**. Nghĩa là AI đã sinh ra được câu trả lời và đã lưu vào DB, nhân viên cũng thấy trên Inbox, nhưng khách hàng (client) thì không nhận được vì bạn chưa gọi Zalo API (hoặc Mock webhook) để trả tin về Zalo App.
