const {Router} = require('express');

const router = new Router();

router.get('/ping', (req, res) => {
  return res.sendStatus(200);
});

module.exports = router;
