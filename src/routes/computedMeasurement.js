const {Router} = require('express');
const winston = require('../config/winston');
const ComputedMeasurement = require('../model/computedMeasurement');

const router = new Router();

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
    winston.info(req.params);
    const computedMeasurements = await ComputedMeasurement.find({buoyId: req.params.buoyID}).exec();
    res.send(computedMeasurements);
  } catch (err) {
    winston.error(err.message);
    res.sendStatus(500);
  }
});

module.exports = router;
