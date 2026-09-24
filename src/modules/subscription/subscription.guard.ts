import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private subscriptionService: SubscriptionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      return true; // Let AuthGuard handle missing user if needed
    }

    const hasQuota = await this.subscriptionService.checkUsageLimit(user.id);
    if (!hasQuota) {
      throw new ForbiddenException(
        'Subscription request quota exceeded. Please upgrade your plan to PREMIUM to continue.',
      );
    }

    return true;
  }
}
