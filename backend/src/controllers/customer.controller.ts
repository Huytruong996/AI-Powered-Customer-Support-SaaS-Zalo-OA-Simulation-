import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { db } from '../utils/db';

/**
 * GET /api/v1/customers
 * Returns paginated list of customers with search and tag filtering.
 */
export const getCustomers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || '';
    const tag = (req.query.tag as string) || '';
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { zaloUserId: { contains: search } },
      ];
    }

    if (tag) {
      where.tags = { has: tag };
    }

    const [customers, total] = await Promise.all([
      db.customer.findMany({
        where,
        include: {
          conversations: {
            select: { id: true, status: true, updatedAt: true },
            orderBy: { updatedAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      db.customer.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        customers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('getCustomers error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * GET /api/v1/customers/:id
 * Returns customer detail with all conversations.
 */
export const getCustomerById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const customer = await db.customer.findUnique({
      where: { id },
      include: {
        conversations: {
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found' });
      return;
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    console.error('getCustomerById error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * PUT /api/v1/customers/:id
 * Update customer fields (tags, notes, phone, displayName).
 */
export const updateCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { displayName, phone, tags, notes } = req.body;

    const existing = await db.customer.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Customer not found' });
      return;
    }

    const updateData: any = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (phone !== undefined) updateData.phone = phone;
    if (tags !== undefined) updateData.tags = tags;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await db.customer.update({
      where: { id },
      data: updateData,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('updateCustomer error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
