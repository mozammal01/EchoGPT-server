import { Body, Controller, Delete, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('Admin Panel APIs')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get Admin Dashboard Statistics (Users, Subscriptions, AI Tokens, System)' })
  @ApiResponse({ status: 200, description: 'Dashboard metrics returned' })
  @ApiResponse({ status: 403, description: 'Requires ADMIN role' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'List all registered users with pagination & search filter' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false, example: 'john' })
  @ApiResponse({ status: 200, description: 'Paginated user list returned' })
  async getUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.adminService.getUsers(page ? Number(page) : 1, limit ? Number(limit) : 20, search);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Update user role (ADMIN or USER)' })
  @ApiResponse({ status: 200, description: 'User role updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUserRole(
    @Param('id') userId: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(userId, dto);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user account (Admin)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  async deleteUser(@Param('id') userId: string) {
    return this.adminService.deleteUser(userId);
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'List all user subscriptions with status & limits' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'List of subscriptions' })
  async getSubscriptions(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getSubscriptions(page ? Number(page) : 1, limit ? Number(limit) : 20);
  }

  @Get('usage-analytics')
  @ApiOperation({ summary: 'Get API Usage Analytics and Token Consumption Breakdown' })
  @ApiResponse({ status: 200, description: 'Usage analytics returned' })
  async getUsageAnalytics() {
    return this.adminService.getUsageAnalytics();
  }

  @Get('request-logs')
  @ApiOperation({ summary: 'View API Request Logs with status codes & execution duration' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiResponse({ status: 200, description: 'Logs list' })
  async getRequestLogs(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getRequestLogs(page ? Number(page) : 1, limit ? Number(limit) : 50);
  }

  @Get('system-health')
  @ApiOperation({ summary: 'Get System Health, Memory Usage, Uptime & DB Connection status' })
  @ApiResponse({ status: 200, description: 'System health metrics' })
  async getSystemHealth() {
    return this.adminService.getSystemHealth();
  }
}
