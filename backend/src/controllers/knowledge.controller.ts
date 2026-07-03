import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { db } from '../utils/db';
import { generateLocalEmbedding } from '../utils/local-embedding';

/**
 * POST /api/v1/knowledge
 * Create a new knowledge base entry and compute its embedding.
 */
export const createKnowledge = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content, type } = req.body;

    if (!title || !content) {
      res.status(400).json({ success: false, message: 'Title and content are required' });
      return;
    }

    // Attempt to generate embedding using current AI configuration
    const config = await db.aIConfiguration.findFirst();
    let embeddingVector = '[]';
    
    try {
      const textToEmbed = `Tiêu đề: ${title}\nNội dung: ${content}`;
      const embedding = await generateLocalEmbedding(textToEmbed);
      if (embedding && embedding.length > 0) {
        embeddingVector = `[${embedding.join(',')}]`;
      } else {
        throw new Error("Empty embedding returned");
      }
    } catch (embError: any) {
      console.error('Failed to generate local embedding for knowledge:', embError);
      res.status(500).json({ success: false, message: 'Lỗi khi tạo Vector Embedding nội bộ: ' + (embError.message || 'Unknown error') });
      return;
    }

    // Create knowledge entry (using raw query to support vector insertion easily)
    // We first create it normally without embedding, then update the embedding via raw query.
    // This avoids Prisma type issues with the Unsupported field during creation.
    const knowledge = await db.knowledge.create({
      data: {
        title,
        content,
        type: type || 'GENERAL',
      }
    });

    if (embeddingVector !== '[]') {
      await db.$executeRawUnsafe(`
        UPDATE "Knowledge" 
        SET embedding = $1::vector 
        WHERE id = $2
      `, embeddingVector, knowledge.id);
    }

    res.status(201).json({
      success: true,
      data: knowledge,
    });
  } catch (error) {
    console.error('createKnowledge error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * GET /api/v1/knowledge
 * List knowledge base entries.
 */
export const getKnowledgeList = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || '';
    const type = (req.query.type as string) || '';
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (type) {
      where.type = type;
    }

    const [items, total] = await Promise.all([
      db.knowledge.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.knowledge.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('getKnowledgeList error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * DELETE /api/v1/knowledge/:id
 */
export const deleteKnowledge = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await db.knowledge.delete({ where: { id } });
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    console.error('deleteKnowledge error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
