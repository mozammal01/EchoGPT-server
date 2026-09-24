import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { GetUser } from '../../common/decorators/get-user.decorator';

@ApiTags('User Management')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile details' })
  @ApiResponse({ status: 200, description: 'Profile details returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@GetUser('id') userId: string) {
    return this.userService.getProfile(userId);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update profile information (firstName, lastName)' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @GetUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(userId, dto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change account password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Incorrect current password' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(
    @GetUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.userService.changePassword(userId, dto);
  }

  @Delete('account')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete user account and data' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteAccount(@GetUser('id') userId: string) {
    return this.userService.deleteAccount(userId);
  }
}
