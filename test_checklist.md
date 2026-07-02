# Zalo AI SaaS MVP - Test Checklist

Tài liệu này dùng để theo dõi tiến độ kiểm thử (QA/Testing) của dự án. Đánh dấu `[x]` vào các mục sau khi đã kiểm tra thành công.

## 1. Xác thực (Authentication)
- `[x]` Đăng ký thành công với thông tin hợp lệ (Email, Password, Name).
- `[ ]` Đăng ký thất bại khi email đã tồn tại trong hệ thống.
- `[ ]` Đăng ký thất bại khi thiếu thông tin bắt buộc (Email, Password).
- `[ ]` Đăng nhập thành công, nhận được JWT Cookie hợp lệ.
- `[ ]` Đăng nhập thất bại do sai mật khẩu hoặc sai email.
- `[ ]` Đăng xuất thành công (Cookie bị xóa).
- `[ ]` Truy cập API nội bộ (Protected Routes) mà không có Token -> Bị từ chối (401 Unauthorized).
- `[ ]` API lấy thông tin User đang đăng nhập (`/api/v1/auth/me`) hoạt động đúng.

## 2. Tích hợp Zalo Webhook
- `[ ]` Xác thực Webhook (GET request) trả về 200 OK.
- `[ ]` Nhận tin nhắn từ KH mới -> Tự động tạo Customer, Conversation, và Message.
- `[ ]` Nhận tin nhắn từ KH cũ -> Thêm Message vào Conversation hiện tại, tăng `unreadCount`.
- `[ ]` Không lưu trùng lặp tin nhắn nếu nhận cùng một `zaloMessageId` (Duplicate payload).

## 3. Hệ thống Hộp thư (Inbox)
- `[ ]` Tải danh sách các cuộc hội thoại thành công (Có kèm tin nhắn preview).
- `[ ]` Phân trang (Pagination) danh sách hội thoại hoạt động đúng.
- `[ ]` Tìm kiếm hội thoại theo tên khách hàng.
- `[ ]` Bấm vào hội thoại hiển thị chi tiết lịch sử tin nhắn.
- `[ ]` Bấm vào hội thoại tự động cập nhật `unreadCount` về 0 (Đã xem).
- `[ ]` Phân biệt rõ màu/vị trí tin nhắn của Khách hàng, Nhân viên, và AI.
- `[ ]` Gửi tin nhắn mới (Role: Staff) hoạt động đúng, tự load lại lịch sử chat.
- `[ ]` Chặn gửi tin nhắn trống.

## 4. Quản lý Khách hàng (CRM)
- `[ ]` Tải danh sách khách hàng thành công (Có phân trang).
- `[ ]` Tìm kiếm khách hàng theo Tên, SĐT, hoặc Zalo ID.
- `[ ]` Lọc danh sách khách hàng theo Tag (Thẻ).
- `[ ]` Trang chi tiết hiển thị đầy đủ thông tin KH và lịch sử hội thoại.
- `[ ]` Thêm/Xóa Tag thành công.
- `[ ]` Cập nhật thông tin khách hàng (Tên, SĐT, Ghi chú nội bộ) thành công.

## 5. Trợ lý AI & Mẫu câu trả lời
- `[ ]` Đổi Provider AI (Gemini <-> OpenRouter) và lưu thành công.
- `[ ]` Cập nhật API Key và System Prompt thành công.
- `[ ]` Nút "Gợi ý AI" (Suggest) sinh nội dung chính xác theo ngữ cảnh tin nhắn.
- `[ ]` Tính năng "Trả lời tự động" (Auto-reply) hoạt động khi bật (Tự tạo Message với Role: AI).
- `[ ]` Không tự động trả lời khi tính năng Auto-reply đang tắt.
- `[ ]` Gợi ý AI báo lỗi rõ ràng nếu chưa cấu hình API Key.
- `[ ]` Thêm mới Mẫu câu (Canned Response) thành công.
- `[ ]` Sửa Mẫu câu thành công.
- `[ ]` Xóa Mẫu câu thành công.
- `[ ]` Tải danh sách các Mẫu câu thành công.

## 6. Thống kê (Analytics Dashboard)
- `[ ]` Bảng Dashboard hiển thị Tổng số Khách hàng chính xác.
- `[ ]` Bảng Dashboard hiển thị Tổng số Hội thoại đang mở chính xác.
- `[ ]` Bảng Dashboard hiển thị Tổng số Tin nhắn chính xác.
