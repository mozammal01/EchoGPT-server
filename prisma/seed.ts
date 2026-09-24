import { PrismaClient, Role, PlanType, SubscriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.ENCRYPTION_KEY || 'echogpt_aes_256_secret_key_32c!';

function encryptKey(text: string): string {
  if (!text) return '';
  const key = crypto.scryptSync(SECRET_KEY, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create Default Admin User
  const adminPasswordHash = await bcrypt.hash('Admin@123456', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@echogpt.io' },
    update: {},
    create: {
      email: 'admin@echogpt.io',
      passwordHash: adminPasswordHash,
      firstName: 'EchoGPT',
      lastName: 'Administrator',
      role: Role.ADMIN,
      isEmailVerified: true,
      subscription: {
        create: {
          plan: PlanType.PREMIUM,
          status: SubscriptionStatus.ACTIVE,
          monthlyLimit: 10000,
          usedRequests: 0,
          periodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });
  console.log(`✅ Admin user seeded: ${admin.email}`);

  // 2. Create Default Standard User
  const userPasswordHash = await bcrypt.hash('User@123456', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@echogpt.io' },
    update: {},
    create: {
      email: 'user@echogpt.io',
      passwordHash: userPasswordHash,
      firstName: 'John',
      lastName: 'Doe',
      role: Role.USER,
      isEmailVerified: true,
      subscription: {
        create: {
          plan: PlanType.FREE,
          status: SubscriptionStatus.ACTIVE,
          monthlyLimit: 50,
          usedRequests: 0,
          periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });
  console.log(`✅ Standard user seeded: ${user.email}`);

  // 3. Create Default AI Providers
  const providers = [
    {
      name: 'openai',
      displayName: 'OpenAI GPT Models',
      apiKey: encryptKey(process.env.OPENAI_API_KEY || 'sk-proj-openai-sample-key'),
      baseUrl: 'https://api.openai.com/v1',
      models: JSON.stringify(['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo']),
      isEnabled: true,
      isDefault: true,
    },
    {
      name: 'claude',
      displayName: 'Anthropic Claude Models',
      apiKey: encryptKey(process.env.ANTHROPIC_API_KEY || 'sk-ant-claude-sample-key'),
      baseUrl: 'https://api.anthropic.com/v1',
      models: JSON.stringify(['claude-3-5-sonnet-20240620', 'claude-3-haiku-20240307', 'claude-3-opus-20240229']),
      isEnabled: true,
      isDefault: false,
    },
    {
      name: 'gemini',
      displayName: 'Google Gemini Models',
      apiKey: encryptKey(process.env.GEMINI_API_KEY || 'AIzaSyGeminiSampleKey'),
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
      models: JSON.stringify(['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro']),
      isEnabled: true,
      isDefault: false,
    },
  ];

  for (const providerData of providers) {
    const p = await prisma.aIProvider.upsert({
      where: { name: providerData.name },
      update: {
        displayName: providerData.displayName,
        baseUrl: providerData.baseUrl,
        models: providerData.models,
      },
      create: providerData,
    });
    console.log(`✅ AI Provider seeded: ${p.displayName} (${p.name})`);
  }

  console.log('🎉 Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
