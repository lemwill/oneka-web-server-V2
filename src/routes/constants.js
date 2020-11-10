const {Router} = require('express');
const redisClient = require('../config/redisClient');

const router = new Router();

router.get('/:value', async (req, res) => {
  const constante = await redisClient.getAsync(req.params.value);
  return res.send(constante);
});

module.exports = router;
