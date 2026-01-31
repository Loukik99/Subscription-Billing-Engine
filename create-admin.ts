
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@example.com';
  const password = 'admin123';
  const hashedPassword = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Admin user already exists.');
    // Optional: Update password if it exists but might be wrong?
    // For now, let's assume if it exists, it's fine.
    // Or force update it to be sure.
    await prisma.user.update({
        where: { email },
        data: { password: hashedPassword, role: 'ADMIN' }
    });
    console.log('Admin user updated with known password.');
    return;
  }

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('Admin user created:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
