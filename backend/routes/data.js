const DaqMessage = require('../model/daqMessage');
const winston = require('../config/winston');

module.exports = (router) => {
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

  return router;
};
