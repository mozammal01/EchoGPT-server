import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PlanType, SubscriptionStatus } from '@prisma/client';
import { UpgradeSubscriptionDto } from './dto/upgrade-subscription.dto';

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  async getPlans() {
    return [
      {
        name: 'FREE',
        price: 0,
        currency: 'USD',
        monthlyLimit: 50,
        features: ['50 requests / month', 'Access to Standard AI Models', 'Web Search Enabled', 'Community Support'],
      },
      {
        name: 'PREMIUM',
        price: 19.99,
        currency: 'USD',
        monthlyLimit: 10000,
        features: ['10,000 requests / month', 'Access to All AI Models (GPT-4o, Claude 3.5, Gemini 1.5 Pro)', 'Unlimited Web Search', 'Priority Processing & Faster Speed', '24/7 Support'],
      },
    ];
  }

  async getStatus(userId: string) {
    let sub = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!sub) {
      sub = await this.prisma.subscription.create({
        data: {
          userId,
          plan: PlanType.FREE,
          status: SubscriptionStatus.ACTIVE,
          monthlyLimit: 50,
          usedRequests: 0,
          periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // Auto reset if period expired
    if (new Date() > sub.periodEnd) {
      sub = await this.prisma.subscription.update({
        where: { id: sub.id },
        data: {
          usedRequests: 0,
          periodStart: new Date(),
          periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    const remainingRequests = Math.max(0, sub.monthlyLimit - sub.usedRequests);

    return {
      plan: sub.plan,
      status: sub.status,
      monthlyLimit: sub.monthlyLimit,
      usedRequests: sub.usedRequests,
      remainingRequests,
      periodStart: sub.periodStart,
      periodEnd: sub.periodEnd,
    };
  }

  async upgradeSubscription(userId: string, dto: UpgradeSubscriptionDto) {
    if (dto.plan === PlanType.FREE) {
      return this.downgradeSubscription(userId);
    }

    const monthlyLimit = 10000;
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const updated = await this.prisma.subscription.upsert({
      where: { userId },
      update: {
        plan: PlanType.PREMIUM,
        status: SubscriptionStatus.ACTIVE,
        monthlyLimit,
        periodEnd,
      },
      create: {
        userId,
        plan: PlanType.PREMIUM,
        status: SubscriptionStatus.ACTIVE,
        monthlyLimit,
        usedRequests: 0,
        periodEnd,
      },
    });

    return {
      message: 'Subscription upgraded to PREMIUM successfully',
      subscription: updated,
    };
  }

  async downgradeSubscription(userId: string) {
    const monthlyLimit = 50;

    const updated = await this.prisma.subscription.update({
      where: { userId },
      data: {
        plan: PlanType.FREE,
        status: SubscriptionStatus.ACTIVE,
        monthlyLimit,
      },
    });

    return {
      message: 'Subscription downgraded to FREE successfully',
      subscription: updated,
    };
  }

  async getRemainingRequests(userId: string) {
    const status = await this.getStatus(userId);
    return {
      plan: status.plan,
      monthlyLimit: status.monthlyLimit,
      usedRequests: status.usedRequests,
      remainingRequests: status.remainingRequests,
    };
  }

  async incrementUsage(userId: string, count = 1) {
    const sub = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!sub) return;

    await this.prisma.subscription.update({
      where: { userId },
      data: {
        usedRequests: { increment: count },
      },
    });
  }

  async checkUsageLimit(userId: string): Promise<boolean> {
    const status = await this.getStatus(userId);
    return status.remainingRequests > 0;
  }
}
