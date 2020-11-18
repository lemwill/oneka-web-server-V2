const {Router} = require('express');
const DaqMessage = require('../model/daqMessage');
const winston = require('../config/winston');
const router = new Router();

router.post('/', (req, res) => {
  const daqMessage = new DaqMessage();
  try {
    daqMessage.deserializeAndSave(req.body);
  } catch (e) {
    winston.error(e);
    return res.sendStatus(500);
  }
  return res.sendStatus(200);
});

module.exports = router;
