import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { HashUtil } from '../../common/utils/hash.util';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
        subscription: {
          select: {
            plan: true,
            status: true,
            monthlyLimit: true,
            usedRequests: true,
            periodStart: true,
            periodEnd: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName !== undefined ? dto.firstName : undefined,
        lastName: dto.lastName !== undefined ? dto.lastName : undefined,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isEmailVerified: true,
        updatedAt: true,
      },
    });

    return {
      message: 'Profile updated successfully',
      user: updated,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await HashUtil.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Incorrect current password');
    }

    const newPasswordHash = await HashUtil.hash(dto.newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Revoke all active sessions for security
    await this.prisma.session.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });

    return { message: 'Password changed successfully. Please log in again.' };
  }

  async deleteAccount(userId: string) {
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'Account and associated data deleted successfully' };
  }
}
