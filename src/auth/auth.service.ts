import prisma from '../db/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Customer, SubscriptionRequest } from '@prisma/client';
import { Prisma } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export class AuthService {
  async register(data: { email: string; password: string; name: string; region: string; requestedPlanId?: string }) {
    const { email, password, name, region, requestedPlanId } = data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Transaction: Create User -> Create Customer -> Link -> (Optional) Create Request
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Customer
      const customer = await tx.customer.create({
        data: {
          email,
          name,
          region,
          address: JSON.stringify({ country: region }), // Simplified
          currency: region === 'IN' ? 'INR' : 'USD', // Simplified logic
        },
      });

      // 2. Create User linked to Customer
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'CUSTOMER',
          customerId: customer.id,
        },
      });

      // 3. Create Subscription Request if plan selected
      if (requestedPlanId) {
        await tx.subscriptionRequest.create({
          data: {
            customerId: customer.id,
            planId: requestedPlanId,
            status: 'PENDING',
          },
        });
      }

      return { user, customer };
    });

    const token = jwt.sign({ userId: result.user.id, role: result.user.role, customerId: result.customer.id }, JWT_SECRET, { expiresIn: '1d' });
    return { token, user: { id: result.user.id, email: result.user.email, role: result.user.role, customerId: result.customer.id } };
  }

  async login(data: { email: string; password: string }) {
    const { email, password } = data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign({ userId: user.id, role: user.role, customerId: user.customerId }, JWT_SECRET, { expiresIn: '1d' });
    return { token, user: { id: user.id, email: user.email, role: user.role, customerId: user.customerId } };
  }
}
