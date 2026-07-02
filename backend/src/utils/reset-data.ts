import { db as prisma } from './db';

async function main() {
  console.log('Đang xóa dữ liệu cũ...');
  
  // Cần xóa theo thứ tự để tránh lỗi khóa ngoại (Foreign Key)
  await prisma.message.deleteMany();
  await prisma.aIConversationLog.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.cannedResponse.deleteMany();
  await prisma.auditLog.deleteMany(); 
  
  console.log('Xóa thành công! Bắt đầu tạo dữ liệu mock cho Canned Responses...');
  
  await prisma.cannedResponse.createMany({
    data: [
      {
        title: 'Chào hỏi',
        content: 'Dạ shop chào bạn ạ! Bạn đang quan tâm đến sản phẩm nào ạ?',
        category: 'Chăm sóc',
        shortcut: '/chao',
      },
      {
        title: 'Chính sách đổi trả',
        content: 'Dạ bên shop hỗ trợ đổi trả trong vòng 7 ngày kể từ khi nhận hàng nếu có lỗi từ nhà sản xuất nha bạn.',
        category: 'Hỗ trợ',
        shortcut: '/doitra',
      },
      {
        title: 'Xin thông tin giao hàng',
        content: 'Bạn vui lòng cho shop xin số điện thoại và địa chỉ nhận hàng để shop lên đơn cho bạn nha!',
        category: 'Bán hàng',
        shortcut: '/info',
      },
      {
        title: 'Báo hết hàng',
        content: 'Dạ mẫu này hiện tại bên shop đang tạm hết hàng rồi ạ. Hàng sẽ về lại vào tuần sau, bạn tham khảo sang mẫu khác giúp shop trước nhé!',
        category: 'Bán hàng',
        shortcut: '/hethang',
      },
      {
        title: 'Cảm ơn khách hàng',
        content: 'Cảm ơn bạn đã tin tưởng và ủng hộ shop. Đơn hàng của bạn sẽ sớm được giao. Chúc bạn một ngày tốt lành!',
        category: 'Chăm sóc',
        shortcut: '/camon',
      }
    ]
  });
  
  console.log('Tạo dữ liệu Canned Responses thành công!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
