import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  // @ts-ignore: Guessing the property name for Prisma 7
  datasourceUrl: process.env.DATABASE_URL
});

export default prisma;
