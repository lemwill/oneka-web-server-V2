const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');

const winston = require('./config/winston');
const mongo = require('./config/mongo');

const DaqMessage = require('./model/daqMessage');

const dataRouter = require('./routes/data');
const defaultRouter = require('./routes/default');
const computedMeasurementRoute = require('./routes/computedMeasurement');

winston.info(`Start oneka-server V3.1`);
winston.info(`Trying to connect to influx on ${process.env.INFLUX_HOST}`);

daqMessage = new DaqMessage();
daqMessage.start();

mongo().then(
  () => winston.info(`Connected to Mongo`),
).catch(
  (err) => {
    winston.error(`Unable to connect with mongo error : ${err}`);
    return -1;
  },
);

const app = express();

app.use(morgan('combined', {stream: winston.stream}));

app.use(bodyParser.json());
app.use(bodyParser.raw('application/octet-stream'));


app.use('/v1/util', defaultRouter);
app.use('/v1/data', dataRouter);
app.use(`/v1/computedMeasurement`, computedMeasurementRoute);


app.listen(process.env.HTTP_PORT, () =>
  winston.info(`App started to listen for HTTP on ${process.env.HTTP_PORT}`),
);
