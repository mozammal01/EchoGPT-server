import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AIProviderService } from './ai-provider.service';
import { CreateAIProviderDto } from './dto/create-provider.dto';
import { UpdateAIProviderDto } from './dto/update-provider.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('AI Provider Management')
@ApiBearerAuth()
@Controller('ai-providers')
export class AIProviderController {
  constructor(private readonly aiProviderService: AIProviderService) {}

  @Get('public')
  @Public()
  @ApiOperation({ summary: 'Get list of enabled AI providers and their models (Public endpoint)' })
  @ApiResponse({ status: 200, description: 'Active providers returned' })
  async getActiveProviders() {
    return this.aiProviderService.findActive();
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all registered AI Providers (Admin)' })
  @ApiResponse({ status: 200, description: 'List of AI Providers returned with masked API keys' })
  @ApiResponse({ status: 403, description: 'Requires ADMIN role' })
  async findAll() {
    return this.aiProviderService.findAll();
  }

  @Get('health-check')
  @ApiOperation({ summary: 'Execute system health check across all AI providers' })
  @ApiResponse({ status: 200, description: 'Provider health statuses returned' })
  async healthCheck() {
    return this.aiProviderService.healthCheck();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get specific AI provider details (Admin)' })
  @ApiResponse({ status: 200, description: 'AI Provider details' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  async findOne(@Param('id') id: string) {
    return this.aiProviderService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Add a new AI Provider (Admin)' })
  @ApiResponse({ status: 201, description: 'Provider created successfully' })
  @ApiResponse({ status: 409, description: 'Provider with name already exists' })
  async create(@Body() dto: CreateAIProviderDto) {
    return this.aiProviderService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update an existing AI Provider configuration (Admin)' })
  @ApiResponse({ status: 200, description: 'Provider updated' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateAIProviderDto) {
    return this.aiProviderService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete an AI Provider (Admin)' })
  @ApiResponse({ status: 200, description: 'Provider deleted' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  async remove(@Param('id') id: string) {
    return this.aiProviderService.remove(id);
  }

  @Patch(':id/toggle')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Enable or disable an AI Provider (Admin)' })
  @ApiResponse({ status: 200, description: 'Provider status updated' })
  async toggleStatus(@Param('id') id: string, @Body('isEnabled') isEnabled: boolean) {
    return this.aiProviderService.toggleStatus(id, isEnabled);
  }

  @Post(':id/set-default')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Set an AI Provider as system default (Admin)' })
  @ApiResponse({ status: 200, description: 'Set as default provider' })
  async setDefault(@Param('id') id: string) {
    return this.aiProviderService.setDefault(id);
  }
}
