const {BuoyMdl} = require('../model');
const winston = require('../config/winston');

module.exports = (router) => {
  router.get('/', async (req, res) => {
    try {
      const buoys = await BuoyMdl.find();
      res.send(buoys);
    } catch (err) {
      winston.error(err.message);
      res.sendStatus(500);
    }
  });

  return router;
};
