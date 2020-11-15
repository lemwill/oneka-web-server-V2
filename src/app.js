const express = require('express');
const DaqMessage = require('./model/daqMessage');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const winston = require('./config/winston');


const dataRouter = require('./routes/data');
//const constantsRouter = require('./routes/constants');
const defaultRouter = require('./routes/default');

winston.info(`Start oneka-server V3.1`);
winston.info(`Trying to connect to influx on ${process.env.INFLUX_HOST}`);

daqMessage = new DaqMessage();
daqMessage.start();

const app = express();

app.use(morgan('combined', {stream: winston.stream}));

app.use(bodyParser.json());
app.use(bodyParser.raw('application/octet-stream'));


app.use('/v1/util', defaultRouter);
app.use('/v1/data', dataRouter);
//app.use('/v1/constants', constantsRouter);


app.listen(process.env.HTTP_PORT, () =>
  winston.info(`App started to listen for HTTP on ${process.env.HTTP_PORT}`),
);
