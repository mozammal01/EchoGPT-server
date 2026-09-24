import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { UpgradeSubscriptionDto } from './dto/upgrade-subscription.dto';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Subscription Management')
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'Get list of available subscription plans (Free & Premium)' })
  @ApiResponse({ status: 200, description: 'Plans list returned successfully' })
  async getPlans() {
    return this.subscriptionService.getPlans();
  }

  @Get('status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user subscription status and limit' })
  @ApiResponse({ status: 200, description: 'Subscription status returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStatus(@GetUser('id') userId: string) {
    return this.subscriptionService.getStatus(userId);
  }

  @Post('upgrade')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upgrade subscription plan to PREMIUM' })
  @ApiResponse({ status: 200, description: 'Successfully upgraded plan' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async upgradeSubscription(
    @GetUser('id') userId: string,
    @Body() dto: UpgradeSubscriptionDto,
  ) {
    return this.subscriptionService.upgradeSubscription(userId, dto);
  }

  @Post('downgrade')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Downgrade subscription plan to FREE' })
  @ApiResponse({ status: 200, description: 'Successfully downgraded plan' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async downgradeSubscription(@GetUser('id') userId: string) {
    return this.subscriptionService.downgradeSubscription(userId);
  }

  @Get('remaining-requests')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get remaining AI & Search requests for current billing cycle' })
  @ApiResponse({ status: 200, description: 'Remaining request count returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRemainingRequests(@GetUser('id') userId: string) {
    return this.subscriptionService.getRemainingRequests(userId);
  }
}
