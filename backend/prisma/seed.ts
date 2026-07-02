import { db as prisma } from '../src/utils/db';
import bcrypt from 'bcrypt';

async function main() {
  console.log('Seeding database...');

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

  // Create a canned response
  await prisma.cannedResponse.create({
    data: {
      title: 'Greeting',
      content: 'Xin chào, cảm ơn bạn đã liên hệ. Mình có thể giúp gì cho bạn?',
      category: 'General',
      shortcut: '/hi',
    },
  });

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
