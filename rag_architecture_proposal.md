# Báo cáo Đề xuất Kiến trúc "Trí thông minh ngữ cảnh" & RAG

Bản đề xuất này mô tả các bước để cấp cho AI khả năng "nhớ" lịch sử chat, "hiểu" thông tin khách hàng (CRM Context) và đặc biệt là tích hợp Hệ thống RAG (Retrieval-Augmented Generation) để AI có thể tự động trả lời thông tin sản phẩm.

## 📌 Lựa chọn hướng đi

Việc nâng cấp sẽ tự động đính kèm **Lịch sử chat** và **Thông tin CRM (Tags, Notes, Name)** vào Prompt cho AI.

Riêng phần **Kiến thức Sản phẩm (RAG)**, bạn vui lòng chọn 1 trong 2 Option dưới đây để tôi tiến hành:

> [!TIP]
> **Option 1: Basic Prompt Injection (Mock JSON DB)**
> - **Cách hoạt động:** Tạo 1 file `products.mock.ts` chứa 5-10 sản phẩm mẫu. Mỗi khi chat, backend sẽ nối toàn bộ danh sách này vào Prompt để gửi cho AI.
> - **Phù hợp:** Làm MVP nhanh, demo đơn giản, tiết kiệm chi phí, không cần setup phức tạp.

> [!IMPORTANT]
> **Option 2: Advanced Vector RAG (PostgreSQL pgvector)**
> - **Cách hoạt động:** Cài đặt extension `pgvector` vào database PostgreSQL hiện tại. Tạo bảng `Product`, sinh Embedding vector cho từng sản phẩm (dùng model của Gemini hoặc OpenRouter). Mỗi khi khách hỏi, backend sẽ "Vector Search" để lấy ra **Top 3** sản phẩm liên quan nhất và đưa vào Prompt.
> - **Phù hợp:** Chuẩn hóa kiến trúc production, sẵn sàng scale lên hàng ngàn sản phẩm, tiết kiệm token API.

**👉 Quyết định của bạn:** Bạn muốn triển khai **Option 1** hay **Option 2**? Hãy báo cho tôi biết trước khi bấm Proceed nhé!

---

## Chi tiết Triển khai (Dự kiến cho cả 2 Option)

### Backend - AI Context Helper

#### [NEW] [ai-context.ts](file:///e:/Document/vibecode/Project-2/backend/src/utils/ai-context.ts)
- Hàm `buildEnhancedSystemPrompt(conversationId, baseSystemPrompt)`.
- Hàm này sẽ:
  1. **(Nếu chọn Opt 1):** Đọc danh sách sản phẩm từ file Mock.
  2. **(Nếu chọn Opt 2):** Lấy câu hỏi hiện tại -> Sinh Embedding Vector -> Tìm Top K sản phẩm từ `pgvector`.
  3. Truy vấn Database lấy ra Customer liên kết với Conversation.
  4. Lấy ra tối đa 10 tin nhắn gần nhất và đảo ngược thứ tự thời gian.
  5. Nối Dữ liệu Sản phẩm + CRM + Lịch sử Chat vào `baseSystemPrompt`.

### Backend - AI Provider & Controllers

#### [MODIFY] [ai-provider.ts](file:///e:/Document/vibecode/Project-2/backend/src/utils/ai-provider.ts)
- Đổi format gửi đi thành `\n\n--- CURRENT INPUT ---\n${message}\n\nReply:` để AI phân biệt rõ lệnh.
- *(Nếu chọn Opt 2)*: Bổ sung thêm hàm `generateEmbedding(text)` để gọi API tạo vector.

#### [MODIFY] [ai.controller.ts](file:///e:/Document/vibecode/Project-2/backend/src/controllers/ai.controller.ts) & [zalo.controller.ts](file:///e:/Document/vibecode/Project-2/backend/src/controllers/zalo.controller.ts)
- Gọi `await buildEnhancedSystemPrompt` để lấy Prompt đầy đủ trước khi gọi `provider.generateReply`.

### Documentation

#### [MODIFY] [PROGRESS_REPORT.md](file:///e:/Document/vibecode/Project-2/PROGRESS_REPORT.md)
- Ghi nhận hoàn tất hệ thống Advanced RAG.

## Kế hoạch Kiểm tra (Verification)

### Kịch bản Test thủ công
1. Nhắn tin hỏi AI về một sản phẩm cụ thể (Ví dụ: "Shop có bán áo thun không, giá bao nhiêu?").
2. Kiểm tra AI có tự động truy xuất đúng thông tin sản phẩm từ hệ thống RAG để trả lời hay không.
3. Test tính liên kết ngữ cảnh: Nhắn "tôi muốn mua cái áo", xong nhắn tiếp "giá bao nhiêu", xem AI có hiểu câu sau đang nhắc đến sản phẩm ở câu trước không.
