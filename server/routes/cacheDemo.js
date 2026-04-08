const router = require('express').Router();
const { redis } = require('../cache');

// Demo: set a key with TTL
router.post('/set', async (req, res, next) => {
  try {
    const { key, value, ttl = 60 } = req.body;
    if (!key || !value) return res.status(400).json({ error: 'key and value are required' });
    const safeKey = 'demo:' + key.substring(0, 100).replace(/[^a-zA-Z0-9._:-]/g, '_');
    const safeTtl = Math.min(Math.max(parseInt(ttl) || 60, 1), 3600);
    await redis.setex(safeKey, safeTtl, value.substring(0, 1000));
    res.json({ key: safeKey, value: value.substring(0, 1000), ttl: safeTtl });
  } catch (err) { next(err); }
});

// Demo: get a key (shows cache hit/miss)
router.get('/get/:key', async (req, res, next) => {
  try {
    const safeKey = 'demo:' + req.params.key.substring(0, 100).replace(/[^a-zA-Z0-9._:-]/g, '_');
    const value = await redis.get(safeKey);
    const ttl = await redis.ttl(safeKey);
    if (value === null) {
      return res.json({ key: safeKey, hit: false, value: null, ttl: -1 });
    }
    await redis.incr('counter:cache_hits');
    res.json({ key: safeKey, hit: true, value, ttl });
  } catch (err) { next(err); }
});

// Demo: list all demo keys
router.get('/keys', async (req, res, next) => {
  try {
    const keys = await redis.keys('demo:*');
    const entries = [];
    for (const key of keys.slice(0, 50)) {
      const [value, ttl] = await Promise.all([redis.get(key), redis.ttl(key)]);
      entries.push({ key, value, ttl });
    }
    res.json(entries);
  } catch (err) { next(err); }
});

// Demo: flush demo keys only
router.post('/flush', async (req, res, next) => {
  try {
    const keys = await redis.keys('demo:*');
    if (keys.length > 0) await redis.del(...keys);
    res.json({ flushed: keys.length });
  } catch (err) { next(err); }
});

module.exports = router;
