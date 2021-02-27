const winston = require('../config/winston');
const ComputedMeasurement = require('../model/computedMeasurement');

module.exports = (router) => {
  router.post('/', async (req, res) => {
    const computedMeasurement = new ComputedMeasurement(req.body);
    try {
      const id = await computedMeasurement.save();
      res.send(id);
    } catch (err) {
      winston.error(err);
      res.sendStatus(500);
    }
  });

  router.get('/:buoyID', async (req, res) => {
    try {
      const computedMeasurements = await ComputedMeasurement
        .find({buoyId: req.params.buoyID}).exec();
      res.send(computedMeasurements);
    } catch (err) {
      winston.error(err.message);
      res.sendStatus(500);
    }
  });

  router.put('/:buoyId/:name', async (req, res) => {
    try {
      await ComputedMeasurement.findOneAndUpdate({
        buoyId: req.params.buoyId,
        name: req.params.name,
      }, {
        $set: req.body,
      },
      {
        upsert: true,
      });
      const computedMeasurement = await ComputedMeasurement.find({
        buoyId: req.params.buoyId,
        name: req.params.name,
      });
      res.send(computedMeasurement);
    } catch (err) {
      winston.error(err.message);
      res.sendStatus(500);
    }
  });

  router.delete('/:buoyId/:name', async (req, res) => {
    try {
      await ComputedMeasurement.findOneAndDelete({
        buoyId: req.params.buoyId,
        name: req.params.name,
      });
      res.sendStatus(204);
    } catch (err) {
      winston.error(err.message);
      res.sendStatus(500);
    }
  });

  return router;
};
