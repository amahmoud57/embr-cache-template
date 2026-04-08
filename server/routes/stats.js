const router = require('express').Router();
const { redis } = require('../cache');

router.get('/', async (req, res, next) => {
  try {
    const info = await redis.info('memory');
    const usedMemMatch = info.match(/used_memory_human:(.+)/);
    const peakMemMatch = info.match(/used_memory_peak_human:(.+)/);
    const connectedClients = await redis.info('clients');
    const clientMatch = connectedClients.match(/connected_clients:(\d+)/);

    const leaderboardSize = await redis.zcard('leaderboard');

    res.json({
      usedMemory: usedMemMatch ? usedMemMatch[1].trim() : 'N/A',
      peakMemory: peakMemMatch ? peakMemMatch[1].trim() : 'N/A',
      connectedClients: clientMatch ? parseInt(clientMatch[1]) : 0,
      leaderboardSize,
    });
  } catch (err) { next(err); }
});

module.exports = router;
