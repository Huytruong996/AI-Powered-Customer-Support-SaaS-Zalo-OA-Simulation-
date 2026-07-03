import { db } from './db';
import { AIProvider } from './ai-provider';
import { generateLocalEmbedding } from './local-embedding';

export async function buildEnhancedSystemPrompt(
  conversationId: string,
  currentMessage: string,
  baseSystemPrompt: string,
  aiProvider: AIProvider
): Promise<string> {
  let enhancedPrompt = baseSystemPrompt;
  
  try {
    // 1. Fetch Conversation Context (Customer info & tags)
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: {
        customer: true,
      },
    });

    if (conversation?.customer) {
      enhancedPrompt += `\n\n--- THÔNG TIN KHÁCH HÀNG ---\n`;
      enhancedPrompt += `Tên: ${conversation.customer.displayName}\n`;
      if (conversation.customer.notes) {
        enhancedPrompt += `Ghi chú: ${conversation.customer.notes}\n`;
      }
      if (conversation.customer.tags && conversation.customer.tags.length > 0) {
        enhancedPrompt += `Tags: ${conversation.customer.tags.join(', ')}\n`;
      }
    }

    // 2. Fetch Chat History Context (Last 10 messages)
    const recentMessages = await db.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (recentMessages.length > 0) {
      enhancedPrompt += `\n\n--- LỊCH SỬ CHAT GẦN ĐÂY ---\n`;
      // Reverse to chronological order
      const historyStr = recentMessages.reverse().map(m => {
        const role = m.senderType === 'CUSTOMER' ? 'Khách hàng' : (m.senderType === 'AI' ? 'AI' : 'Nhân viên');
        return `${role}: ${m.content}`;
      }).join('\n');
      enhancedPrompt += historyStr + '\n';
    }

    // 3. RAG: Vector Search for Product/Policy Knowledge
    // We only do this if there's an incoming message and AI supports embeddings
    if (currentMessage) {
      const questionEmbedding = await generateLocalEmbedding(currentMessage);
      console.log("currentMessage: ", currentMessage)
      if (questionEmbedding && questionEmbedding.length > 0) {
        // Convert number[] to vector string format suitable for pgvector
        const vectorStr = `[${questionEmbedding.join(',')}]`;
        
        // Use db.$queryRawUnsafe because Prisma doesn't natively support vector distances yet in safe queries perfectly
        // We find top 3 matches using cosine distance (<=>) or L2 distance (<->)
        // Cosine distance (<=>) is often recommended for embeddings from OpenAI/Gemini
        const topKnowledge: any[] = await db.$queryRawUnsafe(`
          SELECT title, content, type, 1 - (embedding <=> $1::vector) as similarity
          FROM "Knowledge"
          ORDER BY embedding <=> $1::vector
          LIMIT 6
        `, vectorStr);

        if (topKnowledge && topKnowledge.length > 0) {
          enhancedPrompt += `\n\n--- KIẾN THỨC NỘI BỘ (RAG) ---\n`;
          enhancedPrompt += `Dưới đây là thông tin tra cứu được từ cơ sở dữ liệu để trả lời khách hàng. Hãy dựa vào những thông tin này nếu chúng liên quan đến câu hỏi:\n\n`;
          
          topKnowledge.forEach((k, idx) => {
            // Only include if similarity is reasonable (optional filter)
            // if (k.similarity > 0.5) ...
            enhancedPrompt += `[${idx + 1}] ${k.title} (${k.type}):\n${k.content}\n\n`;
          });
        }
      }
    }

  } catch (error) {
    console.error('Error in buildEnhancedSystemPrompt:', error);
    // Fallback to base prompt if anything fails
  }
  console.log("enhancedPrompt : " , enhancedPrompt)
  return enhancedPrompt;
}
