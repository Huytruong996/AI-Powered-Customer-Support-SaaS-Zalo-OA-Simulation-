import { db as prisma } from '../src/utils/db';
import bcrypt from 'bcrypt';
import { generateLocalEmbedding } from '../src/utils/local-embedding';

async function main() {
  console.log('Seeding database...');
  console.log('Clearing existing data...');
  
  // Clear existing data to prevent duplicates
  await prisma.aIConversationLog.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.cannedResponse.deleteMany();
  await prisma.knowledge.deleteMany();
  // Note: we don't delete Users or Customers so they remain ifupserted, or we could delete them if needed, but upsert handles them.

  // Create an admin user if not exists
  const adminEmail = 'admin@example.com';
  const password = await bcrypt.hash('password123', 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });
  console.log('Admin user checked/created.');

  // Create customers
  const customer1 = await prisma.customer.upsert({
    where: { zaloUserId: 'zalo_12345' },
    update: {},
    create: {
      zaloUserId: 'zalo_12345',
      displayName: 'Nguyen Van A',
      phone: '0901234567',
      tags: ['vip', 'new'],
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { zaloUserId: 'zalo_67890' },
    update: {},
    create: {
      zaloUserId: 'zalo_67890',
      displayName: 'Tran Thi B',
      phone: '0919876543',
    },
  });

  // Create conversations
  const conv1 = await prisma.conversation.create({
    data: {
      customerId: customer1.id,
      status: 'OPEN',
      unreadCount: 1,
    },
  });

  const conv2 = await prisma.conversation.create({
    data: {
      customerId: customer2.id,
      status: 'CLOSED',
    },
  });

  // Create messages
  await prisma.message.createMany({
    data: [
      {
        conversationId: conv1.id,
        content: 'Xin chào, tôi muốn hỏi về sản phẩm.',
        senderType: 'CUSTOMER',
        createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      },
      {
        conversationId: conv1.id,
        content: 'Dạ chào anh, anh cần tư vấn về sản phẩm nào ạ?',
        senderType: 'STAFF',
        createdAt: new Date(Date.now() - 1000 * 60 * 30),
      },
      {
        conversationId: conv1.id,
        content: 'Cho mình xin bảng giá nhé.',
        senderType: 'CUSTOMER',
        createdAt: new Date(),
      },
      {
        conversationId: conv2.id,
        content: 'Sản phẩm bên mình có bảo hành không?',
        senderType: 'CUSTOMER',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      },
      {
        conversationId: conv2.id,
        content: 'Có ạ, bảo hành 12 tháng.',
        senderType: 'AI',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 23),
      },
    ],
  });

  // Create Templates (Canned Responses)
  await prisma.cannedResponse.createMany({
    skipDuplicates: true,
    data: [
      {
        title: 'Greeting',
        content: 'Xin chào, cảm ơn bạn đã liên hệ. Mình có thể giúp gì cho bạn?',
        category: 'General',
        shortcut: '/hi',
      },
      {
        title: 'Báo giá',
        content: 'Dạ, sản phẩm bạn quan tâm hiện đang có giá ưu đãi là [GIÁ]. Bạn có muốn đặt hàng luôn không ạ?',
        category: 'Sales',
        shortcut: '/price',
      },
      {
        title: 'Xin địa chỉ',
        content: 'Dạ, bạn vui lòng cho mình xin địa chỉ nhận hàng và số điện thoại để bên mình tiến hành giao hàng nhé.',
        category: 'Order',
        shortcut: '/address',
      },
      {
        title: 'Xin lỗi',
        content: 'Xin lỗi bạn vì sự cố vừa rồi. Bên mình sẽ kiểm tra lại và phản hồi bạn trong thời gian sớm nhất.',
        category: 'Support',
        shortcut: '/sorry',
      },
      {
        title: 'Hỏi tên',
        content: 'Dạ, để tiện xưng hô và hỗ trợ tốt nhất, bạn cho mình xin tên nhé.',
        category: 'General',
        shortcut: '/name',
      },
      {
        title: 'Thanh toán chuyển khoản',
        content: 'Dạ bạn có thể chuyển khoản vào STK: 123456789 (Vietcombank) - Tên TK: TECHSHOP. Nội dung: [Tên của bạn] - [Số điện thoại].',
        category: 'Payment',
        shortcut: '/bank',
      },
      {
        title: 'Cảm ơn',
        content: 'Cảm ơn bạn đã quan tâm đến sản phẩm của TechShop. Chúc bạn một ngày vui vẻ!',
        category: 'General',
        shortcut: '/thanks',
      },
      {
        title: 'Chốt sale',
        content: 'Sản phẩm này bên mình đang còn số lượng rất ít, bạn nhanh tay chốt đơn để không bỏ lỡ ưu đãi nhé!',
        category: 'Sales',
        shortcut: '/chot',
      },
    ],
  });

  // Create Knowledge Base items (3 types: PRODUCT, POLICY, GENERAL)
  const knowledgeData = [
    {
      title: 'Giờ mở cửa và Địa chỉ',
      content: 'Cửa hàng mở cửa từ 8:00 sáng đến 9:00 tối mỗi ngày, kể cả thứ 7 và Chủ nhật. Địa chỉ cửa hàng: 123 Đường Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh.',
      type: 'GENERAL',
    },
    {
      title: 'Chính sách đổi trả',
      content: 'Khách hàng có thể đổi trả sản phẩm trong vòng 7 ngày kể từ ngày nhận hàng nếu có lỗi từ nhà sản xuất. Yêu cầu sản phẩm còn nguyên tem mác, hộp và phụ kiện đi kèm. Quá trình đổi trả sẽ mất từ 3-5 ngày làm việc.',
      type: 'POLICY',
    },
    {
      title: 'Thông tin sản phẩm: Điện thoại X-Pro',
      content: 'Điện thoại X-Pro màn hình OLED 6.7 inch, chip xử lý Snapdragon 8 Gen 2, RAM 12GB, bộ nhớ trong 256GB. Camera sau 108MP + 12MP + 10MP, camera trước 32MP. Pin 5000mAh hỗ trợ sạc nhanh 65W. Giá niêm yết: 24,990,000 VNĐ. Có 3 màu: Đen, Trắng, và Xanh titan.',
      type: 'PRODUCT',
    },
    {
      title: 'Chính sách bảo hành',
      content: 'Tất cả các sản phẩm điện tử đều được bảo hành chính hãng 12 tháng. Phụ kiện đi kèm bảo hành 6 tháng. Miễn phí đổi mới trong 30 ngày đầu nếu phát sinh lỗi phần cứng.',
      type: 'POLICY',
    },
    {
      title: 'Giao hàng và Phí vận chuyển',
      content: 'Miễn phí giao hàng toàn quốc cho đơn hàng từ 1,000,000 VNĐ. Nội thành TP.HCM giao siêu tốc trong 2 giờ. Các tỉnh thành khác nhận hàng từ 2-4 ngày làm việc.',
      type: 'POLICY',
    },
    {
      title: 'Thông tin sản phẩm: Tai nghe Wireless Pro',
      content: 'Tai nghe Bluetooth Wireless Pro với công nghệ chống ồn chủ động (ANC), pin nghe liên tục 24 giờ, âm thanh vòm 360 độ, kháng nước IPX5. Phù hợp cho cả iOS và Android. Giá niêm yết: 3,500,000 VNĐ.',
      type: 'PRODUCT',
    },
    {
      title: 'Thông tin sản phẩm: Laptop Gaming Z',
      content: 'Laptop Gaming Z cấu hình cao cấp: CPU Core i9, RAM 32GB, SSD 1TB, Card đồ họa RTX 4070. Màn hình 15.6 inch tần số quét 165Hz. Thiết kế hầm hố, tản nhiệt kép. Giá: 45,900,000 VNĐ.',
      type: 'PRODUCT',
    },
    {
      title: 'Chương trình khách hàng thân thiết (VIP)',
      content: 'Khách hàng có tổng giá trị mua hàng từ 50,000,000 VNĐ sẽ được nâng hạng VIP. Thành viên VIP được giảm 5% cho tất cả đơn hàng, tặng quà sinh nhật và ưu tiên xử lý đơn hàng.',
      type: 'GENERAL',
    },
  ];

  for (const k of knowledgeData) {
    const textToEmbed = `Tiêu đề: ${k.title}\nNội dung: ${k.content}`;
    let embeddingVector = '[]';
    
    try {
      const embedding = await generateLocalEmbedding(textToEmbed);
      if (embedding && embedding.length > 0) {
        embeddingVector = `[${embedding.join(',')}]`;
      }
    } catch (e) {
      console.error('Failed to generate embedding for', k.title, e);
    }

    const createdKnowledge = await prisma.knowledge.create({
      data: {
        title: k.title,
        content: k.content,
        type: k.type,
      }
    });

    if (embeddingVector !== '[]') {
      await prisma.$executeRawUnsafe(`
        UPDATE "Knowledge" 
        SET embedding = $1::vector 
        WHERE id = $2
      `, embeddingVector, createdKnowledge.id);
    }
  }

  // Setup AI Configuration with System Prompt
  const systemPrompt = `Bạn là nhân viên chăm sóc khách hàng (CSKH) chuyên nghiệp của cửa hàng TechShop.
Giọng điệu của bạn: lịch sự, nhiệt tình, thân thiện và luôn xưng "mình" và gọi khách hàng là "bạn" hoặc "anh/chị".
Nhiệm vụ của bạn:
- Giải đáp thắc mắc của khách hàng dựa trên thông tin cửa hàng cung cấp.
- Tư vấn bán hàng một cách khéo léo.
- Nếu không biết câu trả lời, hãy báo rằng bạn sẽ chuyển thông tin cho nhân viên trực tiếp hỗ trợ.
- Câu trả lời phải ngắn gọn, súc tích (dưới 3-4 câu).
Luôn ưu tiên sử dụng thông tin từ Knowledge Base (thông tin sản phẩm, chính sách, giờ mở cửa) nếu có thể.`;

  const existingConfig = await prisma.aIConfiguration.findFirst();
  if (existingConfig) {
    await prisma.aIConfiguration.update({
      where: { id: existingConfig.id },
      data: {
        systemPrompt: systemPrompt,
      }
    });
  } else {
    await prisma.aIConfiguration.create({
      data: {
        systemPrompt: systemPrompt,
      }
    });
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
