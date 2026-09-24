import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PlanType, Role } from '@prisma/client';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const totalUsers = await this.prisma.user.count();
    const adminCount = await this.prisma.user.count({ where: { role: Role.ADMIN } });
    const userCount = totalUsers - adminCount;

    const freeSubscriptions = await this.prisma.subscription.count({ where: { plan: PlanType.FREE } });
    const premiumSubscriptions = await this.prisma.subscription.count({ where: { plan: PlanType.PREMIUM } });

    const totalConversations = await this.prisma.conversation.count();
    const totalMessages = await this.prisma.message.count();
    const totalSearches = await this.prisma.webSearch.count();

    const activeProvidersCount = await this.prisma.aIProvider.count({ where: { isEnabled: true } });

    const tokensAgg = await this.prisma.apiUsageLog.aggregate({
      _sum: { tokensUsed: true },
    });

    return {
      users: {
        total: totalUsers,
        admins: adminCount,
        regularUsers: userCount,
      },
      subscriptions: {
        free: freeSubscriptions,
        premium: premiumSubscriptions,
      },
      usage: {
        totalConversations,
        totalMessages,
        totalSearches,
        totalTokensUsed: tokensAgg._sum.tokensUsed || 0,
      },
      system: {
        activeProviders: activeProvidersCount,
      },
    };
  }

  async getUsers(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isEmailVerified: true,
          createdAt: true,
          subscription: {
            select: { plan: true, status: true, usedRequests: true, monthlyLimit: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateUserRole(userId: string, dto: UpdateUserRoleDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role: dto.role },
      select: { id: true, email: true, role: true },
    });

    return { message: `User role updated to ${dto.role}`, user: updated };
  }

  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    await this.prisma.user.delete({ where: { id: userId } });
    return { message: `User ${user.email} deleted successfully` };
  }

  async getSubscriptions(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [subscriptions, total] = await Promise.all([
      this.prisma.subscription.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.subscription.count(),
    ]);

    return {
      subscriptions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUsageAnalytics() {
    const logsByEndpoint = await this.prisma.apiUsageLog.groupBy({
      by: ['endpoint'],
      _count: { id: true },
      _sum: { tokensUsed: true },
      _avg: { durationMs: true },
    });

    const topUsers = await this.prisma.apiUsageLog.groupBy({
      by: ['userId'],
      _count: { id: true },
      _sum: { tokensUsed: true },
      orderBy: {
        _sum: { tokensUsed: 'desc' },
      },
      take: 10,
    });

    return {
      endpointAnalytics: logsByEndpoint,
      topUsersAnalytics: topUsers,
    };
  }

  async getRequestLogs(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.prisma.apiUsageLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true } },
          provider: { select: { name: true, displayName: true } },
        },
      }),
      this.prisma.apiUsageLog.count(),
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSystemHealth() {
    const memoryUsage = process.memoryUsage();
    const uptimeSeconds = Math.floor(process.uptime());

    let dbStatus = 'HEALTHY';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'UNHEALTHY';
    }

    const providers = await this.prisma.aIProvider.findMany({
      select: { name: true, displayName: true, isEnabled: true, healthStatus: true, lastHealthCheck: true },
    });

    return {
      status: dbStatus === 'HEALTHY' ? 'OK' : 'DEGRADED',
      database: dbStatus,
      uptimeSeconds,
      memoryUsage: {
        rssMB: Math.round(memoryUsage.rss / 1024 / 1024),
        heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      },
      aiProviders: providers,
      timestamp: new Date(),
    };
  }
}
