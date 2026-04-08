const router = require('express').Router();
const { redis } = require('../cache');

// Get top N players
router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const members = await redis.zrevrange('leaderboard', 0, limit - 1, 'WITHSCORES');
    const leaderboard = [];
    for (let i = 0; i < members.length; i += 2) {
      leaderboard.push({ rank: (i / 2) + 1, name: members[i], score: parseInt(members[i + 1]) });
    }
    res.json(leaderboard);
  } catch (err) { next(err); }
});

// Add or update a player's score
router.post('/', async (req, res, next) => {
  try {
    const { name, score } = req.body;
    if (!name || score == null) return res.status(400).json({ error: 'name and score are required' });
    await redis.zadd('leaderboard', parseInt(score), name.substring(0, 50));
    const rank = await redis.zrevrank('leaderboard', name.substring(0, 50));
    res.json({ name: name.substring(0, 50), score: parseInt(score), rank: rank + 1 });
  } catch (err) { next(err); }
});

// Increment a player's score
router.post('/:name/increment', async (req, res, next) => {
  try {
    const { amount = 1 } = req.body;
    const newScore = await redis.zincrby('leaderboard', parseInt(amount), req.params.name.substring(0, 50));
    const rank = await redis.zrevrank('leaderboard', req.params.name.substring(0, 50));
    res.json({ name: req.params.name.substring(0, 50), score: parseInt(newScore), rank: rank != null ? rank + 1 : null });
  } catch (err) { next(err); }
});

// Remove a player
router.delete('/:name', async (req, res, next) => {
  try {
    await redis.zrem('leaderboard', req.params.name);
    res.json({ deleted: true });
  } catch (err) { next(err); }
});

module.exports = router;
