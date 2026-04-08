const router = require('express').Router();
const { redis } = require('../cache');

const ALLOWED_COUNTERS = ['page_views', 'api_calls', 'cache_hits', 'errors'];

// Get all counters
router.get('/', async (req, res, next) => {
  try {
    const pipeline = redis.pipeline();
    for (const c of ALLOWED_COUNTERS) pipeline.get('counter:' + c);
    const results = await pipeline.exec();
    const counters = {};
    ALLOWED_COUNTERS.forEach((name, i) => {
      counters[name] = parseInt(results[i][1]) || 0;
    });
    res.json(counters);
  } catch (err) { next(err); }
});

// Increment a counter
router.post('/:name/increment', async (req, res, next) => {
  try {
    const { name } = req.params;
    if (!ALLOWED_COUNTERS.includes(name)) return res.status(400).json({ error: 'Invalid counter: ' + name });
    const value = await redis.incr('counter:' + name);
    res.json({ name, value });
  } catch (err) { next(err); }
});

// Reset a counter
router.post('/:name/reset', async (req, res, next) => {
  try {
    const { name } = req.params;
    if (!ALLOWED_COUNTERS.includes(name)) return res.status(400).json({ error: 'Invalid counter: ' + name });
    await redis.set('counter:' + name, 0);
    res.json({ name, value: 0 });
  } catch (err) { next(err); }
});

module.exports = router;
