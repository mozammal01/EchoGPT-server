import { Body, Controller, Get, HttpCode, HttpStatus, Query, Req, UseGuards, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WebSearchService } from './web-search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { SubscriptionGuard } from '../subscription/subscription.guard';
import { Request } from 'express';

@ApiTags('Web Search API')
@ApiBearerAuth()
@Controller('web-search')
export class WebSearchController {
  constructor(private readonly webSearchService: WebSearchService) {}

  @Post()
  @UseGuards(SubscriptionGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Perform AI-assisted web search query' })
  @ApiResponse({ status: 200, description: 'Search results returned (cached or live)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Subscription limit reached' })
  async search(
    @GetUser('id') userId: string,
    @Body() dto: SearchQueryDto,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.webSearchService.search(userId, dto, ipAddress);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get user web search history' })
  @ApiResponse({ status: 200, description: 'Search history list' })
  async getHistory(
    @GetUser('id') userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.webSearchService.getHistory(userId, limit ? Number(limit) : 20);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent distinct search queries for current user' })
  @ApiResponse({ status: 200, description: 'List of recent queries' })
  async getRecentSearches(@GetUser('id') userId: string) {
    return this.webSearchService.getRecentSearches(userId);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get autocomplete search suggestions' })
  @ApiQuery({ name: 'q', example: 'NestJS', description: 'Query prefix for suggestion' })
  @ApiResponse({ status: 200, description: 'Search suggestions' })
  async getSuggestions(@Query('q') query: string) {
    return this.webSearchService.getSuggestions(query);
  }
}
