# AI-Powered Customer Support SaaS (Zalo OA Simulation)

![Project Status](https://img.shields.io/badge/Status-In_Development-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.0-black.svg?logo=next.js)
![Node.js](https://img.shields.io/badge/Node.js-Backend-339933.svg?logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-4169E1.svg?logo=postgresql)

## 📌 Giới thiệu (Overview)
Dự án này là một hệ thống SaaS (Software as a Service) Hỗ trợ Khách hàng tích hợp Trí tuệ nhân tạo (AI), được thiết kế mô phỏng theo nền tảng **Zalo Official Account (Zalo OA)**. 
Hệ thống cho phép các doanh nghiệp quản lý tin nhắn của khách hàng từ nhiều nguồn khác nhau, đồng thời sử dụng AI để tự động trả lời, phân tích ngữ cảnh và đề xuất câu trả lời dựa trên kho tri thức (Knowledge Base) của riêng doanh nghiệp.

## 🚀 Tính năng nổi bật (Key Features)
- **Tích hợp Zalo OA (Mô phỏng):** Giao diện nhắn tin và quản lý tương tác khách hàng theo thời gian thực tương tự Zalo OA.
- **AI Chatbot & RAG (Retrieval-Augmented Generation):** AI có khả năng đọc tài liệu nội bộ của doanh nghiệp (được vector hóa thông qua `pgvector`) để tự động trả lời câu hỏi của khách hàng một cách chính xác.
- **Quản lý Hộp thư (Inbox Dashboard):** Giao diện phân loại tin nhắn, quản lý đoạn chat, và hỗ trợ trực tiếp (Live Chat).
- **Quản lý Kho tri thức (Knowledge Base):** Cho phép doanh nghiệp tải lên tài liệu mẫu, quy trình chăm sóc khách hàng để "huấn luyện" AI.
- **Phân quyền & Quản trị:** Quản lý tài khoản doanh nghiệp (Tenant) độc lập và bảo mật thông tin khách hàng.

## 🛠️ Công nghệ sử dụng (Tech Stack)

### Frontend (Giao diện người dùng)
- **Framework:** Next.js (App Router)
- **Ngôn ngữ:** TypeScript
- **Giao diện & UI Components:** Tailwind CSS, shadcn/ui

### Backend (Hệ thống máy chủ)
- **Framework:** Node.js / Express.js (hoặc tương đương)
- **Ngôn ngữ:** TypeScript
- **ORM:** Prisma
- **AI & Embedding:** Tích hợp mô hình ngôn ngữ lớn (LLM) và local embedding.

### Cơ sở dữ liệu (Database)
- **Hệ quản trị CSDL:** PostgreSQL
- **Vector Search:** `pgvector` extension (Lưu trữ và truy xuất dữ liệu Knowledge Base cho AI).
- **Môi trường chạy cục bộ:** Docker Compose

## 📂 Cấu trúc thư mục (Folder Structure)
```
.
├── frontend/             # Chứa mã nguồn giao diện Next.js
├── backend/              # Chứa API Server Node.js và cấu hình Prisma
├── docker-compose.yml    # Cấu hình khởi tạo Database PostgreSQL + pgvector (Local)
└── README.md             # Tài liệu mô tả dự án
```

## 💻 Hướng dẫn chạy môi trường phát triển (Local Development)

### 1. Khởi động Cơ sở dữ liệu
Dự án yêu cầu cài đặt Docker. Chạy lệnh sau để khởi động PostgreSQL:
```bash
docker-compose up -d
```

### 2. Cài đặt Backend
```bash
cd backend
npm install
npx prisma db push  # Cập nhật schema vào database
npm run dev         # Khởi động server
```

### 3. Cài đặt Frontend
```bash
cd frontend
npm install
npm run dev         # Khởi động giao diện Next.js
```

---
*Dự án được phát triển nhằm mục đích cung cấp giải pháp CSKH tự động hóa thông minh cho các doanh nghiệp.*
