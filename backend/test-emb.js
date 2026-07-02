const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { createAIProvider } = require('./src/utils/ai-provider');

async function main() {
  const config = await prisma.aIConfiguration.findFirst();
  console.log('Current AI Config:', config);

  if (config && config.apiKey) {
    const provider = createAIProvider(config.provider, config.apiKey);
    console.log(`Testing embedding with ${config.provider}...`);
    try {
      const emb = await provider.generateEmbedding('Hello world');
      console.log('Embedding length:', emb.length);
      console.log('Sample:', emb.slice(0, 5));
    } catch (e) {
      console.error('Embedding error:', e.message);
    }
  } else {
    console.log('No API key found in DB.');
  }

  // Also check if there's any knowledge item without embedding
  const items = await prisma.$queryRawUnsafe(`SELECT id, title, type, (embedding IS NULL) as is_null FROM "Knowledge"`);
  console.log('Knowledge items:', items);
}

main().catch(console.error).finally(() => prisma.$disconnect());
