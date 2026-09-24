import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CryptoUtil } from '../../common/utils/crypto.util';
import { CreateAIProviderDto } from './dto/create-provider.dto';
import { UpdateAIProviderDto } from './dto/update-provider.dto';
import { ProviderHealth } from '@prisma/client';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AIProviderService {
  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
  ) {}

  async findAll() {
    const providers = await this.prisma.aIProvider.findMany({
      orderBy: { createdAt: 'asc' },
    });

    return providers.map((p) => {
      const rawKey = p.apiKey ? CryptoUtil.decrypt(p.apiKey) : '';
      return {
        ...p,
        apiKey: CryptoUtil.maskApiKey(rawKey),
        models: JSON.parse(p.models || '[]'),
      };
    });
  }

  async findActive() {
    const providers = await this.prisma.aIProvider.findMany({
      where: { isEnabled: true },
      orderBy: { isDefault: 'desc' },
    });

    return providers.map((p) => ({
      id: p.id,
      name: p.name,
      displayName: p.displayName,
      models: JSON.parse(p.models || '[]'),
      isDefault: p.isDefault,
      healthStatus: p.healthStatus,
    }));
  }

  async findOne(id: string) {
    const provider = await this.prisma.aIProvider.findUnique({
      where: { id },
    });

    if (!provider) {
      throw new NotFoundException(`AI Provider with ID ${id} not found`);
    }

    const rawKey = provider.apiKey ? CryptoUtil.decrypt(provider.apiKey) : '';
    return {
      ...provider,
      apiKey: CryptoUtil.maskApiKey(rawKey),
      models: JSON.parse(provider.models || '[]'),
    };
  }

  async create(dto: CreateAIProviderDto) {
    const existing = await this.prisma.aIProvider.findUnique({
      where: { name: dto.name.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException(`AI Provider ${dto.name} already exists`);
    }

    if (dto.isDefault) {
      await this.prisma.aIProvider.updateMany({
        data: { isDefault: false },
      });
    }

    const encryptedKey = dto.apiKey ? CryptoUtil.encrypt(dto.apiKey) : null;

    const provider = await this.prisma.aIProvider.create({
      data: {
        name: dto.name.toLowerCase(),
        displayName: dto.displayName,
        apiKey: encryptedKey,
        baseUrl: dto.baseUrl,
        models: JSON.stringify(dto.models),
        isEnabled: dto.isEnabled !== undefined ? dto.isEnabled : true,
        isDefault: dto.isDefault !== undefined ? dto.isDefault : false,
      },
    });

    return {
      message: 'AI Provider created successfully',
      provider: {
        ...provider,
        apiKey: CryptoUtil.maskApiKey(dto.apiKey || ''),
        models: dto.models,
      },
    };
  }

  async update(id: string, dto: UpdateAIProviderDto) {
    const existing = await this.prisma.aIProvider.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`AI Provider with ID ${id} not found`);
    }

    if (dto.isDefault) {
      await this.prisma.aIProvider.updateMany({
        where: { id: { not: id } },
        data: { isDefault: false },
      });
    }

    const encryptedKey = dto.apiKey ? CryptoUtil.encrypt(dto.apiKey) : existing.apiKey;

    const provider = await this.prisma.aIProvider.update({
      where: { id },
      data: {
        displayName: dto.displayName || existing.displayName,
        apiKey: encryptedKey,
        baseUrl: dto.baseUrl !== undefined ? dto.baseUrl : existing.baseUrl,
        models: dto.models ? JSON.stringify(dto.models) : existing.models,
        isEnabled: dto.isEnabled !== undefined ? dto.isEnabled : existing.isEnabled,
        isDefault: dto.isDefault !== undefined ? dto.isDefault : existing.isDefault,
      },
    });

    const rawKey = provider.apiKey ? CryptoUtil.decrypt(provider.apiKey) : '';

    return {
      message: 'AI Provider updated successfully',
      provider: {
        ...provider,
        apiKey: CryptoUtil.maskApiKey(rawKey),
        models: JSON.parse(provider.models || '[]'),
      },
    };
  }

  async remove(id: string) {
    const existing = await this.prisma.aIProvider.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`AI Provider with ID ${id} not found`);
    }

    await this.prisma.aIProvider.delete({ where: { id } });
    return { message: `AI Provider ${existing.displayName} deleted successfully` };
  }

  async toggleStatus(id: string, isEnabled: boolean) {
    const provider = await this.prisma.aIProvider.update({
      where: { id },
      data: { isEnabled },
    });

    return {
      message: `AI Provider ${provider.displayName} ${isEnabled ? 'enabled' : 'disabled'}`,
      provider,
    };
  }

  async setDefault(id: string) {
    await this.prisma.aIProvider.updateMany({
      data: { isDefault: false },
    });

    const provider = await this.prisma.aIProvider.update({
      where: { id },
      data: { isDefault: true, isEnabled: true },
    });

    return {
      message: `${provider.displayName} set as default AI Provider`,
      provider,
    };
  }

  async getDecryptedKey(providerId: string): Promise<{ id: string; apiKey: string; baseUrl?: string; models: string[]; name: string }> {
    const provider = await this.prisma.aIProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException(`Provider ${providerId} not found`);
    }

    const decryptedKey = provider.apiKey ? CryptoUtil.decrypt(provider.apiKey) : '';
    return {
      id: provider.id,
      name: provider.name,
      apiKey: decryptedKey,
      baseUrl: provider.baseUrl || undefined,
      models: JSON.parse(provider.models || '[]'),
    };
  }

  async getDefaultProviderDecrypted() {
    let provider = await this.prisma.aIProvider.findFirst({
      where: { isDefault: true, isEnabled: true },
    });

    if (!provider) {
      provider = await this.prisma.aIProvider.findFirst({
        where: { isEnabled: true },
      });
    }

    if (!provider) {
      return null;
    }

    const decryptedKey = provider.apiKey ? CryptoUtil.decrypt(provider.apiKey) : '';
    return {
      id: provider.id,
      name: provider.name,
      displayName: provider.displayName,
      apiKey: decryptedKey,
      baseUrl: provider.baseUrl || undefined,
      models: JSON.parse(provider.models || '[]'),
    };
  }

  async healthCheck() {
    const providers = await this.prisma.aIProvider.findMany();
    const results = [];

    for (const provider of providers) {
      let status: ProviderHealth = ProviderHealth.HEALTHY;
      let latencyMs = 0;
      const startTime = Date.now();

      try {
        // Simple health verification or ping check
        const rawKey = provider.apiKey ? CryptoUtil.decrypt(provider.apiKey) : '';
        if (!provider.isEnabled) {
          status = ProviderHealth.DEGRADED;
        } else if (!rawKey && !process.env[`${provider.name.toUpperCase()}_API_KEY`]) {
          status = ProviderHealth.DEGRADED;
        } else {
          status = ProviderHealth.HEALTHY;
        }
        latencyMs = Date.now() - startTime;
      } catch {
        status = ProviderHealth.UNHEALTHY;
      }

      await this.prisma.aIProvider.update({
        where: { id: provider.id },
        data: {
          healthStatus: status,
          lastHealthCheck: new Date(),
        },
      });

      results.push({
        id: provider.id,
        name: provider.name,
        displayName: provider.displayName,
        healthStatus: status,
        latencyMs,
        lastCheck: new Date(),
      });
    }

    return {
      timestamp: new Date(),
      providers: results,
    };
  }
}
