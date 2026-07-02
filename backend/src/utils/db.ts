import { PrismaClient } from '@prisma/client';

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

declare global {
  var prisma: PrismaClient | undefined;
}

const connectionString = process.env.DATABASE_URL || '';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const db = global.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') global.prisma = db;
