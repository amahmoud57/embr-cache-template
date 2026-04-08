const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

redis.on('error', (err) => console.error('Redis error:', err.message));

const DEMO_PLAYERS = [
  { name: 'Aria', score: 9450 },
  { name: 'Marcus', score: 8720 },
  { name: 'Zoe', score: 8100 },
  { name: 'Kai', score: 7650 },
  { name: 'Luna', score: 7200 },
  { name: 'Felix', score: 6800 },
  { name: 'Nova', score: 6350 },
  { name: 'Atlas', score: 5900 },
  { name: 'Iris', score: 5400 },
  { name: 'Orion', score: 4950 },
];

async function seedDemoData() {
  try {
    const exists = await redis.exists('leaderboard');
    if (!exists) {
      const pipeline = redis.pipeline();
      for (const p of DEMO_PLAYERS) {
        pipeline.zadd('leaderboard', p.score, p.name);
      }
      pipeline.set('counter:page_views', 1247);
      pipeline.set('counter:api_calls', 8432);
      pipeline.set('counter:cache_hits', 6218);
      pipeline.set('counter:errors', 23);
      await pipeline.exec();
    }
  } catch (err) {
    console.error('Failed to seed demo data:', err.message);
  }
}

module.exports = { redis, seedDemoData };
