import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { SearchQueryDto } from './dto/search-query.dto';
import * as crypto from 'crypto';

@Injectable()
export class WebSearchService {
  constructor(
    private prisma: PrismaService,
    private subscriptionService: SubscriptionService,
  ) {}

  async search(userId: string, dto: SearchQueryDto, ipAddress?: string) {
    const startTime = Date.now();
    const cleanQuery = dto.query.trim().toLowerCase();
    const queryHash = crypto.createHash('md5').update(cleanQuery).digest('hex');

    // 1. Check Search Cache
    const cachedSearch = await this.prisma.webSearch.findFirst({
      where: { queryHash },
      orderBy: { updatedAt: 'desc' },
    });

    let results = [];
    let isCached = false;

    if (cachedSearch) {
      isCached = true;
      results = JSON.parse(cachedSearch.results);

      // Update hit count and user web search log
      await this.prisma.webSearch.update({
        where: { id: cachedSearch.id },
        data: {
          hitCount: { increment: 1 },
          updatedAt: new Date(),
        },
      });
    } else {
      // 2. Perform live search (Mock / External Web Search Engine)
      results = this.performEngineSearch(cleanQuery, dto.limit || 5);

      // Save to Search Cache DB
      await this.prisma.webSearch.create({
        data: {
          userId,
          query: dto.query,
          queryHash,
          results: JSON.stringify(results),
          hitCount: 1,
        },
      });
    }

    // 3. Increment subscription usage & record log
    const durationMs = Date.now() - startTime;
    await this.subscriptionService.incrementUsage(userId, 1);
    await this.prisma.apiUsageLog.create({
      data: {
        userId,
        endpoint: '/api/v1/web-search',
        tokensUsed: 10,
        statusCode: 200,
        durationMs,
        ipAddress,
      },
    });

    return {
      query: dto.query,
      isCached,
      totalResults: results.length,
      results,
    };
  }

  async getHistory(userId: string, limit = 20) {
    const history = await this.prisma.webSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        query: true,
        hitCount: true,
        createdAt: true,
      },
    });

    return { history };
  }

  async getRecentSearches(userId: string, limit = 5) {
    const searches = await this.prisma.webSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      distinct: ['queryHash'],
      select: {
        query: true,
        createdAt: true,
      },
    });

    return { recentSearches: searches.map((s) => s.query) };
  }

  async getSuggestions(query: string) {
    if (!query || query.length < 2) {
      return { suggestions: [] };
    }

    const matches = await this.prisma.webSearch.findMany({
      where: {
        query: { contains: query.toLowerCase(), mode: 'insensitive' },
      },
      take: 5,
      distinct: ['queryHash'],
      select: { query: true },
    });

    const defaultSuggestions = [
      `${query} official documentation`,
      `${query} examples and guide`,
      `${query} release notes 2026`,
    ];

    const suggestions = Array.from(
      new Set([...matches.map((m) => m.query), ...defaultSuggestions]),
    ).slice(0, 5);

    return { suggestions };
  }

  private performEngineSearch(query: string, limit: number) {
    const sampleResults = [
      {
        title: `${query} - Complete Developer Documentation`,
        url: `https://docs.example.com/search?q=${encodeURIComponent(query)}`,
        snippet: `Comprehensive overview and architectural patterns regarding ${query}. Includes official API documentation and code samples.`,
        source: 'DocsHub',
      },
      {
        title: `Top 10 Best Practices for ${query} in 2026`,
        url: `https://techblog.example.org/posts/${encodeURIComponent(query)}`,
        snippet: `In-depth analysis of modern solutions and optimizations for ${query}. Written by senior engineers.`,
        source: 'TechBlog',
      },
      {
        title: `GitHub - Awesome ${query} Resources & Tutorials`,
        url: `https://github.com/topics/${encodeURIComponent(query)}`,
        snippet: `Curated collection of libraries, tools, frameworks, and community resources for ${query}.`,
        source: 'GitHub',
      },
      {
        title: `${query} Performance Benchmark & Analysis`,
        url: `https://benchmarks.example.net/${encodeURIComponent(query)}`,
        snippet: `Real-world performance testing, latency metrics, and comparative evaluation for ${query}.`,
        source: 'PerformanceLab',
      },
      {
        title: `Community Discussions on ${query} - StackOverflow`,
        url: `https://stackoverflow.com/questions/tagged/${encodeURIComponent(query)}`,
        snippet: `Q&A discussions, common troubleshooting steps, and community code solutions for ${query}.`,
        source: 'StackOverflow',
      },
    ];

    return sampleResults.slice(0, limit);
  }
}
